import { produce } from "immer";
import {
  Download,
  Plus,
  Printer,
  Settings,
  StoreIcon,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import useTheme from "~/hooks/useTheme";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import SellerCatalogService from "~/services/SellerCatalogService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import FacetFilter from "~/shared/catalog/components/facet-filter/FacetFilter";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import CatalogSidePane from "~/shared/inventory/components/catalog-side-pane/CatalogSidePane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { FacetSelection } from "~/shared/catalog/components/facet-filter/modals/facet-filter/FacetFilterModal";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import ViewMyClubModal from "~/shared/store/view-my-club/ViewMyClubModal";
import CreateItemModal from "~/shared/inventory/modals/create-item/CreateItemModal";
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
import StockChips, { type StockChipSelection } from "./components/StockChips";
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
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const isInactivePage = searchParams.get("inactive") === "true";

  // Dedicated menu view state: when the user taps a menu in the catalog side
  // pane, the list opens with `view=menu` plus the menu id/name/count.
  const isMenuView = searchParams.get("view") === "menu";
  const menuName = searchParams.get("menuName") || "";
  const menuCount = parseInt(searchParams.get("menuCount") || "0", 10) || 0;

  const { isMobile } = useScreenView();
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [productsCount, setProductsCount] = useState(0);

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

  const [showCreateItemModal, setShowCreateItemModal] = useState(false);

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

  // Tracks the menu/category/brand ids applied via the (search-driven) facet
  // filter. Clearing the search removes only these — selections made via the
  // main Filter modal share the same form fields/URL params but stay untouched.
  const facetSelectedRef = useRef<{
    menus: string[];
    categories: string[];
    brands: string[];
  }>({ menus: [], categories: [], brands: [] });

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

  useEffect(() => {
    const fetchData = async () => {
      const r = await getCount(
        prepareParams({}, paginationRef.current, sortRef.current),
      );
      setProductsCount(r || 0);
    };
    fetchData();
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
      const fd: any = { ...formData };

      // When the user clears the search, drop only the menu/category/brand that
      // was applied via the (search-driven) facet filter so results aren't left
      // filtered by stale facets. Selections made through the main Filter modal
      // share these fields but must be preserved. The FacetFilter's own internal
      // selection is reset via its remount key below.
      if (!fd.search || !fd.search.trim()) {
        const facet = facetSelectedRef.current;
        fd.menu = (fd.menu || []).filter(
          (m: any) => !facet.menus.includes(m?.value?.id),
        );
        fd.category = (fd.category || []).filter(
          (c: any) => !facet.categories.includes(c?.value?.id),
        );
        fd.brand = (fd.brand || []).filter(
          (b: any) => !facet.brands.includes(b?.value?.id),
        );
        facetSelectedRef.current = { menus: [], categories: [], brands: [] };
      }

      const params =
        InventoryDealFilterService.prepareInventoryFilterQueryParams(fd);

      if (formData.search) params.set("search", formData.search);
      if (formData.globalSort) params.set("globalSort", formData.globalSort);
      if (formData.reserve && formData.reserve !== "All")
        params.set("reserve", formData.reserve);

      // Preserve the current tab value when applying filters
      const currentTab = searchParams.get("tab");
      if (currentTab) {
        params.set("tab", currentTab);
      }

      // Preserve the dedicated menu-view params so filtering inside a menu
      // stays in menu view and keeps showing the menu name/count in the header.
      if (isMenuView) {
        const menuId = searchParams.get("menuId");
        const menuName = searchParams.get("menuName");
        const menuCount = searchParams.get("menuCount");
        if (menuId) params.set("menuId", menuId);
        if (menuName) params.set("menuName", menuName);
        if (menuCount) params.set("menuCount", menuCount);
        params.set("view", "menu");
      }

      // The inactive view is driven by this flag (title, tabs, side pane, stock
      // alerts), while the actual filtering rides on `status`. Keep the two in
      // sync so the flag survives a filter/chip change made on the inactive page
      // and so the Inactive chip switches the page into that view. Any filter
      // that puts `status` back to Active drops the flag, which is how the
      // "All" chip gets the user back out.
      if (fd.status === "Inactive") {
        params.set("inactive", "true");
      }

      // Replace the current history entry instead of pushing a new one
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Apply menu/category/brand selections from the facet filter (inline chips and
  // the "More" modal) by writing them onto the URL query params, the same way
  // the Filter modal does. The read-effect on [searchParams] rehydrates the form
  // and re-runs the fetch. All three support multiple selections, so their
  // ids/names are stored comma-separated.
  const handleFacetApply = useCallback(
    (payload: { action: string; data?: FacetSelection }) => {
      if (payload.action !== "apply" || !payload.data) return;

      const { menus, categories, brands } = payload.data;

      // Preserve every other active param (search, tab, globalSort, …).
      const next: Record<string, string> = {
        ...Object.fromEntries(searchParams.entries()),
      };

      const setMulti = (
        idKey: string,
        nameKey: string,
        items: { id: string; name: string }[],
      ) => {
        if (items.length) {
          next[idKey] = items.map((i) => i.id).join(",");
          next[nameKey] = items.map((i) => i.name).join(",");
        } else {
          delete next[idKey];
          delete next[nameKey];
        }
      };

      setMulti("menuId", "menuName", menus);
      setMulti("categoryId", "categoryName", categories);
      setMulti("brandId", "brandName", brands);

      // Remember what the facet filter contributed so a later search-clear can
      // remove only these, without dropping Filter-modal selections.
      facetSelectedRef.current = {
        menus: menus.map((m) => m.id),
        categories: categories.map((c) => c.id),
        brands: brands.map((b) => b.id),
      };

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // The selection currently applied via the URL, fed back into FacetFilter so it
  // stays in sync when a menu/category/brand is removed elsewhere (e.g. an
  // AppliedFilter chip). Memoized on the params so its identity only changes
  // when the applied filters do.
  const facetSelection = useMemo<FacetSelection>(() => {
    const toSel = (ids: string | null, names: string | null) => {
      if (!ids) return [];
      const idList = ids.split(",");
      const nameList = (names || "").split(",");
      return idList.map((id, i) => ({ id, name: nameList[i] || "" }));
    };
    return {
      menus: toSel(searchParams.get("menuId"), searchParams.get("menuName")),
      categories: toSel(
        searchParams.get("categoryId"),
        searchParams.get("categoryName"),
      ),
      brands: toSel(searchParams.get("brandId"), searchParams.get("brandName")),
    };
  }, [searchParams]);

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

  // Combined stock-movement / stock-status chips. The chip tells us which kind
  // it is; a movement chip drives `velocity`, a status chip drives
  // `stockStatus`, and picking one resets the other (single active filter).
  // "Inactive" is special: it filters product status, not stockStatus.
  const handleStockChipSelect = useCallback(
    ({ type, value }: StockChipSelection) => {
      methods.setValue("onlyWithStockData", false);
      if (type === "status" && value === "In Stock") {
        methods.setValue("onlyWithStockData", true);
        methods.setValue("velocity", "All");
        methods.setValue("stockStatus", "All");
        methods.setValue("status", "Active");
      } else if (type === "status" && value === "Inactive") {
        methods.setValue("status", "Inactive");
        methods.setValue("velocity", "All");
        methods.setValue("stockStatus", "All");
      } else if (type === "all") {
        methods.setValue("velocity", "All");
        methods.setValue("stockStatus", "All");
        methods.setValue("status", "Active");
      } else if (type === "movement") {
        methods.setValue("velocity", value);
        methods.setValue("stockStatus", "All");
        methods.setValue("status", "Active");
      } else {
        methods.setValue("stockStatus", value);
        methods.setValue("velocity", "All");
        methods.setValue("status", "Active");
      }
      handleFilterChange({ formData: methods.getValues() });
    },
    [methods, handleFilterChange],
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

  // Count badges for the movement/status stock chips, keyed by chip key. Reuses
  // the already-fetched inventory summary — movement tallies come from the
  // product-summary breakdown, stock-status tallies from the main summary.
  const stockChipCounts = useMemo<Record<string, number>>(() => {
    const byKey = (key: string) =>
      summaryData.productSummary.find((item) => item.key === key)?.value ?? 0;
    const { mainSummary } = summaryData;
    // `mainSummary.totalProducts` is the *filtered* total, so it collapses to the
    // selected chip's own count once a movement/status chip is active. The chip
    // row needs the unfiltered total, which is what the second analytics call
    // (movement/stock-status filters stripped — see getSummary) returns.
    const totalIgnoringChips =
      summaryData.rawData?.totalDeals ?? mainSummary.totalProducts;
    return {
      "in-stock": summaryData.mainSummary.inStock,
      all: totalIgnoringChips,
      "fast-moving": byKey("fast-moving"),
      "slow-moving": byKey("slow-moving"),
      "non-moving": byKey("non-moving"),
      expired: mainSummary.expired,
      "out-of-stock": mainSummary.outOfStock,
      "near-expiry": mainSummary.nearExpiry,
      "low-stock": mainSummary.lowStock,
    };
  }, [summaryData]);

  // Which stock-alert tile (if any) is the currently applied filter. The URL
  // carries the raw filter value ("Out of Stock", "Slow Moving", …); the panel
  // highlights by tile key.
  const activeStockAlertKey = useMemo(() => {
    const byValue: Record<string, string> = {
      "Out of Stock": "out-of-stock",
      "Slow Moving": "slow-moving",
      "Non-Moving": "non-moving",
      "Near Expiry": "near-expiry",
      Expired: "expired",
    };
    const applied =
      searchParams.get("stockStatus") || searchParams.get("velocity") || "";
    return byValue[applied];
  }, [searchParams]);

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
              color="primary"
              onClick={() => setShowCreateItemModal(true)}
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
        title={
          isMenuView && menuName ? menuName : t(isInactivePage ? "inactiveItems" : "allItems")
        }
        showAudioNote={true}
        audioNoteTitle={
          isMenuView && menuName ? menuName : t(isInactivePage ? "inactiveItems" : "allItems")
        }
        audioFeature="manageInventory"
        sectionKey="catalog"
        mobileLead="menu"
        subtitle={
          <span>
            {isMenuView && menuCount ? menuCount : productsCount} {t("items")}
          </span>
        }
        // Desktop-only create-item entry point; mobile keeps the footer /
        // FAB affordances, so the header actions stay untouched there.
        renderActions={
          isMobile ? undefined : (
            <Rbac
              roles={rbacRoles.addProduct}
              forceDisplay={AuthService.isMasterLogin()}
            >
              <AppButton
                size="small"
                color="primary"
                onClick={() => setShowCreateItemModal(true)}
                className="tw:flex tw:items-center tw:gap-2"
              >
                <Plus size={16} />
                <span>{t("createProduct")}</span>
              </AppButton>
            </Rbac>
          )
        }
      />
      <div className="page-bg app-page page-padding">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        {/* <SectionTabs
          sectionKey="catalog"
          activeTab="my-catalog"
          noShadow */}
        {/* sticky */}
        {/* /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="my-catalog"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <div>
                  {/* Breadcrumb + description + inline actions. On theme-2 mobile
                      every child is hidden (breadcrumbs/description via CSS, the
                      actions live in the footer), so collapse the empty row to
                      drop the dead gap above the search block. */}
                  {!isTheme2 && (
                    <div className="tw:flex tw:flex-col tw:lg:flex-row tw:lg:justify-between tw:items-start tw:lg:items-center tw:mb-4 tw:gap-3 theme-2-mobile-hide">
                      <div className="tw:flex-1">
                        <AppBreadcrumbs
                          data={breadcrumbs}
                          className="tw:mb-0!"
                        />
                        <PageDescription description="manageInventory" />
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap">
                        <div className="tw:md:flex tw:hidden tw:w-full tw:md:w-auto">
                          {renderActionButton()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feed copies — in theme-2 desktop the pane chips / summary rows
              replace these (see AppPaneSide below). theme-2 hides the tab row
              entirely (mobile + desktop). */}
                  {!isTheme2 && (
                    <InventoryTab
                      activeTab={
                        isInactivePage ? "inactive-products" : "products"
                      }
                      className="tw:mb-2 app-pane-hide"
                    />
                  )}

                  {/* Missing sell-in config alert — hidden in theme-2. */}
                  {!isTheme2 && <MissingConfigAlert />}
                  <SyncInventoryAlert />

                  {activeView === "products" ? (
                    <FormProvider {...methods}>
                      {/* Full-bleed white search bar, pinned on scroll. Kept as a
                          direct child of the scrolling content column (alongside
                          the product list) so it stays sticky over the whole
                          list — a short wrapper would unstick the moment it
                          scrolled out of view. The facet/applied/stock chips
                          below scroll away normally. */}
                      <div className="catalog-search-sticky catalog-search-flush tw:mb-5">
                        <Filter callback={handleFilterChange} />
                      </div>

                      <div className="tw:mt-3">
                        <FacetFilter
                          // Remount when the search term clears so the facet filter's
                          // selected chips reset for the next search.
                          key={
                            searchParams.get("search")
                              ? "facet-active"
                              : "facet-empty"
                          }
                          search={searchParams.get("search") || ""}
                          source="seller-deal"
                          selected={facetSelection}
                          callback={handleFacetApply}
                        />
                      </div>

                      {!isInactivePage && !isTheme2 && (
                        <InventoryMainSummary
                          className="tw:mb-3 app-pane-hide"
                          summaryData={summaryData.mainSummary}
                          loading={summaryLoading}
                          onItemClick={handleSummaryItemClick}
                        />
                      )}

                      <StockChips
                        className="tw:mb-3 tw:md:hidden"
                        onSelect={handleStockChipSelect}
                        counts={stockChipCounts}
                        loading={summaryLoading}
                      />

                      <ProductAppliedFilter
                        onFilterChange={handleFilterChange}
                        hiddenFilters={isMenuView ? ["menu"] : undefined}
                      />

                      {/* <InventoryProductSummary
                summaryData={summaryData.productSummary}
              /> */}
                    </FormProvider>
                  ) : null}

                  {activeView === "products" && (
                    <>
                      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
                        <div className="tw:flex tw:gap-2 tw:items-center">
                          <PaginationSummary
                            paginationConfig={paginationRef.current}
                            loadingTotalRecords={loading}
                            loadedCount={products.length}
                            fwSize="sm"
                          />
                        </div>
                        <div className="tw:flex tw:gap-2 tw:items-center">
                          {!(isTheme2 && !isMobile) && (
                            <ViewToggle
                              viewType={view}
                              callback={setView}
                              hideInMobile={false}
                              showOnlyIcon={isMobile}
                            />
                          )}
                          <div>
                            <SortBy
                              globalSortValue={
                                methods.getValues().globalSort || ""
                              }
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
                                    appNav.to(
                                      "/dashboard/bulk-upload/add-stock",
                                    );
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
                      {!isTheme2 &&
                        searchParams.get("stockStatus") !== "Out of Stock" && (
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
                                      newParams.set(
                                        "onlyWithStockData",
                                        "true",
                                      );
                                    else newParams.delete("onlyWithStockData");
                                    setSearchParams(newParams, {
                                      replace: true,
                                    });
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
                      ) : isTheme2 || view === "list" ? (
                        // theme-2 desktop always uses the table view — the
                        // reworked DesktopView is the layout the split pane was
                        // designed around, so the card/list toggle is hidden.
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
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <CatalogSidePane
                  scopeLabel={isInactivePage ? "Inactive" : ""}
                  showInventoryValue={false}
                  showStockAlerts={!isInactivePage}
                  showActivityLog={false}
                  onValueSelect={(key) =>
                    handleSummaryItemClick(
                      key === "totalItems" ? "totalProducts" : key,
                    )
                  }
                  activeStockAlertKey={activeStockAlertKey}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* footer — hidden in theme-2, which uses the add-item FAB on mobile and
          the top-right action row on desktop instead. */}
      {isMobile && !isTheme2 && (
        <div className="app-footer">{renderActionButton()}</div>
      )}

      {/* theme-2 mobile: floating add-item button (replaces the footer). */}
      {isTheme2 && isMobile && (
        <Rbac
          roles={rbacRoles.addProduct}
          forceDisplay={AuthService.isMasterLogin()}
        >
          <button
            type="button"
            onClick={() => setShowCreateItemModal(true)}
            aria-label={t("createProduct")}
            className="theme-2-fab tw:flex tw:items-center tw:gap-2 tw:rounded-full tw:bg-primary tw:px-5 tw:py-3.5 tw:text-primary-foreground tw:shadow-lg tw:cursor-pointer tw:transition-transform tw:active:scale-95"
          >
            <Plus size={20} />
            <span className="tw:text-sm tw:font-semibold">
              {t("createProduct")}
            </span>
          </button>
        </Rbac>
      )}

      <CreateItemModal
        show={showCreateItemModal}
        callback={() => setShowCreateItemModal(false)}
      />

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
