import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import PageDescription from "~/components/core/page-description/PageDescription";
import PageHeading from "~/components/core/page-heading/PageHeading";
import PoSectionTabs from "~/shared/purchase-order/components/PoSectionTabs";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import VendorSidePane from "~/shared/vendor/components/vendor-side-pane/VendorSidePane";
import AddVendorFab from "~/shared/vendor/components/AddVendorFab";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "../components/ViewToggle";
import BrandGroupCard from "./components/BrandGroupCard";
import Filter from "./components/Filter";
import {
  defaultFilter,
  getCount,
  getData,
  getSummary,
  prepareParams,
  type BrandGroup,
  type FilterFormData,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

/**
 * Vendors grouped by the brands they supply ("By brand" view of the vendor
 * directory). Sits next to the flat A–Z list at /dashboard/vendor/list —
 * switch between the two via the ViewToggle.
 *
 * Data source: `vendor/brands` (see helper.ts) — the response key mapping in
 * `formatBrandGroups` is provisional until the final payload lands.
 */
const VendorBrands = () => {
  const { t } = useTranslation(["common", "menu"]);

  const appNav = useAppNav();

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<BrandGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalBrands, setTotalBrands] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const summary = getSummary(data, totalBrands);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    const params = prepareParams(
      formMethods.getValues(),
      paginationRef.current,
    );

    const [groups, count] = await Promise.all([
      getData(params),
      getCount(params),
    ]);

    setData(groups);
    setTotalBrands(count);
    paginationRef.current.totalRecords = count;
    setHasMoreData(groups.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  }, [formMethods]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    const params = prepareParams(
      formMethods.getValues(),
      paginationRef.current,
    );
    // Offset keeps the brand accent cycle continuous across pages.
    const groups = await getData(params, data.length);

    setData((prev) => [...prev, ...groups]);
    setHasMoreData(groups.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  }, [loadingMore, hasMoreData, data.length, formMethods]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: "Dashboard",
      langKey: "dashboard",
      redirect: { path: "/dashboard" },
    },
    {
      label: "Parties/Vendors List",
      redirect: { path: "/dashboard/vendor/list" },
    },
    { label: "Vendors by brand" },
  ];

  const handleItemCallback = ({
    action,
    data,
  }: {
    action: string;
    data: Record<string, any>;
  }) => {
    if (action === "view") {
      appNav.to(`/dashboard/vendor/view/${data._id}`);
    } else if (action === "seeAll") {
      // Deep-link into the A–Z list pre-filtered to this brand. The list's
      // brand filter matches on the BR… code (see list/helper prepareParams),
      // not the brand's Mongo id.
      appNav.to(
        `/dashboard/vendor/brand/${data.brandId}?brandName=${encodeURIComponent(data.name)}`,
      );
    }
  };

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="vendors"
        mobileLead="menu"
        title="Vendors by brand"
        subtitle={`${summary.totalBrands} brands · ${summary.totalVendors} vendors mapped`}
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
            Replaced by the vendor tab bar below so this page carries the same
            Vendors / Purchases / SK Invoice AI tabs as /dashboard/vendor/list. */}
        {/* <SectionTabs sectionKey="supply" activeTab="vendors" noShadow sticky /> */}
        <PoSectionTabs
          type="vendor"
          activeTab="vendors"
          outerClassName="tw:mb-3"
        />

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
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Title / desc — hidden in theme-2 at every breakpoint, where
                    the AppHeader already carries the page title. */}
                <div className="hide-in-theme-2">
                  <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                  <PageDescription description="manageVendor" />
                  <PageHeading
                    title="Vendors by brand"
                    description="manageVendor"
                  />
                </div>

                {/* No top margin — the tab bar above already carries the gap
                    (same spacing as /dashboard/vendor/list). */}
                <ViewToggle active="brands" className="tw:mb-3" />

                <FormProvider {...formMethods}>
                  <Filter callback={applyFilter} />
                </FormProvider>

                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loading}
                  loadedCount={data.length}
                  fwSize="sm"
                  className="tw:mb-2"
                />

                {loading ? (
                  <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
                    <AppSpinner className="tw:w-8 tw:h-8" />
                  </div>
                ) : data.length === 0 ? (
                  <NoData />
                ) : (
                  <>
                    {data.map((group) => (
                      <BrandGroupCard
                        key={group._id}
                        group={group}
                        callback={handleItemCallback}
                      />
                    ))}

                    {hasMoreData && (
                      <div className="tw:flex tw:justify-center tw:mt-3">
                        <LoadMoreButton
                          loadMore={loadMore}
                          loading={loadingMore}
                          totalCount={paginationRef.current.totalRecords}
                          loadedCount={data.length}
                        />
                      </div>
                    )}
                  </>
                )}
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

      {/* Add Vendor FAB — theme-2 mobile only. */}
      <AddVendorFab />
    </>
  );
};

export default VendorBrands;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendors by Brand"),
    },
  ];
}
