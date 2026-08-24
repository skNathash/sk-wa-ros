import { ChevronRight, Star } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import SellerProducts from "./SellerProducts";
import { ETA_PLACEHOLDERS, type Seller } from "./helper";

// One shop in the "Shop by seller" section: a tinted header carrying the
// seller's identity, terms and open cart value, with their catalog underneath.

type Props = {
  seller: Seller;
  /** Position in the list — picks the fallback tint and placeholder terms. */
  index: number;
  onEnterShop: (seller: Seller) => void;
};

const initialOf = (name: string) => (name || "").trim().charAt(0).toUpperCase();

const SellerBlock = ({ seller, index, onEnterShop }: Props) => {
  const rating = seller.ratingsSummary?.avgRating;
  const orders = seller.orderCount || 0;
  const minOrder = Number(seller.minOrder) || 0;
  const place = seller.city || seller.town || seller.district || "";
  const cartValue = seller.totalCartValue || 0;

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-card">
      <TintTile
        index={seller._tintIndex ?? index}
        className="tw:justify-start tw:px-4 tw:py-3"
      >
        <div className="tw:flex tw:w-full tw:flex-wrap tw:items-center tw:gap-3">
          <span className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-white tw:text-lg tw:font-bold tw:text-(--tint-ink) tw:shadow-sm">
            {seller.shopImg ? (
              <ImgRender
                assetId={seller.shopImg}
                alt={seller.name}
                className="tw:h-full tw:w-full tw:object-cover"
              />
            ) : (
              (seller._initial ?? initialOf(seller.name))
            )}
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
              <AppButton
                fill="clear"
                size="small"
                onClick={() => onEnterShop(seller)}
                className="tw:h-auto tw:truncate tw:px-0 tw:py-0 tw:text-[15px]! tw:font-bold tw:text-slate-900 tw:hover:bg-transparent"
              >
                {seller.name}
              </AppButton>
              {seller._networkLbl ? (
                <AppBadge variant={seller._networkColor || "light"} size="sm">
                  {seller._networkLbl}
                </AppBadge>
              ) : null}
              {seller.paylaterInfo ? (
                <AppBadge variant="secondary" size="sm">
                  PayLater
                </AppBadge>
              ) : null}
            </div>

            {/* Meta strip — place, distance, rating, fulfilment, volume */}
            <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-[11px] tw:text-slate-600">
              {place ? <span>{place}</span> : null}
              {seller.distanceToFranchiseKm != null ? (
                <span>· {seller.distanceToFranchiseKm.toFixed(1)}km</span>
              ) : null}
              {rating != null ? (
                <span className="tw:inline-flex tw:items-center tw:gap-0.5">
                  ·
                  <Star
                    size={11}
                    className="tw:fill-amber-400 tw:text-amber-400"
                  />
                  <span className="tw:font-semibold tw:text-slate-800">
                    {rating.toFixed(1)}
                  </span>
                </span>
              ) : null}
              {minOrder > 0 ? (
                <span className="tw:inline-flex tw:items-center tw:gap-1">
                  · MOQ <Amount value={minOrder} decimalPlaces={0} />
                </span>
              ) : null}
              {orders > 0 ? <span>· {orders} orders in network</span> : null}
            </div>
          </div>

          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2">
            {cartValue > 0 ? (
              <span className="tw:inline-flex tw:items-baseline tw:gap-1 tw:rounded-lg tw:bg-white tw:px-2.5 tw:py-1.5 tw:shadow-sm">
                <Amount
                  value={cartValue}
                  className="tw:text-[13px] tw:font-bold tw:text-slate-900"
                />
                <span className="tw:text-[11px] tw:text-slate-500">
                  in cart
                </span>
              </span>
            ) : null}
            <AppButton
              fill="clear"
              size="small"
              onClick={() => onEnterShop(seller)}
              aria-label="Enter shop"
              className="tw:h-9 tw:gap-1 tw:rounded-lg tw:bg-white tw:px-2 tw:text-[12px]! tw:font-semibold tw:text-slate-800 tw:shadow-sm tw:hover:bg-slate-50 tw:lg:px-3"
            >
              <span className="tw:hidden tw:lg:inline">Enter shop</span>
              <ChevronRight className="tw:size-[18px] tw:lg:size-[13px]" />
            </AppButton>
          </div>
        </div>
      </TintTile>

      {/* The seller's catalog rail */}
      <div className="tw:px-3 tw:py-3">
        <SellerProducts sellerId={seller._id} />
      </div>
    </div>
  );
};

export default SellerBlock;
