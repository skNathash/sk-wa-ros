import { IndianRupee } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { AppRadio } from "~/components/core/form/AppRadio";
import AppTab from "~/components/core/tab/AppTab";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type {
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import Summary from "./components/Summary";
import UserDesktopView from "./components/user/DesktopView";
import UserMobileView from "./components/user/MobileView";
import { getCount, getData, getSummary, prepareParams } from "./helper";
import HandoverModal from "./modals/HandoverModal";
import UserPendingHandoverModal from "./modals/UserPendingHandoverModal/UserPendingHandoverModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["ACCOUNTS.COD-RECONCILIATION"]);
}

const tabItems: TabItem[] = [
  { key: "pending", name: "Pending", langKey: "pending" },
  { key: "handedover", name: "Handed Over", langKey: "handedover" },
];

const viewByItems: TabItem[] = [
  { key: "order", name: "Order", langKey: "order" },
  { key: "user", name: "Delivery Agent", langKey: "deliveryAgent" },
];

export default function CodReconciliation() {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appToast = useAppToast();

  const [activeTab, setActiveTab] = useState(tabItems[0].key);
  const [viewBy, setViewBy] = useState<"order" | "user">("order");
  const [view, setView] = useState<ViewToggleType>("list");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [summary, setSummary] = useState<any[]>([]);

  const [handoverModal, setHandoverModal] = useState({
    show: false,
    data: null,
  });

  const [userPendingHandoverModal, setUserPendingHandoverModal] = useState<{
    show: boolean;
    userId: string | null;
  }>({
    show: false,
    userId: null,
  });

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({ status: activeTab });

  // Load summary data
  const loadSummary = useCallback(async () => {
    try {
      const summaryData = await getSummary(filterRef.current);

      const summaryArray = [
        {
          label: "Pending Handover",
          langKey: "pendingHandover",
          value: summaryData.initiated || 0,
          color: "warning",
          amountClass: "tw:text-orange-600",
          borderClass: "tw:border-orange-200",
          icon: <IndianRupee size={20} />,
        },
        {
          label: "Handed Over",
          langKey: "handedover",
          value: summaryData.settled || 0,
          color: "info",
          amountClass: "tw:text-blue-600",
          borderClass: "tw:border-blue-200",
          icon: <IndianRupee size={20} />,
        },
        // {
        //   label: "Deposited",
        //   value: countResult.value || 0,
        //   color: "tw:text-green-600 tw:border-green-100",
        //   amountClass: "tw:text-green-600",
        //   borderClass: "tw:border-green-200",
        // },
      ];
      setSummary(summaryArray);
    } catch (error) {
      console.error("Error loading summary:", error);
      setSummary([]);
    }
  }, []);

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
        { ...filterRef.current, status: activeTab, viewBy },
        paginationRef.current,
        { key: "orderDate", value: "desc" },
      );
      const result = await getData(params);
      setData(result || []);
      const countResult = await getCount(params);
      console.log(countResult);
      paginationRef.current.totalRecords = countResult.count || 0;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );

      // Load summary data
      await loadSummary();
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [activeTab, viewBy, loadSummary]);

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
        { ...filterRef.current, status: activeTab, viewBy },
        paginationRef.current,
        { key: "orderDate", value: "desc" },
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, activeTab, viewBy]);

  // Initial load and on tab change
  useEffect(() => {
    filterRef.current.activeTab = activeTab;
    applyFilter();
  }, [activeTab, applyFilter]);

  const onFilterChange = useCallback(
    (data: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter],
  );

  const handleHandoverModalCallback = (data: any) => {
    setHandoverModal({
      show: false,
      data: null,
    });

    // Refresh data if handover was successful
    if (data.success) {
      applyFilter();
    }
  };

  const handleItemCallback = (data: any) => {
    if (
      AuthService.isMasterLogin() &&
      !AuthService.isMasterLoginWithFullAccess()
    ) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "error",
      });
      return;
    }
    if (data.action === "handover") {
      if (viewBy === "user") {
        setUserPendingHandoverModal({
          show: true,
          userId: data.data?.shipmentUserId || null,
        });
        return;
      }
      setHandoverModal({
        show: true,
        data: data.data,
      });
    }
  };

  const handleUserPendingHandoverModalCallback = (data: {
    action: string;
    data?: any;
  }) => {
    if (data.action === "handover" && data.data) {
      setUserPendingHandoverModal({ show: false, userId: null });
      setHandoverModal({ show: true, data: data.data });
      return;
    }
    setUserPendingHandoverModal({ show: false, userId: null });
  };

  return (
    <>
      <Filter callback={onFilterChange} tab={activeTab} />
      <Summary summaryData={summary} />
      <AppTab
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab.key)}
        className="tw:mb-4"
      />
      <div className="tw:mb-4 tw:flex tw:items-center tw:gap-3">
        <span className="tw:text-sm tw:font-medium tw:text-muted-foreground">
          {t("viewBy")}:
        </span>
        <AppRadio
          name="viewBy"
          defaultValue={viewBy}
          inline
          onChange={(value) => setViewBy(value as "order" | "user")}
          options={viewByItems.map((item) => ({
            value: item.key,
            label: item.name,
            langKey: item.langKey,
          }))}
        />
      </div>
      <div className="tw:flex tw:justify-between tw:mb-4 tw:items-center">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
        />
        <ViewToggle viewType={view} callback={setView} />
      </div>
      {isMobile || view === "card" ? (
        <>
          {viewBy === "user" ? (
            <UserMobileView
              data={data}
              loading={loading}
              callback={handleItemCallback}
              tab={activeTab}
            />
          ) : (
            <MobileView
              data={data}
              loading={loading}
              callback={handleItemCallback}
              tab={activeTab}
            />
          )}
          {hasMoreData && !loading && (
            <div className="tw:text-center tw:mt-4">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          )}
        </>
      ) : (
        <AppCard noPadding>
          {viewBy === "user" ? (
            <UserDesktopView
              data={data}
              loading={loading}
              callback={handleItemCallback}
              tab={activeTab}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              hasMoreData={hasMoreData}
            />
          ) : (
            <DesktopView
              data={data}
              loading={loading}
              callback={handleItemCallback}
              tab={activeTab}
              loadMore={loadMore}
              loadingMore={loadingMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              hasMoreData={hasMoreData}
            />
          )}
        </AppCard>
      )}

      <HandoverModal
        show={handoverModal.show}
        data={handoverModal.data}
        callback={handleHandoverModalCallback}
      />

      <UserPendingHandoverModal
        show={userPendingHandoverModal.show}
        userId={userPendingHandoverModal.userId}
        callback={handleUserPendingHandoverModalCallback}
      />
    </>
  );
}

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("COD Reconciliation"),
    },
  ];
}
