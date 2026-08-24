import clsx from "clsx";
import { Package, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import { Checkbox } from "~/components/ui/checkbox";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import ProductMoreMenu from "./ProductMoreMenu";

interface Props {
  data: {
    images?: string[];
    category?: { name: string };
    name: string;
    brand?: { name: string };
    companyName?: string;
    price: number | string;
    mrp: number;
    _id: string;
    dealId: string;
    isSubscribed?: boolean;
    isInCart?: boolean;
    itemId?: string;
    isSelected?: boolean;
    isLoading?: boolean;
    hsn?: string;
    gst?: number;
    consumerOffer?: { enabled?: boolean };
    groupDeals?: any[];
    totalSubscribed?: number;
    sellersCount?: number;
    radiusKm?: number;
  };
  index: number;
  callback: (params: { action: string; data?: any }) => void;
  showCheckbox?: boolean;
  /** 1-based position in the top-selling list; renders a rank badge when set. */
  rank?: number;
}

/**
 * theme-2 subscribe search row. A WhatsApp-style single-line-per-product card:
 * selection checkbox, image/initials thumb, name + company/brand, and a
 * trailing MRP stacked over the subscribe/remove action. Mirrors the
 * products-list ProductMobileItemTheme2 idiom so the two lists read as one
 * system, but keeps the existing MobileView callback contract intact.
 */
const MobileItemTheme2: React.FC<Props> = ({
  data,
  index,
  callback,
  showCheckbox = false,
  rank,
}) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);

  const selectable = !data.isSubscribed && !data.isInCart;
  const initials = (data.name || "").trim().slice(0, 3);
  const subtitle = data.companyName || data.brand?.name || "";

  const handleCheckboxChange = (checked: boolean) => {
    callback({
      action: "toggle-selection",
      data: { index, checked, productId: data._id },
    });
  };

  const handleTap = () => {
    callback({ action: "product-tap", data: { _id: data._id } });
  };

  return (
    <AppCard
      noPadding
      className={clsx(
        "tw:relative tw:overflow-hidden tw:rounded-none tw:mb-0 tw:transition-shadow tw:duration-150 tw:hover:shadow-md tw:active:scale-[0.995]",
        {
          "tw:ring-2 tw:ring-primary tw:ring-inset": data.isSelected,
        },
      )}
      bodyClassName="tw:flex tw:items-center tw:gap-3 tw:p-3"
    >
      {/* Selection checkbox — only for products that can still be subscribed. */}
      {showCheckbox && selectable && (
        <Checkbox
          checked={data.isSelected || false}
          onCheckedChange={handleCheckboxChange}
          className="tw:shrink-0 tw:border-2 tw:border-gray-400"
          aria-label={t("search.selectProduct", {
            defaultValue: "Select product",
          })}
        />
      )}

      {/* Thumb — product image if present, else a theme-tinted initials tile. */}
      <button
        type="button"
        onClick={handleTap}
        className="tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:ring-1 tw:bg-[color-mix(in_srgb,var(--primary)_7%,#fff)] tw:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
      >
        {data.images && data.images.length > 0 ? (
          <ImgRender
            assetId={data.images[0]}
            alt={data.name}
            className="tw:h-14 tw:w-14 tw:object-cover"
          />
        ) : initials ? (
          <span className="tw:text-sm tw:font-bold tw:uppercase tw:tracking-tight tw:text-primary">
            {initials}
          </span>
        ) : (
          <Package size={20} className="tw:text-slate-300" />
        )}
      </button>

      {/* Middle — name + company/brand meta line. */}
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:justify-center tw:gap-1">
        <button
          type="button"
          onClick={handleTap}
          className="tw:line-clamp-2 tw:text-left tw:text-sm tw:font-semibold tw:leading-snug tw:tracking-tight tw:text-slate-800 tw:hover:text-primary"
        >
          {data.name}
        </button>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-[11px] tw:leading-none tw:text-slate-500">
          {subtitle && (
            <span className="tw:truncate tw:max-w-[140px] tw:font-medium">
              {subtitle}
            </span>
          )}
          {data.sellersCount !== undefined && data.radiusKm !== undefined && (
            <span className="tw:truncate tw:font-medium">
              {data.sellersCount} shops within {data.radiusKm}km
            </span>
          )}
          {data.consumerOffer?.enabled ? <ConsumerOfferBadge /> : null}
        </div>
      </div>

      {/* Right — MRP over the action. */}
      <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:justify-center tw:gap-1.5">
        <div className="tw:flex tw:flex-col tw:items-end tw:leading-none">
          <span className="app-label tw:text-[10px] tw:text-slate-400">
            {t("search.mrp", { defaultValue: "MRP" })}
          </span>
          <Amount
            value={data.mrp || 0}
            className="tw:text-sm tw:font-bold tw:text-slate-800"
          />
        </div>

        <div className="tw:flex tw:items-center tw:gap-1">
          {data.isSubscribed ? (
            <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700">
              {t("search.subscribed", { defaultValue: "Subscribed" })}
            </span>
          ) : data.isInCart ? (
            <AppButton
              size="small"
              noShadow
              color="danger"
              fill="outline"
              onClick={() =>
                callback({ action: "remove", data: { ...data, index } })
              }
              isLoading={data.isLoading}
            >
              <Trash2 size={14} />
            </AppButton>
          ) : (
            <>
              {selectable && (
                <ProductMoreMenu data={data} callback={callback} />
              )}
              <AppButton
                size="small"
                noShadow
                onClick={() =>
                  callback({ action: "subscribe", data: { ...data, index } })
                }
                isLoading={data.isLoading}
              >
                {data.groupDeals && data.groupDeals.length > 0 ? (
                  <span className="tw:text-xs">
                    {`${data.groupDeals?.[0]?.values?.length} options`}
                  </span>
                ) : (
                  <Plus size={16} />
                )}
              </AppButton>
            </>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default MobileItemTheme2;
