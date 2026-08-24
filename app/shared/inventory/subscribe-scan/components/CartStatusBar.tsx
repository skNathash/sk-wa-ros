import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";

import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import useTheme from "~/hooks/useTheme";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";
import SubscribeCartBar from "~/shared/inventory/components/subscribe-cart-bar/SubscribeCartBar";

type Props = {
  className?: string;
  /**
   * theme-2 mobile: show the cart as the pinned footer bar. Pages that already
   * pin a footer of their own (bulk scan's Review bar) pass `false` so the two
   * don't stack on top of each other — there the strip simply stays hidden.
   */
  theme2Footer?: boolean;
};

// Shared subscription-cart status bar for the barcode scan flows (single and
// bulk). Self-contained: fetches its own count and keeps it live. The
// subscribe-item-* events are dispatched on `document` (MiscService.createEvent),
// so we listen there — not on `window`.
//
// theme-2 doesn't carry the inline strip at all: the scan page is a working
// surface and an in-flow banner competes with the results below it. On mobile
// the cart moves to the pinned footer bar instead (the same one the subscribe
// layout uses); on desktop the side pane already carries the cart, so nothing
// renders here.
const CartStatusBar: React.FC<Props> = ({
  className = "",
  theme2Footer = true,
}) => {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const [count, setCount] = useState(0);
  const [value, setValue] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { totalCount, cartValue }: any =
        await InventorySubscribeService.getCartAndPendingCount();
      setCount(totalCount);
      setValue(cartValue || 0);
      return;
    } catch (e) {
      // fall through to local cart
    }
    const local = InventorySubscribeService.getLocalCart() || [];
    setCount(local.length);
    setValue(0);
  }, []);

  useEffect(() => {
    refresh();
    document.addEventListener("subscribe-item-added", refresh);
    document.addEventListener("subscribe-item-removed", refresh);
    MiscService.listenEvent("create-pending-updated", refresh);
    return () => {
      document.removeEventListener("subscribe-item-added", refresh);
      document.removeEventListener("subscribe-item-removed", refresh);
      MiscService.removeEventListener("create-pending-updated", refresh);
    };
  }, [refresh]);

  if (count <= 0) return null;

  const openCart = () => appNav.to("/dashboard/inventory/subscribe/cart");

  if (isTheme2) {
    // Mobile gets the pinned footer bar; desktop gets nothing (side pane).
    return isMobile && theme2Footer ? (
      <SubscribeCartBar count={count} amount={value} onView={openCart} />
    ) : null;
  }

  return (
    <button
      type="button"
      onClick={() => appNav.to("/dashboard/inventory/subscribe/cart")}
      className={`tw:w-full tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-3 tw:py-1.5 tw:rounded-lg tw:bg-orange-50/60 tw:border tw:border-orange-100 tw:text-gray-700 hover:tw:bg-orange-50 tw:transition-colors tw:cursor-pointer ${className}`}
    >
      <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
        <ShoppingBag className="tw:w-3.5 tw:h-3.5 tw:text-orange-500 tw:shrink-0" />
        <span className="tw:text-xs tw:font-medium tw:text-left tw:truncate">
          {count} {count === 1 ? "product" : "products"} in your Subscription
          Cart
        </span>
      </span>
      <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-semibold tw:text-orange-600 tw:shrink-0 tw:whitespace-nowrap">
        View cart
        <ArrowRight className="tw:w-3.5 tw:h-3.5 tw:shrink-0" />
      </span>
    </button>
  );
};

export default CartStatusBar;
