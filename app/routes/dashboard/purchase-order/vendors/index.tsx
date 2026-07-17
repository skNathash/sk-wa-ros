import { Building2, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ImportSteps from "~/components/feature/inventory/import-catalog/ImportSteps";
import PoSteps from "~/components/feature/inventory/po-steps/PoSteps";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import VendorItem from "./components/VendorItem";
import VendorsFilter from "./components/VendorsFilter";
import { getCount, getData, prepareParams } from "./helper";
import SkSellerAvailableNote from "~/shared/vendor/components/sk-seller-available/SkSellerAvailableNote";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import PageHeader from "~/shared/page-header/PageHeader";

interface VendorData {
  _id: string;
  name: string;
  contact: Array<{
    mobile: string;
    email: string;
  }>;
  address: {
    line1: string;
    line2: string;
    state: string;
    district: string;
    pincode: string;
    city?: string;
  };
  gst_no?: string;
  status?: string;
  average_tat?: number;
  openPoCount?: number;
  posInThirtyDays?: number;
}

const tabItems: TabItem[] = [
  { key: "allVendors", name: "All Vendors", langKey: "allVendors" },
  { key: "topVendors", name: "Top Vendors", langKey: "topVendors" },
];

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: {
      path: "/dashboard",
    },
  },
  {
    label: "Local Purchase Orders",
    langKey: "localPurchaseOrders",
    redirect: {
      path: "/dashboard/purchase-order/main",
    },
  },
  {
    label: "Select Vendor",
    langKey: "selectVendor",
  },
];

const VendorSelection = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");

  const [breadcrumbs, setBreadcrumbs] =
    useState<BreadcrumbItem[]>(defaultBreadcrumbs);

  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [activeTab, setActiveTab] = useState<TabItem>(tabItems[0]);
  const [viewBrandsModal, setViewBrandsModal] = useState<{
    show: boolean;
    vendorId: string;
  }>({
    show: false,
    vendorId: "",
  });

  const filterRef = useRef<FilterState>({
    ...defaultFilter,
    activeTab: tabItems[0].key,
  });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const { isMobile } = useScreenView();

  useEffect(() => {
    if (searchParams.get("from") === "import") {
      setBreadcrumbs((prev) => {
        const newBreadcrumbs = [...prev];
        newBreadcrumbs[1] = {
          label: "Import Product",
          redirect: {
            path: "/dashboard/inventory/import/list",
          },
        };
        return newBreadcrumbs;
      });
    } else {
      setBreadcrumbs(defaultBreadcrumbs);
    }
  }, [searchParams]);

  const init = useCallback(() => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    applyFilter();
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setVendors([]);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
    } finally {
      setLoading(false);
    }

    loadList();
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const vendorsData = await getData(params);
      setVendors(vendorsData);
      setHasMoreData(vendorsData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading vendors data:", error);
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
      const params = prepareParams(filterRef.current, paginationRef.current);
      const vendorsData = await getData(params);
      setVendors((prev) => [...prev, ...vendorsData]);
      setHasMoreData(vendorsData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more vendors:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onFilterChange = (a: { formData: any; action: string }) => {
    if (a.action === "filter" || a.action === "clear") {
      filterRef.current = { ...filterRef.current, ...a.formData };
      applyFilter();
    }
  };

  const onTabChange = (tab: TabItem) => {
    setActiveTab(tab);
    filterRef.current = { ...filterRef.current, activeTab: tab.key };
    applyFilter();
  };

  const onVendorItemClick = (a: { action: string; data: any }) => {
    if (a.action === "viewVendor") {
      if (from === "import") {
        appNav.to(`/dashboard/inventory/import?id=${a.data._id}`);
      } else if (from === "po") {
        appNav.to(`/dashboard/purchase-order/manage?vid=${a.data._id}`);
      } else {
        appNav.to(`/dashboard/vendor/manage?vid=${a.data._id}`);
      }
    } else if (a.action === "viewBrands") {
      setViewBrandsModal({
        show: true,
        vendorId: a.data._id,
      });
    }
  };

  const handleCreateVendor = () => {
    appNav.to("/dashboard/vendor/manage", {
      from: from,
    });
  };

  const handleViewBrandsModalCallback = (a: { action: string; data?: any }) => {
    if (a.action === "close") {
      setViewBrandsModal({
        show: false,
        vendorId: "",
      });
    }
  };

  return (
    <>
      <AppHeader title={getTitle(from || "")} />
      <div className="page-padding page-bg app-page">
        <div className="app-container">
          {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
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
              <SkSellerAvailableNote />

              {/* Page header and Create Vendor Button */}
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-center tw:mb-4 tw:gap-3">
                <PageHeader
                  breadcrumbs={breadcrumbs}
                  title={t("selectVendor")}
                  description="purchaseOrder"
                />
                {!isMobile && (
                  <AppButton
                    onClick={handleCreateVendor}
                    color="primary"
                    size="small"
                    className="tw:!px-4"
                  >
                    <Plus className="tw:w-4 tw:h-4 tw:mr-2" />
                    {t("createVendor")}
                  </AppButton>
                )}
              </div>

              {from === "import" && <ImportSteps activeStep={0} />}
              {from === "po" && (
                <div className="tw:text-center tw:mb-6">
                  <div className="tw:inline-flex">
                    <PoSteps activeStep={0} />
                  </div>
                </div>
              )}

              <VendorsFilter callback={onFilterChange} />

              <div className="tw:mb-2">
                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loading}
                  fwSize="sm"
                  loadedCount={vendors.length}
                />
              </div>

              {vendors.length === 0 && !loading && (
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
                  <Building2 className="tw:w-12 tw:h-12 tw:text-gray-400 tw:mb-2" />
                  <div>{t("noVendorsFound")}</div>
                </div>
              )}

              {vendors.length > 0 && (
                <>
                  {vendors.map((vendor: any) => (
                    <VendorItem
                      key={vendor._id}
                      vendor={vendor}
                      callback={onVendorItemClick}
                    />
                  ))}

                  {!loading && hasMoreData && (
                    <div className="tw:flex tw:justify-center tw:py-8">
                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                        loadedCount={vendors.length}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="tw:fixed tw:bottom-0 tw:left-0 tw:right-0 tw:bg-white tw:border-t tw:border-gray-200 tw:p-4">
          <AppButton
            onClick={handleCreateVendor}
            color="primary"
            expand="block"
          >
            <Plus className="tw:w-4 tw:h-4 tw:mr-2" />
            Create Vendor
          </AppButton>
        </div>
      )}
    </>
  );
};

interface FilterState {
  search?: string;
  activeTab?: string;
  brand?: any[];
  category?: any[];
  status?: string; // Added for compatibility with prepareParams
}

interface PaginationState {
  activePage: number;
  rowsPerPage: number;
  startSlNo: number;
  endSlNo: number;
  totalRecords: number;
}

const defaultFilter: FilterState = {
  search: "",
  activeTab: "topVendors",
  brand: [],
  category: [],
  status: "All",
};

const getTitle = (from: string) => {
  if (from === "po") {
    return "Select Vendor - Purchase Order";
  }
  if (from === "import") {
    return "Select Vendor - Import Product";
  }
  return "Select Vendor";
};

export default VendorSelection;

export function meta() {
  return [
    { title: "Select Vendor - Purchase Order" },
    {
      name: "description",
      content: "Select a vendor to create a new purchase order",
    },
  ];
}
