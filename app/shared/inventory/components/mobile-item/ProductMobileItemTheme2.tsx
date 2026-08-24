import clsx from "clsx";
import {
  Clock,
  MoreVertical,
  Package,
  Plus,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import LocationsBlock from "~/components/feature/inventory/location-block/LocationsBlock";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import Rbac from "~/components/core/rbac/Rbac";
import AuthService from "~/services/AuthService";
import type { SellerDeal } from "~/types/CommonTypes";
import ProductMobileItemPopover from "./ProductMobileItemPopover";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
  view: ["INVENTORY.VIEW-INVENTORY"],
};

// Movement is the reading of the velocity number, not a separate fact — so it
// tints the velocity instead of adding a pill beside it. "Normal" is the
// baseline and stays neutral: a list of twenty products shouldn't read as
// twenty flags.
const MOVEMENT: Record<
  string,
  { label: string; icon: typeof Zap; tone: string }
> = {
  "fast moving": { label: "Fast", icon: Zap, tone: "tw:text-emerald-700" },
  "slow moving": {
    label: "Slow",
    icon: TrendingDown,
    tone: "tw:text-amber-700",
  },
  "non-moving": { label: "Idle", icon: TrendingDown, tone: "tw:text-rose-600" },
};

/**
 * theme-2 products-list row. One product per line: thumb, then name over a
 * stock line and a quiet brand · rack line, with the stock-on-hand value
 * trailing right in the theme's serif "amount" voice.
 *
 * Reading order is importance order — name, how much is on hand and how fast it
 * leaves, then where it lives. Colour is spent only on movement and on stock-out,
 * so scanning the list surfaces what needs attention, not what exists.
 */
const ProductMobileItemTheme2 = ({
  data,
  callback,
}: {
  data: SellerDeal;
  callback: (args: { action: string; data: SellerDeal }) => void;
}) => {
  const { t } = useTranslation(["common"]);

  const stock = Number(data.actualMaxQty) || 0;
  const isOutOfStock = stock === 0;
  const initials = (data.name || "").trim().slice(0, 3);
  const brandName = (data.brand as any)?._displayName || data.brand?.name || "";
  const href = `/dashboard/inventory/products/view/${data._id}`;

  // Stock-on-hand valuation, same figure the desktop table's value column shows.
  const inventoryValue = Number(data.inventoryValue) || 0;

  // Sales velocity: 30-day units sold averaged per day. Hidden below 0.1/day —
  // "0.0/day" is noise, not information; the movement label carries it instead.
  const velocity =
    (Number(data.salesAnalytics?.last30Days?.quantity) || 0) / 30;
  const showVelocity = velocity >= 0.1;

  // Pre-composed near-expiry sentence from the API (e.g. "2 batches expiring in
  // 12 days") — rendered verbatim, as the desktop table does.
  const expiryNote = data._raw?.nearExpiry?.desc || "";

  const movement = MOVEMENT[(data.movementType || "").toLowerCase()];
  const MovementIcon = movement?.icon;
  const paceLabel = showVelocity
    ? `${velocity.toFixed(1)}/day`
    : movement?.label;

  const hasLocations = (data.locations as any)?.length > 0;
  const hasMeta = Boolean(brandName || hasLocations);

  return (
    <AppCard noPadding className="tw:rounded-none tw:mb-0">
      <div className="tw:flex tw:flex-row tw:gap-2 tw:p-3">
        <div
          aria-hidden
          className={clsx(
            "tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:ring-1",
            isOutOfStock
              ? "tw:bg-slate-50 tw:ring-slate-100 tw:opacity-70 tw:grayscale"
              : "tw:bg-[color-mix(in_srgb,var(--primary)_7%,#fff)] tw:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]",
          )}
        >
          {data.images && data.images.length > 0 ? (
            <ImgRender
              assetId={data.images[0]}
              alt={data.name}
              className="tw:h-12 tw:w-12 tw:object-cover"
            />
          ) : initials ? (
            <span className="tw:text-sm tw:font-bold tw:uppercase tw:tracking-tight tw:text-primary">
              {initials}
            </span>
          ) : (
            <Package size={20} className="tw:text-slate-400" />
          )}
        </div>

        {/* Middle — name, then stock, then where it lives. */}
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
          {/* The ::after pseudo-element stretches this link over the whole card,
            so tapping anywhere opens the product. Controls that need their own
            target sit above it on tw:z-10. */}
          <AppLink
            asLink
            noUnderline
            href={href}
            className="tw:line-clamp-2 tw:text-sm tw:font-semibold tw:leading-snug tw:tracking-tight tw:text-slate-900 tw:transition-colors tw:group-hover:text-primary tw:after:absolute tw:after:inset-0 tw:after:content-['']"
          >
            {data.name}
          </AppLink>

          {/* Stock line — the row's primary datum, with the pace it sells at
            carrying the movement colour. */}
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-0.5 tw:text-[13px] tw:leading-tight">
            {isOutOfStock ? (
              <span className="tw:font-semibold tw:text-rose-600">
                {t("outOfStock")}
              </span>
            ) : (
              <span className="tw:font-semibold tw:text-slate-900">
                <DisplayQty
                  qty={stock}
                  isLooseQty={false}
                  uom={(data as any).selectedStockUom}
                  hideDefaultUom
                />
                <span className="tw:ml-1 tw:font-normal tw:text-slate-500">
                  {t("inStock")}
                </span>
              </span>
            )}
            {paceLabel && (
              <span
                className={clsx(
                  "tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium",
                  movement?.tone || "tw:text-slate-500",
                )}
              >
                {MovementIcon && (
                  <MovementIcon size={12} className="tw:shrink-0" aria-hidden />
                )}
                {paceLabel}
              </span>
            )}
          </div>

          {expiryNote && (
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-medium tw:leading-tight tw:text-amber-700">
              <Clock size={12} className="tw:shrink-0" aria-hidden />
              <span className="tw:min-w-0 tw:truncate">{expiryNote}</span>
            </div>
          )}

          {/* Brand and rack — the quietest line: reference detail, not a signal. */}
          {hasMeta && (
            <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5 tw:text-[11px] tw:leading-tight tw:text-slate-500">
              {brandName && (
                <span className="tw:max-w-[45%] tw:truncate">{brandName}</span>
              )}
              {brandName && hasLocations && (
                <span aria-hidden className="tw:text-slate-300">
                  ·
                </span>
              )}
              {hasLocations && (
                <span className="tw:relative tw:z-10 tw:min-w-0 tw:truncate">
                  <LocationsBlock
                    locations={data.locations}
                    dealId={data.id}
                    small
                  />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right — the stock-on-hand value, then the actions. */}
        <div className="tw:relative tw:z-10 tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:justify-center tw:gap-1.5">
          {!isOutOfStock && (
            <div className="tw:flex tw:flex-col tw:items-end tw:gap-0.5">
              {/* Column is narrow, so the visible label is the short form while
                screen readers get the full term with the figure. */}
              <span
                aria-hidden
                className="tw:text-[10px] tw:leading-none tw:text-slate-500"
              >
                {t("value")}
              </span>
              <span className="app-amount tw:text-[15px] tw:font-semibold tw:leading-none tw:text-slate-900">
                <span className="tw:sr-only">{t("inventoryValue")}: </span>
                <Amount value={inventoryValue} decimalPlaces={0} />
              </span>
            </div>
          )}

          {/* Actions — outline rather than solid, so twenty rows of add-stock read
            as available rather than as twenty calls to action. */}
          <div className="tw:flex tw:items-center tw:gap-1">
            <Rbac
              roles={rbacRoles.addStock}
              forceDisplay={AuthService.isMasterLogin()}
            >
              <AppButton
                onClick={(e) => {
                  e.stopPropagation();
                  callback({ action: "add-stock", data });
                }}
                color="primary"
                fill="outline"
                size="small"
                title={t("addStock")}
                className="tw:size-8 tw:rounded-lg tw:p-0!"
              >
                <Plus className="tw:h-4 tw:w-4" />
              </AppButton>
            </Rbac>
            <AppPopover
              triggerContent={
                <button
                  type="button"
                  aria-label={t("actions")}
                  className="tw:flex tw:size-8 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-lg tw:text-slate-500 tw:transition-colors tw:hover:bg-slate-100 tw:hover:text-slate-700 tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-primary/40"
                >
                  <MoreVertical size={16} />
                </button>
              }
            >
              <ProductMobileItemPopover data={data} />
            </AppPopover>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default ProductMobileItemTheme2;
