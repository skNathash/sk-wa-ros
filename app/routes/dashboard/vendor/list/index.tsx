import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
// import ListSummary from "../components/ListSummary"; // replaced by VendorSummary
// import VendorSummary from "../components/VendorSummary"; // strip commented out below
import FilterChip from "~/components/core/filter-chip/FilterChip";
import FilterChipGroup from "~/components/core/filter-chip/FilterChipGroup";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import VendorAppliedFilter from "./components/AppliedFilter";
import MobileView from "./components/MobileView";
import {
  getCount,
  getData,
  getSummary,
  prepareParams,
  prepareSummaryParams,
} from "./helper";
import VendorBrandsListModal from "./modals/VendorBrandsListModal";
import RecordPaymentModal from "~/shared/accounts/modals/RecordPaymentModal";
import PageAccessService from "~/services/PageAccessService";
import Rbac from "~/components/core/rbac/Rbac";
import CommonService from "~/services/CommonService";
import SkSellerAvailableNote from "~/shared/vendor/components/sk-seller-available/SkSellerAvailableNote";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import PageHeading from "~/components/core/page-heading/PageHeading";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import VendorSidePane from "~/shared/vendor/components/vendor-side-pane/VendorSidePane";
import AddVendorFab from "~/shared/vendor/components/AddVendorFab";
import ViewToggle from "../components/ViewToggle";

const rbacRoles = {
  addVendor: ["VENDOR.ADD"],
};

/**
 * Sticky vertical A–Z rail used only on mobile. Rendered inside FormProvider
 * so it can read/write the `alpha` filter and trigger the list callback.
 */
const MobileAlphaRail = ({ callback }: { callback: (value: any) => void }) => {
  const { getValues, setValue } = useFormContext();
  const alpha = getValues("alpha");

  const handleAlphaChange = (value: string) => {
    setValue("alpha", value, { shouldValidate: false });
    callback({ formData: { ...getValues(), alpha: value } });
  };

  // `w-7` is the rail's real width: the widest chips ("All"/"123") no longer
  // overflow it and spill past the page gutter. The chips stretch to fill it so
  // every letter sits on the same centred column.
  return (
    <div className="tw:sticky tw:top-24 tw:self-start tw:h-[calc(100vh-16rem)] tw:shrink-0 tw:w-7">
      <Alpha
        callback={handleAlphaChange}
        selected={alpha}
        orientation="vertical"
        className="tw:h-full tw:[&_span]:my-0.5 tw:[&_span]:block tw:[&_span]:w-full tw:[&_span]:px-0 tw:[&_span]:py-0.5 tw:[&_span]:text-center tw:[&_span]:text-[10px]"
      />
    </div>
  );
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

/* Quick-filter chips under the summary strip. STATIC placeholder data for the
   theme-2 design pass — visual-only for now, wired to the list filters in a
   follow-up. */
const quickFilterChips = [
  { key: "all", label: "All" },
  { key: "due", label: "Due" },
  { key: "alerts", label: "Alerts" },
  { key: "30-day", label: "30-day" },
  { key: "15-day", label: "15-day" },
  { key: "cod", label: "COD" },
];

const VendorList = () => {
  const { t } = useTranslation(["common", "menu"]);

  const { isMobile } = useScreenView();

  const appNav = useAppNav();

  const methods = useForm({
    defaultValues: {
      status: "All",
      alpha: "",
      createdBy: "me",
      brand: [] as any[],
      search: "",
      distance: "any",
    },
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const from = searchParams.get("from");

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      langKey: "dashboard",
      redirect: { path: "/dashboard" },
    },
    ...(from === "po"
      ? [
          {
            label: "Purchase Orders",
            langKey: "purchaseOrders",
            redirect: { path: "/dashboard/purchase-order/main" },
          },
        ]
      : []),
    { label: "Parties/Vendors List" },
  ];

  const [data, setData] = useState<any[]>([]);

  const [activeQuickChip, setActiveQuickChip] = useState("all");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [brandsModal, setBrandsModal] = useState<{
    show: boolean;
    brands: any[];
  }>({
    show: false,
    brands: [],
  });

  const [recordPaymentModal, setRecordPaymentModal] = useState<{
    show: boolean;
    vendorId: string;
    vendorName: string;
  }>({
    show: false,
    vendorId: "",
    vendorName: "",
  });

  const [summary, setSummary] = useState<any>({
    totalVendors: 0,
    totalPOValue: 0,
    pendingDeliveries: 0,
    unpaidInvoices: 0,
  });

  const filterRef = useRef<Record<string, any>>({
    alpha: "",
    brand: [],
    createdBy: "me",
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    endSlNo: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  // Guards `loadMore` against the infinite-scroll sentinel firing again while a
  // page is still in flight (and against a page landing after a filter reset).
  const loadingRef = useRef(false);

  // NOTE: no mount-only applyFilter() here — the searchParams effect below runs
  // on mount too, so having both fired two concurrent page-1 fetches whose
  // pagination resets raced with an already-triggered load-more.

  // Sync form state and filters when search params change
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Map search params back to form values
    const formValues: Record<string, any> = {};

    formValues.search = params?.search || "";
    formValues.distance = params?.distance || "any";
    formValues.status = params?.status || "All";
    formValues.alpha = params.alpha || "";
    formValues.createdBy = params.createdBy || "me";
    formValues.quickFilter = params.quickFilter || "all";

    // Keep the quick-filter chip highlight in sync with the URL.
    setActiveQuickChip(params.quickFilter || "all");

    // Handle brandId/brandName mapping back to the expected form shape
    if (params.brandId || params.brandName) {
      formValues.brand = [
        {
          value: { id: params.brandId || "", name: params.brandName || "" },
          label: params.brandName || "",
        },
      ];
    }

    methods.reset({
      ...formValues,
    });

    filterRef.current = {
      ...formValues,
    };

    // Re-apply filter when search params change
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, methods]);

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    loadingRef.current = true;

    const params = prepareParams(filterRef.current, paginationRef.current);
    const countResponse = await getCount(params);

    loadSummary(countResponse);

    const response = await getData(params);

    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData(response);
    paginationRef.current.totalRecords = countResponse;
    setLoading(false);
    loadingRef.current = false;
  };

  const loadSummary = async (totalVendors: number) => {
    const params = prepareSummaryParams(filterRef.current);
    const response = await getSummary(params);
    setSummary({ ...response, totalVendors });
  };

  const loadMore = async () => {
    // The infinite-scroll sentinel can re-fire while a page is still loading.
    if (loadingRef.current) return;
    loadingRef.current = true;

    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);
    const params = prepareParams(filterRef.current, paginationRef.current);
    const response = await getData(params);
    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    // Functional update — `data` in this closure is stale when two pages land
    // back to back (which dropped the appended rows and pinned the list at 10).
    setData((prev) => [...prev, ...response]);
    setLoadingMore(false);
    loadingRef.current = false;
  };

  const handleFilterChange = (value: any) => {
    const formData = value?.formData || {};

    // Build search params from form data
    const params = new URLSearchParams();
    if (from) {
      params.set("from", from);
    }
    if (formData.search) {
      params.set("search", formData.search);
    }

    if (formData.distance && formData.distance !== "any") {
      params.set("distance", String(formData.distance));
    }

    if (formData.status) {
      params.set("status", formData.status);
    }

    if (formData.alpha) {
      params.set("alpha", formData.alpha);
    }

    if (formData.createdBy) {
      params.set("createdBy", formData.createdBy);
    }

    // Preserve the active quick-filter chip across form filter changes
    // (handleFilterChange rebuilds params from scratch).
    const currentQuickFilter = searchParams.get("quickFilter");
    if (currentQuickFilter && currentQuickFilter !== "all") {
      params.set("quickFilter", currentQuickFilter);
    }

    if (
      formData.brand &&
      Array.isArray(formData.brand) &&
      formData.brand.length > 0
    ) {
      const b = formData.brand[0];
      const brandId = b?.value?.id;
      const brandName = b?.label;
      if (brandId) {
        params.set("brandId", brandId);
      }
      if (brandName) {
        params.set("brandName", brandName);
      }
    }

    setSearchParams(params, { replace: true });
  };

  const handleQuickChipClick = (key: string) => {
    // Drive the quick filter through the URL so the searchParams effect syncs
    // filterRef and re-fetches the list (same flow as the other filters).
    const params = new URLSearchParams(searchParams as any);
    if (key === "all") {
      params.delete("quickFilter");
    } else {
      params.set("quickFilter", key);
    }
    setSearchParams(params, { replace: true });
  };

  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "view") {
      appNav.to(`/dashboard/vendor/view/${data._id}`);
    } else if (action === "viewBrands") {
      setBrandsModal({
        show: true,
        brands: data.sourceableBrands || [],
      });
    } else if (action === "pay") {
      setRecordPaymentModal({
        show: true,
        vendorId: data._id,
        vendorName: data.name,
      });
    }
  };

  const handleRecordPaymentCallback = (payload: {
    action: string;
    data?: any;
  }) => {
    const { action, data } = payload;
    setRecordPaymentModal({
      show: false,
      vendorId: "",
      vendorName: "",
    });

    // If the shared RecordPaymentModal reports success, refresh the list
    if (action === "success") {
      // Re-apply filter to refresh data and summary
      applyFilter();
    }
  };

  const handleAppliedFilterCallback = (r: { action: string; data?: any }) => {
    if (r.action === "remove" && r.data && r.data.key) {
      const key = r.data.key as string;
      const params = new URLSearchParams(searchParams as any);

      if (key === "brand") {
        params.delete("brandId");
        params.delete("brandName");
      } else if (key === "alpha") {
        params.delete("alpha");
      } else if (key === "status") {
        params.delete("status");
      } else if (key === "createdBy") {
        params.delete("createdBy");
      } else if (key === "search") {
        params.delete("search");
      } else if (key === "distance") {
        params.delete("distance");
      }

      setSearchParams(params, { replace: true });
    }
  };

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="vendors"
        title={t("vendorList")}
        mobileLead="menu"
      />
      <div className="page-bg app-page has-footer page-padding">
        <PoSectionTabs activeTab="vendors" outerClassName="tw:mb-3" />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="vendors"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
              {/* Main column — spans the full grid (the side pane only
                    exists in theme-2 desktop, where the CSS lifts it out of
                    the grid into the fixed list pane; see AppPane). */}
              {/* `page-flush-top` cancels the page's 1rem top gutter on
                    theme-2 tablet so the first row sits flush under the sticky
                    header instead of showing a page-bg band. On phones the
                    sticky section tab bar already cancels it. */}
              <AppPaneMain className="page-flush-top tw:lg:col-span-12">
                <SkSellerAvailableNote />
                {/* Title / desc / Add Vendor — hidden in theme-2 (side pane
                      + FAB carry those jobs there). */}
                <div className="hide-in-theme-2 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:md:mb-4 tw:gap-4">
                  <div className="tw:flex-1">
                    <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
                    <PageDescription description="manageVendor" />
                    <PageHeading
                      title={t("vendorList")}
                      description="manageVendor"
                    />
                  </div>
                  <div>
                    <Rbac roles={rbacRoles.addVendor}>
                      {!isMobile && (
                        <AppButton
                          color="primary"
                          className="tw:text-white"
                          onClick={() => appNav.to("/dashboard/vendor/manage")}
                        >
                          <Plus className="tw:w-4 tw:h-4" />
                          {t("addVendor")}
                        </AppButton>
                      )}
                    </Rbac>
                  </div>
                </div>

                {/* Old stats-card summary — replaced by the new money-first
                      VendorSummary strip below (kept for reference during the
                      theme-2 redesign). */}
                {/* <ListSummary className="tw:mb-4" summary={summary} /> */}
                {/* You owe / Vendor credit / Alerts strip — commented out
                      while its numbers are still static placeholders. */}
                {/* <div className="tw:border-t tw:border-gray-200 tw:mt-4 tw:lg:mt-0 tw:lg:border-t-0">
                  <VendorSummary className="tw:mb-0!" />
                </div> */}

                <div className="tw:flex tw:flex-col tw:gap-4 tw:lg:flex-row tw:lg:items-center">
                  {/* A–Z rolodex vs By-brand view switcher. */}
                  <ViewToggle active="list" />

                  <FilterChipGroup className="tw:-mx-4 tw:px-4 tw:py-2 tw:lg:mx-0 tw:lg:px-0">
                    {quickFilterChips.map((chip) => (
                      <FilterChip
                        key={chip.key}
                        active={activeQuickChip === chip.key}
                        onClick={() => handleQuickChipClick(chip.key)}
                      >
                        {chip.label}
                      </FilterChip>
                    ))}
                  </FilterChipGroup>

                  {/* Add Vendor — theme-2 desktop only, right-aligned on the
                      same row as the view toggle and quick-filter chips.
                      Mobile/other themes keep the FAB and the header button. */}
                  <div className="app-pane-only tw:shrink-0 tw:lg:ml-auto">
                    <Rbac roles={rbacRoles.addVendor}>
                      <AppButton
                        color="primary"
                        className="tw:text-white"
                        onClick={() => appNav.to("/dashboard/vendor/manage")}
                      >
                        <Plus className="tw:w-4 tw:h-4" />
                        {t("addVendor")}
                      </AppButton>
                    </Rbac>
                  </div>
                  {/* <ListTab activeTab="all" className="tw:mb-4" /> */}
                </div>

                <FormProvider {...methods}>
                  <Filter callback={handleFilterChange} />
                  <VendorAppliedFilter callback={handleAppliedFilterCallback} />

                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    fwSize="sm"
                    loadedCount={data.length}
                    className="tw:mb-2"
                  />

                  {isMobile ? (
                    // Mobile: card list with a sticky vertical A–Z rail on the right.
                    <div className="tw:flex tw:gap-2">
                      <div className="tw:flex-1 tw:min-w-0">
                        {loading ? (
                          <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
                            <AppSpinner className="tw:w-8 tw:h-8" />
                          </div>
                        ) : data.length === 0 ? (
                          <NoData />
                        ) : (
                          <>
                            {data.map((item) => (
                              <MobileView
                                key={item._id}
                                item={item}
                                callback={handleItemCallback}
                              />
                            ))}

                            {hasMoreData && !loading && (
                              <div className="tw:flex tw:justify-center tw:mt-3">
                                <LoadMoreButton
                                  loadMore={loadMore}
                                  loading={loadingMore}
                                  totalCount={
                                    paginationRef.current.totalRecords
                                  }
                                  loadedCount={data.length}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <MobileAlphaRail callback={handleFilterChange} />
                    </div>
                  ) : (
                    <AppCard noPadding>
                      <DesktopView
                        data={data}
                        loading={loading}
                        loadingMore={loadingMore}
                        hasMoreData={hasMoreData}
                        loadMore={loadMore}
                        pagination={paginationRef.current}
                        callback={handleItemCallback}
                      />
                    </AppCard>
                  )}
                </FormProvider>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout
                    is active (lg+), where the CSS re-homes it as the fixed
                    vendor list pane beside the section icon rail. */}
              <AppPaneSide className="app-pane-only">
                <VendorSidePane />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <VendorBrandsListModal
        show={brandsModal.show}
        brands={brandsModal.brands}
        callback={() => {
          setBrandsModal({ show: false, brands: [] });
        }}
      />

      <RecordPaymentModal
        show={recordPaymentModal.show}
        callback={handleRecordPaymentCallback}
        entityId={recordPaymentModal.vendorId}
        entityType={"vendor"}
        hideTabs={true}
        paymentType="makePayout"
      />

      {isMobile && (
        <div className="app-footer theme-2-mobile-hide tw:text-end">
          <Rbac roles={rbacRoles.addVendor}>
            <AppButton
              onClick={() => appNav.to("/dashboard/vendor/manage")}
              color="primary"
              expand="block"
            >
              <Plus className="tw:w-4 tw:h-4 tw:mr-2" />
              {t("addVendor")}
            </AppButton>
          </Rbac>
        </div>
      )}

      {/* Add Vendor FAB — theme-2 mobile only (the sticky footer above is
          hidden there via `theme-2-mobile-hide`). */}
      <AddVendorFab />
    </>
  );
};

export default VendorList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendor List"),
    },
  ];
}
