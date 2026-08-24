import { produce } from "immer";
import { Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import BulkUploadModal from "~/routes/configs/rsp/modals/bulk-upload/BulkUploadModal";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { InlinePriceResult } from "~/shared/catalog/components/inline-price-edit/InlinePriceEdit";
import PriceConfigModal, {
  type PriceConfigGroup,
} from "~/shared/catalog/modals/price-config/PriceConfigModal";
import PriceSlabConfigModal from "~/shared/catalog/modals/price-slab-config/PriceSlabConfigModal";
import SortPopover, {
  fromHeaderSort,
  type SortValue,
} from "~/components/feature/utility/sort/SortPopover";
import OnlinePriceOnAppToggle from "~/shared/configs/components/online-price-on-app/OnlinePriceOnAppToggle";
import PricingSidePane from "~/shared/inventory/components/pricing-side-pane/PricingSidePane";
import type { PricingFilterKey } from "~/shared/inventory/components/pricing-side-pane/helper";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
// import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type {
  BreadcrumbItem,
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import ItemDetailModal from "../modals/ItemDetailModal";
import BulkPriceModal from "../modals/bulk-price/BulkPriceModal";
import B2BPriceTools, { ALL_GROUPS } from "./components/B2BPriceTools";
import CategoryChips from "./components/CategoryChips";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MarginSummaryCard from "./components/MarginSummaryCard";
import MobileView from "./components/MobileView";
import PricingFilterChips, {
  type PricingFilterChipKey,
} from "./components/PricingFilterChips";
import PriceTabs from "~/shared/configs/components/price-tabs/PriceTabs";
import PricingChannelCards from "~/shared/configs/components/pricing-channel-cards/PricingChannelCards";
import PricingSummaryCards from "./components/PricingSummaryCards";
import RspAppliedFilter from "./components/RspAppliedFilter";
import type {
  FilterFormFields,
  PriceGroupColumn,
  PriceSummary,
} from "./helper";
import {
  applyRowDecor,
  defaultBreadcrumbs,
  defaultPagination,
  getCount,
  getData,
  getPriceComparisonSummary,
  getPriceGroups,
  getSummary,
  prepareFilters,
} from "./helper";
import {
  applyPriceSummary,
  computePricingStats,
  getOnlineVerdict,
  type PriceComparisonSummary,
} from "./insights";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.PRICING"]);
}

// Maps a table-header column key + direction to the Sort By popover's
// `globalSort` value, so clicking a column header drives the exact same
// sorting as the popover (and stays in sync with it).
const HEADER_SORT_TO_GLOBAL: Record<string, { asc: string; desc: string }> = {
  dealName: { asc: "name-asc", desc: "name-desc" },
  purchasePrice: { asc: "purchase-price-asc", desc: "purchase-price-desc" },
  mrp: { asc: "mrp-asc", desc: "mrp-desc" },
  price: { asc: "price-asc", desc: "price-desc" },
  maxQty: { asc: "low-stock", desc: "high-stock" },
};

// Reverse of the above: derive the active column header + direction from the
// current `globalSort` value so the header chevrons highlight correctly.
const GLOBAL_TO_HEADER_SORT: Record<
  string,
  { key: string; value: "asc" | "desc" }
> = {
  "name-asc": { key: "dealName", value: "asc" },
  "name-desc": { key: "dealName", value: "desc" },
  "purchase-price-asc": { key: "purchasePrice", value: "asc" },
  "purchase-price-desc": { key: "purchasePrice", value: "desc" },
  "mrp-asc": { key: "mrp", value: "asc" },
  "mrp-desc": { key: "mrp", value: "desc" },
  "price-asc": { key: "price", value: "asc" },
  "price-desc": { key: "price", value: "desc" },
  "low-stock": { key: "maxQty", value: "asc" },
  "high-stock": { key: "maxQty", value: "desc" },
};

const Rsp = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appToast = useAppToast();

  const isBuyer = AuthService.isBuyerUser() || AuthService.isSkBuyer();

  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const [searchParams, setSearchParams] = useSearchParams();
  const rawType = searchParams.get("type");
  // The pricing-gap chips ride on `type` alongside the channel — both narrow
  // the whole catalog, and neither is a channel of its own, so they resolve
  // back to the B2C sheet they filter.
  const isLowMarginType = rawType === "lowMargin";
  const isUnpricedType = rawType === "unpriced";
  const type = (isLowMarginType || isUnpricedType ? "customer" : rawType) as
    | "network"
    | "customer";

  const effectiveType = type || "customer";

  const formMethods = useForm<FilterFormFields>({
    defaultValues: {
      dateRange: [],
      status: "",
      search: "",
      alpha: "",
      menu: [] as any[],
      category: [] as any[],
      brand: [] as any[],
      priceMode: "all",
      type: effectiveType,
      velocity: "All",
      stockStatus: "All",
      withoutStock: false,
      onlyOffers: false,
      keys: [] as string[],
      isFixedPrice: false,
      isPriceSlab: false,
      globalSort: "name",
      pricingFilter: "all" as PricingFilterChipKey,
    },
  });

  const [breadcrumbs, setBreadcrumbs] =
    useState<BreadcrumbItem[]>(defaultBreadcrumbs);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [data, setData] = useState<any[]>([]);

  // Catalogue-wide margin summary (price-comparison API) behind the summary
  // cards — independent of the list filters, so it is fetched once per view.
  const [priceSummary, setPriceSummary] =
    useState<PriceComparisonSummary | null>(null);
  const [view, setView] = useState<ViewToggleType>("list");

  // Stat-strip numbers for the filtered slice — refreshed alongside the list.
  const [summary, setSummary] = useState<PriceSummary | null>(null);

  // Buyer groups configured by this franchise — one price column per group on
  // the B2B sheet. Empty on B2C, where a single price covers everyone.
  const [priceGroups, setPriceGroups] = useState<PriceGroupColumn[]>([]);

  // Read inside the inline-save handler, which stays stable across renders —
  // a new group row needs its name and the state value would be stale there.
  const priceGroupsRef = useRef<PriceGroupColumn[]>([]);
  priceGroupsRef.current = priceGroups;

  // Buyer group the B2B sheet is narrowed to. Every group price already comes
  // down with the deal, so this only picks which group columns are drawn.
  const [groupFilter, setGroupFilter] = useState<string>(ALL_GROUPS);

  const visibleGroups = useMemo(
    () =>
      groupFilter === ALL_GROUPS
        ? priceGroups
        : priceGroups.filter((group) => group.id === groupFilter),
    [priceGroups, groupFilter],
  );

  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);

  // Mobile quick-chip: "above" filters the loaded page client-side to items
  // priced above the cheapest online listing; category chips filter serverside.
  const [quickChip, setQuickChip] = useState<"all" | "above">("all");

  // Which pricing gap the theme-2 side pane is narrowing the list to.
  const [paneFilter, setPaneFilter] = useState<PricingFilterKey>("all");

  // Categories seen across loaded pages — feeds the mobile chip row and
  // survives a category filter narrowing the next response.
  const categoriesRef = useRef<Map<string, string>>(new Map());

  // Amazon/Flipkart benchmark prices are only available for electronics
  // franchises; the toggle lets them declutter the table when not needed.
  const isElectronicsFranchise = AuthService.isElectronicsFranchise();
  const [showOnlinePrices, setShowOnlinePrices] = useState(
    isElectronicsFranchise,
  );

  const [itemDetailModal, setItemDetailModal] = useState({
    show: false,
    data: null,
  });
  const [rspManageModal, setRspManageModal] = useState<{
    show: boolean;
    type: "network" | "customer";
    dealId: string | null;
    // Set when a buyer-group price chip was clicked — the modal then edits
    // that group's price instead of the deal-level one.
    group?: PriceConfigGroup;
  }>({
    show: false,
    type: effectiveType,
    dealId: null,
  });

  // Rows picked for the bulk price setter. The full deal is kept (not just the
  // id) so the setter can preview against MRP/cost and the apply can run after
  // a filter change has dropped the row from `data`.
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [bulkModal, setBulkModal] = useState(false);

  const [bulkUploadModal, setBulkUploadModal] = useState<{
    show: boolean;
    products: any[];
  }>({
    show: false,
    products: [],
  });

  const [priceSlabModal, setPriceSlabModal] = useState<{
    show: boolean;
    data: any | null;
    editId?: string | null;
    targetDetails?: any[] | undefined;
    slabs?: any[] | undefined;
  }>({
    show: false,
    data: null,
    editId: null,
    targetDetails: undefined,
  });

  const paginationRef = useRef<PaginationState>({
    ...defaultPagination,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" } | undefined>(
    undefined,
  );

  // Everything in the URL — the list refetches whenever a filter changes.
  const filterParamsKey = useMemo(
    () => new URLSearchParams(searchParams).toString(),
    [searchParams],
  );

  useEffect(() => {
    const search = searchParams.get("search");
    const keys = searchParams.get("keys");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const brandId = searchParams.get("brandId");
    const brandName = searchParams.get("brandName");
    const companyName = searchParams.get("companyName");
    const status = searchParams.get("status");
    const velocity = searchParams.get("velocity");
    const stockStatus = searchParams.get("stockStatus");
    const alpha = searchParams.get("alpha");
    const withoutStock = searchParams.get("withoutStock");
    const onlyOffers = searchParams.get("onlyOffers");
    const menuId = searchParams.get("menuId");
    const menuName = searchParams.get("menuName");
    const isFixedPrice = searchParams.get("isFixedPrice");
    const isPriceSlab = searchParams.get("isPriceSlab");
    const globalSort = searchParams.get("globalSort");
    const pricingFilter = searchParams.get("pricingFilter");

    formMethods.setValue("search", search || "");

    if (globalSort) {
      formMethods.setValue("globalSort", globalSort);
    } else {
      formMethods.setValue(
        "globalSort",
        SellerCatalogService.getGlobalSortOptions()[0].value,
      );
    }

    if (categoryId && categoryName) {
      formMethods.setValue("category", [
        { label: categoryName, value: { id: categoryId, name: categoryName } },
      ]);
    } else {
      formMethods.setValue("category", []);
    }

    if (brandId && brandName) {
      formMethods.setValue("brand", [
        { label: brandName, value: { id: brandId, name: brandName } },
      ]);
    } else {
      formMethods.setValue("brand", []);
    }

    if (menuId && menuName) {
      formMethods.setValue("menu", [
        { label: menuName, value: { id: menuId, name: menuName } },
      ]);
    } else {
      formMethods.setValue("menu", []);
    }

    if (companyName) {
      formMethods.setValue("companyName", [
        { label: companyName, value: { id: companyName, name: companyName } },
      ]);
    } else {
      formMethods.setValue("companyName", []);
    }

    formMethods.setValue("status", status || "");
    formMethods.setValue("velocity", velocity || "All");
    formMethods.setValue("stockStatus", stockStatus || "All");
    formMethods.setValue("alpha", alpha || "");
    formMethods.setValue("withoutStock", withoutStock === "true");
    formMethods.setValue("onlyOffers", onlyOffers === "true");
    formMethods.setValue("isFixedPrice", isFixedPrice === "true");
    formMethods.setValue("isPriceSlab", isPriceSlab === "true");

    const validPricingFilter: PricingFilterChipKey =
      pricingFilter === "unpriced" ||
      pricingFilter === "low-margin" ||
      pricingFilter === "out-of-stock" ||
      pricingFilter === "new"
        ? pricingFilter
        : "all";
    // The pricing gaps (unpriced / low margin) are served per channel — the
    // endpoint judges them against `priceType` — so they carry over to the B2B
    // sheet. The stock/new chips are B2C-only and are dropped there.
    const carriesToB2B =
      validPricingFilter === "unpriced" || validPricingFilter === "low-margin";
    formMethods.setValue(
      "pricingFilter",
      effectiveType === "network" && !carriesToB2B ? "all" : validPricingFilter,
    );

    // If `keys` is provided in the URL (comma-separated), populate the form `keys` array
    const keysParam = searchParams.get("keys");
    const keysFromUrl = keysParam
      ? keysParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    if (keysFromUrl.length > 0) {
      formMethods.setValue("keys", keysFromUrl);
      // If there's no explicit `search` param, use the first keyword as the search value
      if (!search) {
        formMethods.setValue("search", keysFromUrl[0]);
      }
    } else {
      formMethods.setValue("keys", []);
    }

    formMethods.setValue("type", effectiveType);

    // `type=lowMargin` is a server-side filter — show it as the active
    // pricing-gap chip and pass it through to the API instead of filtering
    // only the loaded page client-side.
    if (isLowMarginType) {
      formMethods.setValue("pricingFilter", "low-margin");
      setPaneFilter("low-margin");
    } else if (isUnpricedType) {
      formMethods.setValue("pricingFilter", "unpriced");
      setPaneFilter("unpriced");
    } else {
      // The pane chips read their active state off the URL too, so a link into
      // a gap (or a reload on one) keeps the right chip lit.
      setPaneFilter(
        validPricingFilter === "unpriced" || validPricingFilter === "low-margin"
          ? validPricingFilter
          : "all",
      );
    }

    applyFilter();
  }, [filterParamsKey, formMethods, isLowMarginType, isUnpricedType]);

  useEffect(() => {
    if (effectiveType === "network") {
      setBreadcrumbs(
        produce((draft) => {
          draft[2].label = "B2B Selling Price";
        }),
      );
    } else {
      setBreadcrumbs(
        produce((draft) => {
          draft[2].label = "B2C Selling Price";
        }),
      );
    }
    // A B2C selection cannot carry over into the B2B sheet — different price.
    setSelectedItems([]);
    init();
  }, [type, isBuyer, t]);

  // Remember every category seen so the chip row keeps offering categories
  // even after one of them becomes the active (narrowing) filter.
  useEffect(() => {
    data.forEach((item) => {
      const id = item?.category?._id;
      const name = item?.category?.name;
      if (id && name && !categoriesRef.current.has(id)) {
        categoriesRef.current.set(id, name);
      }
    });
  }, [data]);

  const loadPriceSummary = useCallback(async () => {
    try {
      setPriceSummary(await getPriceComparisonSummary());
    } catch (error) {
      console.error("Error loading price summary:", error);
      setPriceSummary(null);
    }
  }, []);

  // Group price columns are a B2B-only concern.
  const loadPriceGroups = useCallback(async () => {
    if (effectiveType !== "network") {
      setPriceGroups([]);
      setGroupFilter(ALL_GROUPS);
      return;
    }
    try {
      const groups = await getPriceGroups();
      setPriceGroups(groups);
      // The filtered group can be gone after an edit deactivated or removed
      // it — fall back to the full sheet rather than an empty column block.
      setGroupFilter((current) =>
        current === ALL_GROUPS || groups.some((group) => group.id === current)
          ? current
          : ALL_GROUPS,
      );
    } catch (error) {
      console.error("Error loading price groups:", error);
      setPriceGroups([]);
    }
  }, [effectiveType]);

  // Stat strip for the current filtered slice. Kept separate from the list
  // fetch so a price/discount edit can re-read it without reloading the rows.
  const loadSummary = useCallback(async () => {
    try {
      const params = prepareFilters(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      setSummary(await getSummary(params, effectiveType));
    } catch (error) {
      console.error("Error loading price summary:", error);
      setSummary(null);
    }
  }, [effectiveType, formMethods]);

  // Every price/discount write changes what the cards report — pull both the
  // filtered stat strip and the catalogue-wide margin numbers again.
  const refreshSummary = useCallback(() => {
    loadSummary();
    loadPriceSummary();
  }, [loadSummary, loadPriceSummary]);

  const init = async () => {
    paginationRef.current = {
      ...defaultPagination,
    };
    applyFilter();
    loadPriceSummary();
    loadPriceGroups();
  };

  const applyFilter = useCallback(async () => {
    // Reset pagination for new filter
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoading(true);
    setData([]);

    try {
      const params = prepareFilters(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const response = await getData(params, effectiveType);
      setData(response || []);
      setHasMoreData(response.length >= paginationRef.current.rowsPerPage);

      // Stat strip reports on the same filtered slice — a failure here must not
      // take the list down with it.
      loadSummary();

      // Update pagination end number
      const countResponse = await getCount(params, effectiveType);
      paginationRef.current.totalRecords = countResponse;
    } catch (error) {
      console.error("Error applying filter:", error);
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [effectiveType, loadSummary]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }

    setLoadingMore(true);
    try {
      // Update pagination for next page
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };

      const params = prepareFilters(
        formMethods.getValues(),
        paginationRef.current,
        sortRef.current,
      );
      const response = await getData(params, effectiveType);

      setData((prev) => [...prev, ...(response || [])]);
      setHasMoreData(response.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, effectiveType]);

  const onGlobalSortChange = (value: string) => {
    formMethods.setValue("globalSort", value);
    sortRef.current = undefined;
    // Update params
    const newParams = new URLSearchParams(searchParams as any);
    newParams.set("globalSort", value);
    setSearchParams(newParams, { replace: true });
  };

  const handleSortSelect = (value: string) => {
    onGlobalSortChange(value);
    setSortPopoverOpen(false);
  };

  const handleFilterChange = useCallback(
    ({ formData }: { formData: any }) => {
      const params: any = {};
      if (formData.search) params.search = formData.search;
      if (formData.status && formData.status !== "")
        params.status = formData.status;
      if (formData.velocity && formData.velocity !== "All")
        params.velocity = formData.velocity;
      if (formData.stockStatus && formData.stockStatus !== "All")
        params.stockStatus = formData.stockStatus;
      if (formData.alpha) params.alpha = formData.alpha;
      if (formData.withoutStock) params.withoutStock = "true";
      if (formData.onlyOffers) params.onlyOffers = "true";
      if (formData.isFixedPrice) params.isFixedPrice = "true";
      if (formData.isPriceSlab) params.isPriceSlab = "true";

      if (
        formData.pricingFilter &&
        formData.pricingFilter !== "all" &&
        ["unpriced", "low-margin", "out-of-stock", "new"].includes(
          formData.pricingFilter,
        )
      ) {
        // Every chip rides in the URL as `pricingFilter`, so the channel keeps
        // its own `type` — the gaps are per channel (the endpoint judges them
        // against `priceType`), and losing the channel would pin them to B2C.
        params.pricingFilter = formData.pricingFilter;
      }

      if (formData.category && formData.category.length > 0) {
        params.categoryId = formData.category[0].value.id;
        params.categoryName = formData.category[0].label;
      }

      if (formData.brand && formData.brand.length > 0) {
        params.brandId = formData.brand[0].value.id;
        params.brandName = formData.brand[0].label;
      }

      if (formData.menu && formData.menu.length > 0) {
        params.menuId = formData.menu[0].value.id;
        params.menuName = formData.menu[0].label;
      }

      if (formData.companyName && formData.companyName.length > 0) {
        params.companyName = formData.companyName[0].label;
      }

      if (formData.type) {
        params.type = formData.type;
      }

      if (
        formData.keys &&
        Array.isArray(formData.keys) &&
        formData.keys.length
      ) {
        params.keys = formData.keys.join(",");
      }

      // Replace the current history entry instead of pushing a new one
      setSearchParams(params, { replace: true });
    },
    [setSearchParams, searchParams],
  );

  const handleItemCallback = (action: { action: string; data?: any }) => {
    // Opening the product is read-only, so it runs ahead of the write guard.
    if (action.action === "viewDeal" && action.data) {
      const url = `/dashboard/inventory/products/view/${
        action.data._id || action.data.id
      }/pricing`;
      if (!isMobile) {
        appNav.openInNewTab(url);
      } else {
        appNav.to(url);
      }
      return;
    }

    if (
      AuthService.isMasterLogin() &&
      !AuthService.isMasterLoginWithFullAccess()
    ) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    if (action.action === "view" && action.data) {
      setItemDetailModal({
        show: true,
        data: action.data,
      });
    }
    if (action.action === "edit" && action.data) {
      setRspManageModal({
        show: true,
        dealId: action.data._id,
        type: effectiveType,
      });
    }
    // Buyer-group price chip — same modal, scoped to that group's B2B price.
    if (action.action === "editGroupPrice" && action.data) {
      const group = (action.data as any)._group;
      const current = (action.data.networkGroupPrices || []).find(
        (item: any) => item.id === group?.id,
      );
      setRspManageModal({
        show: true,
        dealId: action.data._id,
        type: "network",
        group: {
          id: group?.id,
          name: group?.name,
          price: current?.price,
          discount: current?.discount,
          discountType: current?.discountType,
        },
      });
    }
    if (action.action === "editPriceSlab" && action.data) {
      const td = action.data
        ? [
            {
              label: action.data.name,
              value: {
                id: action.data._id,
                name: action.data.name,
                objId: action.data.id,
              },
            },
          ]
        : undefined;

      // derive slabs array from action.data; support different field names
      const rawSlabs = action.data?._priceSlab?.slab || [];
      const mappedSlabs = Array.isArray(rawSlabs)
        ? rawSlabs.map((s: any) => ({
            fromQty: s.min ?? 0,
            toQty: s.max ?? 0,
            discount: s.discount ?? 0,
          }))
        : [];

      let editId = null;
      if (action.data?.priceSlabType === "Deal") {
        editId = action.data?._priceSlab?.configId;
      }

      setPriceSlabModal({
        show: true,
        data: action.data,
        editId: editId,
        targetDetails: td,
        slabs: mappedSlabs,
      });
    }
    if (action.action === "sort" && action.data) {
      sortRef.current = action.data;
      applyFilter();
    }
  };

  // The inline price field owns its own write and error toast; the screen only
  // keeps the row in sync once a price actually landed. A fixed price is what
  // the field writes, so the row's discount type follows.
  const handlePriceResult = useCallback(
    (result: InlinePriceResult) => {
      if (result.action !== "saved") return;

      setData(
        produce((draft) => {
          const i = draft.findIndex(
            (item) => (item._id || item.id) === result.dealId,
          );
          if (i === -1) return;

          // A buyer-group price only touches that group's entry — the deal's
          // own B2B price is untouched.
          if (result.groupId) {
            const groups = draft[i].networkGroupPrices || [];
            const g = groups.findIndex(
              (group: any) => group.id === result.groupId,
            );
            const next = {
              price: result.price,
              discount: 0,
              discountType: "Fixed",
            };
            if (g !== -1) {
              groups[g] = { ...groups[g], ...next };
            } else {
              groups.push({
                id: result.groupId,
                name:
                  priceGroupsRef.current.find((pg) => pg.id === result.groupId)
                    ?.name || "",
                type: "",
                sellersCount: 0,
                isActive: true,
                ...next,
              });
            }
            draft[i].networkGroupPrices = groups;
            return;
          }

          if (result.type === "b2b") {
            draft[i].b2bPrice = result.price;
            draft[i].b2bDiscount = 0;
            draft[i].b2bDiscountType = "Fixed";
          } else {
            draft[i].b2cPrice = result.price;
            draft[i].b2cDiscount = 0;
            draft[i].b2cDiscountType = "Fixed";
          }
          draft[i].isFixedPrice = true;
          draft[i].fixedPrice = result.price;
          // Margin label, tone and peer range are derived off the price and
          // discount just written — re-derive them or the cell keeps printing
          // what the last fetch computed.
          applyRowDecor(draft[i], effectiveType);
        }),
      );

      // The row is patched locally, so nothing else re-reads the stats.
      refreshSummary();
    },
    [refreshSummary, effectiveType],
  );

  const handleModalCallback = (action: { action: string; data?: any }) => {
    if (action.action === "close") {
      setItemDetailModal({
        show: false,
        data: null,
      });
    }
  };

  const handleRspManageModalCallback = (action: {
    action: string;
    data?: any;
  }) => {
    setRspManageModal({
      show: false,
      dealId: null,
      type: effectiveType,
      group: undefined,
    });
    if (action.action === "update" || action.action === "create") {
      if (action.action === "create") {
        // The refetch carries the filtered stat strip with it; only the
        // catalogue-wide margin numbers need pulling separately.
        applyFilter();
        loadPriceSummary();
      }
      if (action.action === "update") {
        setData(
          produce((draft) => {
            const i = draft.findIndex(
              (item) => item._id === action.data.dealId,
            );
            if (i !== -1) {
              // A group price only touches that group's column.
              if (action.data.groupId) {
                const groups = draft[i].networkGroupPrices || [];
                const g = groups.findIndex(
                  (group: any) => group.id === action.data.groupId,
                );
                const next = {
                  price: action.data.price,
                  discount: action.data.discount || 0,
                  discountType: action.data.isFixedPrice ? "Fixed" : "Normal",
                };
                if (g !== -1) {
                  groups[g] = { ...groups[g], ...next };
                } else {
                  groups.push({
                    id: action.data.groupId,
                    name: rspManageModal.group?.name || "",
                    type: "",
                    sellersCount: 0,
                    isActive: true,
                    ...next,
                  } as any);
                }
                draft[i].networkGroupPrices = groups;
                return;
              }
              /* The modal hands back the discount as typed, so it can arrive
                 as a string — the margin label and tone read it as a number. */
              const discount = Number(action.data.discount) || 0;

              if (action.data.type === "network") {
                draft[i].b2bPrice = action.data.price;
                draft[i].b2bDiscount = discount;
                if (typeof action.data.isFixedPrice !== "undefined") {
                  draft[i].b2bDiscountType = action.data.isFixedPrice
                    ? "Fixed"
                    : "Normal";
                  draft[i].isFixedPrice = action.data.isFixedPrice;
                  draft[i].fixedPrice = action.data.fixedPrice || 0;
                }
              } else {
                draft[i].b2cPrice = action.data.price;
                draft[i].b2cDiscount = discount;
                if (typeof action.data.isFixedPrice !== "undefined") {
                  draft[i].b2cDiscountType = action.data.isFixedPrice
                    ? "Fixed"
                    : "Normal";
                  draft[i].isFixedPrice = action.data.isFixedPrice;
                  draft[i].fixedPrice = action.data.fixedPrice || 0;
                }
              }

              /* Discount type, margin label/tone and the peer bar are all
                 derived — re-derive them off the row that was just written so
                 the cell reads right without a reload. */
              applyRowDecor(draft[i], action.data.type);
            }
          }),
        );
        // Only the row was patched — re-read the summary so the cards match
        // the new price/discount.
        refreshSummary();
      }
    }
  };

  const handleBulkUploadModalCallback = (action: {
    action: string;
    data?: any;
  }) => {
    setBulkUploadModal({
      show: false,
      products: [],
    });
    applyFilter();
    loadPriceSummary();
  };

  const handlePriceSlabModalCallback = async (action: {
    action: string;
    data?: any;
  }) => {
    if (action.action === "save") {
      // Close the modal and highlight the updated deal row instead of creating server-side config here
      setPriceSlabModal({
        show: false,
        data: null,
        editId: null,
        targetDetails: undefined,
      });

      // Slab discounts feed the same margin numbers as any other discount.
      refreshSummary();

      // If we have a reference deal from the modal opener, animate that row
      const ref = priceSlabModal.data;
      if (ref) {
        const matchId = ref._id || ref.id;
        if (matchId) {
          // set animation flag on matching item
          setData(
            produce((draft) => {
              const idx = draft.findIndex(
                (item) => item._id === matchId || item.id === matchId,
              );
              if (idx !== -1) {
                const newSlabsRaw = (action.data?.slabs ?? []).map(
                  (s: any) => ({
                    min: s.fromQty,
                    max: s.toQty,
                    discount: s.discount,
                  }),
                );

                draft[idx] = {
                  ...draft[idx],
                  _priceSlab: {
                    ...(draft[idx]._priceSlab || {}),
                    slab: Array.isArray(newSlabsRaw) ? newSlabsRaw : [],
                    isAvailable: action.data?.status === "active",
                  },
                  priceSlabUpdatedAnimate: true,
                };
              }
            }),
          );

          setTimeout(() => {
            setData(
              produce((draft) => {
                const idx = draft.findIndex(
                  (item) => item._id === matchId || item.id === matchId,
                );
                if (idx !== -1) {
                  draft[idx] = {
                    ...draft[idx],
                    priceSlabUpdatedAnimate: false,
                  };
                }
              }),
            );
          }, 3000);
        }
      }
    } else {
      setPriceSlabModal({
        show: false,
        data: null,
        editId: null,
        targetDetails: undefined,
      });
    }
  };

  // Column-header sort: translate the clicked column + direction into the
  // popover's `globalSort` value so both sort mechanisms share one source.
  const handleSort = (sort: SortProps) => {
    const mapping = HEADER_SORT_TO_GLOBAL[sort.key];
    if (!mapping) return;
    onGlobalSortChange(sort.value === "desc" ? mapping.desc : mapping.asc);
  };

  const activeHeaderSort =
    GLOBAL_TO_HEADER_SORT[searchParams.get("globalSort") || ""];

  // Watched (not read once) so the mobile Sort By popover ticks the option
  // that is actually active, including one set from a column header.
  const activeGlobalSort = formMethods.watch("globalSort") || "";

  // Mobile sort — the same sortable columns the desktop sheet carries, so both
  // views sort on the same fields through `HEADER_SORT_TO_GLOBAL`.
  const mobileSortOptions = useMemo(
    () => [
      { key: "dealName", label: t("product") },
      { key: "purchasePrice", label: t("purchasePrice") },
      { key: "mrp", label: t("mrp") },
      {
        key: "price",
        label: effectiveType === "network" ? t("b2bPrice") : t("b2cPrice"),
      },
      { key: "maxQty", label: t("stock") },
    ],
    [effectiveType, t],
  );

  const mobileSortValue = activeHeaderSort
    ? fromHeaderSort(activeHeaderSort)
    : undefined;

  // Hands `handleSort` the exact payload a column-header click sends
  // ({ key, value: "asc" | "desc" }), so mobile and desktop build the same
  // `globalSort` and therefore the same API sort object.
  const handleMobileSort = (sort: SortValue) =>
    handleSort({ key: sort.key, value: sort.value === 1 ? "asc" : "desc" });

  // Parked along with the Bulk Upload button in the quick-links row.
  // const handleBulkUpload = () => {
  //   if (
  //     AuthService.isMasterLogin() &&
  //     !AuthService.isMasterLoginWithFullAccess()
  //   ) {
  //     appToast.show({
  //       msg: t("youAreNotAuthorizedToDoThisAction"),
  //       color: "danger",
  //     });
  //     return;
  //   }
  //   appNav.to("/dashboard/bulk-upload/pricing");
  // };

  const handleGlobalDiscount = () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }

    const hasFixedPrice = data.some((p) => {
      return p._discountType === "Fixed";
    });

    const withoutFixedPrice = data.filter((p) => {
      return p._discountType !== "Fixed";
    });

    if (!withoutFixedPrice.length && hasFixedPrice) {
      appToast.show({
        msg: "Fixed-price products are not allowed to be updated globally.",
        color: "warning",
        duration: 5000,
      });
      return;
    }

    if (hasFixedPrice) {
      appToast.show({
        msg: "Fixed-price products are not allowed to be updated globally. Remaining products will be updated.",
        color: "warning",
        duration: 5000,
      });
    }

    setBulkUploadModal({
      show: true,
      products: withoutFixedPrice,
    });
  };

  // ——— Bulk price setter ————————————————————————————————————————————

  // Ids drive the checkbox state, so previously picked rows stay checked when
  // the list reloads (load more, filter change, re-fetch after an apply).
  const selectedIds = useMemo(
    () => new Set<string>(selectedItems.map((item) => item._id || item.id)),
    [selectedItems],
  );

  const handleSelectChange = useCallback((item: any, checked: boolean) => {
    const id = item._id || item.id;
    setSelectedItems((prev) => {
      if (!checked) {
        return prev.filter((row) => (row._id || row.id) !== id);
      }
      if (prev.some((row) => (row._id || row.id) === id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedItems([]), []);

  // The bar is always available, so the "nothing picked yet" case is answered
  // with a toast instead of a disabled button.
  const handleBulkSetterOpen = () => {
    if (!selectedItems.length) {
      appToast.show({
        msg: "Select at least one product to set the price on.",
        color: "warning",
      });
      return;
    }
    setBulkModal(true);
  };

  // The modal writes the prices itself — this only reacts to the outcome.
  const handleBulkCallback = ({
    action,
  }: {
    action: "applied" | "clear" | "close";
  }) => {
    if (action === "close") {
      setBulkModal(false);
      return;
    }
    if (action === "clear") {
      clearSelection();
      return;
    }
    if (action === "applied") {
      setBulkModal(false);
      clearSelection();
      // Re-read so the rows below show the prices that were just written.
      applyFilter();
      loadPriceSummary();
    }
  };

  // ——— Design-driven derived state ————————————————————————————————

  const stats = useMemo(
    () =>
      applyPriceSummary(
        computePricingStats(
          data,
          paginationRef.current.totalRecords,
          effectiveType,
        ),
        priceSummary,
      ),
    [data, effectiveType, loading, priceSummary],
  );

  // "Above online" is the one chip with no API filter behind it, so it still
  // narrows the loaded page client-side. The pricing gaps do not: unpriced
  // (`type=defaultToMrp`) and low margin (`type=lowMargin`) are server filters,
  // and re-deriving them here would drop rows the API deliberately returned —
  // an unpriced deal comes back priced at MRP.
  const displayData = useMemo(
    () =>
      quickChip === "above"
        ? data.filter(
            (item) => getOnlineVerdict(item, effectiveType)?.type === "high",
          )
        : data,
    [data, quickChip, effectiveType],
  );

  // Header checkbox — covers exactly the rows currently listed.
  const handleSelectAllChange = useCallback(
    (checked: boolean) => {
      if (!checked) {
        const listedIds = new Set(
          displayData.map((item) => item._id || item.id),
        );
        setSelectedItems((prev) =>
          prev.filter((row) => !listedIds.has(row._id || row.id)),
        );
        return;
      }
      setSelectedItems((prev) => {
        const next = [...prev];
        displayData.forEach((item) => {
          const id = item._id || item.id;
          if (!next.some((row) => (row._id || row.id) === id)) {
            next.push(item);
          }
        });
        return next;
      });
    },
    [displayData],
  );

  const chipCategories = useMemo(
    () =>
      Array.from(categoriesRef.current, ([id, name]) => ({ id, name })).slice(
        0,
        8,
      ),
    [data],
  );

  const activeChip =
    quickChip === "above" ? "above" : searchParams.get("categoryId") || "all";

  const handleChipSelect = (key: string) => {
    if (key === "above") {
      setQuickChip("above");
      return;
    }
    setQuickChip("all");
    if (key === "all") {
      formMethods.setValue("category", []);
    } else {
      const name = categoriesRef.current.get(key) || "";
      formMethods.setValue("category", [
        { label: name, value: { id: key, name } },
      ]);
    }
    handleFilterChange({ formData: formMethods.getValues() });
  };

  // Mobile pricing quick-filter strip — the chip writes `pricingFilter` into
  // the URL, which the effect above reads back into the form on every change.
  const activePricingFilter = formMethods.watch("pricingFilter") || "all";

  const handlePricingFilterSelect = (key: PricingFilterChipKey) => {
    if (key === activePricingFilter) return;
    formMethods.setValue("pricingFilter", key);
    handleFilterChange({ formData: formMethods.getValues() });
  };

  // The tabs and cards navigate themselves; the screen only clears the price filter so
  // the new channel opens on the full list.
  const handleChannelChange = () => formMethods.setValue("priceMode", "all");

  const summaryCards = (
    <PricingSummaryCards stats={stats} summary={summary} type={effectiveType} />
  );

  return (
    <>
      <AppHeader
        title="Manage Price"
        showAudioNote={true}
        audioNoteTitle="Manage Price"
        audioFeature="managePrice"
        sectionKey="catalog"
        activeTab="pricing"
        mobileLead="menu"
      />
      {/* `has-footer` reserves room for the fixed bulk bar. */}
      <div className="app-page page-padding page-bg has-footer">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        {/* <SectionTabs sectionKey="catalog" activeTab="pricing" noShadow sticky /> */}

        <div className="section-layout">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="pricing"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              <AppPaneMain className="tw:lg:col-span-12">
                {/* Dropped wholesale in theme-2 (both children are hidden
                    there anyway) so the empty wrapper stops contributing a
                    stack gap above the command bar. */}
                <div className="hide-in-theme-2">
                  <AppBreadcrumbs data={breadcrumbs} />
                  <PageDescription description="managePrice" />
                </div>

                {/* Pricing command bar — one edge-to-edge white block holding
                    the channel cards (B2C / B2B) above the underline tab
                    row. */}
                <div className="pricing-command-bar tw:-mt-6 tw:md:mt-0">
                  <div className="tw:px-4 tw:md:pt-3 tw:py-2 tw:md:py-0">
                    <PricingChannelCards
                      activeKey={effectiveType}
                      callback={handleChannelChange}
                      // Compact tab row on mobile; full cards from md up.
                      variant={isMobile ? "tab" : "card"}
                      // The underline tab row below is desktop-only, so on
                      // mobile the cards carry Trend watch as one more pill.
                      viewTab="sheet"
                    />
                  </div>

                  {isMobile ? (
                    <>
                      <div className="tw:px-4 tw:border-t tw:border-gray-200 tw:py-2">
                        <FormProvider {...formMethods}>
                          <Filter callback={handleFilterChange} />
                        </FormProvider>

                        {/* B2C only — the B2B sheet already carries a filter
                            row of its own (groups), and two strips of chips
                            stacked on a phone is one too many.
                            The strip carries its own top margin — the row
                            owns the spacing now, so cancel it. */}
                        {effectiveType !== "network" && (
                          <PricingFilterChips
                            active={activePricingFilter}
                            onSelect={handlePricingFilterSelect}
                            className="tw:mt-2! tw:md:hidden"
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <></>
                  )}

                  <PriceTabs
                    type={effectiveType}
                    activeTab="sheet"
                    // Scheme / Price Slab live in the B2B row below, next to
                    // the group filter they belong with.
                    hiddenKeys={["b2bScheme", "priceSlab"]}
                    className="tw:mt-1 tw:px-4 tw:hidden tw:md:block"
                  />

                  {/* B2B row — the two B2B-only screens plus the buyer-group
                      filter. Mobile has no tab row above it, so this is also
                      the way through to Scheme and Price Slab there. */}
                  {effectiveType === "network" && (
                    <B2BPriceTools
                      groups={priceGroups}
                      activeGroupId={groupFilter}
                      onGroupChange={setGroupFilter}
                      onGroupsChange={loadPriceGroups}
                      className="tw:border-t tw:border-gray-200 tw:px-4 tw:py-2"
                    />
                  )}
                </div>

                {/* Surfaced here (rather than only in Advanced Settings)
                    because this is where online prices are being looked at:
                    the sheet's online-price columns are a local view, this
                    states what customers see on the CLUB APP. */}
                {showOnlinePrices && <OnlinePriceOnAppToggle />}

                {/* Quick links + bulk actions — parked for now.
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                  <div className="tw:ml-auto tw:hidden tw:items-center tw:gap-2 tw:md:flex">
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={() => appNav.to("/configs/rsp/history")}
                    >
                      <Clock size={14} />
                      History
                    </AppButton>
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={handleBulkUpload}
                    >
                      <Upload size={14} />
                      Bulk Upload
                    </AppButton>
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={handleGlobalDiscount}
                    >
                      <Percent size={14} />
                      Global Discount
                    </AppButton>
                  </div>
                </div>
                */}

                <div className="tw:hidden tw:md:block">{summaryCards}</div>

                {/* Filter block — its own compact card, separate from the
                    sheet below so the table reads as one uninterrupted
                    surface. */}
                {/* `noPadding` (not `noContentPadding`) — the card's own
                    vertical padding is what was adding the top/bottom air. */}
                {!isMobile && (
                  <AppCard noPadding className="tw:mb-2">
                    <div className="tw:p-2">
                      <FormProvider {...formMethods}>
                        <Filter callback={handleFilterChange} />

                        <RspAppliedFilter onFilterChange={handleFilterChange} />

                        {/* Online-price toggle, card/list view toggle and Sort By
                          are parked — the sheet now shows online prices by
                          default and sorts from the column headers.
                      <div className="tw:mt-2 tw:hidden tw:flex-wrap tw:items-center tw:justify-end tw:gap-2 tw:md:flex">
                        <AppCheckbox
                          label="Show online prices"
                          size="xs"
                          value={showOnlinePrices}
                          onChange={setShowOnlinePrices}
                          className="tw:flex tw:items-center tw:px-2 tw:py-1 tw:border tw:border-gray-200 tw:rounded-md tw:text-gray-600 tw:whitespace-nowrap"
                        />
                        <ViewToggle viewType={view} callback={setView} />
                        <div>
                          <SortBy
                            globalSortValue={
                              formMethods.getValues().globalSort || ""
                            }
                            open={sortPopoverOpen}
                            onOpenChange={setSortPopoverOpen}
                            onSelect={handleSortSelect}
                          />
                        </div>
                      </div>
                      */}
                      </FormProvider>
                    </div>
                  </AppCard>
                )}

                {/* Count line sits between the filter card and the sheet, so
                    the filter block stays purely about filtering. Mobile keeps
                    it too — it is the only place the total is stated there,
                    and it carries the sort trigger: the mobile list has no
                    column headers to sort from. */}
                <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={data.length}
                    fwSize="sm"
                  />

                  {isMobile && (
                    <SortPopover
                      options={mobileSortOptions}
                      sortValue={mobileSortValue}
                      onSort={handleMobileSort}
                    />
                  )}
                </div>

                {isMobile ? (
                  <MobileView
                    data={displayData}
                    type={effectiveType}
                    callback={handleItemCallback}
                    onPriceResult={handlePriceResult}
                    loading={loading}
                    priceGroups={visibleGroups}
                    focusGroup={
                      groupFilter === ALL_GROUPS
                        ? null
                        : visibleGroups[0] || null
                    }
                    selectedIds={selectedIds}
                    onSelectChange={handleSelectChange}
                    showLoadMore={hasMoreData && quickChip !== "above"}
                    loadingMore={loadingMore}
                    loadMore={loadMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={data.length}
                  />
                ) : (
                  // The table keeps its own sticky header and scroll
                  // container, so the card contributes no padding.
                  <AppCard noPadding className="tw:mb-0">
                    <DesktopView
                      data={displayData}
                      callback={handleItemCallback}
                      onPriceResult={handlePriceResult}
                      loading={loading}
                      type={effectiveType}
                      onSort={handleSort}
                      showOnlinePrices={showOnlinePrices}
                      priceGroups={visibleGroups}
                      sortKey={activeHeaderSort?.key || ""}
                      sortValue={activeHeaderSort?.value || "asc"}
                      showLoadMore={
                        hasMoreData && !loading && quickChip !== "above"
                      }
                      loadingMore={loadingMore}
                      loadMore={loadMore}
                      totalCount={paginationRef.current.totalRecords}
                      loadedCount={data.length}
                      selectedIds={selectedIds}
                      onSelectChange={handleSelectChange}
                      onSelectAllChange={handleSelectAllChange}
                    />
                  </AppCard>
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed list pane
                  beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <PricingSidePane
                  priceType={effectiveType === "network" ? "b2b" : "b2c"}
                  filter={paneFilter}
                  onFilterChange={setPaneFilter}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>

        {/* Bulk bar — always on the price sheet, mobile and desktop alike, so
            the bulk flow is discoverable before anything is checked. */}
        <div className="app-footer app-footer-fixed">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <div className="tw:min-w-0">
              <div className="tw:text-sm tw:font-bold tw:text-slate-900">
                {selectedItems.length
                  ? `${selectedItems.length} selected`
                  : "Bulk price setter"}
              </div>
              {selectedItems.length ? (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="tw:cursor-pointer tw:text-xs tw:font-medium tw:text-slate-500 tw:underline"
                >
                  Clear selection
                </button>
              ) : (
                <div className="tw:text-xs tw:text-slate-500">
                  Select products to change price on many SKUs at once
                </div>
              )}
            </div>
            <AppButton onClick={handleBulkSetterOpen}>
              <Zap size={16} />
              Set price
            </AppButton>
          </div>
        </div>

        <BulkPriceModal
          show={bulkModal}
          selected={selectedItems}
          type={effectiveType}
          callback={handleBulkCallback}
        />

        {/* Desktop only — on mobile a row taps straight through to the
            product view instead of opening the config detail. */}
        {!isMobile && (
          <ItemDetailModal
            show={itemDetailModal.show}
            data={itemDetailModal.data}
            callback={handleModalCallback}
            type={effectiveType}
          />
        )}

        <PriceConfigModal
          show={rspManageModal.show}
          type={rspManageModal.type || undefined}
          callback={handleRspManageModalCallback}
          dealId={rspManageModal.dealId || undefined}
          group={rspManageModal.group}
        />

        <BulkUploadModal
          show={bulkUploadModal.show}
          callback={handleBulkUploadModalCallback}
          type={effectiveType}
          products={bulkUploadModal.products}
        />

        <PriceSlabConfigModal
          show={priceSlabModal.show}
          editId={priceSlabModal.editId || undefined}
          type="product"
          targetDetails={priceSlabModal.targetDetails}
          slabs={priceSlabModal.slabs}
          callback={handlePriceSlabModalCallback}
          channel={effectiveType === "network" ? "b2b" : "b2c"}
          disableChannel={true}
          hideTabs={false}
        />
      </div>
    </>
  );
};

export default Rsp;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Products Price Config"),
    },
  ];
}
