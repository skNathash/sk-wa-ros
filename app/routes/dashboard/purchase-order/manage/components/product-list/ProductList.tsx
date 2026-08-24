import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "~/hooks/use-mobile";
import useAppToast from "~/hooks/useAppToast";
import PurchaseCartService from "~/services/PurchaseCartService";
import AddProductModal from "~/shared/catalog/modals/AddProductModal";
import type { PaginationState } from "~/types/CommonTypes";
import {
  fetchDealDetails,
  toCartItem,
} from "~/shared/purchase-order/components/po-add-to-cart/helper";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import {
  getCart,
  getCatalogSource,
  getCount,
  getData,
  getYouBought,
  mapCartProducts,
  markInCart,
  prepareParams,
  type CartLine,
  type ProductListFilter as FilterValues,
  type ProductRow,
  type YouBoughtItem,
} from "./helper";

type Props = {
  vendorId: string;
  vendorName?: string;
  /** Bump when the cart modal mutates the cart so in-cart badges refresh. */
  refreshToken?: number;
  /** Notify parent after this list mutates the cart. */
  onCartChange?: () => void;
  onViewCart?: () => void;
};

const defaultFilterValues: FilterValues = {
  search: "",
  searchMode: "name",
  category: [],
  brand: [],
};

/**
 * Product browse/select surface for PO manage.
 * Fetches vendor cart only to mark in-cart state — does not render the cart.
 */
const ProductList = ({
  vendorId,
  vendorName,
  refreshToken = 0,
  onCartChange,
  onViewCart,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();
  const isMobile = useIsMobile();

  const form = useForm<FilterValues>({
    defaultValues: defaultFilterValues,
    mode: "onChange",
  });

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);

  const [youBought, setYouBought] = useState<YouBoughtItem[]>([]);
  const [loadingYouBought, setLoadingYouBought] = useState(true);

  const [addingDealId, setAddingDealId] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [addProductKey, setAddProductKey] = useState(0);

  const filterRef = useRef<FilterValues>({ ...defaultFilterValues });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 16,
    startSlNo: 1,
    endSlNo: 16,
    totalRecords: 0,
  });
  const cartItemsRef = useRef<CartLine[]>([]);
  const cartDealIdsRef = useRef<Set<string>>(new Set());

  const applyCartSnapshot = (mapped: CartLine[]) => {
    cartItemsRef.current = mapped;
    cartDealIdsRef.current = new Set(
      mapped.map((p) => String(p.dealId)).filter(Boolean),
    );
  };

  const refreshCartState = useCallback(async () => {
    if (!vendorId) return;
    const cart = await getCart(vendorId);
    const mapped = mapCartProducts(cart);
    applyCartSnapshot(mapped);
    setProducts((prev) => markInCart(prev, mapped));
    setYouBought((prev) =>
      prev.map((item) => ({
        ...item,
        inCart:
          cartDealIdsRef.current.has(item.dealId) ||
          cartDealIdsRef.current.has(String(item.id)),
      })),
    );
  }, [vendorId]);

  const applyFilter = useCallback(async () => {
    if (!vendorId) return;

    filterRef.current = { ...form.getValues() };
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    setLoadingProducts(true);
    setProducts([]);

    const params = prepareParams(filterRef.current, paginationRef.current);
    const catalog = getCatalogSource(filterRef.current);

    try {
      // Keep cart snapshot fresh so each product row reflects in-cart state.
      await refreshCartState();

      const [totalRecords, resp] = await Promise.all([
        getCount(catalog, vendorId, params),
        getData(catalog, vendorId, params),
      ]);
      paginationRef.current.totalRecords = totalRecords;
      setProducts(markInCart(resp, cartItemsRef.current));
      setHasMoreProducts(resp.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setHasMoreProducts(false);
    } finally {
      setLoadingProducts(false);
    }
  }, [form, vendorId, refreshCartState]);

  const loadMore = useCallback(async () => {
    if (!vendorId || isLoadingMoreProducts || !hasMoreProducts) return;

    setIsLoadingMoreProducts(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const resp = await getData(
        getCatalogSource(filterRef.current),
        vendorId,
        params,
      );
      setProducts((prev) => [
        ...prev,
        ...markInCart(resp, cartItemsRef.current),
      ]);
      setHasMoreProducts(resp.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMoreProducts(false);
    }
  }, [vendorId, isLoadingMoreProducts, hasMoreProducts]);

  const loadYouBought = useCallback(async () => {
    if (!vendorId) return;
    setLoadingYouBought(true);
    const items = await getYouBought(vendorId, cartDealIdsRef.current);
    setYouBought(items);
    setLoadingYouBought(false);
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId) return;

    const bootstrap = async () => {
      await refreshCartState();
      await Promise.all([applyFilter(), loadYouBought()]);
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once per vendor
  }, [vendorId]);

  useEffect(() => {
    if (!vendorId || refreshToken === 0) return;
    refreshCartState();
  }, [refreshToken, vendorId, refreshCartState]);

  const markDealInLists = (dealId: string, inCart: boolean, qty = 1) => {
    setProducts((prev) =>
      prev.map((p) => {
        const id = String(p._id || p.dealId || "");
        if (id === dealId || String(p.dealId || "") === dealId) {
          return { ...p, inCart, cartQuantity: inCart ? qty : 0 };
        }
        return p;
      }),
    );
    setYouBought((prev) =>
      prev.map((p) => (p.dealId === dealId ? { ...p, inCart } : p)),
    );
  };

  const handleAddProduct = async (
    dealId: string,
    type: "subscribe" | "purchased" = "subscribe",
    qty = 1,
  ) => {
    if (!vendorId || !dealId || addingDealId) return;

    setAddingDealId(dealId);
    try {
      const deal = await fetchDealDetails(vendorId, dealId, type);
      if (!deal?.dealId) throw new Error("Failed to fetch deal details");

      const response = await PurchaseCartService.addItemOrCreate({
        vendorId,
        ...toCartItem(deal, qty),
      });

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        toast.show({
          msg: t("addedToCart", "Added to cart"),
          color: "success",
        });
        cartDealIdsRef.current.add(dealId);
        markDealInLists(dealId, true, qty);
        await refreshCartState();
        onCartChange?.();
        return;
      }

      throw new Error(
        (typeof response?.data?.message === "string" &&
          response.data.message) ||
          "Failed to add to cart",
      );
    } catch (error: any) {
      console.error(error);
      toast.show({
        msg:
          error?.message ||
          t("somethingWentWrong", "Something went wrong"),
        color: "danger",
      });
    } finally {
      setAddingDealId(null);
    }
  };

  const handleAddFromList = (product: ProductRow) => {
    const dealId = String(product._id || product.dealId || "");
    handleAddProduct(dealId, "subscribe", 1);
  };

  const handleAddFromYouBought = (item: YouBoughtItem) => {
    handleAddProduct(item.dealId, "purchased", item.suggestedQty || 1);
  };

  const openAddProductModal = () => {
    setAddProductKey((k) => k + 1);
    setShowAddProduct(true);
  };

  const loadedCount = products.length;
  const totalCount = paginationRef.current.totalRecords;

  const viewProps = {
    vendorId,
    vendorName,
    products,
    loadingProducts,
    hasMoreProducts,
    isLoadingMoreProducts,
    loadedCount,
    totalCount,
    youBought,
    loadingYouBought,
    addingDealId,
    onApplyFilter: applyFilter,
    onAddProduct: openAddProductModal,
    onAdd: handleAddFromList,
    onAddYouBought: handleAddFromYouBought,
    onLoadMore: loadMore,
    onViewCart,
  };

  return (
    <FormProvider {...form}>
      {isMobile ? <MobileView {...viewProps} /> : <DesktopView {...viewProps} />}

      <AddProductModal
        key={addProductKey}
        show={showAddProduct}
        forceNewKeys={addProductKey}
        title={t("createNewProduct", "Create New Product")}
        callback={({ action }) => {
          if (
            action === "close" ||
            action === "done" ||
            action === "created"
          ) {
            setShowAddProduct(false);
            if (action === "created" || action === "done") {
              applyFilter();
            }
          }
        }}
      />
    </FormProvider>
  );
};

export default ProductList;
