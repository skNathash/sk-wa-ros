import { produce } from "immer";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import {
  B2B_DISCOUNT_TYPE,
  DISCOUNT_DECIMAL_PLACES,
  EVENTS,
} from "~/constants";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import type { PaginationState } from "~/types/CommonTypes";
import AppliedFilters from "./AppliedFilters";
import Filter from "./Filter";
import { getCount, getData, prepareParams } from "./helper";
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
  const hasScrollToProduct = !!searchParams.get("scrollToProduct");

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

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
    };
    try {
      const params = prepareParams(getValues(), paginationRef.current);
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
  }, [getValues]);

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
            draft[index].inCart = CartService.isDealInCart(deal.id);
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
      const formData = a.data;
      let params: Record<string, string> = {};
      if (formData.search) {
        params.search = formData.search;
      }
      if (formData.menu?.length > 0) {
        params.menuId = formData.menu.map((m: any) => m.value.id).join(",");
        params.menuName = formData.menu.map((m: any) => m.value.name).join(",");
      }
      if (formData.category?.length > 0) {
        params.categoryId = formData.category
          .map((c: any) => c.value.id)
          .join(",");
        params.categoryName = formData.category
          .map((c: any) => c.value.name)
          .join(",");
      }
      if (formData.brand?.length > 0) {
        params.brandId = formData.brand.map((b: any) => b.value.id).join(",");
        params.brandName = formData.brand
          .map((b: any) => b.value.name)
          .join(",");
      }
      if (formData.showOnlySchemes) {
        params.showOnlySchemes = "1";
      }
      setSearchParams(params, { replace: true, preventScrollReset: true });
    }
  };

  return (
    <>
      <FormProvider {...formMethods}>
        <Filter retailerId={retailerId} callback={handleFilterCallback} />
        {!hasScrollToProduct && (
          <AppliedFilters callback={handleAppliedFiltersCallback} />
        )}
      </FormProvider>

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
