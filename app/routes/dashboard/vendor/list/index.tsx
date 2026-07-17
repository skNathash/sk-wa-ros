import { Plus } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { FormProvider, useForm } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import ListSummary from "../components/ListSummary";
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
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import AddVendorFab from "~/shared/vendor/components/AddVendorFab";

const rbacRoles = {
  addVendor: ["VENDOR.ADD"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["VENDOR.VIEW"]);
}

const VendorList = () => {
  const { t } = useTranslation(["common", "menu"]);

  const { isMobile } = useScreenView();

  const appNav = useAppNav();

  const methods = useForm({
    defaultValues: {
      status: "All",
      alpha: "",
      createdBy: "All",
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
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    endSlNo: 10,
    startSlNo: 1,
    totalRecords: 0,
  });

  useEffect(() => {
    applyFilter();
  }, []);

  // Sync form state and filters when search params change
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Map search params back to form values
    const formValues: Record<string, any> = {};

    formValues.search = params?.search || "";
    formValues.distance = params?.distance || "any";
    formValues.status = params?.status || "All";
    formValues.alpha = params.alpha || "";
    formValues.createdBy = params.createdBy || "All";

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

    const params = prepareParams(filterRef.current, paginationRef.current);
    const countResponse = await getCount(params);

    loadSummary(countResponse);

    setLoading(true);
    const response = await getData(params);

    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData(response);
    paginationRef.current.totalRecords = countResponse;
    setLoading(false);
  };

  const loadSummary = async (totalVendors: number) => {
    const params = prepareSummaryParams(filterRef.current);
    const response = await getSummary(params);
    setSummary({ ...response, totalVendors });
  };

  const loadMore = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);
    const params = prepareParams(filterRef.current, paginationRef.current);
    const response = await getData(params);
    setHasMoreData(paginationRef.current.rowsPerPage === response.length);
    setData([...data, ...response]);
    setLoadingMore(false);
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
      <AppHeader title={t("vendorList")} />
      <div className="page-bg page-padding app-page has-footer">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css).
              `sticky` pins them under the header and breaks out of the page
              padding so the underline runs edge to edge. */}
          <SectionTabs
            sectionKey="supply"
            activeTab="vendors"
            noShadow
            sticky
          />

          <div className="section-layout">
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
          {/* Gap between the sticky section tabs and the content below —
              theme-2 mobile only (the tabs are theme-2-mobile-only). */}
          <div className="theme-2-mobile-only tw:h-4" />
          <SkSellerAvailableNote />
          <div className="theme-2-mobile-hide tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:md:mb-4 tw:gap-4">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:!mb-0" />
              <PageDescription description="manageVendor" />
              <PageHeading title={t("vendorList")} description="manageVendor" />
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

          <ListSummary className="tw:mb-4" summary={summary} />
          {/* <ListTab activeTab="all" className="tw:mb-4" /> */}

          <FormProvider {...methods}>
            <Filter callback={handleFilterChange} />
            <VendorAppliedFilter callback={handleAppliedFilterCallback} />
          </FormProvider>

          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            fwSize="sm"
            loadedCount={data.length}
            className="tw:mb-4"
          />

          {isMobile ? (
            <>
              {loading ? (
                <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
                  <AppSpinner className="tw:w-8 tw:h-8" />
                </div>
              ) : data.length === 0 ? (
                <NoData />
              ) : (
                <>
                  {data.map((item, index) => (
                    <React.Fragment key={item._id}>
                      <MobileView
                        item={item}
                        isSkSeller={index === 0}
                        callback={handleItemCallback}
                      />
                    </React.Fragment>
                  ))}

                  {hasMoreData && !loading && (
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
            </>
          ) : (
            <AppCard noPadding>
              {loading ? (
                <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
                  <AppSpinner className="tw:w-8 tw:h-8" />
                </div>
              ) : data.length === 0 ? (
                <NoData />
              ) : (
                <>
                  {data.map((item, index) => (
                    <React.Fragment key={item._id}>
                      <DesktopView
                        item={item}
                        isSkSeller={index === 0}
                        callback={handleItemCallback}
                      />
                    </React.Fragment>
                  ))}

                  {hasMoreData && !loading && (
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
            </AppCard>
          )}
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
