import { Calendar, Eye, Tag, Layers, Hash, Percent, Package, TrendingUp, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppPopover from "~/components/core/popover/AppPopover";
import DealSummaryPopover from "~/components/feature/inventory/popover/deal-sales-summary/DealSummaryPopover";
import DealScopeBadge from "~/shared/inventory/components/DealScopeBadge";
import type { SellerDeal } from "~/types/CommonTypes";

interface ProductMobileItemPopoverProps {
  data: SellerDeal;
}

const ProductMobileItemPopover = ({ data }: ProductMobileItemPopoverProps) => {
  const { t } = useTranslation(["common"]);
  const stockQty = data.actualMaxQty ?? 0;
  const isOutOfStock = stockQty === 0;

  return (
    <div className="tw:w-60 tw:space-y-2 tw:text-xs">
      {/* 1. Stock Status - Highly visual & compact */}
      <div
        className={`tw:flex tw:items-center tw:gap-2 tw:p-2 tw:rounded-lg tw:border ${
          isOutOfStock
            ? "tw:bg-red-50 tw:border-red-100 tw:text-red-700"
            : "tw:bg-emerald-50 tw:border-emerald-100 tw:text-emerald-700"
        }`}
      >
        <div
          className={`tw:p-1.5 tw:rounded-md ${
            isOutOfStock ? "tw:bg-red-100/70" : "tw:bg-emerald-100/70"
          }`}
        >
          <Package className="tw:w-4 tw:h-4" />
        </div>
        <div className="tw:flex-1">
          <div className="tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wider tw:opacity-75">
            {t("stock")}
          </div>
          <div className="tw:text-xs tw:font-extrabold tw:leading-tight">
            {stockQty} {t("units")}
          </div>
        </div>
        <div>
          {isOutOfStock ? (
            <span className="tw:text-[9px] tw:font-extrabold tw:bg-red-600 tw:text-white tw:px-1.5 tw:py-0.5 tw:rounded-md">
              OUT
            </span>
          ) : (
            <span className="tw:text-[9px] tw:font-extrabold tw:bg-emerald-600 tw:text-white tw:px-1.5 tw:py-0.5 tw:rounded-md">
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* 2. Critical Expiry Warning */}
      {data._raw?.nearExpiry?.desc && (
        <div className="tw:flex tw:items-start tw:gap-2 tw:p-2 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:text-amber-800">
          <Calendar className="tw:w-4 tw:h-4 tw:text-amber-600 tw:flex-shrink-0 tw:mt-0.5" />
          <div className="tw:flex-1">
            <span className="tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-amber-800 block">
              Expiry Warning
            </span>
            <span className="tw:text-[11px] tw:leading-normal block">
              {data._raw.nearExpiry.desc}
            </span>
          </div>
        </div>
      )}

      {/* 3. Product details (Brand, Category, Menu, Type) */}
      <div className="tw:bg-slate-50/70 tw:p-2 tw:rounded-lg tw:border tw:border-slate-100 tw:space-y-1.5">
        {/* Brand */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500">
            <Tag className="tw:w-3 tw:h-3" />
            <span className="tw:text-xs">{t("brand")}</span>
          </div>
          <span className="tw:font-semibold tw:text-slate-800 tw:truncate tw:max-w-[120px]">
            {data.brand?.name || "--"}
          </span>
        </div>

        {/* Category */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500">
            <Layers className="tw:w-3 tw:h-3" />
            <span className="tw:text-xs">{t("category")}</span>
          </div>
          <span className="tw:font-semibold tw:text-slate-800 tw:truncate tw:max-w-[120px]">
            {data.category?.name || "--"}
          </span>
        </div>

        {/* Menu */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500">
            <Info className="tw:w-3 tw:h-3" />
            <span className="tw:text-xs">{t("menu")}</span>
          </div>
          <span className="tw:font-semibold tw:text-slate-800 tw:truncate tw:max-w-[120px]">
            {data.menu?.name || "--"}
          </span>
        </div>

        {/* Type / Local Badge */}
        {data.isLocalDeal && (
          <div className="tw:flex tw:items-center tw:justify-between tw:pt-1.5 tw:border-t tw:border-slate-200/50">
            <span className="tw:text-slate-500">{t("type")}</span>
            <DealScopeBadge isLocalDeal={data.isLocalDeal} size="xs" />
          </div>
        )}
      </div>

      {/* 4. GST & HSN Codes (Side-by-side grid) */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-1.5">
        {/* GST */}
        <div className="tw:bg-slate-50/70 tw:p-1.5 tw:rounded-lg tw:border tw:border-slate-100 tw:flex tw:items-center tw:justify-between">
          <span className="tw:text-slate-500">{t("gst")}</span>
          <span className="tw:font-bold tw:text-slate-800">
            {data.gst ? `${data.gst}%` : "--"}
          </span>
        </div>

        {/* HSN */}
        <div className="tw:bg-slate-50/70 tw:p-1.5 tw:rounded-lg tw:border tw:border-slate-100 tw:flex tw:items-center tw:justify-between">
          <span className="tw:text-slate-500">{t("hsn")}</span>
          <span className="tw:font-bold tw:text-slate-800 tw:truncate tw:max-w-[65px]">
            {data.hsn || "--"}
          </span>
        </div>
      </div>

      {/* 5. ID (Compact) */}
      <div className="tw:bg-slate-50/70 tw:p-1.5 tw:rounded-lg tw:border tw:border-slate-100 tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500">
          <Hash className="tw:w-3 tw:h-3" />
          <span>{t("id")}</span>
        </div>
        <span className="tw:font-semibold tw:text-slate-700 tw:font-mono">
          {data.id || "--"}
        </span>
      </div>

      {/* 6. Activity & Movement */}
      <div className="tw:bg-slate-50/70 tw:p-2 tw:rounded-lg tw:border tw:border-slate-100 tw:space-y-2">
        {/* Movement */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500">
            <TrendingUp className="tw:w-3 tw:h-3" />
            <span>{t("movement")}</span>
          </div>
          <AppBadge
            variant={data._movementTypeColor || "light"}
            className="tw:text-[10px] tw:font-bold tw:py-0 tw:px-1.5 tw:rounded-full"
          >
            {data.movementType || t("normal")}
          </AppBadge>
        </div>

        {/* Sales Activity */}
        <div className="tw:flex tw:items-center tw:justify-between tw:pt-1.5 tw:border-t tw:border-slate-200/50">
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-slate-500">
            <Eye className="tw:w-3 tw:h-3" />
            <span>{t("activity")}</span>
          </div>

          <AppPopover
            triggerContent={
              <button className="tw:cursor-pointer tw:flex tw:items-center tw:gap-1 tw:bg-white tw:hover:tw:bg-slate-100 tw:border tw:border-slate-200 tw:px-1.5 tw:py-0.5 tw:rounded-md tw:text-[11px] tw:font-bold tw:text-slate-700 tw:transition-colors tw:shadow-xs">
                <span>{data.salesAnalytics?.last7Days?.quantity || 0} {t("units")}</span>
                <Info size={10} className="tw:text-slate-400" />
              </button>
            }
            side="top"
            align="end"
          >
            <div className="tw:p-2 tw:min-w-[200px]">
              <DealSummaryPopover salesAnalytics={data.salesAnalytics} />
            </div>
          </AppPopover>
        </div>
      </div>
    </div>
  );
};

export default ProductMobileItemPopover;
