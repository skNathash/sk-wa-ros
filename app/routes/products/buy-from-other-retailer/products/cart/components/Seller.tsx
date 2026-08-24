import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  X,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import ProductItem from "./ProductItem";
import type { SellerData } from "../types";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import PaymentMode from "./PaymentMode";
import SkPaymentBlock from "./SkPaymentBlock";
import RouteInfo from "./RouteInfo";
import ApplyCoupon from "./ApplyCoupon";

interface SellerProps {
  seller: SellerData;
  callback: (a: { action: string; data: any }) => void;
}

const Seller: React.FC<SellerProps> = ({ seller, callback }) => {
  const { t } = useTranslation("common");
  const [showAllProducts, setShowAllProducts] = useState(false);

  const sellerInitial = (seller.franchiseInfo.name || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const computedSubtotal = seller.items.reduce(
    (sum, item) => sum + item.purchasePrice * item.actualQuantity,
    0,
  );

  // The normalized coupon keys from the API are the single source of truth;
  // fall back to the computed subtotal only for the pre-coupon total.
  const couponInfo = seller.couponInfo;
  const couponApplied = Boolean(couponInfo?.couponApplied);
  const couponCode = couponInfo?.code || "";
  const couponSource = couponInfo?.source || "Coupon";
  const couponDiscount = couponInfo?.totalCouponDiscount ?? 0;
  const subtotal = couponInfo?.totalBeforeCoupon || computedSubtotal;
  const payableSubtotal = couponApplied
    ? (couponInfo?.totalAfterCoupon ?? Math.max(subtotal - couponDiscount, 0))
    : subtotal;

  // What this seller's basket saves against MRP, plus whatever the coupon took
  // off — the one "save" figure the header carries under the amount.
  const savings =
    seller.items.reduce(
      (sum, item) =>
        sum + Math.max((item.mrp - item.purchasePrice) * item.actualQuantity, 0),
      0,
    ) + couponDiscount;

  const handleCallback = ({ action, data }: { action: string; data: any }) => {
    if (action === "remove") {
      callback({
        action,
        data: {
          deal: data,
          cartId: seller._id,
          sellerId: seller.franchiseInfo?.id,
        },
      });
    } else {
      // Forward payment selection from PaymentMode to parent as updateSelectedPayment
      if (action === "selectPayment") {
        callback({
          action: "updateSelectedPayment",
          data: { sellerId: seller._id, selectedPayment: data.payment },
        });
        return;
      }

      callback({ action, data });
    }
  };

  // From md up the footer only exists for the coupon confirmation and the
  // minimum-cart warning; with neither it would render as an empty strip.
  const hasFooterNotes =
    (couponApplied && couponDiscount > 0) || subtotal < seller.minCartValue;

  const hasRouteData = Boolean(
    seller.selectedRoute?.routeId ||
    seller.routeInfo?.routeId ||
    seller.routeInfo?.parentRoutes?.length,
  );

  return (
    <AppCard
      noPadding
      noShadow
      className="app-thread tw:overflow-hidden tw:border-0 tw:shadow-sm"
    >
      {/* Contact bar: who this thread is with, how far and when it lands, and
          what the basket comes to. A very light grey tint separates it from the
          white item rows below without pulling focus away from them. */}
      <div className="app-seller-header tw:bg-gray-50 tw:px-3 tw:py-3 tw:md:px-4 tw:border-b tw:border-gray-200">
        <div className="tw:flex tw:items-center tw:gap-3">
          {/* Squircle avatar rather than a circle: it echoes the product tiles
              in the rows below, so the column of images reads as one shape. */}
          <div className="tw:shrink-0 tw:w-10 tw:h-10 tw:rounded-xl tw:bg-primary tw:text-white tw:flex tw:items-center tw:justify-center tw:text-[15px] tw:font-bold tw:tracking-wide">
            {sellerInitial}
          </div>

          <div className="tw:min-w-0 tw:flex-1">
            <AppLink
              href={`/products/buy-from-other-retailer/retailer/${seller.franchiseInfo.id}`}
              asLink
              className="tw:block tw:text-[15px] tw:font-bold tw:text-gray-900 tw:truncate tw:leading-tight"
            >
              {seller.franchiseInfo.name}
            </AppLink>

            <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500 tw:flex-wrap tw:leading-none">
              <span className="tw:inline-flex tw:items-center tw:gap-0.5">
                <MapPin size={12} strokeWidth={2.5} className="tw:text-gray-400" />
                {seller.franchiseInfo.distance || 0} km
              </span>

              {(seller.selectedRoute?.deliveryDate ||
                seller.routeInfo?.deliveryDate) && (
                <>
                  <span className="tw:text-gray-300">·</span>
                  <span className="tw:inline-flex tw:items-center">
                    Delivery by
                    <DateFormat
                      value={
                        seller.selectedRoute?.deliveryDate ||
                        seller.routeInfo?.deliveryDate ||
                        ""
                      }
                      formatStr="dd MMM yyyy"
                      className="tw:ml-1"
                    />
                  </span>
                </>
              )}

              {/* Item count joins the meta line rather than sitting as its own
                  badge — the right edge of the bar now belongs to the money. */}
              <span className="tw:text-gray-300">·</span>
              <span className="tw:tabular-nums">
                {seller.items.length} item{seller.items.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Payable total moves up into the contact bar on wider screens: the
              seller and what their basket costs read as one line. Phones keep
              it in the thread footer, where there's a full row for it. */}
          <div className="tw:hidden tw:md:block tw:shrink-0 tw:text-right tw:leading-tight">
            <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
              Subtotal
            </div>
            <div className="tw:flex tw:items-baseline tw:justify-end tw:gap-1.5 tw:whitespace-nowrap">
              {couponApplied && couponDiscount > 0 && (
                <span className="tw:text-xs tw:text-gray-400 tw:line-through tw:tabular-nums">
                  <Amount value={subtotal} />
                </span>
              )}
              <span className="tw:text-xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:tabular-nums">
                <Amount value={couponApplied ? payableSubtotal : subtotal} />
              </span>
            </div>
            {savings > 0 && (
              <div className="tw:mt-0.5 tw:text-[11px] tw:leading-none tw:text-gray-500 tw:tabular-nums">
                save <Amount value={savings} />
              </div>
            )}
          </div>

          {/* Removing the whole seller is a dismissal of the thread, so it sits
              as a quiet close affordance at the far edge instead of a worded
              destructive button in the footer. Outlined at md+ where it stands
              beside the total and needs an edge of its own. */}
          <button
            type="button"
            onClick={() => handleCallback({ action: "removeCart", data: seller })}
            className="tw:shrink-0 tw:-mr-1 tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-lg tw:text-gray-400 tw:transition-colors tw:cursor-pointer tw:md:mr-0 tw:md:ml-1 tw:md:border tw:md:border-gray-200 tw:hover:bg-red-50 tw:hover:text-red-600 tw:md:hover:border-red-200 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-red-500/40"
            aria-label={`Remove ${seller.franchiseInfo.name} cart`}
            title="Remove cart"
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {hasRouteData && seller.routeInfo && (
        <RouteInfo
          routeInfo={seller.routeInfo}
          selectedRoute={seller.selectedRoute}
          cartId={seller._id}
          onUpdateRoute={(routeData) =>
            handleCallback({
              action: "updateRoute",
              data: routeData,
            })
          }
        />
      )}

      {/* Items run flush inside the card, divided by hairlines. They were laid
          out as bubbles on a cream wallpaper, but inset rows made each seller
          card read as two nested cards and stole the width the price column
          needs. */}
      <div>
        {seller.items
          .slice(0, showAllProducts ? seller.items.length : 1)
          .map((item) => (
            <ProductItem
              key={item._id}
              item={item}
              callback={handleCallback}
              cartId={seller._id}
              sellerId={seller.franchiseInfo.id}
            />
          ))}
      </div>

      {seller.items.length > 1 && (
        <div className="tw:px-3 tw:md:px-4 tw:border-t tw:border-gray-100 tw:bg-white">
          <button
            onClick={() => setShowAllProducts(!showAllProducts)}
            className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-primary tw:text-xs tw:font-semibold tw:hover:text-primary/80 tw:py-2 tw:transition-colors tw:cursor-pointer"
          >
            {showAllProducts ? (
              <>
                View Less <ChevronUp className="tw:w-4 tw:h-4" />
              </>
            ) : (
              <>
                View More ({seller.items.length - 1})
                <ChevronDown className="tw:w-4 tw:h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Coupon Section */}
      <div className="tw:px-3 tw:py-2.5 tw:md:px-4 tw:border-t tw:border-gray-200 tw:bg-white">
        <div className="app-section-label tw:mb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          {t("coupon", { defaultValue: "Coupon" })}
        </div>
        <ApplyCoupon
          cartId={seller._id}
          couponInfo={couponInfo}
          callback={handleCallback}
        />
      </div>

      {/* Payment Mode Section */}
      <div className="tw:px-3 tw:py-2.5 tw:md:px-4 tw:border-t tw:border-gray-200 tw:bg-gray-50/80">
        <div className="app-section-label tw:mb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
          {t("paymentMode", { defaultValue: "Payment" })}
        </div>
        {seller.isSkCart ? (
          <SkPaymentBlock
            orderAmount={payableSubtotal}
            selectedPayment={seller.selectedPayment}
            callback={handleCallback}
          />
        ) : (
          <PaymentMode
            payments={seller.payments}
            orderAmount={payableSubtotal}
            selectedPayment={seller.selectedPayment}
            callback={handleCallback}
            sellerName={seller.franchiseInfo.name}
            sellerFid={seller.franchiseInfo.id}
          />
        )}
      </div>

      {/* Thread footer, on the grey ledge that closes the card. Phones read the
          seller's payable here — label, amount and saving stacked at the left
          edge where the eye lands after the rows. From md up the total has
          already been stated in the contact bar, so only the coupon
          confirmation and the minimum-cart warning remain. */}
      <div
        className={`app-thread-footer app-thread-footer-neutral tw:px-3 tw:py-2.5 tw:md:px-4 tw:border-t tw:border-gray-200 tw:bg-gray-50 ${
          hasFooterNotes ? "" : "tw:md:hidden"
        }`}
      >
        {/* Phone subtotal as a ledger line: label at the left edge, amount at
            the right, the saving tucked under the amount. Stacked it read as
            two loose lines on the grey ledge. */}
        <div className="tw:md:hidden tw:flex tw:items-baseline tw:justify-between tw:gap-3">
          <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
            Subtotal
          </div>
          <div className="tw:text-right">
            <div className="tw:flex tw:items-baseline tw:justify-end tw:gap-1.5 tw:whitespace-nowrap">
              {couponApplied && couponDiscount > 0 && (
                <span className="tw:text-xs tw:text-gray-400 tw:line-through tw:tabular-nums">
                  <Amount value={subtotal} />
                </span>
              )}
              <span className="tw:text-xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:tabular-nums">
                <Amount value={couponApplied ? payableSubtotal : subtotal} />
              </span>
            </div>

            {savings > 0 && (
              <div className="tw:mt-0.5 tw:text-[11px] tw:leading-none tw:text-green-700 tw:tabular-nums">
                save <Amount value={savings} />
              </div>
            )}
          </div>
        </div>

        {/* Coupon confirmation reads at every width: on phones it follows the
            total bubble, on desktop it's what the footer is left holding once
            the total has moved into the contact bar. */}
        {couponApplied && couponDiscount > 0 && (
          <div className="tw:mt-2 tw:flex tw:items-start tw:gap-1 tw:text-[11px] tw:leading-snug tw:text-green-700 tw:md:mt-0">
            <CheckCheck
              size={13}
              strokeWidth={2.25}
              className="app-tick tw:mt-0.5 tw:shrink-0"
            />
            <span>
              {couponSource}{" "}
              <span className="tw:font-semibold">{couponCode}</span> applied —
              saved <Amount value={couponDiscount} />
            </span>
          </div>
        )}

        {subtotal < seller.minCartValue && (
          <div className="tw:mt-2 tw:flex tw:items-start tw:gap-1.5 tw:rounded-lg tw:bg-red-50 tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-red-600">
            <AlertTriangle size={13} className="tw:mt-0.5 tw:shrink-0" />
            <span>
              <span className="tw:font-semibold">Minimum cart value:</span>{" "}
              <Amount value={seller.minCartValue} />. Add{" "}
              <Amount value={seller.minCartValue - subtotal} /> more.
            </span>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Seller;
