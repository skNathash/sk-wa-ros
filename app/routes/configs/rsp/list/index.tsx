import { produce } from "immer";
import { Percent, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppCheckbox } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
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
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import PriceSlabConfigModal from "~/shared/catalog/modals/price-slab-config/PriceSlabConfigModal";
import SortBy from "~/shared/inventory/components/sort-by/SortBy";
import type {
  BreadcrumbItem,
  PaginationState,
  SortProps,
  ViewToggleType,
} from "~/types/CommonTypes";
import ManagePriceTabs from "../../components/ManagePriceTabs";
import ItemDetailModal from "../modals/ItemDetailModal";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import Mobile from "./components/item/Mobile";
import RspAppliedFilter from "./components/RspAppliedFilter";
import type { FilterFormFields } from "./helper";
import {
  defaultBreadcrumbs,
  defaultPagination,
  getCount,
  getData,
  prepareFilters,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.PRICING"]);
}

// Maps a table-header column key + direction to the Sort By popover's
// `globalSort` value, so clicking a column header drives the exact same
// sorting as the popover (and stays in sync with it).
const HEADER_SORT_TO_GLOBAL: Record<string, { asc: string; desc: string }> = {
  dealName: { asc: "name-asc", desc: "name-desc" },
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
  "price-asc": { key: "price", value: "asc" },
  "price-desc": { key: "price", value: "desc" },
  "low-stock": { key: "maxQty", value: "asc" },
  "high-stock": { key: "maxQty", value: "desc" },
};

const Rsp = () => {
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const isBuyer = AuthService.isBuyerUser() || AuthService.isSkBuyer();

  const appNav = useAppNav();
  const { isMobile } = useScreenView();

  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") as "network" | "customer";

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
    },
  });

  const [breadcrumbs, setBreadcrumbs] =
    useState<BreadcrumbItem[]>(defaultBreadcrumbs);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [view, setView] = useState<ViewToggleType>("list");

  const [sortPopoverOpen, setSortPopoverOpen] = useState(false);

  // Amazon/Flipkart benchmark prices are only available for electronics
  // franchises; the toggle lets them declutter the table when not needed.
  const isElectronicsFranchise = AuthService.isElectronicsFranchise();
  const [showOnlinePrices, setShowOnlinePrices] =
    useState(isElectronicsFranchise);

  const [itemDetailModal, setItemDetailModal] = useState({
    show: false,
    data: null,
  });
  const [rspManageModal, setRspManageModal] = useState({
    show: false,
    type: effectiveType,
    dealId: null,
  });

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

    applyFilter();
  }, [searchParams.toString(), formMethods]);

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
    init();
  }, [type, isBuyer, t]);

  const init = async () => {
    paginationRef.current = {
      ...defaultPagination,
    };
    applyFilter();
    // loadSummary();
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

      // Update pagination end number
      const countResponse = await getCount(params);
      paginationRef.current.totalRecords = countResponse;
    } catch (error) {
      console.error("Error applying filter:", error);
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [effectiveType]);

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
    if (action.action === "viewDeal" && action.data) {
      const url = `/dashboard/inventory/products/view/${action.data.id}`;
      if (!isMobile) {
        appNav.openInNewTab(url);
      } else {
        appNav.to(url);
      }
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
    });
    if (action.action === "update" || action.action === "create") {
      if (action.action === "create") {
        applyFilter();
      }
      if (action.action === "update") {
        setData(
          produce((draft) => {
            const i = draft.findIndex(
              (item) => item._id === action.data.dealId,
            );
            if (i !== -1) {
              if (action.data.type === "network") {
                draft[i].b2bPrice = action.data.price;
                draft[i].b2bDiscount = action.data.discount;
                if (typeof action.data.isFixedPrice !== "undefined") {
                  draft[i].b2bDiscountType = action.data.isFixedPrice
                    ? "Fixed"
                    : "Normal";
                  draft[i].isFixedPrice = action.data.isFixedPrice;
                  draft[i].fixedPrice = action.data.fixedPrice || 0;
                  // keep convenience key in sync for table view
                  draft[i]._discountType = draft[i].b2bDiscountType;
                }
              } else {
                draft[i].b2cPrice = action.data.price;
                draft[i].b2cDiscount = action.data.discount;
                if (typeof action.data.isFixedPrice !== "undefined") {
                  draft[i].b2cDiscountType = action.data.isFixedPrice
                    ? "Fixed"
                    : "Normal";
                  draft[i].isFixedPrice = action.data.isFixedPrice;
                  draft[i].fixedPrice = action.data.fixedPrice || 0;
                  // keep convenience key in sync for table view
                  draft[i]._discountType = draft[i].b2cDiscountType;
                }
              }
            }
          }),
        );
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

  const appliedFilterCallback = (r: { action: string; data?: any }) => {
    if (r.action === "remove") {
      formMethods.setValue(r.data.key, r.data.config?.resetValue);
      applyFilter();
    }
  };

  const handlePricingTabChange = (tab: any) => {
    if (isBuyer) return; // buyers should not be able to switch to network pricing
    // reset priceMode to 'all' when switching tabs
    formMethods.setValue("priceMode", "all");
    appNav.replace(`/configs/rsp?type=${tab.key}`);
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

  const handleBulkUpload = () => {
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
    appNav.to("/dashboard/bulk-upload/pricing");
  };

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

  return (
    <>
      <AppHeader
        title="Manage Price"
        showAudioNote={true}
        audioNoteTitle="Manage Price"
        audioFeature="managePrice"
      />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>

          <PageDescription description="managePrice" className="tw:mb-4" />

          <ManagePriceTabs
            activeTab={effectiveType === "network" ? "b2b" : "b2c"}
            className="tw:mb-4"
          />

          <AppCard noContentPadding={true}>
            <div className="tw:px-4">
              {/* <div className="tw:text-base tw:font-semibold tw:mb-4">
                Pricing ({paginationRef.current.totalRecords} items)
              </div> */}
              <FormProvider {...formMethods}>
                <Filter callback={handleFilterChange} />
                <RspAppliedFilter onFilterChange={handleFilterChange} />
                <div className="tw:mb-4 tw:mt-4 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:items-end tw:flex-wrap">
                  <div className="tw:flex-1 tw:hidden tw:md:block">
                    <PaginationSummary
                      paginationConfig={paginationRef.current}
                      loadingTotalRecords={loading}
                      loadedCount={data.length}
                      fwSize="sm"
                    />
                  </div>
                  <div className="tw:flex tw:gap-2 tw:flex-wrap tw:items-center">
                    <AppCheckbox
                      label="Show online prices"
                      size="xs"
                      value={showOnlinePrices}
                      onChange={setShowOnlinePrices}
                      className="tw:flex tw:items-center tw:px-2.5 tw:py-1.5 tw:border tw:border-gray-200 tw:rounded-md tw:text-gray-600 tw:whitespace-nowrap"
                    />
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={handleBulkUpload}
                    >
                      <Upload size={16} />
                      Bulk Upload
                    </AppButton>
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={handleGlobalDiscount}
                    >
                      <Percent size={16} />
                      Global Discount
                    </AppButton>
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
                </div>
              </FormProvider>
            </div>

            {isMobile || view === "card" ? (
              <>
                {loading ? (
                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:md:mx-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="tw:bg-white tw:md:rounded-lg tw:border tw:border-gray-200 tw:animate-pulse"
                      >
                        <div className="tw:p-4">
                          <div className="tw:flex tw:items-start tw:gap-3 tw:mb-3">
                            <div className="tw:w-16 tw:h-16 tw:bg-gray-200 tw:rounded"></div>
                            <div className="tw:flex-1">
                              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2 tw:w-3/4"></div>
                              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
                            </div>
                          </div>
                          <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-3">
                            <div className="tw:flex-1">
                              <div className="tw:h-6 tw:bg-gray-200 tw:rounded tw:mb-1"></div>
                              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-20"></div>
                            </div>
                            <div className="tw:flex-1">
                              <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:mb-1"></div>
                              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-24"></div>
                            </div>
                            <div className="tw:flex-1">
                              <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:mb-1"></div>
                              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !loading && data.length === 0 ? (
                  <NoData />
                ) : (
                  <>
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:md:mx-4">
                      {data.map((item, index) => (
                        <Mobile
                          key={item._id}
                          item={item}
                          callback={handleItemCallback}
                          type={effectiveType}
                          isFirst={index === 0}
                          showOnlinePrices={showOnlinePrices}
                        />
                      ))}
                    </div>
                    {hasMoreData && !loading && data.length > 0 && (
                      <LoadMoreButton
                        loadMore={loadMore}
                        loading={loadingMore}
                        totalCount={paginationRef.current.totalRecords}
                        loadedCount={data.length}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <DesktopView
                data={data}
                callback={handleItemCallback}
                loading={loading}
                type={effectiveType}
                onSort={handleSort}
                showOnlinePrices={showOnlinePrices}
                sortKey={activeHeaderSort?.key || ""}
                sortValue={activeHeaderSort?.value || "asc"}
                showLoadMore={hasMoreData && !loading}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            )}
          </AppCard>

          <ItemDetailModal
            show={itemDetailModal.show}
            data={itemDetailModal.data}
            callback={handleModalCallback}
            type={effectiveType}
          />

          <PriceConfigModal
            show={rspManageModal.show}
            type={rspManageModal.type || undefined}
            callback={handleRspManageModalCallback}
            dealId={rspManageModal.dealId || undefined}
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
