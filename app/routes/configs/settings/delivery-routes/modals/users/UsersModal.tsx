import { produce } from "immer";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useAppToast from "~/hooks/useAppToast";
import DeliveryRoutesService from "~/services/DeliveryRoutesService";
import type { PaginationState, TabItem } from "~/types/CommonTypes";
import RouteInfo from "../../components/RouteInfo";
import UserItem from "./components/UserItem";
import { getCount, getData, prepareParams } from "./helper";

// Hide tabs, only show B2B customers
const tabs: TabItem[] = [
  {
    name: "B2B Customers",
    key: "b2b",
  },
];

type ActiveTab = "b2b" | "b2c";

type FormValues = {
  search: string;
  activeTab: ActiveTab;
  alpha?: string;
};

const UsersModal = ({
  show,
  callback,
  type,
  routeId,
}: {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  type: ActiveTab;
  routeId: string;
}) => {
  const { register, getValues, reset, setValue, control } = useForm<FormValues>(
    {
      defaultValues: {
        search: "",
        activeTab: "b2b", // Always B2B
        alpha: "",
      },
    },
  );

  const [activeTab, alpha] = useWatch({
    control,
    name: ["activeTab", "alpha"],
  });

  const [routeData, setRouteData] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);

  const [data, setData] = useState<any[]>([]);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const appToast = useAppToast();

  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const debouncedSearch = useDebouncedCallback(
    () => {
      applyFilter();
    },
    500,
    {
      maxWait: 1000,
    },
  );

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };

    try {
      const params = prepareParams(getValues(), paginationRef.current);
      const result = await getData(getValues("activeTab") as ActiveTab, params);
      setData(result);
      const totalRecords = await getCount(
        getValues("activeTab") as ActiveTab,
        params,
      );
      paginationRef.current.totalRecords = totalRecords;

      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (show) {
      const fetchRouter = async () => {
        setLoading(true);
        try {
          const resp = await DeliveryRoutesService.getRoutesList({
            filter: {
              _id: routeId,
            },
          });
          const d = resp?.data?.data?.[0] ?? null;

          setRouteData(d);

          reset({
            search: "",
            activeTab: "b2b",
          });

          if (d) {
            applyFilter();
          } else {
            setData([]);
          }
        } catch (err) {
          console.error(err);
          setRouteData(null);
          setData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchRouter();
    }
  }, [show, applyFilter, routeId]);

  const handleClose = useCallback(() => {
    setExpandedDetails(false);
    callback({ action: "close" });
  }, [callback]);

  // Tab change disabled, only B2B
  const handleTabChange = useCallback(() => {}, []);

  const onSearchChange = () => {
    // clear any alpha selection when user types
    if (getValues("alpha")) setValue("alpha", "");
    debouncedSearch();
  };

  const handleAlphaSelect = (val: string) => {
    setValue("alpha", val);
    if (val) {
      setValue("search", "");
    }
    applyFilter();
  };

  const loadMore = async () => {
    setLoadingMore(true);

    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareParams(getValues(), paginationRef.current);
      const result = await getData(activeTab as ActiveTab, params);
      setData(
        produce(data, (draft) => {
          draft.push(...result);
        }),
      );
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleAssign = useCallback(
    async (user: any) => {
      if (!routeId) return;
      try {
        setAssigningUserId(user._id);

        const referenceType = activeTab === "b2b" ? "Franchise" : "Customer";

        // If the user already has a route assigned (and it's different), unlink first
        if (user?.routeId && user.routeId !== routeId) {
          const unlinkPayload = {
            referenceType,
            referenceId: user._id,
            routeId: user.routeId,
          };

          const unlinkResp: any =
            await DeliveryRoutesService.unlinkRoute(unlinkPayload);

          if (
            !unlinkResp ||
            unlinkResp.statusCode < 200 ||
            unlinkResp.statusCode >= 300
          ) {
            const errMsg =
              unlinkResp?.data?.message ||
              "Failed to unlink customer from existing route";
            appToast.show({ msg: errMsg, color: "danger" });
            return;
          }
        }

        const payload = {
          referenceType,
          referenceId: user._id,
          routeId,
        };

        const resp: any = await DeliveryRoutesService.linkRoute(payload);

        if (!resp || resp.statusCode < 200 || resp.statusCode >= 300) {
          const errMsg = resp?.data?.message || "Failed to assign route";
          appToast.show({ msg: errMsg, color: "danger" });
          return;
        }

        // update local list to reflect assigned route
        setData((prev) =>
          produce(prev, (draft) => {
            const idx = draft.findIndex((d) => d._id === user._id);
            if (idx !== -1) {
              draft[idx].routeId = routeId;
              draft[idx].routeName = routeData?.description;
            }
          }),
        );

        appToast.show({
          msg: "Route assigned successfully",
          color: "success",
        });
        // inform parent so it can refresh that single route record
        callback({ action: "userAssigned", data: { routeId, user } });
      } catch (error: any) {
        console.error("Error assigning route:", error);
        const errMsg =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to assign route";
        appToast.show({ msg: errMsg, color: "danger" });
      } finally {
        setAssigningUserId(null);
      }
    },
    [routeId, type, routeData, appToast],
  );

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[95vh]">
      <AppModal.Title onClose={handleClose}>
        Assign B2B Customers to Route
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[95vh]">
        <RouteInfo
          routeData={routeData}
          expanded={expandedDetails}
          onToggle={() => setExpandedDetails(!expandedDetails)}
        />
        {/* Tab hidden, only B2B customers shown */}

        <div className="tw:mb-4">
          <Alpha
            selected={alpha || ""}
            callback={handleAlphaSelect}
            className=""
          />
        </div>

        <AppInput
          name="search"
          placeholder="Search..."
          register={register}
          onChange={onSearchChange}
          className="tw:mb-4"
          leftIcon={<Search size={16} className="tw:text-gray-400" />}
        />

        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
          className="tw:mb-4"
        />

        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && data.length === 0 ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <NoData />
          </div>
        ) : null}

        {!loading && data.length > 0 ? (
          <div className="tw:space-y-2">
            {data.map((item) => (
              <UserItem
                key={item._id}
                item={item}
                routeData={routeData}
                userType={"b2b"}
                assigning={assigningUserId === item._id}
                onAssign={handleAssign}
              />
            ))}

            {hasMoreData && !loadingMore && (
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            )}
          </div>
        ) : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default UsersModal;
