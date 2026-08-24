import clsx from "clsx";
import { Package, Plus, Trash2 } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import { Checkbox } from "~/components/ui/checkbox";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";
import type { TopPickDeal } from "../../helper";

interface Props {
  data: TopPickDeal & { isSelected?: boolean; isLoading?: boolean };
  index: number;
  callback: (params: { action: string; data?: any }) => void;
  showCheckbox?: boolean;
}

/**
 * "Popular near me" card — one SKU sellers around this shop already stock.
 *
 * Reads the network price comparison, so the only figures on it are ones the
 * API sends: how many peers within the radius carry the SKU, and the MRP.
 * Everything renders in a fixed three-band layout (identity → stats → actions)
 * so a grid of these lines up regardless of how long a product name runs.
 */
const TopPickCard: React.FC<Props> = ({
  data,
  index,
  callback,
  showCheckbox = false,
}) => {
  const selectable = !data.isSubscribed && !data.isInCart;
  const subtitle = [data.brand.name, data.category.name]
    .filter(Boolean)
    .join(" · ");

  const handleTap = () =>
    callback({ action: "product-tap", data: { _id: data._id } });

  return (
    <AppCard
      noPadding
      noContentPadding
      className={clsx(
        // `app-bleed-x` — theme-2 mobile only: the card runs out of the page
        // gutter so it touches both screen edges (and loses its radius there).
        // No-op on desktop and on the other themes, where the grid keeps it in.
        "app-bleed-x tw:mb-0 tw:h-full tw:gap-0 tw:rounded-2xl tw:bg-white tw:transition-shadow tw:hover:shadow-md",
        data.isSelected
          ? "tw:border-primary tw:ring-1 tw:ring-primary"
          : "tw:border-slate-200",
      )}
      bodyClassName="tw:flex tw:h-full tw:flex-1 tw:flex-col tw:gap-3 tw:p-4"
    >
      {/* Identity — tinted image / initials tile beside the name and brand line. */}
      <div className="tw:flex tw:items-start tw:gap-3">
        {showCheckbox && selectable && (
          <Checkbox
            checked={data.isSelected || false}
            onCheckedChange={(checked: boolean) =>
              callback({
                action: "toggle-selection",
                data: { index, checked, productId: data._id },
              })
            }
            className="tw:mt-1 tw:shrink-0 tw:border-2 tw:border-gray-400"
            aria-label="Select product"
          />
        )}

        <button type="button" onClick={handleTap} className="tw:shrink-0">
          <TintTile
            index={data.tintIndex}
            className="tw:h-12 tw:w-12 tw:rounded-xl"
          >
            {data.images.length > 0 ? (
              <ImgRender
                assetId={data.images[0]}
                alt={data.name}
                className="tw:h-12 tw:w-12 tw:object-cover"
              />
            ) : data.initials ? (
              <span className="tw:text-xs tw:font-bold tw:tracking-tight">
                {data.initials}
              </span>
            ) : (
              <Package size={18} />
            )}
          </TintTile>
        </button>

        <button
          type="button"
          onClick={handleTap}
          className="tw:min-w-0 tw:flex-1 tw:text-left"
        >
          <span className="tw:line-clamp-2 tw:text-[15px] tw:leading-snug tw:font-bold tw:text-slate-900">
            {data.name}
          </span>
          {subtitle ? (
            <span className="tw:mt-0.5 tw:block tw:truncate tw:text-xs tw:text-slate-500">
              {subtitle}
            </span>
          ) : null}
        </button>
      </div>

      {/* Stats — the two figures the price comparison actually reports. */}
      <div className="tw:mt-auto tw:grid tw:grid-cols-2 tw:gap-3">
        <div>
          <span className="tw:block tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-slate-400 tw:uppercase">
            Shops nearby
          </span>
          <span className="tw:text-base tw:font-bold tw:text-slate-900">
            {data.sellersCount}
          </span>
          <span className="tw:ml-1 tw:text-[11px] tw:text-slate-500">
            within {data.radiusKm}km
          </span>
        </div>

        <div>
          <span className="tw:block tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-slate-400 tw:uppercase">
            MRP
          </span>
          <Amount
            value={data.mrp}
            className="tw:text-base tw:font-bold tw:text-slate-900"
          />
        </div>
      </div>

      {/* Actions — Details opens the SKU, the primary action subscribes it. */}
      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <AppButton
          fill="outline"
          color="secondary"
          size="small"
          onClick={handleTap}
        >
          Details
        </AppButton>

        {data.isSubscribed ? (
          <span className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-md tw:bg-emerald-50 tw:px-2 tw:text-xs tw:font-semibold tw:text-emerald-700">
            Subscribed
          </span>
        ) : data.isInCart ? (
          <AppButton
            size="small"
            color="danger"
            fill="outline"
            isLoading={data.isLoading}
            onClick={() =>
              callback({ action: "remove", data: { ...data, index } })
            }
          >
            <span className="tw:inline-flex tw:items-center tw:gap-1.5">
              <Trash2 size={14} />
              Remove
            </span>
          </AppButton>
        ) : (
          <SubscribeBtn
            dealId={data._id}
            dealName={data.name}
            mrp={data.mrp}
            price={data.price}
            images={data.images}
            size="small"
            color="primary"
            callback={(res) =>
              callback({ ...res, data: { ...res.data, index } })
            }
          >
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              <Plus size={14} />
              Subscribe
            </span>
          </SubscribeBtn>
        )}
      </div>
    </AppCard>
  );
};

export default TopPickCard;
