import { useCallback, useEffect, useRef, useState } from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import {
  POS_CART_ITEM_ADDED,
  POS_CART_ITEM_REMOVED,
  POS_SCAN_INCREMENT_CART_ITEM,
  POS_STOCK_ADDED,
} from "~/constants";
import MiscService from "~/services/MiscService";
import SellerCatalogService from "~/services/SellerCatalogService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import type { PaginationState, SellerDeal } from "~/types/CommonTypes";
import Filter from "./Filter";
import type { PosBillingDeal } from "./helper";
import { getCount, getData, prepareParams } from "./helper";
import ProductGrid from "./ProductGrid";

type Props = {
  cartId?: string;
  customerType?: string;
  quickCheckout?: boolean;
  autoAddSingleResult?: boolean;
  onKeypadClick?: () => void;
  onSearchResult?: (info: { count: number; searchTerm: string }) => void;
  assisted?: boolean;
  cartItems?: any[];
};

const Products = ({
  cartId,
  customerType,
  quickCheckout,
  autoAddSingleResult,
  onKeypadClick,
  onSearchResult,
  assisted,
  cartItems = [],
}: Props) => {
  const [data, setData] = useState<PosBillingDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [hasSearchFilter, setHasSearchFilter] = useState(false);
  // Whether there is anything to search for yet (a barcode/name search term or
  // an active category/brand filter). Products stay hidden until this is true.
  const [hasQuery, setHasQuery] = useState(false);
  const [autoAddEnabled, setAutoAddEnabled] = useState(
    autoAddSingleResult ?? true,
  );
  const [scannedQty, setScannedQty] = useState<number | undefined>(undefined);
  const [searchBy, setSearchBy] = useState<"barcode" | "name">("barcode");

  // Add-stock modal for out-of-stock deals (normal billing only)
  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: SellerDeal | null;
  }>({ show: false, data: null });

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});
  const onSearchResultRef = useRef(onSearchResult);
  useEffect(() => {
    onSearchResultRef.current = onSearchResult;
  }, [onSearchResult]);

  // Apply filter (initial load or filter change)
  const applyFilter = useCallback(async () => {
    const searchTerm = filterRef.current?.search?.trim();
    const hasCatBrand =
      (filterRef.current?.category?.length || 0) > 0 ||
      (filterRef.current?.brand?.length || 0) > 0;
    const activeQuery = !!searchTerm || hasCatBrand;

    setHasSearchFilter(!!searchTerm);
    setHasQuery(activeQuery);
    // Reset auto-add tracking on new search
    justAutoAdded.current = null;

    // Nothing scanned/searched yet — keep the grid empty so the scan/search
    // panel stands alone until the user scans a barcode or searches a name.
    if (!activeQuery) {
      setData([]);
      setHasMoreData(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        { ...filterRef.current, customerType, assisted },
        paginationRef.current,
        assisted,
      );

      // Quick-checkout B2B fulfills like B2C, so it uses sellable stock from
      // SellerCatalogService and must not add the reserved quantity on top.
      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;
      const result = await getData(
        params,
        customerType === "b2c" ? true : false,
        !(isB2b || assisted),
      );
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
      if (searchTerm) {
        onSearchResultRef.current?.({ count: totalRecords, searchTerm });
      }
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [customerType, assisted, quickCheckout]);

  // Pick a random sort option when page loads and none specified
  const getRandomSort = () => {
    try {
      const opts = SellerCatalogService.getGlobalSortOptions()
        .filter((opt) => !opt.value.includes("price"))
        .map((o) => o.value)
        .filter(Boolean);
      if (opts.length === 0) return "all";
      return opts[Math.floor(Math.random() * opts.length)];
    } catch (err) {
      return "all";
    }
  };

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { ...filterRef.current, customerType, assisted },
        paginationRef.current,
        assisted,
      );
      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;
      const result = await getData(
        params,
        customerType === "b2c" ? true : false,
        !(isB2b || assisted),
      );
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      console.error("Error loading more data:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, customerType, assisted, quickCheckout]);

  // Initial load
  useEffect(() => {
    // If no explicit globalSort provided, pick a random one on first load
    if (!filterRef.current?.globalSort) {
      const rand = getRandomSort();
      filterRef.current = { ...filterRef.current, globalSort: rand };
    }
    applyFilter();
  }, [applyFilter]);

  // Event handlers to update maxQty when cart items are added/removed elsewhere
  const updateCartState = useCallback(
    (dealId: string, quantity: number | string, action: "add" | "remove") => {
      if (!dealId || !quantity) return;
      const qty = Number(quantity) || 0;
      // Quick-checkout B2B debits stock like B2C, so track maxQty the B2C way.
      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;

      setData((prev: PosBillingDeal[]) =>
        prev.map((p) => {
          if (p._id !== dealId) return p;

          const currentInCartQty = p.inCart?.qty || 0;

          if (action === "add") {
            const newInCart = { status: true, qty: qty };
            if (isB2b) {
              return { ...p, inCart: newInCart };
            }
            // Ensure origMaxQty exists; fall back to current maxQty or 0
            const orig = p.origMaxQty ?? (p.maxQty || 0);
            // New maxQty is original available minus the new in-cart quantity
            const newMax = Math.max(0, orig - (newInCart.qty || 0));
            return {
              ...p,
              origMaxQty: orig,
              maxQty: newMax,
              inCart: newInCart,
            };
          }

          // remove
          const newInCartQty = Math.max(0, currentInCartQty - qty);
          const newInCart = { status: newInCartQty > 0, qty: newInCartQty };
          if (isB2b) {
            return { ...p, inCart: newInCart };
          }

          // Recompute maxQty from original max
          const origForRemove = p.origMaxQty ?? (p.maxQty || 0);
          const recalculatedMax = Math.max(
            0,
            origForRemove - (newInCart.qty || 0),
          );
          return {
            ...p,
            origMaxQty: origForRemove,
            maxQty: recalculatedMax,
            inCart: newInCart,
          };
        }),
      );
    },
    [customerType, quickCheckout],
  );

  useEffect(() => {
    const handlePosCartAdded = (e: any) => {
      const detail = e?.detail || {};
      const { dealId, quantity } = detail;
      updateCartState(dealId, quantity, "add");
    };

    const handlePosCartRemoved = (e: any) => {
      const detail = e?.detail || {};
      const { dealId, quantity } = detail;
      updateCartState(dealId, quantity, "remove");
    };

    document.addEventListener(POS_CART_ITEM_ADDED, handlePosCartAdded);
    document.addEventListener(POS_CART_ITEM_REMOVED, handlePosCartRemoved);

    return () => {
      document.removeEventListener(POS_CART_ITEM_ADDED, handlePosCartAdded);
      document.removeEventListener(POS_CART_ITEM_REMOVED, handlePosCartRemoved);
    };
  }, [updateCartState]);

  const onFilterChange = useCallback(
    (data: { action: string; formData: any }) => {
      if (data.action === "clear") {
        filterRef.current = {};
      } else {
        filterRef.current = {
          ...filterRef.current,
          ...data.formData,
        };
      }
      if (data.formData?.autoAddToCart !== undefined) {
        setAutoAddEnabled(data.formData.autoAddToCart);
      }
      setScannedQty(data.formData?.scannedQty);
      if (data.formData?.searchBy) {
        setSearchBy(data.formData.searchBy);
      }
      applyFilter();
    },
    [applyFilter],
  );

  // Track whether we just auto-added an item (to avoid re-adding on rerender)
  const justAutoAdded = useRef<string | null>(null);

  // Reset state and auto-add tracking refs when cart changes
  useEffect(() => {
    setHasSearchFilter(false);
    setHasQuery(false);
    setData([]);
    justAutoAdded.current = null;
  }, [cartId]);

  // Note: repeat scans of an item already in the cart are handled by the
  // POS_SCAN_INCREMENT_CART_ITEM effect below (which increments the qty and
  // shows the "Item updated in cart" toast), so we intentionally do not raise
  // the redundant "Item already in cart" alert here.

  // Listen for cart-add events to mark items we just auto-added
  useEffect(() => {
    const handleAutoAddTrack = (e: any) => {
      const detail = (e as CustomEvent)?.detail || {};
      if (detail.dealId) {
        justAutoAdded.current = detail.dealId;
      }
    };
    document.addEventListener(POS_CART_ITEM_ADDED, handleAutoAddTrack);
    return () => {
      document.removeEventListener(POS_CART_ITEM_ADDED, handleAutoAddTrack);
    };
  }, []);

  // Detect repeat scans: when a single search result resolves to a deal that's
  // already in the cart, dispatch an event the cart-side AddToCart components
  // listen for (they have the accurate qty and own the increment/overwrite).
  const repeatScanFiredRef = useRef<string | null>(null);
  useEffect(() => {
    const single =
      autoAddEnabled && hasSearchFilter && data.length === 1 ? data[0] : null;
    if (!single) {
      repeatScanFiredRef.current = null;
      return;
    }
    const dealId = single._id;
    const existsInCart = cartItems.some((i: any) => i?.deal?.id === dealId);
    if (!existsInCart) {
      repeatScanFiredRef.current = null;
      return;
    }
    if (repeatScanFiredRef.current === dealId) return;
    repeatScanFiredRef.current = dealId;
    const uom = single.selectedStockUom;
    const isLooseUom = uom === "gm" || uom === "ml";
    MiscService.createEvent(POS_SCAN_INCREMENT_CART_ITEM, {
      dealId,
      scannedQty,
      isLooseUom,
    });
  }, [autoAddEnabled, hasSearchFilter, data, cartItems, scannedQty]);

  const handleProductSelect = useCallback((product: SellerDeal) => {}, []);

  const handleAddStock = useCallback((product: SellerDeal) => {
    setAddStockModal({ show: true, data: product });
  }, []);

  const handleAddStockModal = useCallback(
    async ({ action, product }: { action: string; product?: any }) => {
      setAddStockModal({ show: false, data: null });
      // On success replace the deal with the refreshed one so its updated stock
      // (maxQty) makes the add-to-cart action available immediately.
      if (action === "submit" && product) {
        // Quick-checkout B2B fulfills like B2C, so it must use sellable stock
        // without adding the reserved quantity on top.
        const isB2b =
          (customerType || "").toLowerCase() === "b2b" && !quickCheckout;
        // Re-fetch the deal through the grid's own pipeline so it gets the
        // same formatting (buyer view, case stock ignored for b2c) and the
        // same cart merge (inCart + maxQty reduced by the carted qty, with
        // origMaxQty kept as the full stock). The modal's refreshed deal is
        // formatted with defaults and no POS-cart merge, which reported
        // case-qty stock and dropped the In Cart state.
        let fresh: PosBillingDeal | null = null;
        try {
          const result = await getData(
            { filter: { dealId: product._id } },
            customerType === "b2c" ? true : false,
            !(isB2b || assisted),
          );
          fresh = (result?.[0] as PosBillingDeal) || null;
        } catch (e) {
          fresh = null;
        }
        setData((prev) =>
          prev.map((item) => {
            if (item._id !== product._id) return item;
            const next: PosBillingDeal = fresh
              ? { ...fresh }
              : { ...item, ...product };
            // Safety net: if the cart merge didn't mark it, never lose the
            // In Cart state the grid already knows about.
            const inCartQty = item.inCart?.qty || 0;
            if (inCartQty > 0 && (next.inCart?.qty || 0) <= 0) {
              next.inCart = item.inCart;
              if (!isB2b) {
                next.origMaxQty = next.maxQty || 0;
                next.maxQty = Math.max(0, (next.maxQty || 0) - inCartQty);
              }
            }
            return next;
          }),
        );
        // Notify the billing route so it refreshes the cart, since cart items
        // carry an availableStock cap that is now stale.
        MiscService.createEvent(POS_STOCK_ADDED, {
          dealId: product._id,
        });
      }
    },
    [customerType, quickCheckout, assisted],
  );

  return (
    <div className="tw:space-y-6 tw:w-full">
      {/* Filter Sidebar */}

      <Filter
        callback={onFilterChange}
        cartId={cartId}
        onKeypadClick={onKeypadClick}
        hideAutoAdd={assisted}
      />

      {/* Products Grid — only rendered once a barcode/name search or filter is
          active, so the scan/search panel stands alone by default. */}
      {hasQuery && (
        <>
          <ProductGrid
            data={data}
            loading={loading}
            onProductSelect={handleProductSelect}
            cartId={cartId}
            customerType={customerType}
            quickCheckout={quickCheckout}
            assisted={assisted}
            onAddStock={handleAddStock}
            hasSearchFilter={hasSearchFilter}
            searchBy={searchBy}
            autoAdd={
              autoAddEnabled &&
              hasSearchFilter &&
              data.length === 1 &&
              !cartItems.some((i: any) => i?.deal?.id === data[0]?._id) &&
              !data[0]?.inCart?.status &&
              justAutoAdded.current !== data[0]?._id
            }
            scannedQty={scannedQty}
          />

          {/* Load More Button */}
          {hasMoreData && !loading && (
            <div className="tw:text-center tw:mt-6">
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

      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        currentStock={addStockModal.data?.actualMaxQty}
        barcodes={addStockModal.data?.barcodes}
        selectedStockUom={addStockModal.data?.selectedStockUom}
        showCommission={false}
        callback={handleAddStockModal}
      />
    </div>
  );
};

export default Products;
