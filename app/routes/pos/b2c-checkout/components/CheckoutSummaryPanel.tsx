import clsx from "clsx";
import { ChevronDown, ChevronUp, Edit3, ShieldCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";

type Summary = {
  subtotal: number;
  couponDiscount: number;
  coinsDiscount: number;
  totalDiscount: number;
  finalPrice: number;
  orderAmount: number;
};

type Item = {
  deal?: { id?: string; name?: string };
  name?: string;
  quantity?: number;
  mrp?: number;
  purchasePrice?: number;
};

type Props = {
  items: Item[];
  summary?: Summary;
  variant?: "sidebar" | "drawer";
  onEditCart?: () => void;
  className?: string;
  discount?: number;
};

const CheckoutSummaryPanel = ({
  items,
  summary,
  variant = "sidebar",
  onEditCart,
  className,
  discount = 0,
}: Props) => {
  const { t } = useTranslation(["posbilling"]);
  const [open, setOpen] = useState(false);
  const { control } = useFormContext();
  const [redemptionValue, roundOffOrderAmount] = useWatch({
    control,
    name: ["redemptionValue", "roundOffOrderAmount"],
  });
  const redemption = redemptionValue ? Number(redemptionValue) : 0;

  const baseTotal = summary?.finalPrice ?? summary?.orderAmount ?? 0;
  const rawTotal = Math.max(0, baseTotal - redemption - discount);
  const total = roundOffOrderAmount ? Math.round(rawTotal) : rawTotal;
  const itemCount = items.length;

  if (variant === "drawer") {
    return (
      <div
        className={clsx(
          "app-osum-drawer tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:shadow-sm",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="app-osum-drawer-bar tw:flex tw:w-full tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:cursor-pointer"
        >
          <span className="tw:flex tw:items-center tw:gap-2 tw:text-sm">
            {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            <span className="app-osum-drawer-count tw:text-gray-600">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="app-osum-drawer-total tw:font-semibold tw:text-gray-900">
              · <Amount value={total} />
            </span>
          </span>
          {onEditCart && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onEditCart();
              }}
              className="app-osum-edit tw:text-primary tw:text-xs tw:flex tw:items-center tw:gap-1"
            >
              <Edit3 size={12} /> {t("editCart", "Edit cart")}
            </span>
          )}
        </button>
        {open && (
          <div className="app-osum-drawer-body tw:border-t tw:border-gray-100 tw:px-4 tw:py-3 tw:max-h-60 tw:overflow-auto">
            <SummaryBody
              items={items}
              summary={summary}
              redemption={redemption}
              roundOff={!!roundOffOrderAmount}
              discount={discount}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "app-osum tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:shadow-sm",
        className,
      )}
    >
      <div className="app-osum-head tw:flex tw:items-center tw:justify-between tw:mb-3">
        <h3 className="app-osum-title tw:text-sm tw:font-semibold">
          {t("orderSummary", "Order summary")}
          <span className="app-osum-count">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </h3>
        {onEditCart && (
          <button
            type="button"
            onClick={onEditCart}
            className="app-osum-edit tw:text-primary tw:text-xs tw:flex tw:items-center tw:gap-1 tw:cursor-pointer"
          >
            <Edit3 size={12} /> {t("editCart", "Edit cart")}
          </button>
        )}
      </div>
      <SummaryBody
        items={items}
        summary={summary}
        redemption={redemption}
        roundOff={!!roundOffOrderAmount}
        discount={discount}
      />
    </div>
  );
};

const SummaryBody = ({
  items,
  summary,
  redemption = 0,
  roundOff = false,
  discount = 0,
}: {
  items: Item[];
  summary?: Summary;
  redemption?: number;
  roundOff?: boolean;
  discount?: number;
}) => {
  const { t } = useTranslation(["posbilling"]);
  const coinsDiscountValue =
    redemption > 0 ? redemption : summary?.coinsDiscount || 0;
  const baseTotal = summary?.finalPrice ?? summary?.orderAmount ?? 0;
  const rawTotalPayable = Math.max(0, baseTotal - redemption - discount);
  const totalPayable = roundOff
    ? Math.round(rawTotalPayable)
    : rawTotalPayable;
  return (
    <>
      <div className="app-osum-items tw:max-h-48 tw:overflow-auto tw:mb-2">
        {items.map((item: any, idx: number) => {
          const name = item?.deal?.name || item?.name || "Item";
          const qty = item?.quantity || 0;
          const lineTotal =
            (Number(item?.purchasePrice) || Number(item?.mrp) || 0) * qty;
          return (
            <div
              key={item?.deal?.id || idx}
              className="app-osum-item tw:flex tw:justify-between tw:text-xs tw:py-1"
            >
              <span className="app-osum-item-name tw:truncate tw:pr-2 tw:text-gray-700">
                {name}{" "}
                <span className="app-osum-item-qty tw:text-gray-400">
                  × {qty}
                </span>
              </span>
              <span className="app-osum-item-amt tw:text-gray-800">
                <Amount value={lineTotal} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="app-osum-rows tw:border-t tw:border-gray-100 tw:pt-2 tw:space-y-1">
        <Row
          label={t("subtotal", "Subtotal")}
          value={<Amount value={summary?.subtotal || 0} />}
        />
        {(summary?.couponDiscount || 0) > 0 && (
          <Row
            label={t("couponDiscount", "Coupon discount")}
            value={
              <>
                − <Amount value={summary?.couponDiscount || 0} />
              </>
            }
            muted
          />
        )}
        {coinsDiscountValue > 0 && (
          <Row
            label={t("coinsDiscount", "Coins discount")}
            value={
              <>
                − <Amount value={coinsDiscountValue} />
              </>
            }
            muted
          />
        )}
        {(summary?.totalDiscount || 0) > 0 && (
          <Row
            label={t("totalDiscount", "Total discount")}
            value={
              <>
                − <Amount value={summary?.totalDiscount || 0} />
              </>
            }
            muted
          />
        )}
        {discount > 0 && (
          <Row
            label={t("checkoutModal.summary.cartDiscount", "Cart Discount")}
            value={
              <>
                − <Amount value={discount} />
              </>
            }
            className="tw:text-emerald-600 tw:font-semibold"
          />
        )}
      </div>
      <div className="app-osum-total tw:border-t tw:border-gray-200 tw:mt-3 tw:pt-3 tw:flex tw:justify-between tw:items-baseline">
        <div className="tw:flex tw:flex-col">
          <span className="app-osum-total-label tw:font-semibold tw:text-sm tw:text-gray-900">
            {t("total", "Total payable")}
          </span>
          <span className="app-osum-total-sub tw:text-[10px] tw:text-gray-500 tw:tracking-wide tw:uppercase">
            {t("inclusiveTaxes", "Inclusive of all taxes")}
          </span>
        </div>
        <Amount
          value={totalPayable}
          className="app-osum-total-value tw:font-bold tw:text-xl tw:text-primary tw:tabular-nums"
        />
      </div>
      <div className="app-osum-secure tw:mt-3 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-500">
        <ShieldCheck size={12} className="tw:text-emerald-600" />
        <span>{t("secureCheckout", "Secure checkout")}</span>
      </div>
    </>
  );
};

const Row = ({
  label,
  value,
  muted,
  className,
}: {
  label: string;
  value: ReactNode;
  muted?: boolean;
  className?: string;
}) => (
  <div
    className={clsx("app-osum-row tw:flex tw:justify-between tw:text-xs", className, {
      "tw:text-gray-500": muted && !className,
      "tw:text-gray-700": !muted && !className,
    })}
  >
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default CheckoutSummaryPanel;
