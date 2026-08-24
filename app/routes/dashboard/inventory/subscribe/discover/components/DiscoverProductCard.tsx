import { Box, Plus, Store } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import RemoveSubscribeBtn from "~/shared/catalog/components/subscribe-buttons/RemoveSubscribeBtn";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

export interface DiscoverDeal {
  _id: string;
  dealId: string;
  name: string;
  mrp: number;
  price: number;
  images?: string[];
  isSubscribed?: boolean;
  isInCart?: boolean;
  itemId?: string;
  consumerOffer?: { enabled?: boolean };
  groupDeals?: any[];
  /** Number of retailers who already stock this deal — peer social proof. */
  totalSubscribed?: number;
}

interface Props {
  data: DiscoverDeal;
  /** Open the product detail page for this deal. */
  onTap: (id: string) => void;
}

const DiscoverProductCard: React.FC<Props> = ({ data, onTap }) => {
  const { t } = useTranslation(["inventorySubscribe", "common"]);

  // Local cart state so the button flips between Add/Remove without refetching.
  const [isInCart, setIsInCart] = useState(!!data.isInCart);
  const [itemId, setItemId] = useState(data.itemId || "");

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

  const subscribed = data.totalSubscribed || 0;

  return (
    <AppCard
      noPadding
      className="tw:relative tw:overflow-hidden tw:w-44 tw:shrink-0 tw:border tw:border-slate-200 tw:rounded-2xl tw:transition-[transform,box-shadow,border-color] tw:duration-200 tw:hover:-translate-y-0.5 tw:hover:shadow-md tw:hover:border-slate-300"
    >
      <div
        className="tw:cursor-pointer tw:p-2"
        onClick={() => onTap(data._id)}
      >
        <div className="tw:relative tw:flex tw:h-32 tw:items-center tw:justify-center tw:rounded-xl tw:bg-slate-50">
          {data.consumerOffer?.enabled ? (
            <div className="tw:absolute tw:left-1.5 tw:top-1.5 tw:z-10">
              <ConsumerOfferBadge />
            </div>
          ) : null}

          {data.images && data.images.length > 0 ? (
            <ImgRender
              assetId={data.images[0]}
              alt={data.name}
              className="tw:h-28 tw:w-28 tw:object-contain tw:mix-blend-multiply"
            />
          ) : (
            <div className="tw:flex tw:h-28 tw:w-28 tw:items-center tw:justify-center">
              <Box size={28} className="tw:text-slate-300" />
            </div>
          )}
        </div>
      </div>

      <div className="tw:px-2.5 tw:pb-2.5">
        <div
          className="tw:h-9 tw:cursor-pointer"
          onClick={() => onTap(data._id)}
        >
          <div className="tw:text-xs tw:font-semibold tw:leading-snug tw:text-slate-800 tw:line-clamp-2">
            {data.name}
          </div>
        </div>

        {/* Peer social-proof line — how many retailers subscribed to this. */}
        <div
          className="tw:mt-1 tw:flex tw:h-4 tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500"
          title={
            subscribed > 0
              ? t("discover.storesSubscribed", {
                  count: subscribed,
                  defaultValue: "{{count}} retailers subscribed",
                })
              : undefined
          }
        >
          {subscribed > 0 ? (
            <>
              <Store size={11} className="tw:text-primary" />
              <span>
                <span className="tw:font-semibold tw:text-slate-700">
                  {subscribed}
                </span>{" "}
                {t("discover.storesStocking", {
                  count: subscribed,
                  defaultValue: "retailers subscribed",
                })}
              </span>
            </>
          ) : (
            <span className="tw:text-slate-500">
              {t("discover.beFirst", {
                defaultValue: "Be the first to subscribe",
              })}
            </span>
          )}
        </div>

        <div className="tw:mt-2 tw:flex tw:items-end tw:justify-between tw:gap-2">
          <div className="tw:flex tw:flex-col tw:min-w-0">
            <span className="app-label tw:text-[10px] tw:text-slate-500">
              {t("discover.mrp", { defaultValue: "MRP" })}
            </span>
            <Amount
              value={data.mrp || 0}
              className="tw:text-sm tw:font-bold tw:text-slate-900"
            />
          </div>

          {data.isSubscribed ? (
            <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700">
              {t("discover.subscribed", { defaultValue: "Subscribed" })}
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
              <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:whitespace-nowrap">
                <Plus size={12} />
                {t("search.table.actions.subscribe", {
                  defaultValue: "Subscribe",
                })}
              </span>
            </SubscribeBtn>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default DiscoverProductCard;
