import { useCallback, useEffect, useState } from "react";
import { ArrowRight, ShoppingBag } from "lucide-react";

import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";

type Props = {
  className?: string;
};

// Shared subscription-cart status bar for the barcode scan flows (single and
// bulk). Self-contained: fetches its own count and keeps it live. The
// subscribe-item-* events are dispatched on `document` (MiscService.createEvent),
// so we listen there — not on `window`.
const CartStatusBar: React.FC<Props> = ({ className = "" }) => {
  const appNav = useAppNav();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { totalCount }: any =
        await InventorySubscribeService.getCartAndPendingCount();
      setCount(totalCount);
      return;
    } catch (e) {
      // fall through to local cart
    }
    const local = InventorySubscribeService.getLocalCart() || [];
    setCount(local.length);
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
