import { produce } from "immer";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
// BusyLoader removed in favor of per-item AppButton loading state
import {
  ArrowUpDown,
  Info,
  MapPin,
  Mic,
  ScanBarcode,
  Sparkles,
} from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox } from "~/components/core/form";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppPopover from "~/components/core/popover/AppPopover";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { Button } from "~/components/ui/button";
import { SUBSCRIBE_MAX_PRODUCTS_COUNT, UN_BRAND_ID } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import IntroModal from "~/modals/feature/intro/IntroModal";
import CommonService from "~/services/CommonService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PageAccessService from "~/services/PageAccessService";
import { StorageService } from "~/services/StorageService";
import FacetFilter from "~/shared/catalog/components/facet-filter/FacetFilter";
import type { FacetSelection } from "~/shared/catalog/components/facet-filter/modals/facet-filter/FacetFilterModal";
import AddProductModal from "~/shared/catalog/modals/AddProductModal";
import AiProductInfoModal from "~/shared/catalog/modals/ai-product-info/AiProductInfoModal";
import type {
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import VariantModal from "../modals/variant-modal/VariantModal";
import AppliedFilters from "./components/AppliedFilters";
import Brands from "./components/brands/Brands";
import Categories from "./components/categories/Categories";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileItemTheme2 from "./components/MobileItemTheme2";
import MobileView from "./components/MobileView";
import SearchedViaAI from "./components/SearchedViaAI";
import SubscribeTopProductInfo from "./components/SubscribeTopProductInfo";
import TopPickCard from "./components/top-picks/TopPickCard";
import {
  defaultFilterValues,
  EXTRA_SORT_TYPES,
  getCount,
  getData,
  prepareParams,
  RADIUS_KMS,
  type FilterFormFields,
} from "./helper";

const defaultRadiusKms = 10;

const getRandomSortType = () => {
  try {
    const opts = InventorySubscribeService.getSortOptions().map(
      (opt) => opt.value,
    );
    if (opts.length === 0) return "popular";
    return opts[Math.floor(Math.random() * opts.length)];
  } catch (err) {
    return "popular";
  }
};

const defaultPaginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 50,
  startSlNo: 1,
  endSlNo: 50,
  totalRecords: 0,
};

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { allowNoSubscribe: true });
}

const SearchDiscovery: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);
  const appToast = useAppToast();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";

  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const [searchParams, setSearchParams] = useSearchParams();

  // Always points at the latest searchParams. react-router's setSearchParams
  // functional updater hands back the searchParams captured in *its* closure,
  // not the live URL — and the Filter's debounced search holds a stale
  // setSearchParams/handler from an earlier render. Reading viewMode/tab from
  // this (ref-stable) value keeps them correct regardless of that staleness.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const activeTab = searchParams.get("tab") || "";
  const appNav = useAppNav();

  const mode = searchParams.get("mode") || "";
  const version = searchParams.get("version");

  const isUnbrand = mode === "unbrand";

  const isVoiceSearch = searchParams.get("via") === "voice";
  const voiceSearchTerm = searchParams.get("search") || "";

  const viewModeParam = searchParams.get("viewMode");
  const viewMode: "product" | "brand" | "category" =
    viewModeParam === "brand" || viewModeParam === "category"
      ? viewModeParam
      : "product";
  const isBrandView = viewMode === "brand";
  const isCategoryView = viewMode === "category";
  /** Brand and category views both replace the product list with a group grid. */
  const isGroupView = isBrandView || isCategoryView;

  const handleViewModeChange = (next: "product" | "brand" | "category") => {
    if (next === viewMode) return;

    const allParams = Object.fromEntries(searchParams.entries());
    const preserved: Record<string, string> = {};
    if (allParams.tab) preserved.tab = allParams.tab;
    if (allParams.sortType) preserved.sortType = allParams.sortType;
    if (allParams.radiusKms) preserved.radiusKms = allParams.radiusKms;
    if (allParams.version) preserved.version = allParams.version;
    if (allParams.hideTab) preserved.hideTab = allParams.hideTab;

    if (next === "product") {
      setSearchParams(preserved);
    } else {
      setSearchParams({ ...preserved, viewMode: next });
    }
  };

  const handleBrandView = (brand: { id: string; name: string }) => {
    const hideTab = searchParams.get("hideTab");
    setSearchParams({
      brandId: brand.id,
      brandName: brand.name,
      ...(hideTab ? { hideTab } : {}),
      ...(version ? { version } : {}),
    });
  };

  const handleCategoryView = (category: { id: string; name: string }) => {
    const hideTab = searchParams.get("hideTab");
    setSearchParams({
      categoryId: category.id,
      categoryName: category.name,
      ...(hideTab ? { hideTab } : {}),
      ...(version ? { version } : {}),
    });
  };

  // React Hook Form setup
  const methods = useForm<FilterFormFields>({
    defaultValues: defaultFilterValues,
  });

  const sortType = methods.watch("sortType");

  const [introModal, setIntroModal] = useState<{
    show: boolean;
    data: any;
  }>({ show: false, data: null });

  const [selectedRadiusKms, setSelectedRadiusKms] = useState<number | null>(
    defaultRadiusKms,
  );

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string }>;
  }>({
    show: false,
    images: [],
  });

  const [showSortPopover, setShowSortPopover] = useState(false);

  // State variables for products, loading, and more
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  // Track loading state per item via items[].isLoading
  const [subscribeAllChecked, setSubscribeAllChecked] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [isSubscribingSelected, setIsSubscribingSelected] = useState(false);

  // Variant modal state: { show: boolean, data: any }
  const [variantModal, setVariantModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: null,
  });

  // How the user wants to feed the search: type it, upload a photo, scan a
  // barcode or speak. Only "text" keeps the plain input; the others expose a
  // capture action that ends up writing the same `search` param.
  const [searchMode, setSearchMode] = useState<SearchMode>("text");

  const [showAiModal, setShowAiModal] = useState(false);
  const [searchedViaAI, setSearchedViaAI] = useState(false);
  const [lastAiPayload, setLastAiPayload] = useState<{
    results: any[];
    images: Array<{ id: string }>;
  }>({ results: [], images: [] });

  const [addProductModal, setAddProductModal] = useState<{
    show: boolean;
    data?: any;
    images?: Array<{ id: string }>;
  }>({ show: false, data: null, images: [] });

  const primeCatalog = methods.watch("primeCatalog");
  const primeCatalogTop = methods.watch("primeCatalogTop");

  // Refs for pagination and sort
  const paginationRef = useRef<PaginationState>({ ...defaultPaginationRef });
  const sortRef = useRef<SortProps>(undefined);
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Tracks the brand/category/menu ids that were applied via the (search-driven)
  // facet filter. Clearing the search removes only these — selections made via
  // the main Filter modal share the same form fields/URL params but must be left
  // untouched.
  const facetSelectedRef = useRef<{
    menus: string[];
    categories: string[];
    brands: string[];
  }>({ menus: [], categories: [], brands: [] });

  // Common function to update items with selection state and handle subscribe all logic
  const updateItemsWithSelection = useCallback(
    (newItems: any[], isAppending = false) => {
      // const itemsWithSelection = newItems.map((item: any) => ({
      //   ...item,
      //   isSelected: subscribeAllChecked
      //     ? !item.isSubscribed && !item.isInCart && selectedProducts.size < 50
      //     : false,
      // }));

      if (isAppending) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setItems(newItems);
      }

      // If subscribe all is checked, update the selection
      // if (subscribeAllChecked && selectedProducts.size < 50) {
      //   const selectableProductIds = newItems
      //     .filter((item: any) => !item.isSubscribed && !item.isInCart)
      //     .map((item: any) => item._id);

      //   if (isAppending) {
      //     setSelectedProducts(
      //       (prev) => new Set([...prev, ...selectableProductIds])
      //     );
      //   } else {
      //     setSelectedProducts(new Set(selectableProductIds));
      //   }
      // }
    },
    [subscribeAllChecked],
  );

  // Maximum allowed subscriptions (existing in cart + selected) at any time
  const MAX_SUBSCRIPTIONS = SUBSCRIBE_MAX_PRODUCTS_COUNT;

  // useEffect(() => {
  //   if (!AuthService.isFeatureIntroCompleted("create-catalog")) {
  //     setIntroModal({ show: true, data: null });
  //   }
  // }, []);

  useEffect(() => {
    const handleItemAdded = (event: CustomEvent) => {
      const itemId = event.detail.itemId;
      if (itemId) {
        setItems(
          produce((draft) => {
            const index = draft.findIndex((item) => item.itemId === itemId);
            if (index !== -1) {
              draft[index].isInCart = false;
              draft[index].itemId = null;
            }
          }),
        );
      }
    };
    window.addEventListener(
      "subscribe-item-removed",
      handleItemAdded as EventListener,
    );
    return () =>
      window.removeEventListener(
        "subscribe-item-removed",
        handleItemAdded as EventListener,
      );
  }, []);

  const isAbortError = (error: any) =>
    error?.name === "CanceledError" ||
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED";

  // Apply filter and fetch data
  const applyFilter = async () => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const { signal } = controller;

    setIsLoading(true);
    setItems([]);
    paginationRef.current = { ...paginationRef.current, activePage: 1 };

    // Get current form values instead of using filterRef
    const formValues = methods.getValues();

    if (isUnbrand) {
      formValues.brands = [
        { value: { id: UN_BRAND_ID, name: "Unbranded" }, label: "Unbranded" },
      ];
    }

    const params = prepareParams(
      formValues,
      paginationRef.current,
      sortRef.current,
    );

    try {
      const [countResult, result] = await Promise.all([
        getCount(params, signal),
        getData(params, signal),
      ]);
      if (signal.aborted) return;
      // The "top" tab reads the network price comparison, which carries its own
      // total alongside the rows instead of answering the count call.
      const count = result.total ?? countResult;
      paginationRef.current = {
        ...paginationRef.current,
        totalRecords: count,
      };
      setTotalCount(count);

      // Use common function to update items with selection state
      updateItemsWithSelection(result.data, false);

      setHasMore(result.data.length < count);
      setIsLoading(false);
    } catch (error) {
      if (isAbortError(error)) return;
      setIsLoading(false);
    }
  };

  // Load more data for infinite scroll
  const loadMore = async () => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    const { signal } = controller;

    setIsLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    // Get current form values instead of using filterRef
    const formValues = methods.getValues();

    const params = prepareParams(
      formValues,
      paginationRef.current,
      sortRef.current,
    );

    try {
      const result = await getData(params, signal);
      if (signal.aborted) return;

      // Use common function to update items with selection state (appending mode)
      updateItemsWithSelection(result.data, true);

      setHasMore(result.data.length >= paginationRef.current.rowsPerPage);
      setIsLoadingMore(false);
    } catch (error) {
      if (isAbortError(error)) return;
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const menuId = searchParams.get("menuId");
    const menuName = searchParams.get("menuName");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const brandId = searchParams.get("brandId");
    const brandName = searchParams.get("brandName");
    const companyId = searchParams.get("companyId");
    const companyName = searchParams.get("companyName");
    const search = searchParams.get("search");
    const searchType = searchParams.get("searchType");
    const activeTab = searchParams.get("tab");
    let sortType = searchParams.get("sortType");
    const radiusKms = searchParams.get("radiusKms");
    const onlyOffers = searchParams.get("onlyOffers");
    const isGroupDealParam = searchParams.get("isGroupDeal");
    const storedPrimeCatalog = StorageService.get("primeCatalogShow");
    const primeCatalogDefault =
      storedPrimeCatalog != null ? String(storedPrimeCatalog) : "false";
    const primeCatalog =
      searchParams.get("primeCatalog") || primeCatalogDefault;
    const primeCatalogTop = searchParams.get("primeCatalogTop") || "200";
    const productsWithImages = searchParams.get("productsWithImages");
    const productsWithoutImages = searchParams.get("productsWithoutImages");
    const onlyNotSubscribed = searchParams.get("onlyNotSubscribed");

    methods.setValue("primeCatalog", primeCatalog === "true");
    methods.setValue("primeCatalogTop", parseInt(primeCatalogTop));

    // menu/categories/brands may carry multiple comma-separated ids/names (set
    // by the facet filter); split them back into the array shape the form expects.
    const toItems = (ids?: string | null, names?: string | null) => {
      if (!ids) return [];
      const idList = ids.split(",");
      const nameList = (names || "").split(",");
      return idList.map((id, i) => ({
        value: { id, name: nameList[i] || "" },
        label: nameList[i] || "",
      }));
    };

    if (menuId) {
      methods.setValue("menu", toItems(menuId, menuName));
    } else {
      methods.setValue("menu", []);
    }

    if (categoryId) {
      methods.setValue("categories", toItems(categoryId, categoryName));
    } else {
      methods.setValue("categories", []);
    }

    if (brandId) {
      methods.setValue("brands", toItems(brandId, brandName));
    } else {
      methods.setValue("brands", []);
    }

    if (companyId || companyName) {
      methods.setValue("companyName", [
        {
          label: companyName || "",
          value: { id: companyId || companyName, name: companyName },
        },
      ]);
    } else {
      methods.setValue("companyName", []);
    }

    const keysParam = searchParams.get("keys");
    methods.setValue(
      "keys",
      keysParam ? keysParam.split(",").filter(Boolean) : [],
    );

    methods.setValue("search", search || "");
    methods.setValue("searchType", searchType || "Products");
    methods.setValue("activeTab", activeTab || "search");
    // If no sortType provided in URL, pick a random default on page load
    if (!sortType) {
      // Use random sort only when user hasn't explicitly set one
      sortType = getRandomSortType();
      if (primeCatalog === "true") {
        sortType = "popular";
      }
    }

    methods.setValue("sortType", sortType || "popular");
    const radiusKmsValue =
      activeTab === "top" && sortType === "popular"
        ? radiusKms
          ? parseInt(radiusKms)
          : 5
        : null;
    methods.setValue("radiusKms", radiusKmsValue);
    methods.setValue("onlyOffers", onlyOffers === "true");
    methods.setValue("isGroupDeal", isGroupDealParam === "true");
    methods.setValue("productsWithImages", productsWithImages === "true");
    methods.setValue("productsWithoutImages", productsWithoutImages === "true");
    methods.setValue("onlyNotSubscribed", onlyNotSubscribed === "true");
    methods.setValue("alpha", searchParams.get("alpha") || "");
    setSelectedRadiusKms(radiusKmsValue);
    setSelectedProducts(new Set());
    setSubscribeAllChecked(false);

    // Clear AI search flag on any filter/search change unless it was just set by AI callback
    // We check if the current search matches what AI set, otherwise clear it
    const currentSearch = methods.getValues("search");
    if (currentSearch !== search) {
      setSearchedViaAI(false);
    }

    if (isGroupView) {
      setItems([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    applyFilter();
  }, [searchParams]);

  // Helper function to prepare search params from form data
  const prepareSearchParamsFromFormData = useCallback((formData: any) => {
    const params: Record<string, any> = {};

    // menu/categories/brands support multiple selections (joined comma-separated).
    const menuList = (formData.menu || []).filter((m: any) => m?.value?.id);
    const menuId = menuList.map((m: any) => m.value.id).join(",");
    const menuName = menuList.map((m: any) => m.label).join(",");
    const categoryList = (formData.categories || []).filter(
      (c: any) => c?.value?.id,
    );
    const categoryId = categoryList.map((c: any) => c.value.id).join(",");
    const categoryName = categoryList.map((c: any) => c.label).join(",");
    const brandList = (formData.brands || []).filter((b: any) => b?.value?.id);
    const brandId = brandList.map((b: any) => b.value.id).join(",");
    const brandName = brandList.map((b: any) => b.label).join(",");
    const companyId = formData.companyName?.[0]?.value?.id;
    const companyName = formData.companyName?.[0]?.label;
    const search = formData.search;
    const searchType = formData.searchType;
    const activeTab = formData.activeTab;
    const sortType = formData.sortType;
    const radiusKms = formData.radiusKms;
    const onlyOffers = formData.onlyOffers;
    const alpha = formData.alpha;
    const productsWithImages = formData.productsWithImages;
    const productsWithoutImages = formData.productsWithoutImages;
    const onlyNotSubscribed = formData.onlyNotSubscribed;

    if (menuId) {
      params.menuId = menuId;
      params.menuName = menuName;
    }

    if (categoryId) {
      params.categoryId = categoryId;
      params.categoryName = categoryName;
    }

    if (brandId) {
      params.brandId = brandId;
      params.brandName = brandName;
    }

    if (companyId || companyName) {
      params.companyId = companyId;
      params.companyName = companyName;
    }

    if (search) {
      params.search = search;
    }

    if (searchType) {
      params.searchType = searchType;
    }

    if (activeTab) {
      // URL param is `tab` (read via searchParams.get("tab")); writing it as
      // `activeTab` here dropped the tab (e.g. top) on brand/filter selection.
      params.tab = activeTab;
    }

    if (sortType) {
      params.sortType = sortType;
    }

    if (radiusKms) {
      params.radiusKms = radiusKms;
    }

    if (onlyOffers) {
      params.onlyOffers = onlyOffers.toString();
    }

    if (typeof formData.isGroupDeal === "boolean" && formData.isGroupDeal) {
      params.isGroupDeal = formData.isGroupDeal.toString();
    }

    if (alpha) {
      params.alpha = alpha;
    }

    if (productsWithImages) {
      params.productsWithImages = productsWithImages.toString();
    }

    if (productsWithoutImages) {
      params.productsWithoutImages = productsWithoutImages.toString();
    }

    // If voice or other input collected 'keys' (array), serialize to comma-separated string for URL
    if (formData.keys && Array.isArray(formData.keys) && formData.keys.length) {
      params.keys = formData.keys.join(",");
    }

    if (onlyNotSubscribed) {
      params.onlyNotSubscribed = onlyNotSubscribed.toString();
    }

    return params;
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (data: { action: string; formData?: any; data?: any }) => {
      // Hide AI search indicator when filters are applied
      setSearchedViaAI(false);

      if (data.action === "ai-search") {
        setShowAiModal(true);
        return;
      }

      // Read the current view mode/tab from the live URL via searchParamsRef so
      // we don't depend on a possibly-stale `searchParams` closure (the Filter's
      // debounced search / alpha click can fire an old callback that also holds
      // a stale setSearchParams — see the ref's definition). Pass an explicit
      // object so the result is correct no matter which setSearchParams fires.
      const applyParams = (params: Record<string, string>) => {
        const live = searchParamsRef.current;
        const next: Record<string, string> = { ...params };
        const currentViewMode = live.get("viewMode");
        if (currentViewMode) next.viewMode = currentViewMode;
        const currentTab = live.get("tab");
        if (currentTab) next.tab = currentTab;
        const currentVersion = live.get("version");
        if (currentVersion) next.version = currentVersion;
        const currentHideTab = live.get("hideTab");
        if (currentHideTab) next.hideTab = currentHideTab;
        setSearchParams(next);
      };

      // Handle AppliedFilters callback format - formData is already reset to default
      if (data.action === "filter-removed" && data.data?.formData) {
        applyParams(prepareSearchParamsFromFormData(data.data.formData));
        return;
      }

      // Handle Filter component callback format
      if (data.formData) {
        const formData = { ...data.formData };

        // When the user clears the search, drop only the brand/menu/category that
        // was selected via the (search-driven) facet filter so results aren't left
        // filtered by stale facets. Selections made through the main Filter modal
        // share these fields but must be preserved. The FacetFilter's own internal
        // selection is reset via its remount key below.
        if (!formData.search || !formData.search.trim()) {
          const facet = facetSelectedRef.current;
          formData.menu = (formData.menu || []).filter(
            (m: any) => !facet.menus.includes(m?.value?.id),
          );
          formData.categories = (formData.categories || []).filter(
            (c: any) => !facet.categories.includes(c?.value?.id),
          );
          formData.brands = (formData.brands || []).filter(
            (b: any) => !facet.brands.includes(b?.value?.id),
          );
          facetSelectedRef.current = { menus: [], categories: [], brands: [] };
        }

        applyParams(prepareSearchParamsFromFormData(formData));
      }
    },
    [prepareSearchParamsFromFormData, setSearchParams, searchParams],
  );

  const openBarcodeScan = () =>
    appNav.to(
      version === "old"
        ? "/dashboard/inventory/barcode-scan-v1"
        : "/dashboard/inventory/barcode-scan",
    );

  // Voice results come back as keywords; the first one drives the search and
  // the rest stay as `keys` chips. `via=voice` shows the banner at the top.
  const handleVoiceResult = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action !== "close" && action !== "scan") return;

    const keywords: string[] = Array.isArray(data?.keywords)
      ? data.keywords.filter(Boolean)
      : typeof data?.search === "string" && data.search
        ? [data.search]
        : [];

    if (keywords.length === 0) return;

    methods.setValue("keys", keywords);
    methods.setValue("search", keywords[0]);
    setSearchedViaAI(false);

    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      search: keywords[0],
      keys: keywords.join(","),
      tab: searchParams.get("tab") || "search",
      via: "voice",
    });
  };

  const handleDismissAiSearch = () => {
    setSearchedViaAI(false);
  };

  // Apply menu/category/brand selections from the facet filter (inline brand
  // chips and the "More" modal) by writing them onto the URL query params, the
  // same way the Filter modal does. The read-effect below rehydrates the form
  // from these params and re-runs the search. Menus/categories/brands all
  // support multiple selections via $in, so their ids/names are stored
  // comma-separated.
  const handleFacetApply = (params: {
    action: string;
    data?: FacetSelection;
  }) => {
    if (params.action !== "apply" || !params.data) return;

    const { menus, categories, brands } = params.data;

    // Preserve every other active param (search, tab, sortType, viewMode, …).
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

    setSearchParams(next);
  };

  // The selection currently applied via the URL, fed back into FacetFilter so it
  // stays in sync when a menu/category/brand is removed elsewhere (e.g. an
  // AppliedFilters chip). Memoized on the param strings so its identity only
  // changes when the applied filters do.
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

  // Handle VariantModal callback
  const handleModalCallback = (params: { action: string; data?: any }) => {
    if (params.action === "close") {
      setVariantModal({ show: false, data: null });
    }
  };

  const handleAiModalCallback = (data: { action: string; data?: any }) => {
    if (data.action === "proceed" && data.data && data.data.length > 0) {
      // Preserve AI result payload (results + uploaded image ids) so we can
      // prefill the AddProductModal with richer defaults.
      setLastAiPayload({
        results: data.data || [],
        images:
          (data as any).images && Array.isArray((data as any).images)
            ? (data as any).images
            : [],
      });
      const productData = data.data[0];
      const basicInfo = productData?.product_basic_info || {};
      const searchTerm = (
        basicInfo.product_name ||
        basicInfo.barcode ||
        productData?.barcode ||
        ""
      ).trim();

      if (searchTerm) {
        methods.setValue("search", searchTerm);
        methods.setValue("keys", []);
        methods.setValue("searchType", "Products");

        const params: Record<string, string> = {
          ...Object.fromEntries(searchParams.entries()),
          search: searchTerm,
          tab: "search",
        };
        delete params.keys;

        setSearchParams(params);
        setSearchedViaAI(true);
        // Explicitly trigger search to ensure UI updates
        applyFilter();
      }
    }
    setShowAiModal(false);
  };

  const openAddProductFromAi = () => {
    if (
      !lastAiPayload ||
      !lastAiPayload.results ||
      lastAiPayload.results.length === 0
    )
      return;
    const productData = lastAiPayload.results[0] || {};
    const basicInfo = productData.product_basic_info || {};

    const description =
      productData.visual_description?.short_description ||
      productData.visual_description?.detailed_description ||
      "";

    const mrp = productData.pricing_info?.mrp || "";

    const barcode = productData.pricing_info?.barcode || "";

    const uom = productData.pricing_info?.uom || "unit";

    const imagesFromAi =
      lastAiPayload.images && lastAiPayload.images.length
        ? lastAiPayload.images
        : [];

    const dataForModal = {
      name: basicInfo.product_name || "",
      description,
      mrp,
      barcode,
      uom,
      images: imagesFromAi,
    };

    setAddProductModal({
      show: true,
      data: dataForModal,
      images: dataForModal.images,
    });
  };

  const handleAddProductModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    if (params.action === "close") {
      setAddProductModal({ show: false, data: null, images: [] });
      return;
    }

    if (params.action === "created" && params.data?.product) {
      setAddProductModal({ show: false, data: null, images: [] });
      // Clear AI search state since product was created from AI data
      setSearchedViaAI(false);
      setLastAiPayload({ results: [], images: [] });
      // Also clear search input and keys to remove AI search context
      try {
        methods.setValue("search", "");
        methods.setValue("keys", []);
      } catch (e) {
        // ignore if methods not available for some reason
      }

      const created = params.data.product;
      if (created && (created._id || created.id)) {
        const id = created._id || created.id;
        appNav.to(`/dashboard/inventory/subscribe/product-detail/${id}`);
      } else {
        applyFilter();
      }
    }
  };

  const handleSort = useCallback(
    (sortType: string) => {
      setShowSortPopover(false);
      // Picking a dropdown sort supersedes any active column-header sort.
      sortRef.current = undefined;
      methods.setValue("sortType", sortType);

      if (activeTab === "top") {
        methods.setValue("radiusKms", null);
        setSelectedRadiusKms(null);
      }

      const formValues = methods.getValues();
      const params = prepareSearchParamsFromFormData({
        ...formValues,
        sortType,
      });
      const hideTab = searchParams.get("hideTab");
      setSearchParams({
        tab: searchParams.get("tab") || "search",
        ...(hideTab ? { hideTab } : {}),
        ...(version ? { version } : {}),
        ...params,
      });
    },
    [
      activeTab,
      methods,
      prepareSearchParamsFromFormData,
      searchParams,
      setSearchParams,
    ],
  );

  const handleTableSort = useCallback(
    (params: SortProps) => {
      sortRef.current = params;
      applyFilter();
    },
    [applyFilter],
  );

  const handleSubscribe = async (index: number) => {
    // Verify current cart (server-first) and count unique dealIds to avoid duplicates causing false blocks
    const dealId = items[index]?._id;
    let uniqueCount = 0;
    let hasDealInCart = false;
    try {
      const cartResp = await InventorySubscribeService.getCart();
      if (cartResp?.statusCode === 200) {
        const serverProducts = cartResp.data?.data?.products || [];
        const dealIds = serverProducts
          .map((p: any) => p.dealId || p._id)
          .filter(Boolean);
        hasDealInCart = dealIds.includes(dealId);
        uniqueCount = new Set(dealIds).size;
      }
    } catch (err) {
      // fallback to local
      const local = InventorySubscribeService.getLocalCart() || [];
      const dealIds = local.map((p: any) => p.dealId).filter(Boolean);
      hasDealInCart = dealIds.includes(dealId);
      uniqueCount = new Set(dealIds).size;
    }

    // If this deal is not already in cart and adding it would exceed the limit, block
    if (!hasDealInCart && uniqueCount >= MAX_SUBSCRIPTIONS) {
      appToast.show({
        msg: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products at a time. Please review your cart to subscribe`,
        color: "warning",
      });
      return;
    }
    // mark item as loading using index
    setItems(
      produce((draft) => {
        if (draft[index]) draft[index].isLoading = true;
      }),
    );

    const response = await InventorySubscribeService.createRequest({
      dealId: items[index]._id,
      quantity: 0,
      price: items[index].mrp,
    });

    if (response.statusCode === 200) {
      const product = response.data?.data || {};

      InventorySubscribeService.saveInLocalCart({
        dealId: items[index]._id,
        dealName: items[index].name,
        quantity: 0,
        price: items[index].mrp,
        images: items[index].images,
        itemId: product.itemId,
      });

      InventorySubscribeService.triggerItemAddedEvent({
        dealId: items[index]._id,
        dealName: items[index].name,
      });

      setItems(
        produce((draft) => {
          draft[index].isInCart = true;
          draft[index].itemId = product.itemId;
        }),
      );

      appToast.show({
        msg: t("search.toast.productSubscribed"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: response?.data?.message || t("search.toast.failedToSubscribe"),
        color: "danger",
      });
    }
    // clear loading flag for this item
    setItems(
      produce((draft) => {
        if (draft[index]) draft[index].isLoading = false;
      }),
    );
  };

  const handleRemove = async (index: number) => {
    // mark item as loading using index
    setItems(
      produce((draft) => {
        if (draft[index]) draft[index].isLoading = true;
      }),
    );

    const response = await InventorySubscribeService.removeRequestItem(
      items[index].itemId,
    );

    if (response.statusCode === 200) {
      InventorySubscribeService.removeLocalCartItem(items[index].itemId);

      InventorySubscribeService.triggerItemRemovedEvent({
        itemId: items[index].itemId,
      });

      setItems(
        produce((draft) => {
          draft[index].isInCart = false;
        }),
      );
      appToast.show({
        msg: t("search.toast.productRemoved"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: t("search.toast.failedToRemove"),
        color: "danger",
      });
    }
    // clear loading flag for this item
    setItems(
      produce((draft) => {
        if (draft[index]) draft[index].isLoading = false;
      }),
    );
  };

  const handleItemCallback = async (params: { action: string; data?: any }) => {
    if (params.action === "show-img-preview" && params.data) {
      if (params.data.images.length > 0) {
        setImgPreviewModal({
          show: true,
          images: params.data.images.map((img: string) => ({ id: img })),
        });
      } else {
        appToast.show({
          msg: "No images found",
          color: "danger",
        });
      }
    }
    if (params.action === "product-tap" && params.data?._id) {
      appNav.to(
        `/dashboard/inventory/subscribe/product-detail/${params.data._id}`,
      );
    }
    if (params.action === "show-variant-modal" && params) {
      setVariantModal({ show: true, data: params.data });
    }
    if (params.action === "subscribe" && params.data) {
      // Check if deal has groupDeals, if so show variant modal instead
      const deal = items[params.data.index];
      if (
        deal?.groupDeals &&
        Array.isArray(deal.groupDeals) &&
        deal.groupDeals.length > 0
      ) {
        setVariantModal({ show: true, data: { _id: deal._id, ...deal } });
      } else {
        handleSubscribe(params.data.index);
      }
    }
    if (params.action === "remove" && params.data) {
      handleRemove(params.data.index);
    }
    // SubscribeBtn already called the API and toasted; only the row state is left.
    if (params.action === "subscribed" && params.data) {
      const { index, itemId } = params.data;
      setItems(
        produce((draft) => {
          if (draft[index]) {
            draft[index].isInCart = true;
            draft[index].itemId = itemId;
          }
        }),
      );
    }
    if (params.action === "category-tap" && params.data?.category) {
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        categoryId: params.data.category._id || params.data.category.id,
        categoryName: params.data.category.name,
        brandId: "",
        brandName: "",
      });
      appToast.show({
        msg: t("search.toast.filteredByCategory", {
          categoryName: params.data.category.name,
        }),
        color: "success",
      });
    }
    if (params.action === "brand-tap" && params.data?.brand) {
      setSearchParams({
        ...Object.fromEntries(searchParams.entries()),
        brandId: params.data.brand._id || params.data.brand.id,
        brandName: params.data.brand.name,
      });
      appToast.show({
        msg: t("search.toast.filteredByBrand", {
          brandName: params.data.brand.name,
        }),
        color: "success",
      });
    }
    if (params.action === "toggle-selection" && params.data) {
      // Robustly compute counts to avoid off-by-one issues when selecting items.
      const alreadyInCart =
        InventorySubscribeService.getLocalCart()?.length || 0;
      const currentlySelectedCount = selectedProducts.size || 0;

      const { index, checked, productId } = params.data;

      // when trying to check an item, ensure we don't exceed MAX_SUBSCRIPTIONS
      if (checked) {
        // If we add this item, total would be: alreadyInCart + currentlySelectedCount + 1
        if (alreadyInCart + currentlySelectedCount + 1 > MAX_SUBSCRIPTIONS) {
          appToast.show({
            msg: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products at a time. Please review your cart to subscribe`,
            color: "warning",
          });
          return;
        }
      }

      setSelectedProducts((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, isSelected: checked } : item,
        ),
      );
    }
  };

  const handleSubscribeAllDisplayed = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = event.target.checked;

    const alreadySelected =
      InventorySubscribeService.getLocalCart()?.length || 0;

    // set local state for checkbox regardless (so UI updates)
    setSubscribeAllChecked(checked);

    if (checked) {
      // Select all products that are not already subscribed/selected/in cart
      let selectableProductIds = items
        .filter(
          (item) => !item.isSubscribed && !item.isSelected && !item.isInCart,
        )
        .map((item) => item._id);

      const remainingAllowed =
        MAX_SUBSCRIPTIONS - alreadySelected - selectedProducts.size;

      if (remainingAllowed <= 0) {
        appToast.show({
          msg: `You can only subscribe up to ${MAX_SUBSCRIPTIONS} products at a time. Please review your cart to subscribe`,
          color: "warning",
        });
        // Ensure UI checkbox doesn't remain checked if nothing is selectable
        setSubscribeAllChecked(false);
        return;
      }

      if (selectableProductIds.length > remainingAllowed) {
        appToast.show({
          msg: `Only ${remainingAllowed} more products can be selected to reach the ${MAX_SUBSCRIPTIONS} product limit.`,
          color: "warning",
        });
      }

      // Limit to remainingAllowed
      selectableProductIds = selectableProductIds.slice(0, remainingAllowed);

      // Merge with any existing selections
      setSelectedProducts((prev) => {
        const merged = new Set(prev);
        selectableProductIds.forEach((id) => merged.add(id));
        return merged;
      });

      // Update items to show as selected only for those selected
      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isSelected:
            !item.isSubscribed &&
            !item.isInCart &&
            selectableProductIds.includes(item._id),
        })),
      );
    } else {
      // Deselect displayed products (clear all selections for simplicity)
      setSelectedProducts(new Set());
      setItems((prev) => prev.map((item) => ({ ...item, isSelected: false })));
    }
  };

  const handleSubscribeSelected = async () => {
    if (selectedProducts.size === 0) return;

    setIsSubscribingSelected(true);
    const selectedItems = items.filter((item) =>
      selectedProducts.has(item._id),
    );
    const selectedCount = selectedProducts.size;

    try {
      // Prepare products data for bulk subscription
      const products = selectedItems.map((item) => {
        const product: any = {
          dealId: item._id,
          dealRefId: item.dealId,
          name: item.name,
          quantity: 0,
          mrp: item.mrp,
          price: item.mrp,
          images: item.images || [],
          barcodes: item.barcodes || [],
        };
        if (item.hsn) product.hsnNumber = item.hsn;
        const gstVal = item.gst ?? item.tax;
        if (gstVal !== undefined && gstVal !== "") product.gst = Number(gstVal);
        return product;
      });

      const response =
        await InventorySubscribeService.bulkSubscription(products);

      if (response.statusCode === 200) {
        // Prepare data for localStorage storage
        const subscribedProducts = response.data?.data?.cart?.products || [];

        const localCartData = subscribedProducts
          .map((product: any) => {
            // Find the corresponding selected item by dealId instead of relying on index
            const selectedItem = selectedItems.find(
              (item) => item._id === product.dealId,
            );

            // Skip if we can't find the corresponding selected item
            if (!selectedItem) {
              console.warn(
                `Could not find selected item for dealId: ${product.dealId}`,
              );
              return null;
            }

            return {
              dealId: selectedItem._id,
              dealName: selectedItem.name,
              quantity: 0,
              price: selectedItem.mrp,
              images: selectedItem.images || [],
              itemId: product.itemId || product._id,
            };
          })
          .filter(Boolean); // Remove any null entries

        // Save to localStorage
        if (localCartData.length > 0) {
          InventorySubscribeService.saveBulkInLocalCart(localCartData);
        }

        // Update items to reflect subscription status
        setItems((prev) =>
          prev.map((item) => ({
            ...item,
            isInCart: selectedProducts.has(item._id) ? true : item.isInCart,
            isSelected: false,
            itemId: selectedProducts.has(item._id)
              ? localCartData.find(
                  (cartItem: any) => cartItem.dealId === item._id,
                )?.itemId || item.itemId
              : item.itemId,
          })),
        );

        // Clear selected products and checkbox
        setSelectedProducts(new Set());
        setSubscribeAllChecked(false);

        // Trigger single event for bulk subscription
        InventorySubscribeService.triggerItemAddedEvent({
          bulk: true,
          count: selectedCount,
          dealIds: selectedItems.map((item) => item._id),
        });

        appToast.show({
          msg: t("search.toast.productsSubscribed", {
            count: selectedCount,
            defaultValue: `${selectedCount} products subscribed successfully`,
          }),
          color: "success",
        });

        // Trigger cart popover to open
        InventorySubscribeService.triggerOpenCartPopoverEvent();
      } else {
        appToast.show({
          msg: response?.data?.message || t("search.toast.failedToSubscribe"),
          color: "danger",
        });
      }
    } catch (error) {
      appToast.show({
        msg: t("search.toast.failedToSubscribe"),
        color: "danger",
      });
    } finally {
      setIsSubscribingSelected(false);
    }
  };

  const handleRadiusKmsChange = (radius: { label: string; value: number }) => {
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      sortType: "popular",
      radiusKms: radius.value.toString(),
    });
  };

  const handleImgPreviewModalCallback = (params: {
    action: string;
    data?: any;
  }) => {
    setImgPreviewModal({ show: false, images: [] });
  };

  const handleIntroModalCallback = ({ action }: any) => {
    setIntroModal({ show: false, data: null });
  };

  // "Showing x of y records" + "Subscribe to all". On theme-2 it rides inside
  // the sticky search block (see below) so it doesn't scroll under the pinned
  // white bar; elsewhere it stays in flow above the list.
  const paginationSummaryRow = (
    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:min-w-0">
      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={isLoading}
        fwSize="sm"
        loadedCount={items.length}
      />
      {items.length > 0 && (
        <AppCheckbox
          size="xs"
          className="tw:cursor-pointer"
          label={
            <span className="tw:text-xs tw:text-gray-500 tw:whitespace-nowrap">
              Subscribe to all
            </span>
          }
          value={subscribeAllChecked}
          onChange={(checked) =>
            handleSubscribeAllDisplayed({
              target: { checked },
            } as React.ChangeEvent<HTMLInputElement>)
          }
        />
      )}
    </div>
  );

  const summaryInSticky = isTheme2 && !isUnbrand;

  // Unbranded results stay on the plain product card in every theme (theme-2's
  // full-width row reads as a chat list and there's no view toggle to leave it),
  // laid out 2-up on a phone and 6-up on a desktop.
  const cardGridClass = isUnbrand
    ? "tw:grid tw:grid-cols-2 tw:md:grid-cols-6 tw:gap-2"
    : "tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-x-2";

  // Top picks fall back to the TopPickCard grid everywhere except theme-2 on a
  // phone, where the full-bleed row wins — the skeleton follows the same split.
  const isTopPickGrid = activeTab === "top" && !(isTheme2 && isMobile);

  return (
    <div>
      {/* Voice Search Indicator */}
      {isVoiceSearch && voiceSearchTerm && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:p-3 tw:rounded-lg tw:bg-blue-50 tw:border tw:border-blue-100">
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-blue-600 tw:text-white tw:shrink-0">
            <Mic size={16} />
          </span>
          <span className="tw:text-sm tw:text-gray-700">
            Showing results for voice search:{" "}
            <span className="tw:font-semibold tw:text-gray-900">
              “{voiceSearchTerm}”
            </span>
          </span>
        </div>
      )}

      {/* Header row for the classic themes only — every child inside is gated
          on `!isTheme2`, so on theme-2 the row would render as an empty white
          strip above the search bar and push it off the header. Skipping it
          lets the filter strip below be the page's first block, which is what
          `catalog-search-flush` assumes. */}
      {!isTheme2 && (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-4 tw:gap-y-1 tw:justify-between tw:mb-2">
          {!isUnbrand && (
            <div
              role="radiogroup"
              aria-label="View mode"
              className="tw:flex tw:items-center tw:gap-3 tw:shrink-0 tw:text-xs"
            >
              <span className="tw:text-gray-500">View by:</span>
              {(
                [
                  { value: "product", label: "Products" },
                  { value: "brand", label: "Brands" },
                  { value: "category", label: "Categories" },
                ] as const
              ).map((m) => (
                <label
                  key={m.value}
                  className="tw:inline-flex tw:items-center tw:gap-1 tw:cursor-pointer"
                >
                  <input
                    type="radio"
                    name="view-mode"
                    value={m.value}
                    checked={viewMode === m.value}
                    onChange={() => handleViewModeChange(m.value)}
                    className="tw:h-3 tw:w-3 tw:cursor-pointer"
                  />
                  <span className="tw:text-gray-700">{m.label}</span>
                </label>
              ))}
            </div>
          )}
          <SubscribeTopProductInfo primeCatalogShow={primeCatalog ?? true} />
        </div>
      )}

      {!isUnbrand && (
        <>
          {/* Non-text modes still write into the same search field — each one
              just offers its own way to capture the term. */}
          {searchMode !== "text" && (
            <div className="tw:mb-3 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:shadow-sm">
              <span className="tw:text-xs tw:text-slate-500">
                {searchMode === "image" &&
                  "Upload a product photo and we'll pull out the name, MRP and barcode."}
                {searchMode === "barcode" &&
                  "Open the scanner to look up a product by its EAN / UPC."}
                {searchMode === "voice" &&
                  "Speak the product name in Kannada, Hindi or English."}
              </span>

              {searchMode === "image" && (
                <AppButton
                  size="small"
                  color="primary"
                  onClick={() => setShowAiModal(true)}
                >
                  Upload photo
                </AppButton>
              )}

              {searchMode === "barcode" && (
                <AppButton
                  size="small"
                  color="primary"
                  onClick={openBarcodeScan}
                >
                  Open scanner
                </AppButton>
              )}

              {searchMode === "voice" && (
                <VoiceSearch callback={handleVoiceResult}>
                  <span className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white">
                    <Mic size={14} />
                    Start speaking
                  </span>
                </VoiceSearch>
              )}
            </div>
          )}
        </>
      )}

      <FormProvider {...methods}>
        {/* theme-2 gives the filter block the same full-bleed white band as the
            other catalog surfaces, pinned under the sticky nav chips. Other
            themes keep it inline — their section tab bar already owns that
            sticky slot. */}
        {!isUnbrand && (
          <div
            className={
              isTheme2
                ? "catalog-search-sticky catalog-search-flush tw:mb-2"
                : ""
            }
          >
            <Filter
              callback={handleFilterChange}
              subscribeAllChecked={subscribeAllChecked}
              handleSubscribeAllDisplayed={handleSubscribeAllDisplayed}
              isLoading={isLoading}
              showSubscribeAllCheckbox={false}
              showFilterButton={!isGroupView}
              searchPlaceholder={
                isBrandView
                  ? "Search by brand name"
                  : isCategoryView
                    ? "Search by category name"
                    : undefined
              }
              showAiSearch={!isGroupView}
            />

            {/* theme-2 pins the search block, so an applied-filter row left in
                normal flow below it scrolls straight under the stuck white bar
                and can never be seen or cleared. Ride along inside the sticky
                block instead; other themes keep it in flow further down. */}
            {isTheme2 && !isGroupView && !searchedViaAI && (
              <AppliedFilters
                callback={handleFilterChange}
                className="tw:mt-2"
              />
            )}

            {/* Same reason: the record count / "Subscribe to all" row would
                otherwise sit in the strip's shadow once the bar is pinned. */}
            {summaryInSticky && !isGroupView && (
              <div className="tw:mt-2">{paginationSummaryRow}</div>
            )}
          </div>
        )}
      </FormProvider>

      {/* Popular Near Me radius selector — shown in both product and brand
          views so the km filter persists when the Brands radio is selected. */}
      {activeTab === "top" && (
        // Mobile stacks title → chips → hint. From md the block reads as one
        // toolbar row: the heading and its explainer own the left, the radius
        // selector sits right where the eye lands after the title, so the wide
        // screen doesn't show a title stranded above a near-empty band.
        <AppCard
          noPadding
          className="tw:mt-2 tw:mb-4 tw:gap-0 tw:rounded-xl tw:border-slate-200 tw:bg-white"
        >
          <div className="tw:p-3 tw:md:flex tw:md:items-center tw:md:justify-between tw:md:gap-6 tw:md:p-4">
            <div className="tw:min-w-0">
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <MapPin size={14} className="tw:shrink-0 tw:text-slate-400" />
                <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
                  Popular Near Me
                </span>
              </div>
              {/* Explains what the "top selling" ranking means and that it's
                  scoped to the km radius selected alongside. */}
              <div className="tw:mt-1 tw:flex tw:items-start tw:gap-1.5 tw:text-[11px] tw:text-slate-500">
                <Info size={12} className="tw:mt-0.5 tw:shrink-0" />
                <span>
                  {t("search.topProducts.subtitle", {
                    km: selectedRadiusKms ?? RADIUS_KMS[0]?.value,
                  })}
                </span>
              </div>
            </div>

            {/* Radius selector — a segmented control rather than loose badges,
                so it reads as one control with a chosen value on the wider
                screen. */}
            <div
              role="radiogroup"
              aria-label="Search radius"
              className="tw:mt-3 tw:flex tw:flex-wrap tw:gap-1 tw:rounded-lg tw:bg-slate-100 tw:p-1 tw:md:mt-0 tw:md:shrink-0 tw:md:flex-nowrap"
            >
              {RADIUS_KMS.map((radius) => {
                const isSelected = selectedRadiusKms === radius.value;
                return (
                  <button
                    key={radius.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleRadiusKmsChange(radius)}
                    className={`tw:cursor-pointer tw:rounded-md tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:whitespace-nowrap tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[color-mix(in_srgb,var(--primary)_45%,transparent)] ${
                      isSelected
                        ? "tw:bg-white tw:text-slate-900 tw:shadow-sm"
                        : "tw:text-slate-500 tw:hover:text-slate-800"
                    }`}
                  >
                    {radius.label}
                  </button>
                );
              })}
            </div>
          </div>
        </AppCard>
      )}

      {isBrandView ? (
        <Brands onView={handleBrandView} />
      ) : isCategoryView ? (
        <Categories onView={handleCategoryView} />
      ) : (
        <>
          {!isUnbrand && (
            <FacetFilter
              // Remount when the search term clears so the facet filter's
              // selected brand/menu/category chips reset for the next search.
              key={searchParams.get("search") ? "facet-active" : "facet-empty"}
              search={searchParams.get("search") || ""}
              selected={facetSelection}
              callback={handleFacetApply}
            />
          )}
          <FormProvider {...methods}>
            {!isUnbrand && !isTheme2 && !searchedViaAI && (
              <AppliedFilters callback={handleFilterChange} />
            )}
          </FormProvider>

          {/* AI Search Indicator (shows only when last AI result has images) */}
          {searchedViaAI &&
            lastAiPayload?.images &&
            lastAiPayload.images.length > 0 && (
              <SearchedViaAI
                images={lastAiPayload.images}
                onPreview={(images) =>
                  setImgPreviewModal({ show: true, images })
                }
                showCreateProduct={items.length > 0}
                onCreateProduct={openAddProductFromAi}
              />
            )}

          {/* Skipped entirely when the summary moved into the sticky block —
              the sort/view controls beside it are theme-2-hidden anyway, so the
              row would only pay its bottom margin as an empty band. */}
          {!summaryInSticky && (
            <div className="tw:flex tw:justify-between tw:items-center tw:gap-2 tw:mb-2">
              {paginationSummaryRow}
              {activeTab !== "top" && !isUnbrand && !isTheme2 && (
                <div className="tw:flex tw:gap-2 tw:items-center tw:shrink-0">
                  <ViewToggle
                    viewType={viewType}
                    callback={setViewType}
                    showOnlyIcon={isMobile}
                  />

                  <AppPopover
                    triggerContent={
                      <Button variant="outline" size="sm">
                        <ArrowUpDown
                          size={18}
                          className="tw:text-gray-500 tw:cursor-pointer"
                        />
                      </Button>
                    }
                    open={showSortPopover}
                    onOpenChange={(e) => {
                      setShowSortPopover(e);
                    }}
                  >
                    <div className="tw:flex tw:flex-col tw:gap-2">
                      {[
                        ...InventorySubscribeService.getSortOptions(),
                        ...EXTRA_SORT_TYPES,
                      ].map((opt) => (
                        <span
                          key={opt.value}
                          className="tw:cursor-pointer tw:text-sm"
                          onClick={() => handleSort(opt.value)}
                        >
                          <AppBadge
                            variant={
                              sortType === opt.value ? "primary" : "secondary"
                            }
                            className={
                              sortType === opt.value ? "" : "tw:opacity-70"
                            }
                          >
                            {opt.label}
                          </AppBadge>
                        </span>
                      ))}
                    </div>
                  </AppPopover>
                </div>
              )}
            </div>
          )}
          {/* Unbranded results have no view toggle to switch back with, and
              their rows carry too little to fill a table — so they stay on
              cards at every width. */}
          {viewType === "card" ||
          activeTab === "top" ||
          isMobile ||
          isUnbrand ? (
            <>
              {/* Top picks render as TopPickCards in a 3-up grid everywhere
                  except theme-2 mobile, so the placeholder has to mirror that
                  card instead of the row/list skeletons below. */}
              {isLoading && isTopPickGrid && (
                <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2 tw:lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <AppCard
                      key={i}
                      noPadding
                      noContentPadding
                      className="app-bleed-x tw:mb-0 tw:h-full tw:gap-0 tw:rounded-2xl tw:border-slate-200 tw:bg-white"
                      bodyClassName="tw:flex tw:h-full tw:flex-1 tw:flex-col tw:gap-3 tw:p-4"
                    >
                      <div className="tw:animate-pulse tw:flex tw:flex-col tw:gap-3">
                        {/* Identity */}
                        <div className="tw:flex tw:items-start tw:gap-3">
                          <div className="tw:mt-1 tw:h-4 tw:w-4 tw:shrink-0 tw:rounded tw:bg-gray-200"></div>
                          <div className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded-xl tw:bg-gray-200"></div>
                          <div className="tw:min-w-0 tw:flex-1">
                            <div className="tw:h-4 tw:w-full tw:rounded tw:bg-gray-200"></div>
                            <div className="tw:mt-1.5 tw:h-3 tw:w-1/2 tw:rounded tw:bg-gray-200"></div>
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                          {[1, 2].map((j) => (
                            <div key={j}>
                              <div className="tw:h-2.5 tw:w-2/3 tw:rounded tw:bg-gray-200"></div>
                              <div className="tw:mt-1.5 tw:h-4 tw:w-1/2 tw:rounded tw:bg-gray-200"></div>
                            </div>
                          ))}
                        </div>
                        {/* Actions */}
                        <div className="tw:grid tw:grid-cols-2 tw:gap-2">
                          <div className="tw:h-8 tw:rounded-md tw:bg-gray-200"></div>
                          <div className="tw:h-8 tw:rounded-md tw:bg-gray-200"></div>
                        </div>
                      </div>
                    </AppCard>
                  ))}
                </div>
              )}

              {isLoading && !isTopPickGrid && isTheme2 && !isUnbrand && (
                <div className="tw:space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="tw:flex tw:items-center tw:gap-3 tw:bg-white tw:p-3 tw:rounded-lg tw:border tw:border-gray-200"
                    >
                      <div className="tw:animate-pulse tw:flex tw:items-center tw:gap-3 tw:w-full">
                        <div className="tw:h-14 tw:w-14 tw:bg-gray-200 tw:rounded-xl tw:shrink-0"></div>
                        <div className="tw:flex-1">
                          <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2 tw:w-3/4"></div>
                          <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                        </div>
                        <div className="tw:flex tw:flex-col tw:items-end tw:gap-2">
                          <div className="tw:h-4 tw:w-12 tw:bg-gray-200 tw:rounded"></div>
                          <div className="tw:h-8 tw:w-8 tw:bg-gray-200 tw:rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLoading && !isTopPickGrid && (!isTheme2 || isUnbrand) && (
                <div className={cardGridClass}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div
                      key={i}
                      className="tw:bg-white tw:p-4 tw:rounded-lg tw:border tw:border-gray-200"
                    >
                      <div className="tw:animate-pulse">
                        <div className="tw:flex tw:items-start tw:mb-4">
                          <div className="tw:w-16 tw:h-16 tw:bg-gray-200 tw:rounded tw:mr-4"></div>
                          <div className="tw:flex-1">
                            <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                            <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:mb-2"></div>
                            <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                          </div>
                        </div>
                        <div className="tw:space-y-3">
                          {[1, 2, 3].map((j) => (
                            <div
                              key={j}
                              className="tw:flex tw:justify-between tw:items-center"
                            >
                              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/4"></div>
                              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
                            </div>
                          ))}
                        </div>
                        <div className="tw:mt-4 tw:h-8 tw:bg-gray-200 tw:rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading &&
                items.length === 0 &&
                (searchedViaAI ? (
                  <NoData>
                    <div className="tw:text-center tw:py-8 tw:px-4">
                      <div className="tw:mb-4 tw:inline-flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:bg-gradient-to-br tw:from-purple-100 tw:to-indigo-100 tw:rounded-full tw:shadow-md">
                        <Sparkles
                          size={28}
                          className="tw:text-purple-600"
                          strokeWidth={2}
                        />
                      </div>
                      <div className="tw:mb-2 tw:text-base tw:font-semibold tw:text-gray-900">
                        {t("search.noResultsFromAi", {
                          defaultValue: "No matching products found",
                        })}
                      </div>
                      <div className="tw:mb-6 tw:text-sm tw:text-gray-600 tw:max-w-md tw:mx-auto">
                        {t("search.createProductSuggestion", {
                          defaultValue:
                            "We couldn't find products matching the AI-extracted data. You can create a new product using the information we gathered.",
                        })}
                      </div>
                      <div className="tw:flex tw:justify-center">
                        <AppButton
                          onClick={openAddProductFromAi}
                          color="primary"
                          size="default"
                        >
                          <Sparkles size={16} className="tw:mr-2" />
                          {t("search.createNewProduct", {
                            defaultValue: "Create New Product",
                          })}
                        </AppButton>
                      </div>
                    </div>
                  </NoData>
                ) : (
                  <NoData />
                ))}

              {activeTab === "top" ? (
                // The full-bleed row card only earns its width on a phone; on a
                // desktop it stretches one SKU across the whole page. There the
                // "Popular near me" card grid is the right shape, on theme-2 too.
                isTheme2 && isMobile ? (
                  <div className="tw:space-y-0">
                    {items.map((item, index) => (
                      <div key={item._id || index} className="app-bleed-x">
                        <MobileItemTheme2
                          data={item}
                          index={index}
                          callback={handleItemCallback}
                          showCheckbox={true}
                          rank={index + 1}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2 tw:lg:grid-cols-3">
                    {items.map((item, index) => (
                      <TopPickCard
                        key={item._id || index}
                        data={item}
                        index={index}
                        callback={handleItemCallback}
                        showCheckbox={true}
                      />
                    ))}
                  </div>
                )
              ) : isTheme2 && !isUnbrand ? (
                <div className="tw:space-y-0">
                  {items.map((item, index) => (
                    <div key={index} className="app-bleed-x">
                      <MobileItemTheme2
                        data={item}
                        index={index}
                        callback={handleItemCallback}
                        showCheckbox={true}
                        rank={activeTab === "top" ? index + 1 : undefined}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={cardGridClass}>
                  {items.map((item, index) => (
                    <MobileView
                      key={index}
                      data={item}
                      index={index}
                      callback={handleItemCallback}
                      showCheckbox={true}
                      rank={activeTab === "top" ? index + 1 : undefined}
                    />
                  ))}
                </div>
              )}
              {!isLoading && hasMore && (
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={isLoadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              )}
            </>
          ) : viewType === "list" ? (
            <DesktopView
              data={items}
              callback={handleItemCallback}
              onSort={handleTableSort}
              sortKey={sortRef.current?.key}
              sortValue={sortRef.current?.value || "asc"}
              loading={isLoading}
              showCheckbox={true}
              showLoadMore={hasMore && !isLoading}
              loadingMore={isLoadingMore}
              loadMore={loadMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={items.length}
            />
          ) : null}
        </>
      )}

      {variantModal.show && (
        <VariantModal
          show={variantModal.show}
          callback={handleModalCallback}
          dealId={variantModal.data?._id || ""}
        />
      )}

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={handleImgPreviewModalCallback}
        images={imgPreviewModal.images}
      />

      <AiProductInfoModal
        show={showAiModal}
        mode="search"
        callback={handleAiModalCallback}
      />

      <AddProductModal
        show={addProductModal.show}
        data={addProductModal.data}
        images={addProductModal.images}
        callback={handleAddProductModalCallback}
        title="Create New Product"
      />

      {/* Barcode Scan FAB. Hidden in theme-2, where scanning is reached from
          the search-mode tiles (side pane / Discover) instead, and the floating
          button would otherwise collide with the cart bar and the tab bar. */}
      <button
        type="button"
        aria-label="Scan barcode"
        onClick={openBarcodeScan}
        className={`theme-2-hide tw:fixed tw:right-4 tw:z-40 tw:flex tw:items-center tw:gap-2 tw:bg-slate-900 tw:text-white tw:rounded-full tw:shadow-md tw:px-4 tw:py-3 tw:transition-shadow hover:tw:shadow-xl focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-slate-900 focus-visible:tw:ring-offset-2 ${
          isMobile ? "tw:bottom-16" : "tw:bottom-20"
        } ${selectedProducts.size > 0 ? "tw:mb-12" : ""}`}
      >
        <ScanBarcode size={20} />
        <span className="tw:text-sm tw:font-medium">Scan</span>
      </button>

      {/* AI Search FAB */}
      {/* <div
        className={`tw:fixed tw:right-4 tw:z-50 tw:cursor-pointer tw:transition-all tw:duration-300 tw:hover:scale-110 ${
          isMobile ? "tw:bottom-32" : "tw:bottom-20"
        }`}
        onClick={() => setShowAiModal(true)}
      >
        <div className="tw:rounded-full tw:flex tw:items-center tw:justify-center">
          <span className="animate__animated animate__flip animate__slower animate__infinite">
            <ImgRender src="ai/sk-ai.png" className="tw:h-12" />
          </span>
        </div>
      </div> */}

      {/* BusyLoader removed - per-item loading is shown on buttons */}

      {/* Sticky Subscribe Selected Button */}
      {selectedProducts.size > 0 && (
        <>
          <div className="tw:h-20"></div> {/* Spacer to prevent overlap */}
          <div className="tw:fixed tw:bottom-16 tw:md:bottom-4 tw:left-1/2 tw:transform tw:-translate-x-1/2 tw:z-50">
            <AppButton
              onClick={handleSubscribeSelected}
              isLoading={isSubscribingSelected}
              className="tw:shadow-lg tw:rounded-full tw:px-6 tw:py-3"
              color="primary"
            >
              {t("search.subscribeSelected", {
                count: selectedProducts.size,
                defaultValue: `Subscribe ${selectedProducts.size} Selected`,
              })}
            </AppButton>
          </div>
        </>
      )}

      <IntroModal
        show={introModal.show}
        callback={handleIntroModalCallback}
        feature="create-catalog"
      />

      {/* Mobile spacer so scan FAB no cover last product card */}
      <div className="tw:h-24" />
    </div>
  );
};

export default SearchDiscovery;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Catalog Subscription"),
    },
  ];
}
