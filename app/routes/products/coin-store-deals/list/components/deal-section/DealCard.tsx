import { Eye, Share2 } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import { type SectionDeal } from "./helper";

type Props = {
  deal: SectionDeal;
  onDetail: (deal: SectionDeal) => void;
  onShare: (deal: SectionDeal) => void;
};

const DealCard = ({ deal, onDetail, onShare }: Props) => {
  return (
    <AppCard
      noPadding
      className="tw:mb-0 tw:overflow-hidden tw:border-gray-200 tw:transition-shadow tw:duration-200 hover:tw:shadow-md"
    >
      <div className="tw:flex tw:flex-col tw:h-full">
        {/* Tile — the catalogue image, or a tinted weave carrying the name so
            an image-less reward still reads as its own product. */}
        <TintTile
          index={tintIndexFor(deal.name)}
          className="tw:h-28 tw:sm:h-32 tw:px-3"
        >
          {deal.image ? (
            <ImgRender
              assetId={deal.image}
              size="400x400"
              alt={deal.name}
              className="tw:max-h-full tw:w-auto tw:object-contain"
            />
          ) : (
            <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.15em] tw:text-center tw:line-clamp-2">
              {deal.name}
            </span>
          )}

          {/* {deal.stock > 0 ? (
            <span className="tw:absolute tw:top-1.5 tw:left-1.5 tw:rounded-md tw:bg-emerald-600 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
              {deal.stock} ready
            </span>
          ) : null} */}

          {/* {deal.isHot ? (
            <span className="tw:absolute tw:top-1.5 tw:right-1.5 tw:rounded-md tw:bg-rose-500 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
              Hot
            </span>
          ) : null} */}
        </TintTile>

        <div className="tw:flex tw:flex-1 tw:flex-col tw:p-2.5">
          {/* Fixed height so the coin line and the actions stay on one baseline
              across the row, however long the names run. */}
          <div className="tw:h-8 tw:mb-2">
            <h3 className="tw:text-[13px] tw:font-semibold tw:leading-tight tw:text-gray-900 tw:line-clamp-2">
              {deal.name}
            </h3>
          </div>

          <div className="tw:mt-auto tw:flex tw:items-center tw:justify-between tw:gap-1.5">
            <span className="tw:flex tw:items-center tw:gap-1">
              <ImgRender
                src="kingcoins/logo.png"
                alt="KingCoins"
                className="tw:h-3.5"
              />
              <span className="tw:text-[13px] tw:font-bold tw:text-amber-600">
                {deal.coins.toLocaleString("en-IN")}
              </span>
            </span>

            {/* {deal.category ? (
              <span className="tw:truncate tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
                {deal.category}
              </span>
            ) : null} */}
          </div>

          <div className="tw:mt-2.5 tw:grid tw:grid-cols-2 tw:gap-1.5">
            <AppButton
              size="small"
              fill="outline"
              color="secondary"
              onClick={() => onDetail(deal)}
              className="tw:w-full tw:px-1!"
            >
              <span className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-[11px]">
                <Eye className="tw:h-3 tw:w-3" />
                Detail
              </span>
            </AppButton>
            <AppButton
              size="small"
              color="primary"
              onClick={() => onShare(deal)}
              className="tw:w-full tw:px-1!"
            >
              <span className="tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-[11px]">
                <Share2 className="tw:h-3 tw:w-3" />
                Share
              </span>
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default DealCard;
