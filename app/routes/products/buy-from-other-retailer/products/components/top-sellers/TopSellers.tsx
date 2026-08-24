import { useEffect, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import { DEFAULT_BROWSE_DISTANCE, EVENTS } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import MiscService from "~/services/MiscService";
import SellerBlock from "./SellerBlock";
import {
  getCartValueBySeller,
  getSellersWithCartValue,
  type Seller,
} from "./helper";

// "Shop by seller" — the busiest nearby sellers, each shown as a shop block
// with its own catalog rail underneath and the buyer's open cart value with
// that seller.

type Props = {
  distance?: string | number;
};

const TopSellers = ({ distance = DEFAULT_BROWSE_DISTANCE }: Props) => {
  const { to } = useAppNav();
  const [sellers, setSellers] = useState<Seller[]>([]);

  useEffect(() => {
    let active = true;

    const loadSellers = async () => {
      try {
        const data = await getSellersWithCartValue(distance);
        if (active) setSellers(data);
      } catch (err) {
        console.error("Error loading top sellers", err);
      }
    };

    loadSellers();

    return () => {
      active = false;
    };
  }, [distance]);

  // Keep the "in cart" values honest while the buyer adds/removes from the rails.
  useEffect(() => {
    const refreshCartValues = async () => {
      try {
        const cartValues = await getCartValueBySeller();
        setSellers((prev) =>
          prev.map((seller) => ({
            ...seller,
            totalCartValue: cartValues[seller._id] || 0,
          })),
        );
      } catch (err) {
        console.error("Error refreshing seller cart values", err);
      }
    };

    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, refreshCartValues);
    MiscService.listenEvent(EVENTS.CART_ITEM_UPDATED, refreshCartValues);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, refreshCartValues);

    return () => {
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_ADDED,
        refreshCartValues,
      );
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_UPDATED,
        refreshCartValues,
      );
      MiscService.removeEventListener(
        EVENTS.CART_ITEM_REMOVED,
        refreshCartValues,
      );
    };
  }, []);

  const handleEnterShop = (seller: Seller) => {
    to(`/products/buy-from-other-retailer/retailer/${seller._id}`, {
      tab: "catalog",
    });
  };

  if (sellers.length === 0) return null;

  return (
    <div className="tw:mb-6">
      <div className="tw:mb-3 tw:flex tw:items-start tw:justify-between tw:gap-2">
        <div>
          <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
            Shop by Seller
          </h2>
          <p className="tw:mt-0.5 tw:text-[12px] tw:text-slate-500">
            Walk into each seller's shop — see their catalog, cheapest SKUs, and
            connect for PayLater terms
          </p>
        </div>
        <AppButton
          fill="clear"
          size="small"
          onClick={() =>
            to("/products/buy-from-other-retailer/retailers", {
              distance,
              sort: "topSellers",
            })
          }
          className="tw:h-auto tw:shrink-0 tw:gap-0.5 tw:px-0 tw:py-0 tw:text-[13px]! tw:font-semibold tw:text-primary tw:hover:bg-transparent"
        >
          See all <span aria-hidden>→</span>
        </AppButton>
      </div>

      <div className="tw:flex tw:flex-col tw:gap-4">
        {sellers.map((seller, index) => (
          <SellerBlock
            key={seller._id}
            seller={seller}
            index={index}
            onEnterShop={handleEnterShop}
          />
        ))}
      </div>
    </div>
  );
};

export default TopSellers;
