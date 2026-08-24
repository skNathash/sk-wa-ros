import { produce } from "immer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import useTheme from "~/hooks/useTheme";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import ProductRowCard from "~/shared/products/product-row-card/ProductRowCard";
import {
  B2B_DISCOUNT_TYPE,
  CART_ITEM_ADDED,
  CART_ITEM_REMOVED,
  DISCOUNT_DECIMAL_PLACES,
  EVENTS,
} from "~/constants";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import FacetFilter from "~/shared/catalog/components/facet-filter/FacetFilter";
import type { FacetSelection } from "~/shared/catalog/components/facet-filter/modals/facet-filter/FacetFilterModal";
import type { PaginationState } from "~/types/CommonTypes";
import AppliedFilters from "./AppliedFilters";
import CatalogSummary from "./components/catalog-summary/CatalogSummary";
import DesktopView from "./components/DesktopView";
import Filter from "./Filter";
import {
  defaultCatalogSummary,
  getCount,
  getData,
  getSummary,
  prepareParams,
  type CatalogSummaryData,
} from "./helper";
import { Skeleton } from "~/components/ui/skeleton";

type Props = {
  retailerId: string;
  callback: (data: any) => void;
  isServiceable?: boolean;
};

type FormData = {
  retailerId: string;
  search: string;
  menu: any[];
  category: any[];
  brand: any[];
  showOnlySchemes: boolean;
  productId: string;
};

const Products = ({ retailerId, callback, isServiceable = true }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Always points at the latest searchParams — the Filter's debounced search
  // can fire a handler captured on an earlier render, so URL updates must read
  // the live params from this ref instead of the (possibly stale) closure.
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const hasScrollToProduct = !!searchParams.get("scrollToProduct");
  const theme = useTheme();
  const isTheme2 = theme === "theme-2";

  const formMethods = useForm<FormData>({
    defaultValues: {
      retailerId: retailerId,
      search: "",
      menu: [],
      category: [],
      brand: [],
      showOnlySchemes: false,
      productId: "",
    },
  });
  const { getValues, setValue } = formMethods;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [summary, setSummary] =
    useState<CatalogSummaryData>(defaultCatalogSummary);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [cartAction, setCartAction] = useState<{
    action: string;
    deal: any;
    dealId: string;
    sellerId: string;
  }>({
    action: "",
    deal: {},
    dealId: "",
    sellerId: "",
  });

  const [productDetailModalData, setProductDetailModalData] = useState<any>({
    show: false,
    data: {},
  });

  const onProductDetailModalCallback = (data: any) => {
    setProductDetailModalData({ show: false, data: {} });
    callback(data);
  };

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 14,
    startSlNo: 1,
    endSlNo: 14,
    totalRecords: 0,
  });

  // Tracks the menu/category/brand ids that were applied via the
  // (search-driven) facet filter. Clearing the search removes only these —
  // selections made via the Filter modal share the same form fields/URL
  // params but must be left untouched.
  const facetSelectedRef = useRef<{
    menus: string[];
    categories: string[];
    brands: string[];
  }>({ menus: [], categories: [], brands: [] });

  // Catalog stats follow the same filters as the list, but are fired alongside
  // it so the tiles never hold up the products.
  const applySummary = useCallback(async (params: Record<string, any>) => {
    setSummaryLoading(true);
    try {
      setSummary(await getSummary(params));
    } catch {
      setSummary(defaultCatalogSummary);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };
    try {
      const params = prepareParams(getValues(), paginationRef.current);

      if (isTheme2) {
        applySummary(params);
      }

      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [getValues, isTheme2, applySummary]);

  useEffect(() => {
    const search = searchParams.get("search");
    const menuId = searchParams.get("menuId");
    const menuName = searchParams.get("menuName");
    const categoryId = searchParams.get("categoryId");
    const categoryName = searchParams.get("categoryName");
    const brandId = searchParams.get("brandId");
    const brandName = searchParams.get("brandName");
    const showOnlySchemes = searchParams.get("showOnlySchemes");
    const productId = searchParams.get("productId");

    if (menuId && menuName) {
      const ids = menuId.split(",");
      const names = menuName.split(",");
      setValue(
        "menu",
        ids.map((id, i) => ({
          label: names[i] || "",
          value: { id, name: names[i] || "" },
        })),
      );
    } else {
      setValue("menu", []);
    }

    if (categoryId && categoryName) {
      const ids = categoryId.split(",");
      const names = categoryName.split(",");
      setValue(
        "category",
        ids.map((id, i) => ({
          label: names[i] || "",
          value: { id, name: names[i] || "" },
        })),
      );
    } else {
      setValue("category", []);
    }

    if (brandId && brandName) {
      const ids = brandId.split(",");
      const names = brandName.split(",");
      setValue(
        "brand",
        ids.map((id, i) => ({
          label: names[i] || "",
          value: { id, name: names[i] || "" },
        })),
      );
    } else {
      setValue("brand", []);
    }

    setValue("showOnlySchemes", showOnlySchemes === "1");
    setValue("search", search || "");
    setValue("productId", productId || "");

    setValue("retailerId", retailerId);

    if (retailerId) {
      applyFilter();
    } else {
      setData([]);
      paginationRef.current.totalRecords = 0;
      setHasMoreData(false);
      setLoading(false);
    }
  }, [retailerId, setValue, searchParams]);

  const onProductCardCallback = (e: any) => {
    const action = e.action;
    const deal = e.data?.data?.data || e.data?.data?.deal;

    if (action === "add" || action === "update" || action === "remove") {
      setData(
        produce((draft) => {
          const index = draft.findIndex((e) => {
            return e.id === deal.id;
          });

          if (index !== -1) {
            const price = draft[index].price;
            const priceSlabs = draft[index].priceSlabs;
            draft[index].displayPrice = CommonService.getPriceFromSlab(
              {
                isAvailable: true,
                slab: priceSlabs,
              },
              deal.quantity,
              price,
            );
            // Recalculate discount based on the new displayPrice
            const mrp = draft[index].mrp || draft[index].price || 0;
            draft[index].discount = CommonService.calculateDiscount(
              mrp,
              draft[index].displayPrice,
              DISCOUNT_DECIMAL_PLACES,
              B2B_DISCOUNT_TYPE,
            );
            draft[index].inCart = CartService.isDealInCart(deal.id, retailerId);
          }
        }),
      );
      return;
    }

    if (action === "group-deal") {
      setCartAction({
        action: "group-deal",
        deal: deal,
        dealId: deal?._id,
        sellerId: deal?.buyFromOtherRetailer?.retailerId,
      });
      return;
    }

    if (action === "price-slab") {
      setCartAction({
        action: "price-slab",
        deal: {},
        dealId: deal?.dealId,
        sellerId: retailerId,
      });
      return;
    }

    if (action === "click") {
      setProductDetailModalData({ show: true, data: e.data?.deal });
    }
    callback(data);
  };

  // Mobile row card: "buy" (seller-count tap) opens the product detail modal;
  // cart events come from SellerAddToCart ("added"/"removed"/"price-slab") —
  // sync the row's inCart state so the ADD button flips to the qty stepper.
  const onRowCardCallback = (p: { action: string; data?: any }) => {
    if (p.action === "buy") {
      const item = data.find((d) => d._id === p.data);
      if (item) {
        setProductDetailModalData({ show: true, data: item });
      }
      return;
    }

    if (p.action === "price-slab") {
      setCartAction({
        action: "price-slab",
        deal: {},
        dealId: p.data?.dealId,
        sellerId: retailerId,
      });
      return;
    }

    if (p.action === CART_ITEM_ADDED || p.action === CART_ITEM_REMOVED) {
      const dealId = String(p.data?.dealId || "");
      setData(
        produce((draft) => {
          const index = draft.findIndex(
            (d) => String(d._id) === dealId || String(d.id) === dealId,
          );
          if (index === -1) return;

          if (p.action === CART_ITEM_ADDED) {
            draft[index].inCart = {
              status: true,
              qty: p.data?.qty || p.data?.quantity || 1,
            };
            draft[index].itemId = p.data?.itemId;
            draft[index].cartId = p.data?.cartId;
          } else {
            draft[index].inCart = { status: false, qty: 0 };
            draft[index].itemId = undefined;
            draft[index].cartId = undefined;
          }
        }),
      );
      callback(p);
    }
  };

  // sync local product list when cart events occur (add/update/remove)
  useEffect(() => {
    const handleCartAddedOrUpdated = (ev: any) => {
      const dataEv = ev?.detail || {};
      const eventDealId = String(dataEv.dealId || "");
      const qty = Number(dataEv.qty || 0);
      if (!eventDealId) return;

      setData(
        produce((draft) => {
          const index = draft.findIndex(
            (d) =>
              String(d._id) === eventDealId || String(d.id) === eventDealId,
          );

          if (index !== -1 && draft[index].priceSlabs?.length) {
            draft[index].inCart =
              qty > 0 ? { status: true, qty } : { status: false, qty: 0 };

            const price = draft[index].price;
            const priceSlabs = draft[index].priceSlabs || [];

            if (
              draft[index].inCart?.status &&
              typeof draft[index].inCart.qty === "number" &&
              draft[index].inCart.qty > 0
            ) {
              draft[index].displayPrice = CommonService.getPriceFromSlab(
                { isAvailable: true, slab: priceSlabs },
                draft[index].inCart.qty,
                price,
              );
            } else {
              draft[index].displayPrice = price;
            }

            const mrp = draft[index].mrp || draft[index].price || 0;
            draft[index].discount = CommonService.calculateDiscount(
              mrp,
              draft[index].displayPrice,
              DISCOUNT_DECIMAL_PLACES,
              B2B_DISCOUNT_TYPE,
            );
          }
        }),
      );
    };

    const handleCartRemoved = (ev: any) => {
      const dataEv = ev?.detail || {};
      const eventDealId = String(dataEv.dealId || "");
      if (!eventDealId) return;

      setData(
        produce((draft) => {
          const index = draft.findIndex(
            (d) =>
              String(d._id) === eventDealId || String(d.id) === eventDealId,
          );

          if (index !== -1 && draft[index].priceSlabs?.length) {
            draft[index].inCart = { status: false, qty: 0 };
            draft[index].displayPrice = draft[index].price;
            const mrp = draft[index].mrp || draft[index].price || 0;
            draft[index].discount = CommonService.calculateDiscount(
              mrp,
              draft[index].displayPrice,
              DISCOUNT_DECIMAL_PLACES,
              B2B_DISCOUNT_TYPE,
            );
          }
        }),
      );
    };

    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, handleCartAddedOrUpdated);
    MiscService.listenEvent(EVENTS.CART_ITEM_UPDATED, handleCartAddedOrUpdated);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, handleCartRemoved);

    return () => {
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_ADDED,
        handleCartAddedOrUpdated,
      );
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_UPDATED,
        handleCartAddedOrUpdated,
      );
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_REMOVED,
        handleCartRemoved,
      );
    };
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(getValues(), paginationRef.current);
    const result = await getData(params);
    setData([...data, ...result]);
    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  };

  const handleAppliedFiltersCallback = (a: { action: string; data?: any }) => {
    if (a.action === "remove" && a.data) {
      handleFilterCallback({
        action: "apply",
        data: {
          ...getValues(),
          [a.data.key]: a.data.config.resetValue,
        },
      });
    }
  };

  const handleFilterCallback = (a: { action: string; data?: any }) => {
    if (a.action === "apply" && a.data) {
      const formData = { ...a.data };

      // When the user clears the search, drop only the menu/category/brand
      // that was applied via the (search-driven) facet filter so results
      // aren't left filtered by stale facets. Selections made through the
      // Filter modal share the same form fields but must be preserved.
      if (!formData.search || !formData.search.trim()) {
        const facet = facetSelectedRef.current;
        formData.menu = (formData.menu || []).filter(
          (m: any) => !facet.menus.includes(m?.value?.id),
        );
        formData.category = (formData.category || []).filter(
          (c: any) => !facet.categories.includes(c?.value?.id),
        );
        formData.brand = (formData.brand || []).filter(
          (b: any) => !facet.brands.includes(b?.value?.id),
        );
        facetSelectedRef.current = { menus: [], categories: [], brands: [] };
      }

      // Start from the live URL params so non-filter params (tab,
      // inventoryTab, distance, …) survive — replacing the whole query string
      // here used to kick the page back to the Overview tab on search.
      const next = new URLSearchParams(searchParamsRef.current.toString());
      [
        "search",
        "menuId",
        "menuName",
        "categoryId",
        "categoryName",
        "brandId",
        "brandName",
        "showOnlySchemes",
      ].forEach((k) => next.delete(k));

      if (formData.search) {
        next.set("search", formData.search);
      }
      if (formData.menu?.length > 0) {
        next.set("menuId", formData.menu.map((m: any) => m.value.id).join(","));
        next.set(
          "menuName",
          formData.menu.map((m: any) => m.value.name).join(","),
        );
      }
      if (formData.category?.length > 0) {
        next.set(
          "categoryId",
          formData.category.map((c: any) => c.value.id).join(","),
        );
        next.set(
          "categoryName",
          formData.category.map((c: any) => c.value.name).join(","),
        );
      }
      if (formData.brand?.length > 0) {
        next.set(
          "brandId",
          formData.brand.map((b: any) => b.value.id).join(","),
        );
        next.set(
          "brandName",
          formData.brand.map((b: any) => b.value.name).join(","),
        );
      }
      if (formData.showOnlySchemes) {
        next.set("showOnlySchemes", "1");
      }
      setSearchParams(next, { replace: true, preventScrollReset: true });
    }
  };

  // Apply menu/category/brand selections from the facet filter (inline chips
  // and the "More" modal) by writing them onto the URL query params, the same
  // way the Filter modal does. The read-effect above rehydrates the form from
  // these params and re-runs the search.
  const handleFacetApply = (params: {
    action: string;
    data?: FacetSelection;
  }) => {
    if (params.action !== "apply" || !params.data) return;

    const { menus, categories, brands } = params.data;

    const next = new URLSearchParams(searchParamsRef.current.toString());

    const setMulti = (
      idKey: string,
      nameKey: string,
      items: { id: string; name: string }[],
    ) => {
      if (items.length) {
        next.set(idKey, items.map((i) => i.id).join(","));
        next.set(nameKey, items.map((i) => i.name).join(","));
      } else {
        next.delete(idKey);
        next.delete(nameKey);
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

    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  // The selection currently applied via the URL, fed back into FacetFilter so
  // it stays in sync when a menu/category/brand is removed elsewhere (e.g. an
  // AppliedFilters chip). Memoized on the params so its identity only changes
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

  return (
    <>
      <FormProvider {...formMethods}>
        <Filter retailerId={retailerId} callback={handleFilterCallback} />
        {!hasScrollToProduct && (
          <FacetFilter
            // Remount when the search term clears so the facet filter's
            // selected brand/menu/category chips reset for the next search.
            key={searchParams.get("search") ? "facet-active" : "facet-empty"}
            search={searchParams.get("search") || ""}
            source="seller-deal"
            sellerId={retailerId}
            selected={facetSelection}
            callback={handleFacetApply}
          />
        )}
        {!hasScrollToProduct && (
          <AppliedFilters callback={handleAppliedFiltersCallback} />
        )}
      </FormProvider>

      {isTheme2 ? (
        <CatalogSummary
          className="tw:mb-3"
          data={summary}
          loading={summaryLoading}
        />
      ) : null}

      {loading ? (
        <>
          {/* skeleton loader */}
          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-2">
            {Array.from({ length: paginationRef.current.rowsPerPage }).map(
              (_, index) => (
                <div key={index} className="tw:h-full">
                  <Skeleton className="tw:w-full tw:h-full" />
                  <Skeleton className="tw:w-full tw:h-4" />
                  <Skeleton className="tw:w-full tw:h-4" />
                  <Skeleton className="tw:w-full tw:h-4" />
                </div>
              ),
            )}
          </div>
        </>
      ) : null}

      {!loading && data.length === 0 ? <NoData /> : null}

      {!loading && data.length > 0 ? (
        <>
          <div>
            <PaginationSummary
              loadingTotalRecords={loading}
              paginationConfig={paginationRef.current}
              loadedCount={data.length}
              fwSize="sm"
              className="tw:mb-2"
            />
          </div>
          {isTheme2 ? (
            <>
              {/* Mobile: edge-to-edge row list. `app-bleed-x` pulls it out of
                  the page gutter on theme-2 mobile and drops the radius, so the
                  rows read as one continuous band separated by hairlines
                  instead of floating cards. */}
              <div className="app-bleed-x tw:divide-y tw:divide-border tw:rounded-none tw:bg-white tw:md:hidden">
                {data.map((item) => (
                  <ProductRowCard
                    key={item._id}
                    data={item}
                    callback={onRowCardCallback}
                    hideSellerCount
                    flush
                  />
                ))}
              </div>
              {/* Desktop: dense catalog table */}
              <div className="tw:hidden tw:md:block">
                <DesktopView
                  data={data}
                  sellerId={retailerId}
                  callback={onRowCardCallback}
                />
              </div>
            </>
          ) : (
            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-7 tw:gap-2">
              {data.map((item) => (
                <div key={item._id} className="tw:h-full">
                  <ProductCard
                    data={item}
                    callback={onProductCardCallback}
                    cartType="buy-from-other-retailer"
                    // Allow purchase even when retailer is not serviceable
                    // hideAddToCart={!isServiceable}
                  />
                </div>
              ))}
            </div>
          )}
          {hasMoreData && !loading && data.length > 0 ? (
            <div className="tw:flex tw:justify-center tw:items-center">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          ) : null}
        </>
      ) : null}

      <ProductDetailModal
        show={productDetailModalData.show}
        callback={onProductDetailModalCallback}
        dealId={productDetailModalData.data?._id}
        cartType="buy-from-other-retailer"
        retailerId={retailerId}
        // Allow purchase even when retailer is not serviceable
        // hideAddToCart={!isServiceable}
      />

      <AddToCartActionHandler
        deal={cartAction.deal}
        action={cartAction.action}
        callback={(e) => {
          setCartAction({ action: "", deal: {}, dealId: "", sellerId: "" });
        }}
        sellerId={cartAction.sellerId}
        dealId={cartAction.dealId}
      />
    </>
  );
};

export default Products;
