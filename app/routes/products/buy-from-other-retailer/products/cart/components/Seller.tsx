import React, { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Trash2, CheckCircle2 } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import ProductItem from "./ProductItem";
import type { SellerData } from "../types";
import KeyValue from "~/components/core/key-value/KeyValue";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import PaymentMode from "./PaymentMode";
import RouteInfo from "./RouteInfo";
import ApplyCoupon from "./ApplyCoupon";

interface SellerProps {
  seller: SellerData;
  callback: (a: { action: string; data: any }) => void;
}

const Seller: React.FC<SellerProps> = ({ seller, callback }) => {
  const [showAllProducts, setShowAllProducts] = useState(false);

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

  const handleCallback = ({ action, data }: { action: string; data: any }) => {
    if (action === "remove") {
      callback({
        action,
        data: {
          deal: data,
          cartId: seller._id,
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

  const hasRouteData = Boolean(
    seller.selectedRoute?.routeId ||
    seller.routeInfo?.routeId ||
    seller.routeInfo?.parentRoutes?.length,
  );

  return (
    <AppCard noPadding>
      {/* Seller Header */}
      <div className="tw:bg-linear-to-r tw:from-primary/5 tw:to-primary/10 tw:p-3 tw:border-b tw:border-primary/20">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-4">
          <div className="tw:flex-1">
            <KeyValue
              label="Seller Name"
              size="sm"
              valueClassName="tw:font-semibold tw:text-gray-900"
            >
              <AppLink
                href={`/products/buy-from-other-retailer/retailer/${seller.franchiseInfo.id}`}
                asLink
              >
                {seller.franchiseInfo.name}
              </AppLink>
            </KeyValue>
          </div>

          <div className="tw:shrink-0 tw:flex tw:flex-col tw:items-end tw:justify-center tw:gap-1">
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600 tw:font-medium">
              <MapPin size={12} strokeWidth={2.5} />
              {seller.franchiseInfo.distance || 0} km
            </span>

            {(seller.selectedRoute?.deliveryDate ||
              seller.routeInfo?.deliveryDate) && (
              <span className="tw:inline-flex tw:items-center tw:text-[11px] tw:text-gray-600 tw:mt-1">
                Delivery by:{" "}
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
            )}
          </div>
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
        {/* View more/less moved to footer (right side) */}

        {seller.items.length > 1 && (
          <div className="tw:text-center tw:my-1">
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="tw:inline-flex tw:items-center tw:text-primary tw:text-xs tw:font-medium hover:tw:text-primary/80"
            >
              {showAllProducts ? (
                <>
                  View Less <ChevronUp className="tw:ml-1 tw:w-4 tw:h-4" />
                </>
              ) : (
                <>
                  View More ({seller.items.length - 1})
                  <ChevronDown className="tw:ml-1 tw:w-4 tw:h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Coupon Section */}
      <div className="tw:px-4 tw:py-2.5 tw:border-t tw:border-gray-200">
        <ApplyCoupon
          cartId={seller._id}
          couponInfo={couponInfo}
          callback={handleCallback}
        />
      </div>

      {/* Payment Mode Section */}
      <div className="tw:p-2 tw:border-t tw:border-gray-200 tw:bg-gray-50">
        <PaymentMode
          payments={seller.payments}
          orderAmount={payableSubtotal}
          selectedPayment={(seller as any).selectedPayment}
          callback={handleCallback}
          sellerName={seller.franchiseInfo.name}
          sellerFid={seller.franchiseInfo.id}
        />
      </div>

      {/* Footer with Subtotal and Actions */}
      <div className="tw:px-4 tw:py-3 tw:border-t tw:border-gray-200 tw:bg-white">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
          <div className="tw:flex tw:items-baseline tw:gap-x-3 tw:gap-y-1 tw:flex-wrap tw:min-w-0">
            <span className="tw:text-xs tw:text-gray-600 tw:font-medium">
              {seller.items.length} item
              {seller.items.length !== 1 ? "s" : ""}
            </span>
            <span className="tw:text-sm tw:font-semibold tw:text-gray-700">
              Subtotal:
            </span>
            {couponApplied && couponDiscount > 0 ? (
              <span className="tw:flex tw:items-baseline tw:gap-1.5">
                <span className="tw:text-xs tw:text-gray-400 tw:line-through">
                  <Amount value={subtotal} />
                </span>
                <span className="tw:text-base tw:font-bold tw:text-green-600">
                  <Amount value={payableSubtotal} />
                </span>
              </span>
            ) : (
              <span className="tw:text-base tw:font-bold tw:text-green-600">
                <Amount value={subtotal} />
              </span>
            )}
          </div>

          <AppButton
            color="danger"
            size="small"
            fill="outline"
            className="tw:shrink-0"
            onClick={() =>
              handleCallback({ action: "removeCart", data: seller })
            }
          >
            <Trash2 size={16} />
            Remove
          </AppButton>
        </div>

        {couponApplied && couponDiscount > 0 && (
          <div className="tw:mt-2 tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-green-700 tw:bg-green-50 tw:border tw:border-green-200 tw:px-2 tw:py-1 tw:rounded">
            <CheckCircle2 size={13} strokeWidth={2.25} className="tw:shrink-0" />
            <span>
              {couponSource}{" "}
              <span className="tw:font-semibold">{couponCode}</span> applied —
              saved <Amount value={couponDiscount} />
            </span>
          </div>
        )}

        {subtotal < seller.minCartValue && (
          <div className="tw:mt-2 tw:flex tw:items-start tw:gap-1 tw:text-xs tw:text-red-600 tw:bg-red-50 tw:px-2 tw:py-1.5 tw:rounded">
            <span className="tw:font-medium">Minimum cart value:</span>
            <span>
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
