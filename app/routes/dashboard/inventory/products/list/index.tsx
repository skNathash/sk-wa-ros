import { produce } from "immer";
import {
  Download,
  Plus,
  Printer,
  Settings,
  StoreIcon,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppPopover from "~/components/core/popover/AppPopover";
import Rbac from "~/components/core/rbac/Rbac";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { Button } from "~/components/ui/button";
import { AppCheckbox } from "~/components/core/form";
import { CLUB_STORE_URL } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import SellerCatalogService from "~/services/SellerCatalogService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import ViewMyClubModal from "~/shared/store/view-my-club/ViewMyClubModal";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
  ViewToggleType,
} from "~/types/CommonTypes";
import InventoryMainSummary from "../../components/main-summary/InventoryMainSummary";
import InventoryTab from "../../components/tab/InventoryTab";
import ProductAppliedFilter from "./components/AppliedFilter";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import SortBy from "./components/SortBy";
import MissingConfigAlert from "./components/MissingConfigAlert";
import SyncInventoryAlert from "./components/SyncInventoryAlert";
import {
  DEFAULT_SUMMARY_DATA,
  defaultFilterValues,
  downloadProducts,
  getCount,
  getData,
  getSummary,
  prepareParams,
  SORT_OPTIONS,
  type FilterFormFields,
  type SummaryData,
} from "./helper";
import BulkStockConfigModal from "./modals/bulk-stock-config/BulkStockConfigModal";
import OpenPoModal from "./modals/open-po/OpenPoModal";
import InventoryDealFilterService from "~/services/InventoryDealFilterService";

const rbacRoles = {
  subscribe: ["CATALOG.SUBSCRIBE"],
  addProduct: ["CATALOG.ADD-PRODUCT"],
  bulkUpload: ["CATALOG.BULK-UPLOAD"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-INVENTORY"]);
}

const DEFAULT_GLOBAL_SORT = "recently-subscribed";

const WHATSAPP_TEMPLATE_CATEGORIES = ["Invite"];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "All Items", langKey: "allItems" },
];

const tabs: TabItem[] = [
  { name: "Products", key: "products", langKey: "products" },
  { name: "Categories", key: "categories", langKey: "categories" },
  { name: "Brands", key: "brands", langKey: "brands" },
];

const Products = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const isInactivePage = searchParams.get("inactive") === "true";

  const { isMobile } = useScreenView();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [summaryData, setSummaryData] =
    useState<SummaryData>(DEFAULT_SUMMARY_DATA);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [busyLoader, setBusyLoader] = useState<{
    show: boolean;
    message: string;
  }>({ show: false, message: "" });

  const [pendingPoModal, setPendingPoModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [openPoModal, setOpenPoModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [bulkStockConfigModal, setBulkStockConfigModal] = useState<{
    show: boolean;
    products: any[];
  }>({ show: false, products: [] });

  const [viewMyClubModal, setViewMyClubModal] = useState<{
    show: boolean;
    value: string;
  }>({ show: false, value: "" });

  const [whatsappTemplateModal, setWhatsappTemplateModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [view, setView] = useState<ViewToggleType>("card");

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);

  const [activeView, setActiveView] = useState("products");

  const [invalidBarcodeCount, setInvalidBarcodeCount] = useState(0);

  const methods = useForm<FilterFormFields>({
    defaultValues: defaultFilterValues,
  });

  // const filterRef = useRef<any>({ ...defaultFilter }); // Removed filterRef
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" | undefined }>(
    undefined,
  );

  // Pick a random sort option when page loads and none specified
  const getRandomSort = () => {
    try {
      const opts = SORT_OPTIONS.map((o) => o.value).filter(Boolean);
      if (opts.length === 0) return DEFAULT_GLOBAL_SORT;
      return opts[Math.floor(Math.random() * opts.length)];
    } catch (err) {
      return DEFAULT_GLOBAL_SORT;
    }
  };

  useEffect(() => {
    const search = searchParams.get("search");
    const globalSort = searchParams.get("globalSort");
    const tab = searchParams.get("tab");
    const reserve = searchParams.get("reserve");

    // Set active view based on tab query param
    if (tab === "products") {
      setActiveView("products");
    } else if (tab === "categories") {
      setActiveView("categories");
    } else if (tab === "brands") {
      setActiveView("brands");
    } else if (tab === "summary") {
      setActiveView("summary");
    }

    const searchParamsObj = Object.fromEntries(searchParams.entries());
    const formDataObj =
      InventoryDealFilterService.prepareInventoryParamToFormData(
        searchParamsObj,
      );

    Object.keys(formDataObj).forEach((key) => {
      methods.setValue(key as any, formDataObj[key]);
    });

    if (!globalSort) {
      const rand = getRandomSort();
      methods.setValue("globalSort", rand);
    }

    methods.setValue("search", search || "");
    methods.setValue(
      "status",
      isInactivePage ? "Inactive" : searchParams.get("status") || "Active",
    );
    methods.setValue("reserve", reserve || "All");
    methods.setValue(
      "onlyWithStockData",
      searchParams.get("onlyWithStockData") === "true",
    );

    // If there's no explicit `search` param, use the first keyword as the search value
    if (formDataObj.keys && formDataObj.keys.length > 0) {
      if (!search) {
        methods.setValue("search", formDataObj.keys[0]);
      }
    }

    applyFilter();
    fetchSummary();
  }, [searchParams]);

  useEffect(() => {
    const fetchInvalidBarcodeCount = async () => {
      try {
        const response = await InventorySubscribeService.getInvalidBarcodes({
          filter: { status: "PENDING" },
          outputType: "count",
        });
        setInvalidBarcodeCount(response?.data?.data?.count || 0);
      } catch (error) {
        console.error("Error fetching invalid barcode count:", error);
      }
    };
    fetchInvalidBarcodeCount();
  }, []);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const summary = await getSummary(params);
      setSummaryData(summary);
    } catch (error) {
      console.error("Error fetching summary data:", error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Apply filter and reset pagination
  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params);
      setProducts(productsData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  };

  // Load more data for load more button
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        methods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const productsData = await getData(params);
      setProducts((prev) => [...prev, ...productsData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  const handleTabChange = useCallback(
    (tab: TabItem) => {
      setActiveView(tab.key as any);
      // Update search params with only the tab value
      const newParams = new URLSearchParams(searchParams as any);
      newParams.set("tab", tab.key);
      setSearchParams(newParams, { replace: true });
    },
    [setSearchParams],
  );

  const handleFilterChange = useCallback(
    ({ formData }: { formData: FilterFormFields }) => {
      const params =
        InventoryDealFilterService.prepareInventoryFilterQueryParams(formData);

      if (formData.search) params.set("search", formData.search);
      if (formData.globalSort) params.set("globalSort", formData.globalSort);
      if (formData.reserve && formData.reserve !== "All")
        params.set("reserve", formData.reserve);

      // Preserve the current tab value when applying filters
      const currentTab = searchParams.get("tab");
      if (currentTab) {
        params.set("tab", currentTab);
      }

      // Replace the current history entry instead of pushing a new one
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleSummaryItemClick = useCallback(
    (key: string) => {
      const newParams = new URLSearchParams(searchParams as any);
      if (key === "totalProducts" || key === "inventoryValue") {
        newParams.delete("stockStatus");
        newParams.delete("velocity");
      } else {
        const stockStatusTypes = SellerCatalogService.getStockStatusTypes();
        const stockStatusMap: Record<string, string> = {};
        stockStatusTypes.forEach((type) => {
          stockStatusMap[type.key] = type.value;
        });
        const keyMap: Record<string, string> = {
          lowStock: "low-stock",
          outOfStock: "out-of-stock",
          nearExpiry: "near-expiry",
          expired: "expired",
        };
        const mappedKey = keyMap[key];
        const stockStatus = stockStatusMap[mappedKey];
        if (stockStatus) {
          newParams.set("stockStatus", stockStatus);
          newParams.delete("velocity");
        }
      }
      setSearchParams(newParams, { replace: true });
    },
    [searchParams],
  );

  const handleItemClick = useCallback(
    ({ action, data }: any) => {
      if (action === "view") {
        appNav.to(`/dashboard/inventory/products/view/${data._id}`);
      } else if (action === "open-po") {
        setOpenPoModal({
          show: true,
          data: {
            productName: data.name,
            purchaseOrders: data.openPoAnalytics?.openPos || [],
            loading: false,
          },
        });
      } else if (action === "add-stock") {
        setAddStockModal({ show: true, data });
      } else if (action === "status-updated") {
        // Update local products list to reflect the updated status coming from child views
        if (data && data._id) {
          setProducts((prev) =>
            prev.map((item) =>
              item._id === data._id ? { ...item, status: data.status } : item,
            ),
          );
          // Refresh summary to keep counts in sync
          fetchSummary();
        }
      }
    },
    [appNav],
  );

  const handlePendingPoModal = useCallback(({ action }: any) => {
    if (action === "close") {
      setPendingPoModal({ show: false, data: null });
    }
  }, []);

  const handleOpenPoModal = useCallback(
    ({ action }: any) => {
      if (action === "close") {
        setOpenPoModal({ show: false, data: null });
      } else if (action === "open") {
        // Navigate to purchase order list with product filter
        if (openPoModal.data) {
          appNav.to("/dashboard/purchase-order/list", {
            productId: openPoModal.data._id,
            productName: openPoModal.data.name,
          });
        }
        setOpenPoModal({ show: false, data: null });
      }
    },
    [openPoModal.data, appNav],
  );

  const handleAddStockModal = useCallback(
    ({ action, data, product }: any) => {
      setAddStockModal({ show: false, data: null });
      if (action === "submit" && product) {
        setProducts((prev) =>
          prev.map((item) =>
            item._id === product._id ? { ...item, ...product } : item,
          ),
        );

        // Re-fetch summary to reflect the updated inventory values from server
        fetchSummary();

        // animate the product in the list
        setProducts(
          produce((draft) => {
            const index = draft.findIndex(
              (item) => item._id === addStockModal.data._id,
            );
            if (index !== -1) {
              draft[index] = { ...draft[index], _animate: true };
            }
          }),
        );

        // stop the animation after 1 second
        const t = setTimeout(() => {
          clearTimeout(t);
          setProducts(
            produce((draft) => {
              const index = draft.findIndex(
                (item) => item._id === addStockModal.data._id,
              );
              if (index !== -1) {
                draft[index]._animate = false;
              }
            }),
          );
        }, 1000);
      }
    },
    [addStockModal.data, fetchSummary],
  );

  const handleBulkStockConfigModal = useCallback(
    ({ action }: any) => {
      if (action === "close") {
        setBulkStockConfigModal({ show: false, products: [] });
        // Re-fetch data to reflect any changes
        applyFilter();
        fetchSummary();
      }
    },
    [applyFilter, fetchSummary],
  );

  const handleSort = useCallback(
    ({ key, value }: any) => {
      sortRef.current = { key, value };
      methods.setValue("globalSort", "all");
      // Update params to reflect this change?
      // If we want to sync sortRef with URL, we should.
      // But sortRef seems to be for column sorting, while globalSort is for the dropdown.
      // Let's just trigger applyFilter.
      applyFilter();
    },
    [applyFilter, methods],
  );

  const onGlobalSortChange = (value: string) => {
    methods.setValue("globalSort", value);
    sortRef.current = undefined;
    // Update params
    // Replace the current history entry for sort changes
    const newParams = new URLSearchParams(searchParams as any);
    newParams.set("globalSort", value);
    setSearchParams(newParams, { replace: true });
  };

  const handleSortSelect = (value: string) => {
    onGlobalSortChange(value);
    setSortPopoverOpen(false);
  };

  const viewMyClub = () => {
    const user = AuthService.getLoggedInUser();
    const mobile = user?.mobile;
    if (mobile) {
      const url = CLUB_STORE_URL + mobile;
      setViewMyClubModal({ show: true, value: url });
    } else {
      appToast.show({
        msg: "No mobile number found",
        color: "danger",
      });
    }
  };

  const handleViewMyClubCallback = useCallback(({ action, data }: any) => {
    if (action === "whatsapp") {
      // Close the QR modal and open Whatsapp template modal with dynamic data
      setViewMyClubModal({ show: false, value: "" });
      setWhatsappTemplateModal({
        show: true,
        data: {
          dynamicData: {
            ...data,
            franchiseId: AuthService.getLoggedInUserId(),
          },
        },
      });
    }
  }, []);

  const handleWhatsappTemplateCallback = useCallback(
    ({ action }: any) => {
      if (action === "close") {
        setWhatsappTemplateModal({ show: false, data: null });
      } else if (action === "send") {
        setWhatsappTemplateModal({ show: false, data: null });
        appToast.show({ msg: "WhatsApp message sent", color: "success" });
      } else if (action === "send_error") {
        setWhatsappTemplateModal({ show: false, data: null });
        appToast.show({ msg: "Failed to send WhatsApp", color: "danger" });
      }
    },
    [appToast],
  );

  const handleDownload = async () => {
    // Require either category or brand to be selected before download
    const hasCategory =
      Array.isArray(methods.getValues().category) &&
      methods.getValues().category!.length > 0;
    const hasBrand =
      Array.isArray(methods.getValues().brand) &&
      methods.getValues().brand!.length > 0;

    if (!hasCategory && !hasBrand) {
      // If neither selected, allow only if total records is small (< 1000)
      const total = paginationRef.current?.totalRecords || 0;
      if (total >= 1000) {
        appToast.show({
          msg: "Please select a category or brand to download",
          color: "warning",
          // duration: 5000, // Removed duration property as it does not exist in type 'ToastOptions'
        });
        return;
      }
      // else allow download for small datasets
    }

    const params = prepareParams(
      methods.getValues(),
      paginationRef.current,
      sortRef.current,
    );

    setBusyLoader({ show: true, message: t("downloadingItems") });
    const data = await downloadProducts(params);
    setBusyLoader({ show: false, message: "" });
    if (data.filePath) {
      CommonService.windowOpenHandler(
        SellerCatalogService.downloadTempFile(data.filePath),
        () => {},
      );
    }
  };

  const handleBarcodeUpload = () => {
    // TODO: Implement barcode upload functionality
  };

  const handleStockUpload = () => {
    // Check if there are products to configure
    if (products.length === 0) {
      appToast.show({
        msg: t("noItemsToConfigure"),
        color: "warning",
      });
      return;
    }

    // Open bulk stock config modal with all current products
    setBulkStockConfigModal({
      show: true,
      products: products,
    });
  };

  // Handle voice search callback from VoiceSearch component
  const handleVoiceSearchCallback = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if ((action === "close" || action === "scan") && data) {
        const newParams = new URLSearchParams(searchParams as any);

        // If voice returned an explicit search string, set/replace the `search` param
        if (data.search && typeof data.search === "string") {
          newParams.set("search", data.search);
        }

        // If voice returned keywords (array), join into comma-separated `keys` param
        if (data.keywords && Array.isArray(data.keywords)) {
          const keys = data.keywords.filter(Boolean).join(",");
          if (keys) {
            newParams.set("keys", keys);
          } else {
            newParams.delete("keys");
          }
        }

        // If neither search nor keywords present, do not mutate params
        // Replace the current history entry for voice-search updates
        setSearchParams(newParams, { replace: true });
      }
    },
    [searchParams, setSearchParams],
  );

  const renderActionButton = () => {
    return (
      <div className="tw:flex tw:w-full tw:gap-2 tw:items-stretch">
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:gap-2">
          <Rbac
            roles={rbacRoles.addProduct}
            forceDisplay={AuthService.isMasterLogin()}
          >
            <AppButton
              size="small"
              color="success"
              onClick={() =>
                appNav.to("/dashboard/inventory/subscribe/add-product")
              }
              className="tw:w-full tw:flex-1"
            >
              <Plus size={16} />
              <span>{t("createProduct")}</span>
            </AppButton>
          </Rbac>

          <AppButton
            size="small"
            color="primary"
            onClick={viewMyClub}
            className="tw:bg-[#204286] tw:hover:bg-[#204286]/80 tw:w-full tw:flex-1"
          >
            <StoreIcon />
            <ImgRender src="logo/club-logo.png" className="tw:h-6" />
          </AppButton>
        </div>
      </div>
    );
  };

  return (
    <>
      <AppHeader
        title={t("allItems")}
        showAudioNote={true}
        audioNoteTitle={t("allItems")}
        audioFeature="manageInventory"
      />
      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:lg:flex-row tw:lg:justify-between tw:items-start tw:lg:items-center tw:mb-4 tw:gap-3">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
              <PageDescription description="manageInventory" />
            </div>
            <div className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap">
              <div className="tw:md:flex tw:hidden tw:w-full tw:md:w-auto">
                {renderActionButton()}
              </div>
            </div>
          </div>

          <InventoryTab
            activeTab={isInactivePage ? "inactive-products" : "products"}
            className="tw:mb-2"
          />

          <MissingConfigAlert />
          <SyncInventoryAlert />

          {activeView === "products" ? (
            <>
              <InventoryMainSummary
                className="tw:mb-4"
                summaryData={summaryData.mainSummary}
                loading={summaryLoading}
                onItemClick={handleSummaryItemClick}
              />

              {/* <InventoryProductSummary
                summaryData={summaryData.productSummary}
              /> */}
              <div className="tw:mb-2">
                <FormProvider {...methods}>
                  <Filter callback={handleFilterChange} />
                  <ProductAppliedFilter onFilterChange={handleFilterChange} />
                </FormProvider>
              </div>
            </>
          ) : null}

          {activeView === "products" && (
            <>
              <div className="tw:flex tw:justify-between tw:items-center">
                <div className="tw:flex tw:gap-2 tw:items-center">
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={products.length}
                    fwSize="sm"
                  />
                </div>
                <div className="tw:flex tw:gap-2 tw:items-center">
                  <ViewToggle
                    viewType={view}
                    callback={setView}
                    hideInMobile={false}
                    showOnlyIcon={isMobile}
                  />
                  <div>
                    <SortBy
                      globalSortValue={methods.getValues().globalSort || ""}
                      open={sortPopoverOpen}
                      onOpenChange={setSortPopoverOpen}
                      onSelect={handleSortSelect}
                    />
                  </div>
                  <AppPopover
                    open={popoverOpen}
                    onOpenChange={setPopoverOpen}
                    triggerContent={
                      <Button
                        variant="outline"
                        size="sm"
                        className="tw:p-2! tw:cursor-pointer"
                      >
                        <Settings size={16} />
                      </Button>
                    }
                    side="bottom"
                    align="end"
                  >
                    <div className="tw:flex tw:flex-col tw:gap-1">
                      <Rbac roles={rbacRoles.addProduct}>
                        <AppButton
                          fill="outline"
                          size="small"
                          className="tw:p-2! tw:cursor-pointer"
                          onClick={() => {
                            appNav.to("/dashboard/bulk-upload/add-stock");
                            setPopoverOpen(false);
                          }}
                        >
                          <Upload size={16} />
                          <span>Bulk Upload</span>
                        </AppButton>
                      </Rbac>
                      <AppButton
                        fill="outline"
                        size="small"
                        className="tw:p-2! tw:cursor-pointer"
                        onClick={() => {
                          setPopoverOpen(false);
                          appNav.to(
                            "/configs/product-select?feature=PackUpdate",
                          );
                        }}
                      >
                        <Settings size={16} />
                        <span>Sell In Config</span>
                      </AppButton>
                      <AppButton
                        fill="outline"
                        size="small"
                        className="tw:p-2! tw:cursor-pointer"
                        onClick={() => {
                          appNav.to("/dashboard/bulk-upload/add-stock");
                          setPopoverOpen(false);
                        }}
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </AppButton>
                      <AppButton
                        fill="outline"
                        size="small"
                        className="tw:p-2! tw:cursor-pointer"
                        onClick={() => {
                          appNav.to("/configs/settings/price-labels");
                          setPopoverOpen(false);
                        }}
                      >
                        <Printer size={16} />
                        <span>Print Label</span>
                      </AppButton>
                    </div>
                  </AppPopover>
                </div>
              </div>
              {searchParams.get("stockStatus") !== "Out of Stock" && (
                <div className="tw:flex tw:items-center tw:mb-2">
                  <Controller
                    name="onlyWithStockData"
                    control={methods.control}
                    render={({ field }) => (
                      <AppCheckbox
                        className="tw:cursor-pointer"
                        label={
                          <span className="tw:text-xs tw:text-gray-500">
                            Show only with stock
                          </span>
                        }
                        value={field.value || false}
                        onChange={(checked) => {
                          field.onChange(checked);
                          const newParams = new URLSearchParams(
                            searchParams as any,
                          );
                          if (checked)
                            newParams.set("onlyWithStockData", "true");
                          else newParams.delete("onlyWithStockData");
                          setSearchParams(newParams, { replace: true });
                        }}
                      />
                    )}
                  />
                </div>
              )}
            </>
          )}

          {activeView === "products" ? (
            <>
              {isMobile ? (
                <>
                  <MobileView
                    data={products}
                    loading={loading}
                    callback={handleItemClick}
                    showLoadMore={hasMoreData}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={products.length}
                    viewType={view}
                  />
                </>
              ) : view === "list" ? (
                <>
                  <AppCard noContentPadding noPadding>
                    <DesktopView
                      data={products}
                      loading={loading}
                      callback={handleItemClick}
                      sortKey={sortRef.current?.key || ""}
                      sortValue={sortRef.current?.value}
                      onSort={handleSort}
                      loadedCount={products.length}
                      showLoadMore={hasMoreData && !loading}
                      loadingMore={loadingMore}
                      loadMore={loadMore}
                      totalCount={paginationRef.current.totalRecords}
                    />
                  </AppCard>
                </>
              ) : (
                <>
                  <MobileView
                    data={products}
                    loading={loading}
                    callback={handleItemClick}
                    showLoadMore={hasMoreData}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={products.length}
                    viewType={view}
                  />
                </>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* footer */}
      {isMobile && (
        <div className="app-footer">{renderActionButton()}</div>
      )}

      <OpenPoModal
        show={openPoModal.show}
        data={openPoModal.data}
        callback={handleOpenPoModal}
      />

      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        currentStock={addStockModal.data?.actualMaxQty}
        barcodes={addStockModal.data?.barcodes}
        selectedStockUom={addStockModal.data?.selectedStockUom}
        callback={handleAddStockModal}
      />

      <BulkStockConfigModal
        show={bulkStockConfigModal.show}
        products={bulkStockConfigModal.products}
        callback={handleBulkStockConfigModal}
      />

      <ViewMyClubModal
        show={viewMyClubModal.show}
        onClose={() => setViewMyClubModal({ show: false, value: "" })}
        callback={handleViewMyClubCallback}
        title="View My Club"
        value={viewMyClubModal.value}
      />

      <WhatsappTemplateModal
        show={whatsappTemplateModal.show}
        callback={handleWhatsappTemplateCallback}
        data={whatsappTemplateModal.data}
        categories={WHATSAPP_TEMPLATE_CATEGORIES}
        showTemplateForSelect={true}
        showCategoryDropdown={false}
      />

      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default Products;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Inventory Items List"),
    },
  ];
}
