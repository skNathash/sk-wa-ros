import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BadgePercent,
  Package,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import CartTotalBanner, {
  type CartTotalChip,
} from "~/shared/catalog/components/cart-total-banner/CartTotalBanner";
import type { SellerData } from "../types";

/**
 * Top-of-cart summary strip. Receives the raw cart data and owns all of its
 * calculations so the page only has to pass `sellers` down.
 *
 * - Grand total: purchase-price value of all items, net of coupon discounts.
 * - You save: retailer margin (MRP − purchase price) plus coupon discounts.
 * - Payable now: amount that must be paid immediately — the prepaid amount
 *   entered for sellers whose selected payment is PREPAID.
 * - On PayLater: only what sellers who actually picked PAYLATER carry; sellers
 *   with no payment mode chosen yet count towards neither figure.
 */

interface StatDef {
  key: string;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: React.ReactNode;
  valueClass: string;
  subtext?: React.ReactNode;
}

const CartSummary = ({ sellers }: { sellers: SellerData[] }) => {
  const { t } = useTranslation();

  const summary = useMemo(() => {
    let grandTotal = 0;
    let saved = 0;
    let payableNow = 0;
    let onPaylater = 0;
    let totalItems = 0;

    (sellers || []).forEach((seller) => {
      let sellerTotal = 0;

      (seller.items || []).forEach((item) => {
        const qty = item.actualQuantity || 0;
        sellerTotal += item.purchasePrice * qty;
        saved += Math.max((item.mrp - item.purchasePrice) * qty, 0);
        totalItems += qty;
      });

      const couponDiscount = seller.couponInfo?.totalCouponDiscount ?? 0;
      saved += couponDiscount;
      grandTotal += Math.max(sellerTotal - couponDiscount, 0);

      const sellerNet = Math.max(sellerTotal - couponDiscount, 0);
      const paymentType = (
        seller.selectedPayment?.paymentType || ""
      ).toUpperCase();
      // Fall back to the seller's net total when no explicit amount is set.
      const enteredAmount =
        Number(seller.selectedPayment?.paymentMode?.amount) || 0;
      const paidAmount = enteredAmount > 0 ? enteredAmount : sellerNet;

      if (paymentType === "PREPAID") {
        payableNow += paidAmount;
      } else if (paymentType === "PAYLATER") {
        onPaylater += paidAmount;
      }
    });

    return {
      totalSellers: (sellers || []).length,
      totalItems,
      grandTotal,
      saved,
      payableNow,
      onPaylater,
    };
  }, [sellers]);

  const stats: StatDef[] = [
    {
      key: "totalSellers",
      label: t("totalSellers", { defaultValue: "Total Sellers" }),
      icon: Store,
      iconBg: "tw:bg-blue-100",
      iconColor: "tw:text-blue-700",
      value: summary.totalSellers,
      valueClass: "tw:text-slate-900",
    },
    {
      key: "grandTotal",
      label: t("grandTotal", { defaultValue: "Grand Total" }),
      icon: Package,
      iconBg: "tw:bg-slate-100",
      iconColor: "tw:text-slate-700",
      value: <Amount value={summary.grandTotal} decimalPlaces={2} />,
      valueClass: "tw:text-slate-900",
    },
    {
      key: "saved",
      label: t("youSave", { defaultValue: "You Save" }),
      icon: BadgePercent,
      iconBg: "tw:bg-green-100",
      iconColor: "tw:text-green-700",
      value: <Amount value={summary.saved} decimalPlaces={2} />,
      valueClass: "tw:text-green-700",
      subtext: t("vsMrp", { defaultValue: "vs MRP" }),
    },
    {
      key: "payableNow",
      label: t("payableNow", { defaultValue: "Payable Now" }),
      icon: Wallet,
      iconBg: "tw:bg-violet-100",
      iconColor: "tw:text-violet-700",
      value: <Amount value={summary.payableNow} decimalPlaces={2} />,
      valueClass: "tw:text-violet-700",
      subtext:
        summary.onPaylater > 0 ? (
          <>
            {t("onPaylater", { defaultValue: "on PayLater" })}{" "}
            <Amount
              value={summary.onPaylater}
              decimalPlaces={2}
              className="tw:font-semibold"
            />
          </>
        ) : undefined,
    },
  ];

  // Phone chips: the two counts plus the saving, in the order they qualify the
  // total — what it saves, what it covers, who it's split across.
  const chips: CartTotalChip[] = [
    {
      key: "saved",
      tone: "accent",
      label: (
        <>
          {t("save", { defaultValue: "Save" })}{" "}
          <Amount value={summary.saved} decimalPlaces={2} />{" "}
          {t("vsMrp", { defaultValue: "vs MRP" })}
        </>
      ),
    },
    {
      key: "items",
      label: `${summary.totalItems} ${t("items", { defaultValue: "items" })}`,
    },
    {
      key: "sellers",
      label: `${summary.totalSellers} ${t("sellers", { defaultValue: "sellers" })}`,
    },
  ];

  // Two shapes for two widths. Phones get the single banner — one figure to
  // land on, the rest as chips; desktop keeps a card per figure, where each
  // stat is an independent reading of the cart and there's room to compare
  // them side by side.
  return (
    <>
      <CartTotalBanner
        label={t("grandTotal", { defaultValue: "Grand Total" })}
        amount={summary.grandTotal}
        chips={chips}
        className="tw:md:hidden"
      />

      <div className="tw:hidden tw:md:grid tw:md:grid-cols-4 tw:md:gap-3">
        {stats.map((stat) => (
          <AppCard key={stat.key} noPadding className="tw:mb-0 tw:border-0">
            <div className="tw:flex tw:items-start tw:gap-2.5 tw:p-2.5">
              <div
                className={`tw:shrink-0 tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full ${stat.iconBg}`}
              >
                <stat.icon size={16} className={stat.iconColor} />
              </div>
              <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
                <span className="app-section-label tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                  {stat.label}
                </span>
                <span
                  className={`tw:text-base tw:font-bold tw:leading-tight tw:tabular-nums ${stat.valueClass}`}
                >
                  {stat.value}
                </span>
                {stat.subtext && (
                  <span className="tw:text-[10px] tw:text-gray-500 tw:leading-tight">
                    {stat.subtext}
                  </span>
                )}
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </>
  );
};

export default CartSummary;
