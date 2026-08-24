import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PageDescription from "~/components/core/page-description/PageDescription";
import PageHeading from "~/components/core/page-heading/PageHeading";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import AddVendorFab from "~/shared/vendor/components/AddVendorFab";
import VendorSidePane from "~/shared/vendor/components/vendor-side-pane/VendorSidePane";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import VendorCard from "./components/VendorCard";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
  type BrandVendor,
  type FilterFormData,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

/**
 * Every vendor supplying one brand — the "See all" destination from the
 * grouped Vendors-by-brand view (/dashboard/vendor/brands). Same endpoint,
 * called with `outputType=list` (see helper.ts).
 *
 * The brand name isn't in the list payload, so the caller passes it along as a
 * `brandName` query param; the brand code falls back in when it's absent.
 */
const VendorBrand = () => {
  const { t } = useTranslation(["common", "menu"]);

  const appNav = useAppNav();

  const brandId = useParams().brandId || "";
  const [searchParams] = useSearchParams();
  const brandName = searchParams.get("brandName") || brandId;

  const formMethods = useForm<FilterFormData>({
    defaultValues: defaultFilter,
  });

  const [data, setData] = useState<BrandVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalVendors, setTotalVendors] = useState(0);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

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
      brandId,
    );

    const [vendors, count] = await Promise.all([
      getData(params),
      getCount(params),
    ]);

    setData(vendors);
    setTotalVendors(count);
    paginationRef.current.totalRecords = count;
    setHasMoreData(vendors.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  }, [formMethods, brandId]);

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
      brandId,
    );
    const vendors = await getData(params);

    setData((prev) => [...prev, ...vendors]);
    setHasMoreData(vendors.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  }, [loadingMore, hasMoreData, formMethods, brandId]);

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
    {
      label: "Vendors by brand",
      redirect: { path: "/dashboard/vendor/brands" },
    },
    { label: brandName },
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
    }
  };

  return (
    <>
      <AppHeader
        sectionKey="supply"
        activeTab="vendors"
        mobileLead="menu"
        title={brandName}
        subtitle={`${totalVendors} ${totalVendors === 1 ? "vendor" : "vendors"} supplying this brand`}
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs sectionKey="supply" activeTab="vendors" noShadow sticky />

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
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Title / desc — hidden in theme-2 at every breakpoint, where
                    the AppHeader already carries the page title. */}
                <div className="hide-in-theme-2">
                  <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
                  <PageDescription description="manageVendor" />
                  <PageHeading title={brandName} description="manageVendor" />
                </div>

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
                    {/* Extra top gap keeps the BOUGHT ribbon (which sits above
                        the card edge) clear of the pagination summary. */}
                    <div className="tw:mt-2 tw:grid tw:grid-cols-1 tw:gap-3 tw:lg:grid-cols-3">
                      {data.map((vendor) => (
                        <VendorCard
                          key={vendor._id}
                          vendor={vendor}
                          callback={handleItemCallback}
                        />
                      ))}
                    </div>

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

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed vendor
                  list pane beside the section icon rail. */}
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

export default VendorBrand;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Vendors by Brand"),
    },
  ];
}
