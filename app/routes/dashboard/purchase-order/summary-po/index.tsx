import { endOfDay, startOfDay } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useAppToast from "~/hooks/useAppToast";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import SummaryPoAppliedFilter from "./components/AppliedFilter";
import { getCount, getData, prepareFilterParams } from "./helper";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PurchaseOrderService from "~/services/PurchaseOrderService";
import PageHeader from "~/shared/page-header/PageHeader";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PoActionButtons from "~/shared/purchase-order/components/PoActionButtons";
import PoListTabs from "../components/tabs/PoListTabs";

const defaultBreadcrumbs = [
  {
    label: "Purchase Orders",
    redirect: { path: "/dashboard/purchase-order/main" },
    langKey: "purchaseOrders",
  },
  { label: "All Purchase Orders", langKey: "allPurchaseOrders" },
];

const defaultFilter = {
  search: "",
  vendorType: "All",
  status: "All",
  type: "All",
};

const getPageTitle = (groupByType: string) => {
  if (groupByType === "total") {
    return "All Purchase Orders";
  }
  return `Purchase Orders - ${
    groupByType === "received" ? "Received POs" : "Not Received POs"
  }`;
};

const getPageDescription = (groupByType: string) => {
  if (groupByType === "total") {
    return "List of all purchase orders with summary";
  }
  if (groupByType === "received") {
    return "List of purchase orders with received status";
  }
  if (groupByType === "notReceived") {
    return "List of purchase orders with not received status";
  }
  return "";
};

const SummaryVendors = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();

  const methods = useForm();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { isMobile } = useScreenView();
  const appNav = useAppNav();

  const [view, setView] = useState<ViewToggleType>("list");

  const [pageTitle, setPageTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [breadcrumbs] = useState(defaultBreadcrumbs);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const groupByType = useWatch({
    control: methods.control,
    name: "groupByType",
  });

  // When search params change in the URL, sync them into the form and apply filter
  useEffect(() => {
    const s = Object.fromEntries(Array.from(searchParams.entries()));

    const newFormValues: any = {
      groupByType: s.groupByType || "",
      status: s.status || "All",
      purchasedFrom: s.purchasedFrom || "All",
    };

    if (s.search) {
      newFormValues.search = s.search;
    }

    if (s.vendorId || s.vendorName) {
      // map vendor fields similar to summary page
      newFormValues.vendorInfo = {
        vendorId: s.vendorId,
        name: s.vendorName,
        _id: s.vendorId,
      };
    }

    if (s.dateFrom && s.dateTo) {
      try {
        newFormValues.dateRange = [new Date(s.dateFrom), new Date(s.dateTo)];
      } catch (e) {
        // ignore parse errors
      }
    }

    // set form values silently
    Object.keys(newFormValues).forEach((k) => {
      methods.setValue(k as any, newFormValues[k]);
    });

    // update filterRef so prepareParams uses the latest form state
    filterRef.current = { ...filterRef.current, ...methods.getValues() };

    setPageTitle(getPageTitle(s.groupByType));
    setDescription(getPageDescription(s.groupByType));

    // apply filter after syncing form
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const init = useCallback(() => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    applyFilter();
  }, []);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setOrders([]);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
      );
      const total = await getCount(params);
      paginationRef.current.totalRecords = total;
    } finally {
      setLoading(false);
    }

    loadList();
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
      );
      const data = await getData(params);
      setOrders(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading summary vendors:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    setLoadingMore(true);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current,
      );
      const data = await getData(params);
      setOrders((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more summary vendors:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const downloadSummary = async () => {
    if (downloading) return;
    setDownloading(true);

    const rowsToFetch = Math.max(
      paginationRef.current.totalRecords || 0,
      10000,
    );
    const downloadPagination: PaginationState = {
      ...paginationRef.current,
      activePage: 1,
      rowsPerPage: rowsToFetch,
      startSlNo: 1,
      endSlNo: rowsToFetch,
      totalRecords: paginationRef.current.totalRecords,
    };

    const params = prepareFilterParams(filterRef.current, downloadPagination);
    params.outputType = "download";

    try {
      const userId = AuthService.getLoggedInUserId();
      const response = await PurchaseOrderService.getPoDashboardSummary(
        userId,
        params,
      );
      const fileName = response.data?.data?.fileName;
      if (!fileName) {
        appToast.show({
          color: "error",
          msg: "Failed to download summary",
        });
        return;
      }

      CommonService.windowOpenHandler(
        PurchaseOrderService.getPoDashboardSummaryDownloadUrl(fileName),
        () => {},
      );

      appToast.show({
        color: "success",
        msg: "Summary downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PO summary:", error);
      appToast.show({
        color: "error",
        msg: "Failed to download summary",
      });
    } finally {
      setDownloading(false);
    }
  };

  const onFilterChange = (a: { formData: any; action: string }) => {
    filterRef.current = { ...filterRef.current, ...a.formData };

    try {
      const params: Record<string, any> = {};

      if (filterRef.current.search?.trim()) {
        params.search = filterRef.current.search.trim();
      }

      if (filterRef.current.vendorInfo?._id) {
        params.vendorId = filterRef.current.vendorInfo.vendorId;
        params.vendorName = filterRef.current.vendorInfo.name;
      }

      if (
        filterRef.current.dateRange &&
        Array.isArray(filterRef.current.dateRange) &&
        filterRef.current.dateRange.length === 2
      ) {
        params.dateFrom = startOfDay(
          filterRef.current.dateRange[0],
        ).toISOString();
        params.dateTo = endOfDay(filterRef.current.dateRange[1]).toISOString();
      }

      if (filterRef.current.groupByType) {
        params.groupByType = filterRef.current.groupByType;
      }

      if (filterRef.current.status && filterRef.current.status !== "All") {
        params.status = filterRef.current.status;
      }

      if (
        filterRef.current.purchasedFrom &&
        filterRef.current.purchasedFrom !== "All"
      ) {
        params.purchasedFrom = filterRef.current.purchasedFrom;
      }

      if (Object.keys(params).length > 0) {
        appNav.replace(location.pathname, params);
      } else {
        // remove query params when no filters
        appNav.replace(location.pathname);
      }
    } catch (e) {
      // ignore errors during URL sync
    }
  };

  const handleAppliedFilterChange = (filters: { formData: any }) => {
    onFilterChange({ formData: filters.formData, action: "appliedFilter" });
  };

  const handleRowAction = (a: { action: string; data: any }) => {
    if (a.action === "viewVendor") {
      const row = a.data || {};
      const id = row?._id || row?.vendorInfo?.vendorId;
      if (id) {
        appNav.to(`/dashboard/vendor/view/${id}`);
      }
    }
  };

  return (
    <>
      <AppHeader title={pageTitle} />
      <div className="app-page page-padding page-bg">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab="purchase-orders"
            noShadow
            sticky
          />

          <div className="section-layout">
            {/* Desktop-only left rail — section side menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="supply"
                  activeTab="purchase-orders"
                  title={t("manageSupply", { ns: "menu" })}
                />
              </div>
            </aside>

            <div className="section-content">
          <div className="theme-2-mobile-hide tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-2 tw:mb-4">
            <PageHeader
              breadcrumbs={breadcrumbs}
              title={pageTitle || t("purchaseOrders")}
              description="purchaseOrder"
            />
            <PoActionButtons />
          </div>

          {groupByType === "total" && (
            <PoListTabs activeTab="all-po" className="tw:mb-4" />
          )}

          <FormProvider {...methods}>
            <div className="tw:mb-2">
              <Filter callback={onFilterChange} />
              <SummaryPoAppliedFilter
                onFilterChange={handleAppliedFilterChange}
              />
            </div>
          </FormProvider>

          <div className="tw:flex tw:justify-between tw:items-center tw:mb-2 tw:flex-wrap tw:gap-3">
            <div>
              <PaginationSummary
                paginationConfig={paginationRef.current}
                loadingTotalRecords={loading}
                loadedCount={orders.length}
                fwSize="sm"
              />
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <AppButton
                size="small"
                fill="outline"
                color="light"
                onClick={downloadSummary}
                disabled={loading || downloading}
                isLoading={downloading}
              >
                <Download className="tw:mr-1" size={14} aria-hidden />
                {downloading ? t("common:downloading") : t("common:download")}
              </AppButton>
              <ViewToggle
                viewType={view}
                callback={setView}
                showOnlyIcon={isMobile}
              />
            </div>
          </div>
          {isMobile || view === "card" ? (
            <>
              <MobileView data={orders} groupByType={groupByType} />
              {hasMoreData && !loading && orders.length > 0 && (
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={orders.length}
                />
              )}
            </>
          ) : (
            <AppCard noPadding={true}>
              <DesktopView
                data={orders}
                loading={loading}
                sortCb={() => {}}
                callback={handleRowAction}
                showLoadMore={hasMoreData}
                loadMore={loadMore}
                loadingMore={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                groupByType={groupByType}
              />
            </AppCard>
          )}
            </div>
          </div>
        </div>
      </div>

      <CreatePoFab />

      <BusyLoader show={downloading} message={t("common:downloading")} />
    </>
  );
};

export default SummaryVendors;
