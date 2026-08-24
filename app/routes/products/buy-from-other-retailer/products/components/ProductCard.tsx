import React from "react";
import { Plus } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import type { SellerDeal } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";

interface ProductCardProps {
  data: SellerDeal;
  callback?: (data: { action: string; data?: any }) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ data, callback }) => {
  const brandName = data.brand?._displayName || data.brand?.name || "";
  // The tint keys off the brand so every SKU of a brand shares one plate colour.
  const tintIndex = tintIndexFor(brandName || data.name || "");
  const sellerCount = data.totalSellers ?? data.sellers?.length ?? 0;
  // Sellers arrive SK-first from `prepareSellersData`, so the first record is
  // the one the buyer lands on when they open the seller list.
  const leadSeller = data.sellers?.[0]?.name || "";

  return (
    <AppCard
      noPadding
      className="tw:mb-0 tw:flex tw:h-full tw:flex-col tw:gap-0 tw:rounded-2xl tw:border tw:border-slate-100 tw:transition tw:duration-200 tw:hover:shadow-md"
    >
      {/* Tinted wash + white inner plate — same visual language as the brand and
          category tiles, so a packaged good and a bare logo both read cleanly. */}
      <TintTile index={tintIndex} className="tw:h-32">
        {data.isPromotionalDeal ? (
          <span className="tw:absolute tw:top-1.5 tw:left-1.5 tw:z-10 tw:rounded-full tw:bg-white tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:leading-4 tw:text-slate-700 tw:shadow-sm">
            Promotional
          </span>
        ) : null}
        {data.discount > 0 ? (
          <span className="tw:absolute tw:top-1.5 tw:right-1.5 tw:z-10 tw:rounded-full tw:bg-emerald-600 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:leading-4 tw:text-white tw:shadow-sm">
            {data.discount}% OFF
          </span>
        ) : null}
        <div className="tw:relative tw:flex tw:h-24 tw:w-24 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:bg-white tw:shadow-sm">
          <ImgRender
            assetId={data.images[0]}
            alt={data.name}
            className="tw:h-full tw:w-full tw:object-contain tw:p-1"
          />
        </div>
      </TintTile>

      <div className="tw:flex tw:flex-1 tw:flex-col tw:px-2 tw:pt-1.5 tw:pb-2">
        {brandName ? (
          <div className="tw:line-clamp-1 tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-slate-400 tw:uppercase">
            {brandName}
          </div>
        ) : null}
        <h3 className="tw:mt-0.5 tw:line-clamp-2 tw:h-9 tw:text-[13px] tw:font-bold tw:leading-snug tw:text-slate-800">
          {data.name}
        </h3>

        <div className="tw:mt-1.5 tw:flex tw:items-end tw:justify-between tw:gap-1.5">
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:flex tw:items-baseline tw:gap-1.5">
              <Amount
                value={data.price}
                className="tw:text-base tw:font-bold tw:text-emerald-700"
              />
              {data.discount > 0 ? (
                <Amount
                  value={data.mrp}
                  className="tw:text-xs tw:text-slate-400 tw:line-through"
                />
              ) : null}
            </div>
            <button
              type="button"
              className="tw:mt-0.5 tw:block tw:max-w-full tw:cursor-pointer tw:truncate tw:text-left tw:text-[11px] tw:text-slate-400 tw:hover:text-primary tw:hover:underline"
              onClick={() => callback?.({ action: "buy", data: data._id })}
            >
              {sellerCount} seller{sellerCount === 1 ? "" : "s"}
              {leadSeller ? ` · from ${leadSeller}` : ""}
            </button>
          </div>
          <AppButton
            onClick={() => callback?.({ action: "buy", data: data._id })}
            size="small"
            className="tw:shrink-0 tw:rounded-full"
          >
            <Plus size={18} />
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default ProductCard;
