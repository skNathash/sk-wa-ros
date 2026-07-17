import { Settings } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type {
  PaginationState,
  SortProps,
  SortValue,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import { getCount, getData, prepareParams } from "./helper";
import PaylaterManageWalletModal from "~/shared/accounts/modals/paylater/manage-wallet/PaylaterManageWalletModal";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";
import Rbac from "~/components/core/rbac/Rbac";
import PaylaterService from "~/services/PaylaterService";

const PaylaterNetworkStatement = ({
  userId,
  type,
}: {
  userId: string;
  type: "b2c" | "b2b";
}) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [view, setView] = useState<any>("list");

  const [showManageWalletModal, setShowManageWalletModal] = useState(false);

  const [refresh, setRefresh] = useState(false);

  const [canManage, setCanManage] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<any>({});

  const sortRef = useRef<SortProps>({
    key: "createdAt",
    value: "desc",
  });

  // Apply filter (initial load or filter change)
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Fetch paylater request to check _canManage
  const fetchPaylaterRequest = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await PaylaterService.getRequests({
        filter: {
          "userInfo.id": userId,
          "franchiseInfo.id": AuthService.getLoggedInUserId(),
        },
      });
      const requestData = response.data?.data?.[0];
      if (requestData) {
        const formatted = PaylaterService.formatPaylaterRequest([requestData]);
        setCanManage(formatted[0]?._canManage || false);
      } else {
        setCanManage(false);
      }
    } catch (e) {
      setCanManage(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    filterRef.current = {
      userId: userId,
    };

    if (userId) {
      applyFilter();
      fetchPaylaterRequest();
    }
  }, [applyFilter, userId, fetchPaylaterRequest]);

  // Filter change handler
  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  const onSort = useCallback(
    (data: { key: string; value: SortValue }) => {
      const { key, value } = data;
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  const handleItemCb = ({ action, data }: { action: string; data: any }) => {
    if (action === "view-order") {
      appNav.to(`/dashboard/orders/view/${data.orderId}`);
    }
  };

  const handleManageWalletModalCallback = (args: {
    action: string;
    data?: any;
  }) => {
    setShowManageWalletModal(false);

    setRefresh(true);
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      setRefresh(false);
    }, 1000);

    // Refresh canManage status after modal actions
    if (args.action === "submit") {
      fetchPaylaterRequest();
    }
  };

  const openManageWalletModal = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    setShowManageWalletModal(true);
  };

  return (
    <>
      <div className="tw:flex tw:justify-between tw:items-center tw:w-full tw:mb-4">
        <div>PayLater Transactions ({data.length})</div>
        {canManage ? (
          <Rbac roles={["ACCOUNTS.PAYLATER-MANAGE-LIMIT"]}>
            <AppButton
              size="small"
              color="light"
              fill="outline"
              onClick={openManageWalletModal}
            >
              <Settings />
              Manage
            </AppButton>
          </Rbac>
        ) : null}
      </div>

      <Summary userId={userId} refresh={refresh} type={type} />

      <Filter callback={onFilterChange} />

      <div className="tw:mb-4 tw:flex tw:justify-between tw:items-center">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>

        <ViewToggle viewType={view} callback={setView} />
      </div>

      {isMobile || view === "card" ? (
        <MobileView
          data={data}
          loading={loading}
          hasMoreData={hasMoreData}
          loadingMore={loadingMore}
          loadMore={loadMore}
          totalCount={paginationRef.current.totalRecords}
          loadedCount={data.length}
          callback={handleItemCb}
        />
      ) : (
        <AppCard noPadding>
          <DesktopView
            data={data}
            loading={loading}
            hasMoreData={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
            callback={handleItemCb}
          />
        </AppCard>
      )}

      <PaylaterManageWalletModal
        show={showManageWalletModal}
        callback={handleManageWalletModalCallback}
        userId={userId}
        routeType={type}
      />
    </>
  );
};

export default PaylaterNetworkStatement;
