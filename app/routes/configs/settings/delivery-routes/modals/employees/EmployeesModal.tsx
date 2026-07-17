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
import type { PaginationState } from "~/types/CommonTypes";
import RouteInfo from "../../components/RouteInfo";
import EmployeeItem from "./components/EmployeeItem";
import { getCount, getData, prepareParams } from "./helper";

type FormValues = {
  search: string;
  alpha?: string;
};

const EmployeesModal = ({
  show,
  callback,
  routeId,
}: {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  routeId: string;
}) => {
  const { register, getValues, reset, setValue, control } =
    useForm<FormValues>({
      defaultValues: {
        search: "",
        alpha: "",
      },
    });

  const [alpha] = useWatch({
    control,
    name: ["alpha"],
  });

  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const appToast = useAppToast();

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
    { maxWait: 1000 },
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
      const result = await getData(params);
      setData(result);
      const totalRecords = await getCount(params);
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
      const fetchRoute = async () => {
        setLoading(true);
        try {
          const resp = await DeliveryRoutesService.getRoutesList({
            filter: { _id: routeId },
          });
          const d = resp?.data?.data?.[0] ?? null;
          setRouteData(d);
          reset({ search: "", alpha: "" });
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
      fetchRoute();
    }
  }, [show, applyFilter, routeId]);

  const handleClose = useCallback(() => {
    setExpandedDetails(false);
    callback({ action: "close" });
  }, [callback]);

  const onSearchChange = () => {
    if (getValues("alpha")) setValue("alpha", "");
    debouncedSearch();
  };

  const handleAlphaSelect = (val: string) => {
    setValue("alpha", val);
    if (val) setValue("search", "");
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
      const result = await getData(params);
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
    async (employee: any) => {
      if (!routeId) return;
      try {
        setAssigningUserId(employee._id);

        const resp: any = await DeliveryRoutesService.linkRoute({
          referenceType: "Manpower",
          referenceId: employee._id,
          routeId,
        });

        if (!resp || resp.statusCode < 200 || resp.statusCode >= 300) {
          appToast.show({
            msg: resp?.data?.message || "Failed to assign route",
            color: "danger",
          });
          return;
        }

        setData((prev) =>
          produce(prev, (draft) => {
            const idx = draft.findIndex((d) => d._id === employee._id);
            if (idx !== -1) {
              draft[idx].routes = [
                ...(draft[idx].routes || []),
                { _id: routeId, name: routeData?.description },
              ];
              draft[idx].routeIds = [
                ...(draft[idx].routeIds || []),
                routeId,
              ];
            }
          }),
        );

        appToast.show({ msg: "Route assigned successfully", color: "success" });
        callback({
          action: "employeeAssigned",
          data: { routeId, employee },
        });
      } catch (error: any) {
        console.error("Error assigning route:", error);
        appToast.show({
          msg:
            error?.response?.data?.message ||
            error?.message ||
            "Failed to assign route",
          color: "danger",
        });
      } finally {
        setAssigningUserId(null);
      }
    },
    [routeId, routeData, appToast, callback],
  );

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[95vh]">
      <AppModal.Title onClose={handleClose}>
        Assign Digital Raja/Rani to Route
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[95vh]">
        <RouteInfo
          routeData={routeData}
          expanded={expandedDetails}
          onToggle={() => setExpandedDetails(!expandedDetails)}
        />

        <div className="tw:mb-4">
          <Alpha
            selected={alpha || ""}
            callback={handleAlphaSelect}
            className=""
          />
        </div>

        <AppInput
          name="search"
          placeholder="Search employees..."
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
              <EmployeeItem
                key={item._id}
                item={item}
                routeData={routeData}
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

export default EmployeesModal;
