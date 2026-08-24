import clsx from "clsx";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import { EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import MiscService from "~/services/MiscService";
import SellerCatalogService from "~/services/SellerCatalogService";

interface SellerLine {
  id: string;
  name: string;
  total: number;
}

interface CartSummary {
  total: number;
  itemCount: number;
  savings: number;
  sellers: SellerLine[];
}

const EMPTY_SUMMARY: CartSummary = {
  total: 0,
  itemCount: 0,
  savings: 0,
  sellers: [],
};

/**
 * Rolls the raw multi-carts response into the numbers the card shows: payable
 * total, unit count, MRP savings and a per-seller line. Mirrors the maths the
 * network cart page does on the same API response.
 */
const summarise = (carts: any[]): CartSummary => {
  const sellers: SellerLine[] = [];
  let total = 0;
  let itemCount = 0;
  let mrpTotal = 0;

  (carts || []).forEach((cart: any) => {
    const items = cart?.items || [];
    if (!items.length) return;

    let sellerTotal = 0;
    items.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      sellerTotal += (Number(item.purchasePrice) || 0) * qty;
      mrpTotal += (Number(item.mrp) || 0) * qty;
      itemCount += qty;
    });

    total += sellerTotal;
    sellers.push({
      id: cart._id,
      name: cart.franchiseInfo?.name || "Seller",
      total: sellerTotal,
    });
  });

  return {
    total,
    itemCount,
    savings: Math.max(mrpTotal - total, 0),
    sellers: sellers.sort((a, b) => b.total - a.total),
  };
};

interface PurchaseCartCardProps {
  /** Max seller lines listed before the rest collapse into a "+N more" row. */
  maxSellers?: number;
  /** Optional node to render while the cart is empty; nothing renders by default. */
  emptyFallback?: React.ReactNode;
  className?: string;
}

/**
 * Purchase-cart summary block for the catalog side panes. Reads the same
 * multi-carts API the network cart page uses, and refreshes itself whenever an
 * item is added, updated or removed anywhere in the app.
 */
const PurchaseCartCard: React.FC<PurchaseCartCardProps> = ({
  maxSellers = 3,
  emptyFallback = null,
  className,
}) => {
  const appNav = useAppNav();

  const [summary, setSummary] = useState<CartSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const fetchCarts = useCallback(async () => {
    try {
      const resp = await SellerCatalogService.getMultiCarts({});
      setSummary(summarise(resp.data?.data || []));
    } catch (err) {
      console.error("Error fetching purchase cart summary:", err);
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarts();

    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, fetchCarts);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, fetchCarts);
    MiscService.listenEvent(EVENTS.CART_ITEM_UPDATED, fetchCarts);
    return () => {
      MiscService.removeEventListener(EVENTS.CART_ITEM_ADDED, fetchCarts);
      MiscService.removeEventListener(EVENTS.CART_ITEM_REMOVED, fetchCarts);
      MiscService.removeEventListener(EVENTS.CART_ITEM_UPDATED, fetchCarts);
    };
  }, [fetchCarts]);

  const openCart = () => {
    appNav.to("/products/buy-from-other-retailer/products/cart", { tab: 1 });
  };

  if (loading) {
    return (
      <div
        className={clsx(
          "skeleton-loader tw:h-36 tw:w-full tw:rounded-xl",
          className,
        )}
      />
    );
  }

  // Nothing in the cart — hide the whole block unless a fallback is supplied.
  if (!summary.sellers.length) {
    return <>{emptyFallback}</>;
  }

  const visibleSellers = summary.sellers.slice(0, maxSellers);
  const hiddenCount = summary.sellers.length - visibleSellers.length;

  return (
    <div
      className={clsx(
        "tw:rounded-xl tw:bg-primary tw:p-3 tw:text-primary-foreground tw:shadow-sm",
        className,
      )}
    >
      {/* Header — title + seller count */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <ShoppingCart className="tw:size-4 tw:shrink-0" />
        <h3 className="tw:flex-1 tw:text-sm tw:font-bold tw:leading-tight">
          Purchase Cart
        </h3>
        <span
          className="tw:shrink-0 tw:rounded-full tw:bg-white/15 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-widest"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {summary.sellers.length} sellers
        </span>
      </div>

      {/* Payable total + what it saves against MRP */}
      <Amount
        value={summary.total}
        decimalPlaces={0}
        className="tw:mt-2 tw:block tw:text-2xl tw:font-bold tw:leading-none"
      />
      <p className="tw:mt-1 tw:text-[11px] tw:text-primary-foreground/85">
        {summary.itemCount} items
        {summary.savings > 0 && (
          <>
            {" · "}save <Amount value={summary.savings} decimalPlaces={0} /> vs
            MRP
          </>
        )}
      </p>

      {/* Per-seller split */}
      <div className="tw:mt-2 tw:border-t tw:border-white/20 tw:pt-1.5">
        {visibleSellers.map((seller) => (
          <div
            key={seller.id}
            className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-0.5 tw:text-[11px]"
          >
            <span className="tw:min-w-0 tw:truncate tw:text-primary-foreground/85">
              {seller.name}
            </span>
            <Amount
              value={seller.total}
              decimalPlaces={0}
              className="tw:shrink-0 tw:font-semibold"
            />
          </div>
        ))}
        {hiddenCount > 0 && (
          <p className="tw:py-0.5 tw:text-[11px] tw:text-primary-foreground/70">
            +{hiddenCount} more {hiddenCount === 1 ? "seller" : "sellers"}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={openCart}
        className="tw:mt-2.5 tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-center tw:gap-1.5 tw:rounded-lg tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-primary tw:transition-opacity tw:hover:opacity-90"
      >
        Open cart
        <ArrowRight className="tw:size-3.5" />
      </button>
    </div>
  );
};

export default PurchaseCartCard;
