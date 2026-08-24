import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import {
  applyQtyFieldChange,
  getProductBadgeLabel,
  getProductReceiveStatus,
  getShortQty,
  type ProductReceiveStatus,
} from "./productQtyUtils";

type ProductItemProps = {
  product: any;
  index: number;
  onEdit: (index: number) => void;
};

const statusVariant: Record<
  ProductReceiveStatus,
  "success" | "danger" | "warning"
> = {
  OK: "success",
  DAMAGED: "danger",
  SHORT: "warning",
};

/* The SKU tile carries a stable colour per item so a long list reads as
   distinct rows at a glance; OWN products keep their own rose tint. */
const skuTones = [
  "tw:bg-orange-500",
  "tw:bg-emerald-500",
  "tw:bg-red-500",
  "tw:bg-sky-500",
  "tw:bg-violet-500",
  "tw:bg-amber-500",
];

const toneFor = (key: string) => {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  return skuTones[sum % skuTones.length];
};

const ProductItem = ({ product, index, onEdit }: ProductItemProps) => {
  const { t } = useTranslation();
  const { setValue, getValues } = useFormContext();

  const status = getProductReceiveStatus(product);
  const shortQty = getShortQty(product);
  const badge = getProductBadgeLabel(product);

  const ordered = Number(product.quantity) || 0;
  const receivedQty = Number(product.formData?.receivedQty) || 0;
  const damageQty = Number(product.formData?.damageQty) || 0;
  const mrp = Number(product.mrp ?? product.formData?.mrp) || 0;
  const buyPrice = Number(product.formData?.purchasePrice) || 0;
  const brand = product.brand?.name || "";

  // Gap against what was ordered — the one number a receiver scans for. Only
  // a non-zero gap earns the chip, so a clean row stays quiet.
  const delta = receivedQty + damageQty - ordered;

  // Pack line: brand · ordered × uom · buy price per unit.
  const packParts = [
    brand,
    product.uom ? `${ordered} × ${product.uom}` : "",
    buyPrice ? `₹${buyPrice}/u` : "",
  ].filter(Boolean);

  const setReceived = (next: number) => {
    const productsList = getValues("products") || [];
    const current = productsList[index];
    if (!current) return;

    const nextFormData = applyQtyFieldChange({
      product: current,
      field: "receivedQty",
      rawValue: next,
    });

    setValue(`products.${index}.formData`, nextFormData, { shouldDirty: true });
    setValue(`products.${index}._scanned`, true, { shouldDirty: true });
  };

  return (
    <div
      className={clsx(
        // `app-bleed-x` runs the row edge to edge on theme-2 mobile: the list
        // reads as stacked bands of the receiving sheet rather than cards
        // floating in a gutter.
        "app-msg-bubble app-bleed-x tw:px-4 tw:py-3",
        product?._anim && "tw:ring-2 tw:ring-emerald-300",
      )}
    >
      <div className="tw:flex tw:items-start tw:gap-3">
        {/* Square SKU tile — reads as the item's chip in the verify list. */}
        <div
          className={clsx(
            "tw:w-10 tw:h-10 tw:rounded-xl tw:flex tw:items-center tw:justify-center tw:text-[10px] tw:font-bold tw:text-white tw:shrink-0",
            badge.tone === "own" ? "tw:bg-rose-500" : toneFor(product.dealName || ""),
          )}
        >
          {badge.label}
        </div>

        <div className="tw:flex-1 tw:min-w-0">
          <div className="tw:flex tw:items-start tw:gap-2">
            <div className="tw:flex-1 tw:min-w-0 tw:text-sm tw:font-semibold tw:leading-snug tw:line-clamp-2 tw:text-slate-900">
              <AppLink
                href={`/dashboard/inventory/products/view/${product.dealId}`}
                asLink
              >
                {product.dealName}
              </AppLink>
            </div>

            {delta !== 0 && (
              <span
                className={clsx(
                  "tw:shrink-0 tw:rounded-md tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:tabular-nums",
                  delta < 0
                    ? "tw:bg-amber-100 tw:text-amber-700"
                    : "tw:bg-emerald-100 tw:text-emerald-700",
                )}
              >
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>

          <div className="tw:mt-0.5 tw:truncate tw:text-[11px] tw:text-slate-500">
            {packParts.join(" · ")}
          </div>
        </div>
      </div>

      {/* Count row: the fixed ordered figure on the left, the received count as
          a stepper on the right — the only field this screen edits inline. */}
      <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-2">
        <div className="tw:shrink-0 tw:text-[11px] tw:text-slate-500">
          {t("ordered")}{" "}
          <span className="tw:text-sm tw:font-bold tw:text-slate-900 tw:tabular-nums">
            {ordered}
          </span>
        </div>

        <div className="tw:ml-auto tw:flex tw:h-9 tw:min-w-0 tw:flex-1 tw:items-stretch tw:overflow-hidden tw:rounded-lg tw:border tw:border-slate-200">
          <button
            type="button"
            aria-label={t("decrease", { defaultValue: "Decrease" })}
            onClick={() => setReceived(Math.max(0, receivedQty - 1))}
            disabled={receivedQty <= 0}
            className="tw:w-9 tw:shrink-0 tw:flex tw:items-center tw:justify-center tw:text-slate-500 disabled:tw:opacity-30"
          >
            <Minus className="tw:w-4 tw:h-4" />
          </button>

          <span className="tw:flex tw:flex-1 tw:min-w-0 tw:items-center tw:justify-end tw:truncate tw:pr-2 tw:text-[11px] tw:text-slate-400">
            {t("received")}
          </span>

          <span
            className={clsx(
              "tw:w-12 tw:shrink-0 tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-bold tw:tabular-nums",
              shortQty > 0
                ? "tw:bg-amber-50 tw:text-amber-700"
                : "tw:text-slate-900",
            )}
          >
            {receivedQty}
          </span>

          <button
            type="button"
            aria-label={t("increase", { defaultValue: "Increase" })}
            onClick={() => setReceived(receivedQty + 1)}
            className="tw:w-9 tw:shrink-0 tw:flex tw:items-center tw:justify-center tw:text-emerald-600"
          >
            <Plus className="tw:w-4 tw:h-4" />
          </button>
        </div>
      </div>

      {/* Everything the row still has to account for — status, the counts the
          stepper doesn't edit, identifiers — on one quiet strip with the edit
          action at its end. */}
      <div className="app-msg-meta tw:mt-2 tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-2.5 tw:py-1.5">
        <div className="tw:flex tw:min-w-0 tw:flex-wrap tw:items-center tw:gap-x-2.5 tw:gap-y-0.5 tw:text-[11px]">
          <AppBadge
            variant={statusVariant[status]}
            size="sm"
            className="tw:shrink-0 tw:rounded-full!"
          >
            {status}
          </AppBadge>
          <span className="tw:whitespace-nowrap">
            <span className="tw:opacity-70">{t("damaged")}:</span>{" "}
            <span
              className={clsx(
                "tw:font-semibold",
                damageQty > 0 && "tw:text-red-600",
              )}
            >
              {damageQty}
            </span>
          </span>
          <span className="tw:whitespace-nowrap">
            <span className="tw:opacity-70">
              {t("short", { defaultValue: "Short" })}:
            </span>{" "}
            <span
              className={clsx(
                "tw:font-semibold",
                shortQty > 0 && "tw:text-amber-600",
              )}
            >
              {shortQty}
            </span>
          </span>
        </div>

        <AppButton
          size="small"
          fill="clear"
          color="light"
          onClick={() => onEdit(index)}
          className="app-msg-action tw:h-6 tw:px-2.5 tw:font-semibold tw:shrink-0"
        >
          {status === "DAMAGED"
            ? t("capture", { defaultValue: "Capture" })
            : t("edit", { defaultValue: "Edit" })}{" "}
          →
        </AppButton>
      </div>

      <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:gap-x-2 tw:gap-y-0.5 tw:text-[11px] tw:text-slate-500">
        <span>
          {t("id")}: {product.dealRefId}
        </span>
        {mrp > 0 && (
          <span>
            <span className="tw:text-slate-300">·</span> {t("mrp")}{" "}
            <Amount value={mrp} />
          </span>
        )}
        {product.barcode && (
          <span>
            <span className="tw:text-slate-300">·</span> {t("barcode")}:{" "}
            {product.barcode}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductItem;
