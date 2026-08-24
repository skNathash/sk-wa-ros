import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import { useSearchParams } from "react-router";
import { endOfMonth, startOfMonth } from "date-fns";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import AccountsSidePane from "~/shared/accounts/components/accounts-side-pane/AccountsSidePane";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import Filter from "./components/Filter";
import ExpenseOverview from "~/shared/expense/components/expense-overview/ExpenseOverview";
import SnapBillBanner from "./components/SnapBillBanner";
import AiScanModal from "./components/ai-scan/AiScanModal";
import Category from "./components/Category";

const defaultFilter = {
  search: "",
  dateRange: null,
  category: null,
  subcategory: null,
  status: "all",
  type: "all",
};

const ExpenseRecords = () => {
  const { t } = useTranslation(["expense", "menu"]);
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { isMobile } = useScreenView();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [view, setView] = useState<ViewToggleType>("list");
  const [showAiScan, setShowAiScan] = useState(false);

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // Category filter is driven by the `category` query param (set by the Category
  // grid); the date range is driven by the `month`/`year` query params (set by
  // the Summary month/year selects). Re-fetch whenever any of them change.
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");

  useEffect(() => {
    const now = new Date();
    const month =
      monthParam !== null &&
      Number.isInteger(Number(monthParam)) &&
      Number(monthParam) >= 0 &&
      Number(monthParam) <= 11
        ? Number(monthParam)
        : now.getMonth();
    const year =
      yearParam !== null && /^\d{4}$/.test(yearParam)
        ? Number(yearParam)
        : now.getFullYear();
    const base = new Date(year, month, 1);

    filterRef.current = {
      ...filterRef.current,
      category: categoryParam ? [{ value: categoryParam, label: "" }] : null,
      dateRange: [startOfMonth(base), endOfMonth(base)],
    };
    applyFilter();
  }, [categoryParam, monthParam, yearParam]);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setRecords([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        undefined
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const data = await getData(params);
      setRecords(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
      appToast.show({ msg: t("errorOccured") || "Error", color: "danger" });
    } finally {
      setLoading(false);
    }
  }, [appToast, t]);

  // Load more
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
        undefined
      );
      const data = await getData(params);
      setRecords((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error(e);
      appToast.show({ msg: t("errorOccured") || "Error", color: "danger" });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, appToast, t]);

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = { ...filterRef.current, ...formData };
      applyFilter();
    },
    [applyFilter]
  );

  const handleItemAction = useCallback(
    ({ action, data }: any) => {
      if (action === "view") {
        appNav.to(`/dashboard/expenses/view/${data._id}`);
      } else if (action === "receipt") {
        // open receipt in new tab or modal - placeholder
        if (data?.receiptUrl) window.open(data.receiptUrl, "_blank");
      }
    },
    [appNav]
  );

  return (
    /* No `theme-2-mobile-gap-top`: the layout's sticky tab tray sits directly
       above with its own bottom margin, so the grid's mobile top gap would only
       double the space between the tray and the first card. */
    <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
      <AppPaneMain className="tw:lg:col-span-12">
        {/* Period total + category split. Lives on the page itself in every
            layout — the side pane deliberately doesn't carry a copy. */}
        <ExpenseOverview className="tw:mb-4" />

        <SnapBillBanner onClick={() => setShowAiScan(true)} />

        <AiScanModal
          show={showAiScan}
          callback={(data) => {
            if (data.action === "close") setShowAiScan(false);
            if (data.action === "saved") applyFilter();
          }}
        />

        <Category />

        <Filter callback={handleFilterChange} />

        <div className="tw:flex tw:justify-between tw:mb-3 tw:items-center">
          <div className="tw:flex tw:items-center tw:gap-3">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              loadedCount={records.length}
              fwSize="sm"
            />
          </div>
          <ViewToggle viewType={view} callback={setView} />
        </div>

        {isMobile || view === "card" ? (
          <MobileView
            data={records}
            callback={handleItemAction}
            showLoadMore={hasMoreData}
            loadingMore={loadingMore}
            loadMore={loadMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={records.length}
            loading={loading}
          />
        ) : (
          <AppCard noPadding>
            <DesktopView
              data={records}
              loading={loading}
              callback={handleItemAction}
              loadedCount={records.length}
              showLoadMore={hasMoreData && !loading}
              loadingMore={loadingMore}
              loadMore={loadMore}
              totalCount={paginationRef.current.totalRecords}
            />
          </AppCard>
        )}
      </AppPaneMain>

      {/* Side column — only rendered while the theme-2 split layout is active
          (lg+), where the CSS re-homes it as the fixed list pane beside the
          icon rail. Shared with the accounts section: its chips are the
          business-money navigation, and the expense chip stacks the Add Expense
          CTA, the month hero and the recent expenses list. */}
      <AccountsSidePane />
    </div>
  );
};

export default ExpenseRecords;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Expense Records"),
    },
  ];
}
