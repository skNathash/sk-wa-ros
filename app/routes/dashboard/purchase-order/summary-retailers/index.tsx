import { endOfDay, format, startOfDay, sub } from "date-fns";
import { ArrowRight, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useLocation, useSearchParams } from "react-router";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import PageHeader from "~/shared/page-header/PageHeader";
import CreatePoFab from "~/shared/purchase-order/components/CreatePoFab";
import PoActionButtons from "~/shared/purchase-order/components/PoActionButtons";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import PurchaseOrderSidePane from "~/shared/purchase-order/components/purchase-order-side-pane/PurchaseOrderSidePane";
import type {
  BreadcrumbItem,
  PaginationState,
  ViewToggleType,
} from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareFilterParams } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Purchase Orders",
    redirect: { path: "/dashboard/purchase-order/main" },
    langKey: "purchaseOrders",
  },
  {
    label: "Network Purchase",
    redirect: { path: "/dashboard/purchase-order/seller-summary" },
    langKey: "networkPurchase",
  },
  {
    label: "Retailers",
    langKey: "retailers",
  },
];

const defaultFilter = {
  search: "",
  vendorType: "All",
};

const getPageTitle = (groupByType: string) => {
  if (groupByType === "total") {
    return "All Retailers";
  }
  return `Retailers - ${
    groupByType === "received" ? "Received POs" : "Not Received POs"
  }`;
};

const getPageDescription = (groupByType: string) => {
  if (groupByType === "total") {
    return "List of all retailers with purchase order summary";
  }
  if (groupByType === "received") {
    return "List of retailers with received purchase orders";
  }
  if (groupByType === "notReceived") {
    return "List of retailers with not received purchase orders";
  }
  return "";
};

const SummaryRetailers = () => {
  const { t } = useTranslation(["common", "menu"]);
  const isTheme2 = useTheme() === "theme-2";

  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isMobile } = useScreenView();

  const [view, setView] = useState<ViewToggleType>("list");

  const [pageTitle, setPageTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [retailers, setRetailers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  type FormValues = {
    dateRange: Date[];
    vendorInfo?: Record<string, any>;
    search?: string;
    groupByType?: string;
  };

  const formMethods = useForm<FormValues>({
    defaultValues: {
      dateRange: [sub(new Date(), { days: 30 }), new Date()],
      vendorInfo: {},
      search: "",
      groupByType: "",
    },
  });

  // watch vendorInfo from the Filter form so we can show selected vendor chip
  const vendorInfo = useWatch<any>({
    control: formMethods.control,
    name: "vendorInfo",
  });

  const groupByType =
    useWatch({ control: formMethods.control, name: "groupByType" }) || "";

  const clearSelectedVendor = () => {
    formMethods.setValue("vendorInfo", {});
    // update URL/query params after clearing vendor so filters sync
    handleFilter();
  };

  const handleFilter = () => {
    const formData = formMethods.getValues();
    const params = getQueryParamsFromForm(formData);

    appNav.replace(location.pathname, params);
  };

  // When search params change in the URL, sync them into the form and apply filter
  useEffect(() => {
    const s = Object.fromEntries(Array.from(searchParams.entries()));

    const newFormValues: any = {
      groupByType: s.groupByType || "",
    };

    if (s.search) {
      newFormValues.search = s.search;
    }

    if (s.vendorId || s.vendorName) {
      newFormValues.vendorInfo = {
        vendorId: s.vendorId,
        name: s.vendorName,
        _id: s.vendorId,
      };
    }

    if (s.startDate && s.endDate) {
      try {
        newFormValues.dateRange = [new Date(s.startDate), new Date(s.endDate)];
      } catch (e) {
        // ignore parse errors
      }
    }

    // set form values silently
    Object.keys(newFormValues).forEach((k) => {
      formMethods.setValue(k as any, newFormValues[k]);
    });

    // update filterRef so prepareParams uses the latest form state
    filterRef.current = { ...filterRef.current, ...formMethods.getValues() };

    setPageTitle(getPageTitle(s.groupByType));
    setDescription(getPageDescription(s.groupByType));

    // apply filter after syncing form
    applyFilterList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const init = useCallback(() => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    applyFilterList();
  }, []);

  const applyFilterList = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setRetailers([]);
    try {
      const params = prepareFilterParams(
        filterRef.current,
        paginationRef.current
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
        paginationRef.current
      );
      const data = await getData(params);
      setRetailers(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading summary retailers:", error);
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
        paginationRef.current
      );
      const data = await getData(params);
      setRetailers((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more summary retailers:", error);
    } finally {
      setLoadingMore(false);
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
          filterRef.current.dateRange[0]
        ).toISOString();
        params.dateTo = endOfDay(filterRef.current.dateRange[1]).toISOString();
      }

      if (filterRef.current.groupByType) {
        params.groupByType = filterRef.current.groupByType;
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

  const handleItemCb = (a: { action: string; data: any }) => {
    if (a.action === "viewRetailer") {
      const row = a.data || {};
      // Prefer franchiseId for the retailer link; fall back to existing ids if needed
      const franchiseId = row?.vendorInfo?.franchiseId;
      if (franchiseId) {
        appNav.to(
          `/products/buy-from-other-retailer/retailer/${franchiseId}?tab=orders`
        );
      }
    }
  };

  const handleSummaryCardCallback = (a: { action: string; data?: any }) => {
    formMethods.setValue("groupByType", a.data.type);
    filterRef.current.groupByType = a.data.type;
    applyFilterList();
  };

  const getQueryParamsFromForm = (formData: any) => {
    const params: Record<string, any> = {};

    if (formData.search?.trim()) {
      params.search = formData.search.trim();
    }

    if (formData.vendorInfo?._id) {
      params.vendorId = formData.vendorInfo.vendorId || formData.vendorInfo._id;
      params.vendorName = formData.vendorInfo.name;
    }

    if (
      formData.dateRange &&
      Array.isArray(formData.dateRange) &&
      formData.dateRange.length === 2
    ) {
      params.dateFrom = format(formData.dateRange[0], "yyyy-MM-dd");
      params.dateTo = format(formData.dateRange[1], "yyyy-MM-dd");
    }

    return params;
  };

  const handleCreatePurchaseOrder = () => {
    appNav.to("/dashboard/purchase-order/vendors", {
      from: "order",
    });
  };

  return (
    <>
      <AppHeader
        title={pageTitle || t("networkPurchase")}
        sectionKey="supply"
        activeTab="purchase-orders"
        mobileLead="menu"
        showAudioNote={true}
        audioNoteTitle={t("purchaseOrders")}
        audioFeature="order"
      />
      <div className="page-padding page-bg app-page has-footer theme-2-no-footer">
        <div className="app-container">
          {/* PO tab bar — theme-2 mobile only (see theme-2.css). */}
          <PoSectionTabs outerClassName="tw:mb-3" />

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
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12 tw:space-y-0">
                  {!isTheme2 && (
                    <div className="theme-2-hide tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4 tw:gap-3">
                      <PageHeader
                        breadcrumbs={breadcrumbs}
                        title={pageTitle || "Network Retailers"}
                        description="purchaseOrder"
                      />

                      <PoActionButtons
                        createFrom="order"
                        getVendorParams={() =>
                          getQueryParamsFromForm(formMethods.getValues())
                        }
                      />
                    </div>
                  )}

                  <FormProvider {...formMethods}>
                    <Filter callback={onFilterChange} />
                  </FormProvider>

                  {/* Show selected vendor chip with remove icon when vendorInfo is set */}
                  {vendorInfo && vendorInfo?._id ? (
                    <div className="tw:mt-3 tw:flex tw:items-center tw:gap-2 tw:mb-4">
                      <div className="tw:text-sm tw:font-medium">
                        Selected Retailer
                      </div>
                      <AppBadge
                        variant="primary"
                        showClose={true}
                        onClose={clearSelectedVendor}
                      >
                        {vendorInfo.name}
                      </AppBadge>
                    </div>
                  ) : null}

                  <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={retailers.length}
                      fwSize="sm"
                    />
                    <ViewToggle viewType={view} callback={setView} />
                  </div>

                  {isMobile || view === "card" ? (
                    <MobileView
                      data={retailers}
                      groupByType={groupByType}
                      showLoadMore={hasMoreData}
                      loadMore={loadMore}
                      loadingMore={loadingMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={retailers.length}
                    />
                  ) : (
                    <AppCard noPadding={true}>
                      <DesktopView
                        data={retailers}
                        loading={loading}
                        callback={handleItemCb}
                        showLoadMore={hasMoreData}
                        loadMore={loadMore}
                        loadingMore={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                        groupByType={groupByType}
                      />
                    </AppCard>
                  )}
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <PurchaseOrderSidePane />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="app-footer theme-2-mobile-hide">
        <div className="tw:md:text-end">
          <AppButton
            color="primary"
            onClick={() => appNav.to("/dashboard/purchase-order/box-receive")}
            className="tw:font-semibold tw:w-full tw:md:w-auto"
            size="large"
          >
            <ScanLine size={16} />
            {t("scanBox")}
            <ArrowRight className="tw:ml-1" size={16} />
          </AppButton>
        </div>
      </div>
      <CreatePoFab />
    </>
  );
};

export default SummaryRetailers;
