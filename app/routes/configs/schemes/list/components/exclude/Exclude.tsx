import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import UsersModal from "./modals/users/UsersModal";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import type { ViewToggleType } from "~/types/CommonTypes";

const Exclude = () => {
  const [searchParams] = useSearchParams();
  const { isMobile } = useScreenView();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [accessConfig, setAccessConfig] = useState<any>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewToggleType>("list");
  const appToast = useAppToast();

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    } as PaginationState;
    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(
        {
          search: searchParams.get("search") || "",
          alpha: searchParams.get("alpha") || "",
        },
        paginationRef.current,
      );

      const res = await getData(params);
      const dataRes = res?.data || [];

      setLoadingTotalRecords(true);
      const count = await getCount(params);
      paginationRef.current.totalRecords = count;
      setLoadingTotalRecords(false);

      setData(dataRes);
      setAccessConfig(res?.accessConfig || null);
      paginationRef.current.endSlNo = dataRes.length;
      setHasMoreData(dataRes.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [searchParams]);

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      } as PaginationState;
      const params = prepareParams(
        {
          search: searchParams.get("search") || "",
          alpha: searchParams.get("alpha") || "",
        },
        paginationRef.current,
      );
      const res = await getData(params);
      const newData = res?.data || [];
      setData((prev) => {
        const merged = [...prev, ...newData];
        paginationRef.current.endSlNo = merged.length;
        return merged;
      });
      setHasMoreData(newData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  };

  const itemCallback = async (args: { action: string; data?: any }) => {
    if (args.action === "remove") {
      const user = args.data;
      try {
        const configRes = await FranchiseService.getAccessConfig();
        const config = configRes.data?.data?.[0];
        const configId = config?._id;
        let currentList: any[] = config?.schemeExcludeFranchiseList || [];

        const userId = user.id || user._id;
        setRemovingId(userId);
        const newList = currentList.filter(
          (item) => (item.id || item._id) !== userId,
        );

        const payload = {
          franchiseId: AuthService.getLoggedInUserId(),
          schemeExcludeFranchiseList: newList.map((item: any) => ({
            id: item.id || item._id,
            refId: item.refId,
            name: item.name,
            mobile: item.mobile,
            city: item.city,
            district: item.district,
            state: item.state,
            pincode: item.pincode,
            displayImg: item.displayImg,
            _displayImg: item._displayImg,
          })),
        };

        const res = await FranchiseService.updateAccessConfig(
          configId,
          payload,
        );

        if (res.statusCode === 200) {
          appToast.show({
            msg: "Customer removed from exclude list",
            color: "success",
          });

          // Update local state
          setAccessConfig((prev: any) => ({
            ...(prev || {}),
            _id: configId || res.data?.data?.[0]?._id || res.data?.data?._id,
            schemeExcludeFranchiseList: newList,
          }));

          setData((prev) =>
            prev.filter((item) => (item.id || item._id) !== userId),
          );
          paginationRef.current.totalRecords -= 1;
        } else {
          appToast.show({
            msg: res.data?.message || "Failed to remove customer",
            color: "danger",
          });
        }
      } catch (error) {
        console.error("Error removing customer:", error);
        appToast.show({ msg: "An error occurred", color: "danger" });
      } finally {
        setRemovingId(null);
      }
    }
  };

  return (
    <>
      <div className="tw:mt-4">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-4">
          <div className="tw:flex-1">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loadingTotalRecords}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>

          <div className="tw:flex tw:items-center tw:gap-2">
            <ViewToggle viewType={view} callback={setView} />
            <AppButton
              size="small"
              color="primary"
              fill="solid"
              onClick={() => setShowUsersModal(true)}
            >
              <Plus className="tw:w-4 tw:h-4" />
              ADD
            </AppButton>
          </div>
        </div>

        {isMobile || view === "card" ? (
          <MobileView
            data={data}
            loading={loading}
            callback={itemCallback}
            showLoadMore={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            removingId={removingId}
          />
        ) : (
          <AppCard noPadding>
            <DesktopView
              data={data}
              loading={loading}
              callback={itemCallback}
              showLoadMore={hasMoreData}
              loadingMore={loadingMore}
              loadMore={loadMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              removingId={removingId}
              startSlNo={paginationRef.current.startSlNo}
            />
          </AppCard>
        )}
      </div>
      <UsersModal
        show={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        callback={({ action, item }) => {
          if (action === "add") {
            setData((prev) => [item, ...prev]);
            paginationRef.current.totalRecords += 1;
            setAccessConfig((prev: any) => ({
              ...(prev || {}),
              schemeExcludeFranchiseList: [
                item,
                ...(prev?.schemeExcludeFranchiseList || []),
              ],
            }));
          } else if (action === "remove") {
            setData((prev) => {
              const filtered = prev.filter(
                (u) => (u.id || u._id) !== (item.id || item._id),
              );
              if (filtered.length !== prev.length) {
                paginationRef.current.totalRecords -= 1;
              }
              return filtered;
            });
            setAccessConfig((prev: any) => ({
              ...(prev || {}),
              schemeExcludeFranchiseList: (
                prev?.schemeExcludeFranchiseList || []
              ).filter((u: any) => (u.id || u._id) !== (item.id || item._id)),
            }));
          }
        }}
      />
    </>
  );
};

export default Exclude;
