import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import MiscService from "~/services/MiscService";

const CART_PATH = "/dashboard/inventory/subscribe/cart";

interface SubscribeCartCardProps {
  className?: string;
}

/**
 * The subscribe cart, as a single filled card for the side pane. It carries the
 * count of what's staged plus the one line that explains where those SKUs land
 * after subscribing, and opens the cart page. Counts come from the same source
 * as the cart FAB — `getCartAndPendingCount` (cart lines + pending AI barcode
 * items), with the local cart as the fallback, refreshed on the same events —
 * so the pane and the FAB never disagree. Renders nothing when the cart is
 * empty; an empty card would just take the pane's room without saying anything.
 */
const SubscribeCartCard = ({ className }: SubscribeCartCardProps) => {
  const appNav = useAppNav();
  const [count, setCount] = useState(0);

  const fetchCartDetails = useCallback(async () => {
    try {
      const { totalCount } =
        await InventorySubscribeService.getCartAndPendingCount();
      setCount(totalCount);
    } catch (error) {
      console.error("Error fetching cart details:", error);
      setCount(InventorySubscribeService.getLocalCart()?.length || 0);
    }
  }, []);

  useEffect(() => {
    fetchCartDetails();

    document.addEventListener("subscribe-item-added", fetchCartDetails);
    document.addEventListener("subscribe-item-removed", fetchCartDetails);
    MiscService.listenEvent("create-pending-updated", fetchCartDetails);

    return () => {
      document.removeEventListener("subscribe-item-added", fetchCartDetails);
      document.removeEventListener("subscribe-item-removed", fetchCartDetails);
      MiscService.removeEventListener(
        "create-pending-updated",
        fetchCartDetails,
      );
    };
  }, [fetchCartDetails]);

  if (!count) return null;

  const headline = `${count} SKU${count === 1 ? "" : "s"}`;

  return (
    <div
      // Brand greens straight off the theme tokens: theme-2 rewrites the
      // emerald/green Tailwind utilities to its bright success fill, which is
      // the wrong green for a filled surface like this one.
      style={{
        backgroundImage:
          "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, #000) 100%)",
      }}
      className={clsx(
        "tw:rounded-2xl tw:px-4 tw:py-3.5 tw:text-white tw:shadow-sm",
        className,
      )}
    >
      <div className="tw:flex tw:items-start tw:gap-3">
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/70">
            Subscribe Cart
          </p>
          <p className="tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:leading-snug tw:tabular-nums">
            {headline}
          </p>
        </div>

        <button
          type="button"
          onClick={() => appNav.to(CART_PATH)}
          style={{ backgroundColor: "var(--primary-2)" }}
          className="tw:flex tw:shrink-0 tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-[13px] tw:font-bold tw:text-white tw:transition-opacity tw:duration-150 tw:hover:opacity-90 tw:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-white/70"
        >
          Load
          <ArrowRight size={14} className="tw:shrink-0" />
        </button>
      </div>

      <p className="tw:mt-2 tw:text-[13px] tw:leading-snug tw:text-white/85">
        Add SKUs here, then subscribe in one go — they land in All Items ready to
        price
      </p>
    </div>
  );
};

export default SubscribeCartCard;
