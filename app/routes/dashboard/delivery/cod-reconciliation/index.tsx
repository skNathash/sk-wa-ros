import { Package, Search } from "lucide-react";
import { debounce } from "lodash";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppTab from "~/components/core/tab/AppTab";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import DeliveryTabs from "~/shared/delivery/components/delivery-tabs/DeliveryTabs";
import PageTopBar from "~/shared/layout/page-top-bar/PageTopBar";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import MobileViewTheme2 from "./components/MobileViewTheme2";
import Summary from "./components/Summary";
import UserDesktopView from "./components/user/DesktopView";
import UserMobileView from "./components/user/MobileView";
import UserMobileViewTheme2 from "./components/user/MobileViewTheme2";
import { getCount, getData, getSummary, prepareParams } from "./helper";
import HandoverModal from "./modals/HandoverModal";
import UserPendingHandoverModal from "./modals/UserPendingHandoverModal/UserPendingHandoverModal";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Delivery Management",
    langKey: "deliveryManagement",
  },
];

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

/* Mobile runs both segmented controls on one line, where the full "Delivery
   Agent" label overruns the strip — the short form keeps it whole. */
const viewByItemsCompact: TabItem[] = [
  { key: "order", name: "Order", langKey: "order" },
  { key: "user", name: "Agent" },
];

export default function CodReconciliation() {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const appToast = useAppToast();
  const { register, getValues } = useForm({
    defaultValues: { search: "" },
  });

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
          icon: <Package size={20} />,
        },
        {
          label: "Handed Over",
          langKey: "handedover",
          value: summaryData.settled || 0,
          color: "info",
          amountClass: "tw:text-blue-600",
          borderClass: "tw:border-blue-200",
          icon: <Package size={20} />,
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

  const handleSearchChange = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues],
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
      {/* Sub-nav + search on one full-bleed white strip pinned under the app
          header — the top block every reworked section page opens with. The
          page's own controls (pending / handed over, view-by, date range) ride
          a second row of the same strip. */}
      <PageTopBar
        lead={
          /* theme-2 hides the delivery sub-nav here. */
          !isTheme2 ? (
            <DeliveryTabs
              activeTab="cod-reconciliation"
              variant={isTheme2 ? "pills" : undefined}
            />
          ) : undefined
        }
        trail={
          <AppInput
            register={register}
            name="search"
            placeholder={t("searchByOrderNumber")}
            className="tw:w-full"
            onChange={handleSearchChange}
            leftIcon={<Search size={16} />}
          />
        }
      >
        {/* Second row of the strip. The section pills (Dispatch / In Transit /
            COD Reconciliation) already own the row above, so the page's own
            controls stay on the lighter segmented treatment — two pill rows
            stacked read as one confused sub-nav. */}
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-2">
          {/* The two segmented controls travel together: one scrolling line of
              their own on mobile, inline with the date range from sm up. */}
          <div className="hide-scrollbar tw:flex tw:w-full tw:flex-nowrap tw:items-center tw:gap-x-3 tw:overflow-x-auto tw:sm:w-auto tw:sm:overflow-visible">
            <AppTab
              tabs={tabItems}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab.key)}
              compact
              className="tw:shrink-0"
            />

            <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
              {/* The caption only earns its width once the strip has room for
                  it — on mobile the two controls share a single line. */}
              <span className="tw:hidden tw:sm:inline tw:text-xs tw:font-medium tw:text-muted-foreground">
                {t("viewBy")}:
              </span>
              <AppTab
                tabs={isMobile ? viewByItemsCompact : viewByItems}
                activeTab={viewBy}
                onTabChange={(tab) => setViewBy(tab.key as "order" | "user")}
                compact
                className="tw:shrink-0"
              />
            </div>
          </div>

          {/* The date range only narrows what has already been handed over. It
              breaks to its own full-width row on mobile rather than riding the
              scrolling line above, where it would sit off-screen. */}
          {activeTab === "handedover" && (
            <div className="tw:w-full tw:sm:ms-auto tw:sm:w-auto tw:sm:min-w-56">
              <Filter callback={onFilterChange} />
            </div>
          )}
        </div>
      </PageTopBar>

      {/* theme-2 drops the breadcrumb block; the strip above is the page's
          whole top section there. */}
      <div className="hide-in-theme-2">
        <AppBreadcrumbs data={breadcrumbs} />
        <PageDescription description="lastMileDelivery" className="tw:mb-4" />
      </div>

      <Summary summaryData={summary} />
      <div className="tw:flex tw:justify-between tw:mb-4 tw:items-center">
        <PaginationSummary
          paginationConfig={paginationRef.current}
          loadingTotalRecords={loading}
          loadedCount={data.length}
          fwSize="sm"
        />
        {/* theme-2 picks the view from the screen, so the toggle only exists
            in the themes that still offer both. */}
        {!isTheme2 && <ViewToggle viewType={view} callback={setView} />}
      </div>
      {/* theme-2 mobile runs the same chat-list sheet for both view-by modes —
          only the row's subject changes (a settlement, or the agent holding
          the cash), so switching view-by never switches layouts. */}
      {isTheme2 && isMobile ? (
        <>
          {viewBy === "user" ? (
            <UserMobileViewTheme2
              data={data}
              loading={loading}
              callback={handleItemCallback}
              tab={activeTab}
            />
          ) : (
            <MobileViewTheme2
              data={data}
              loading={loading}
              callback={handleItemCallback}
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
      ) : isMobile || (!isTheme2 && view === "card") ? (
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
