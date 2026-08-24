import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import {
  POS_CART_ITEM_ADDED,
  POS_CART_ITEM_REMOVED,
  POS_SCAN_INCREMENT_CART_ITEM,
  POS_STOCK_ADDED,
} from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import MiscService from "~/services/MiscService";
import SellerCatalogService from "~/services/SellerCatalogService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import type { PaginationState, SellerDeal } from "~/types/CommonTypes";
import type { FnKeyItem } from "../fn-keys/FnKeys";
import Filter from "./Filter";
import type { PosBillingDeal } from "./helper";
import { getCount, getData, prepareParams } from "./helper";
import ProductGrid from "./ProductGrid";
import PosSubscribeDealModal from "../../modals/subscribe-deal/PosSubscribeDealModal";
import PosAddProductModal from "../../modals/add-product/PosAddProductModal";

type Props = {
  cartId?: string;
  customerType?: string;
  /** Retailer the B2B bill is for — sent as `buyerId` so the backend prices
   *  each deal for that buyer instead of the FE picking a price. */
  buyerId?: string;
  quickCheckout?: boolean;
  autoAddSingleResult?: boolean;
  onKeypadClick?: () => void;
  onSearchResult?: (info: { count: number; searchTerm: string }) => void;
  assisted?: boolean;
  cartItems?: any[];
  /** Theme-2 mobile: content that shares the sticky dock with the scan rail. */
  dock?: React.ReactNode;
  /** Fires when a barcode/name search or category filter becomes (in)active. */
  onQueryChange?: (active: boolean) => void;
  /** Page-level function keys printed under the scan rail (desktop till). */
  fnKeys?: FnKeyItem[];
};

const Products = ({
  cartId,
  customerType,
  buyerId,
  quickCheckout,
  autoAddSingleResult,
  onKeypadClick,
  onSearchResult,
  assisted,
  cartItems = [],
  dock,
  onQueryChange,
  fnKeys,
}: Props) => {
  const appToast = useAppToast();
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
  // Drives autoAdd on that deal's add-to-cart control after subscribe.
  const [recentlySubscribedDealId, setRecentlySubscribedDealId] = useState<
    string | null
  >(null);

  // Subscribe modal for catalog deals the seller hasn't taken on yet
  const [subscribeModal, setSubscribeModal] = useState<{
    show: boolean;
    data: SellerDeal | null;
  }>({ show: false, data: null });

  // Create-product modal — the escape hatch offered when a search finds
  // nothing in the seller's catalog or the global one.
  const [addProductModal, setAddProductModal] = useState<{
    show: boolean;
    searchTerm: string;
  }>({ show: false, searchTerm: "" });

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

  const onQueryChangeRef = useRef(onQueryChange);
  useEffect(() => {
    onQueryChangeRef.current = onQueryChange;
  }, [onQueryChange]);

  // Let the page know whether the grid currently has something to show, so a
  // docked layout can swap the product list out for the cart.
  useEffect(() => {
    onQueryChangeRef.current?.(hasQuery);
  }, [hasQuery]);

  const loadingTypeRef = useRef<"own" | "global">("own");

  // Extra params every single-deal refetch needs so the refreshed row comes
  // back priced for the same buyer the grid was listed for.
  const buyerParams = useMemo(
    () =>
      (customerType || "").toLowerCase() === "b2b" && buyerId
        ? { buyerId }
        : {},
    [customerType, buyerId],
  );

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
    loadingTypeRef.current = "own";
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(
        { ...filterRef.current, customerType, assisted, buyerId },
        paginationRef.current,
        assisted,
      );

      // Quick-checkout B2B fulfills like B2C, so it uses sellable stock from
      // SellerCatalogService and must not add the reserved quantity on top.
      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;
      let result = await getData(
        params,
        customerType === "b2c" ? true : false,
        !(isB2b || assisted),
        loadingTypeRef.current,
      );

      // The seller's own catalog has nothing for this query — fall through to
      // the global catalog right away instead of waiting for a "load more".
      if (loadingTypeRef.current === "own" && !(result || []).length) {
        loadingTypeRef.current = "global";
        paginationRef.current = {
          ...paginationRef.current,
          activePage: 1,
          startSlNo: 1,
          endSlNo: paginationRef.current.rowsPerPage,
        };
        result = await getData(
          params,
          customerType === "b2c" ? true : false,
          !(isB2b || assisted),
          loadingTypeRef.current,
        );
      }

      setData(result || []);

      const totalRecords = await getCount(params, loadingTypeRef.current);
      paginationRef.current.totalRecords = totalRecords;
      // Own deals can still spill over into the global catalog on load-more;
      // once we're already global, stop when a short page comes back.
      setHasMoreData(
        loadingTypeRef.current === "own" ||
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
  }, [customerType, assisted, quickCheckout, buyerId]);

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
        { ...filterRef.current, customerType, assisted, buyerId },
        paginationRef.current,
        assisted,
      );
      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;

      if (
        loadingTypeRef.current === "own" &&
        (data || []).length <= paginationRef.current.totalRecords
      ) {
        loadingTypeRef.current = "global";
        const totalRecords = await getCount(params, loadingTypeRef.current);
        paginationRef.current = {
          ...paginationRef.current,
          activePage: 1,
          totalRecords: paginationRef.current.totalRecords + totalRecords,
        };
      }

      const result = await getData(
        params,
        customerType === "b2c" ? true : false,
        !(isB2b || assisted),
        loadingTypeRef.current,
      );

      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );

      if (loadingTypeRef.current === "own" && !(result || []).length) {
        loadingTypeRef.current = "global";
        const totalRecords = await getCount(params, loadingTypeRef.current);
        paginationRef.current = {
          ...paginationRef.current,
          activePage: 0,
          totalRecords: paginationRef.current.totalRecords + totalRecords,
        };
        console.log("paginationRef.current", paginationRef.current);
        loadMore();
        return;
      }
    } catch (e) {
      console.error("Error loading more data:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMoreData,
    customerType,
    assisted,
    quickCheckout,
    buyerId,
  ]);

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
      loadingTypeRef.current = "own";

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
          // Always the seller-catalog pipeline: Add stock only exists for
          // subscribed deals, and the grid may still be listing global results
          // (a deal subscribed moments ago from this same list).
          const result = await getData(
            { filter: { dealId: product._id }, ...buyerParams },
            customerType === "b2c" ? true : false,
            !(isB2b || assisted),
            "own",
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
    [customerType, quickCheckout, assisted, buyerParams],
  );

  const handleAddProduct = useCallback(() => {
    setAddProductModal({
      show: true,
      searchTerm: (filterRef.current?.search || "").trim(),
    });
  }, []);

  const addProductModalCallback = useCallback(
    async ({ action, data }: { action: string; data?: any }) => {
      setAddProductModal({ show: false, searchTerm: "" });
      if (action !== "created") return;

      const barcode = String(data?.barcode || "").trim();
      const productName = String(data?.productName || "").trim();
      const cartQty = Number(data?.cartQty) || 1;

      // Look the new product up by what it was actually created with, not by
      // the term that came up empty: the modal pre-fills the catalog's own name
      // over a typed one, so the original term may no longer match.
      const term = barcode || productName;
      if (!term) return;

      // Reset to the seller catalog — the search that came up empty had fallen
      // through to the global one.
      loadingTypeRef.current = "own";
      filterRef.current = {
        ...filterRef.current,
        search: term,
        searchBy: barcode ? "barcode" : "name",
        category: [],
        brand: [],
      };
      setSearchBy(barcode ? "barcode" : "name");
      paginationRef.current = {
        ...paginationRef.current,
        activePage: 1,
        startSlNo: 1,
        endSlNo: paginationRef.current.rowsPerPage,
      };

      // The modal collected the qty to bill; auto-add puts the single result
      // straight into the cart with it. Name search normally leaves auto-add
      // off, but here the operator has already said how many to bill.
      justAutoAdded.current = null;
      setScannedQty(cartQty);
      setAutoAddEnabled(true);
      setHasSearchFilter(true);
      setHasQuery(true);
      setHasMoreData(false);
      setData([]);
      setLoading(true);

      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;
      const params = prepareParams(
        { ...filterRef.current, customerType, assisted, buyerId },
        paginationRef.current,
        assisted,
      );

      // The deal is only searchable once the import has been written through,
      // which is not always true by the time the create call returns — so give
      // it a few tries before declaring it missing.
      let found: PosBillingDeal[] = [];
      for (let attempt = 0; attempt < 4 && found.length === 0; attempt++) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
        try {
          found = await getData(
            params,
            customerType === "b2c" ? true : false,
            !(isB2b || assisted),
            "own",
          );
        } catch (e) {
          found = [];
        }
      }

      // A name search can bring back neighbours too. Auto-add only fires on a
      // single result, so narrow to the one that was just created.
      const exact =
        found.find((d: any) =>
          barcode
            ? (d.barcodes || []).some((b: any) => String(b).trim() === barcode)
            : String(d.name || "").trim().toLowerCase() ===
              productName.toLowerCase(),
        ) || found[0];

      setData(exact ? [exact] : []);
      setLoading(false);

      if (!exact) {
        appToast.show({
          msg: `${productName} was created, but isn't billable yet. Scan or search it again in a moment.`,
          color: "warning",
        });
      }
    },
    [customerType, quickCheckout, assisted, buyerId, appToast],
  );

  const handleSubscribeClick = useCallback((product: SellerDeal) => {
    setSubscribeModal({ show: true, data: product });
  }, []);

  const subscribeModalCallback = useCallback(
    async ({ action, data: payload }: { action: string; data?: any }) => {
      setSubscribeModal({ show: false, data: null });
      if (action !== "subscribed") return;

      const dealId = payload?.dealId;
      if (!dealId) return;

      // Pull the freshly subscribed deal through the seller-catalog pipeline so
      // the row carries stock/price and flips to the add-to-cart action. Stock
      // and price were already set inside the subscribe modal. Setting
      // recentlySubscribedDealId lets ProductGrid autoAdd that row.
      const isB2b =
        (customerType || "").toLowerCase() === "b2b" && !quickCheckout;
      let fresh: PosBillingDeal | null = null;
      try {
        const result = await getData(
          { filter: { dealId }, ...buyerParams },
          customerType === "b2c" ? true : false,
          !(isB2b || assisted),
          "own",
        );
        fresh = (result?.[0] as PosBillingDeal) || null;
      } catch (e) {
        fresh = null;
      }

      const base: PosBillingDeal = {
        ...(payload?.deal || {}),
        _id: dealId,
      } as PosBillingDeal;
      const subscribed: PosBillingDeal = fresh
        ? { ...base, ...fresh, isSubscribed: true }
        : { ...base, isSubscribed: true, maxQty: 0 };

      setData((prev) =>
        prev.map((item) =>
          item._id === dealId ? { ...item, ...subscribed } : item,
        ),
      );

      MiscService.createEvent(POS_STOCK_ADDED, { dealId });
      setRecentlySubscribedDealId(dealId);
    },
    [customerType, quickCheckout, assisted, buyerParams],
  );

  /* Search results. Rendered once a barcode/name search or filter is active, so
     the scan/search panel stands alone by default. The docked layout hands them
     to Filter, which prints them inside the dock under the field; every other
     layout keeps them below the block. */
  const results = hasQuery ? (
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
        recentlySubscribedDealId={recentlySubscribedDealId}
        autoAdd={
          autoAddEnabled &&
          hasSearchFilter &&
          data.length === 1 &&
          !cartItems.some((i: any) => i?.deal?.id === data[0]?._id) &&
          !data[0]?.inCart?.status &&
          justAutoAdded.current !== data[0]?._id
        }
        scannedQty={scannedQty}
        onSubscribeClick={handleSubscribeClick}
        /* Assisted orders bill someone else's catalog, so creating a product
           into this seller's inventory isn't an option there. */
        onAddProduct={assisted ? undefined : handleAddProduct}
      />

      {/* Load More Button — an empty result has nothing to page through, so
          its "Loaded 0 / 0" line stays out of the not-found state. */}
      {hasMoreData && !loading && data.length > 0 && (
        <div className="app-prod-more tw:text-center tw:mt-6">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
          />
        </div>
      )}
    </>
  ) : null;

  return (
    <div
      className={clsx("app-billing-products tw:space-y-6 tw:w-full", {
        /* Docked layout: this wrapper and the scan block collapse to
           `display: contents` on theme-2 mobile so the sticky dock inside
           Filter can travel against the whole page column. */
        "is-docked": !!dock,
      })}
    >
      {/* Filter Sidebar */}

      <Filter
        callback={onFilterChange}
        cartId={cartId}
        onKeypadClick={onKeypadClick}
        hideAutoAdd={assisted}
        /* In the docked layout the cart takes the idle panel's place once
           there is something in it, so the two never stack. */
        idle={!hasQuery && !(dock && cartItems.length > 0)}
        dock={dock}
        results={dock ? results : undefined}
        fnKeys={fnKeys}
      />

      {!dock && results}

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

      <PosSubscribeDealModal
        show={subscribeModal.show}
        dealId={subscribeModal.data?._id}
        deal={subscribeModal.data}
        type={
          (customerType || "").toLowerCase() === "b2b" && !quickCheckout
            ? "b2b"
            : "b2c"
        }
        callback={subscribeModalCallback}
      />

      <PosAddProductModal
        show={addProductModal.show}
        searchTerm={addProductModal.searchTerm}
        searchBy={searchBy}
        callback={addProductModalCallback}
      />
    </div>
  );
};

export default Products;
