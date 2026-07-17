import React from "react";
import { Plus } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import type { SellerDeal } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";

interface ProductCardProps {
  data: SellerDeal;
  callback?: (data: { action: string; data?: any }) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ data, callback }) => {
  return (
    <AppCard
      noPadding
      className="tw:mb-0 tw:flex tw:flex-col tw:h-full tw:border tw:border-gray-200 tw:transition-colors tw:hover:border-primary/40"
    >
      {/* Product image sits on a soft neutral tile and is contained (not cropped)
          so packaged goods and the "No Image" placeholder read consistently. */}
      <div className="tw:relative tw:flex tw:justify-center tw:items-center tw:bg-slate-50 tw:p-2">
        {data.discount > 0 ? (
          <span className="tw:absolute tw:bottom-1.5 tw:left-1.5 tw:z-10 tw:rounded-md tw:bg-rose-600 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:leading-none tw:text-white tw:shadow-sm">
            {data.discount}% OFF
          </span>
        ) : null}
        {data.isPromotionalDeal ? (
          <span className="tw:absolute tw:top-1.5 tw:left-1.5 tw:z-10 tw:rounded-md tw:bg-orange-500 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:leading-none tw:tracking-wide tw:text-white tw:shadow-sm">
            PROMOTIONAL
          </span>
        ) : null}
        <ImgRender
          assetId={data.images[0]}
          alt={data.name}
          className="tw:h-32 tw:w-full tw:object-contain"
        />
      </div>
      <div className="tw:pt-1.5 tw:px-2.5 tw:pb-2.5">
        <button
          type="button"
          className="tw:text-xs tw:text-primary tw:font-semibold tw:mb-1 tw:cursor-pointer tw:hover:underline"
          onClick={() => callback?.({ action: "buy", data: data._id })}
        >
          Sellers: {data.sellers?.length || 0}
        </button>
        <div className="tw:h-9 tw:overflow-hidden">
          <h3 className="tw:text-xs tw:font-semibold tw:leading-snug tw:text-slate-800 tw:line-clamp-2">
            {data.name}
          </h3>
        </div>
        <div className="tw:mt-1">
          <div className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400 tw:mb-0.5">
            B2B Price
          </div>
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0 tw:h-9 tw:justify-center">
              <Amount
                value={data.price}
                className="tw:text-base tw:font-bold tw:text-emerald-700"
              />
              {data.discount > 0 ? (
                <Amount
                  value={data.mrp}
                  className="tw:text-xs tw:text-gray-400 tw:line-through"
                />
              ) : null}
            </div>
            <AppButton
              onClick={() => callback?.({ action: "buy", data: data._id })}
              size="small"
            >
              <Plus size={18} />
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default ProductCard;
