import { Box, Plus, Store } from "lucide-react";
import React, { useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import RemoveSubscribeBtn from "~/shared/catalog/components/subscribe-buttons/RemoveSubscribeBtn";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

export interface NewlyLaunchedDeal {
  _id: string;
  dealId: string;
  name: string;
  mrp: number;
  price: number;
  images?: string[];
  brand?: { name?: string; id?: string };
  isSubscribed?: boolean;
  isInCart?: boolean;
  itemId?: string;
  consumerOffer?: { enabled?: boolean };
  /** Retailers who already subscribed this deal — the peer proof line. */
  totalSubscribed?: number;
}

interface Props {
  data: NewlyLaunchedDeal;
  /** A deal this many stores already picked up reads as "hot" rather than "new". */
  hotThreshold?: number;
  onTap: (id: string) => void;
}

const NewlyLaunchedCard: React.FC<Props> = ({
  data,
  hotThreshold = 25,
  onTap,
}) => {
  // Local cart state so the button flips between Add/Remove without a refetch.
  const [isInCart, setIsInCart] = useState(!!data.isInCart);
  const [itemId, setItemId] = useState(data.itemId || "");

  const brandName = data.brand?.name || "";
  // Tint keys off the brand, so every SKU of a brand shares one plate colour.
  const tintIndex = tintIndexFor(brandName || data.name || "");
  const subscribed = data.totalSubscribed || 0;
  const isHot = subscribed >= hotThreshold;
  const hasDiscount = data.price > 0 && data.mrp > data.price;

  const handleSubscribed = (res: { action: string; data?: any }) => {
    if (res.action === "subscribed" && res.data?.itemId) {
      setIsInCart(true);
      setItemId(res.data.itemId);
    }
  };

  const handleRemoved = (res: { action: string; data?: any }) => {
    if (res.action === "removed") {
      setIsInCart(false);
      setItemId("");
    }
  };

  return (
    <AppCard
      noPadding
      className="tw:mb-0 tw:flex tw:h-full tw:w-52 tw:shrink-0 tw:flex-col tw:gap-0 tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-100 tw:transition-[transform,box-shadow] tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:shadow-md"
      // CardContent must stretch too, else short cards leave white below the
      // footer strip when the swiper equalises slide heights.
      bodyClassName="tw:flex tw:flex-1 tw:flex-col"
    >
      <div className="tw:cursor-pointer" onClick={() => onTap(data._id)}>
        <TintTile index={tintIndex} className="tw:h-32">
          <span
            className={`tw:absolute tw:top-1.5 tw:left-1.5 tw:z-10 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-white tw:uppercase tw:shadow-sm ${
              isHot ? "tw:bg-amber-500" : "tw:bg-violet-600"
            }`}
          >
            {isHot ? "Hot" : "New"}
          </span>

          {data.consumerOffer?.enabled ? (
            <div className="tw:absolute tw:top-1.5 tw:right-1.5 tw:z-10">
              <ConsumerOfferBadge />
            </div>
          ) : null}

          {/* White inner plate so a packaged shot and a bare wordmark both sit
              cleanly on the tint. */}
          <div className="tw:relative tw:flex tw:h-24 tw:w-24 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:bg-white tw:shadow-sm">
            {data.images?.length ? (
              <ImgRender
                assetId={data.images[0]}
                alt={data.name}
                width={96}
                className="tw:h-full tw:w-full tw:object-contain tw:p-1"
                fallback={
                  <span className="tw:px-1 tw:text-center tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-[color:var(--tint-ink)] tw:uppercase">
                    {brandName || data.name}
                  </span>
                }
              />
            ) : brandName ? (
              <span className="tw:line-clamp-2 tw:px-1 tw:text-center tw:text-[11px] tw:leading-tight tw:font-bold tw:tracking-wide tw:text-[color:var(--tint-ink)] tw:uppercase">
                {brandName}
              </span>
            ) : (
              <Box size={26} className="tw:text-slate-300" />
            )}
          </div>
        </TintTile>
      </div>

      <div className="tw:flex tw:flex-1 tw:flex-col tw:px-2.5 tw:pt-2">
        {brandName ? (
          <div className="tw:line-clamp-1 tw:text-[10px] tw:font-semibold tw:tracking-wider tw:text-slate-400 tw:uppercase">
            {brandName}
          </div>
        ) : null}

        <h3
          className="tw:mt-0.5 tw:line-clamp-2 tw:h-9 tw:cursor-pointer tw:text-[13px] tw:leading-snug tw:font-bold tw:text-slate-800"
          onClick={() => onTap(data._id)}
        >
          {data.name}
        </h3>

        <div className="tw:mt-2 tw:flex tw:items-end tw:justify-between tw:gap-2">
          <div className="tw:min-w-0">
            <Amount
              value={data.price || data.mrp || 0}
              className="tw:text-base tw:font-bold tw:text-emerald-700"
            />
            {hasDiscount ? (
              <div className="tw:flex tw:items-baseline tw:gap-1 tw:text-[11px] tw:text-slate-400">
                <span>MRP</span>
                <Amount
                  value={data.mrp}
                  className="tw:text-[11px] tw:text-slate-400 tw:line-through"
                />
              </div>
            ) : null}
          </div>

          {data.isSubscribed ? (
            <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700">
              Subscribed
            </span>
          ) : isInCart ? (
            <RemoveSubscribeBtn
              itemId={itemId}
              size="small"
              callback={handleRemoved}
            />
          ) : (
            <SubscribeBtn
              dealId={data._id}
              dealName={data.name}
              mrp={data.mrp}
              price={data.price}
              images={data.images || []}
              size="small"
              callback={handleSubscribed}
            >
              <span className="tw:inline-flex tw:items-center tw:gap-0.5">
                <Plus size={12} />
                Subscribe
              </span>
            </SubscribeBtn>
          )}
        </div>
      </div>

      {/* Total subscribes — the social proof strip that closes the card. */}
      <div
        className={`tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:px-2.5 tw:py-2 tw:text-[11px] tw:leading-tight ${
          subscribed > 0
            ? "tw:bg-emerald-50/70 tw:text-emerald-800"
            : "tw:bg-slate-50 tw:text-slate-500"
        }`}
      >
        <Store size={12} className="tw:shrink-0" />
        {subscribed > 0 ? (
          <span className="tw:line-clamp-1">
            <span className="tw:font-bold">{subscribed}</span>{" "}
            {subscribed === 1 ? "store" : "stores"} subscribed
          </span>
        ) : (
          <span className="tw:line-clamp-1">Be the first to stock this</span>
        )}
      </div>
    </AppCard>
  );
};

export default NewlyLaunchedCard;
