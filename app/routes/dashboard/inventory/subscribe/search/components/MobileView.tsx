import Amount from "app/components/core/amount/Amount";
import AppBadge from "app/components/core/badge/AppBadge";
import AppButton from "app/components/core/button/AppButton";
import AppCard from "app/components/core/card/AppCard";
import ImgRender from "app/components/core/img/ImgRender";
import clsx from "clsx";
import {
  Box,
  CheckCircle2,
  Eye,
  Package,
  Plus,
  PlusCircle,
  Trash2,
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "~/components/ui/checkbox";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import BarcodeInfo from "./BarcodeInfo";
import ProductMoreMenu from "./ProductMoreMenu";

interface Props {
  data: {
    images?: string[];
    category?: { name: string };
    name: string;
    brand?: { name: string };
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
    // Optionally include other keys from formatProductResponse if needed
  };
  index: number;
  callback: (params: { action: string; data?: any }) => void;
  showCheckbox?: boolean;
  /** 1-based position in the top-selling list; renders a rank badge when set. */
  rank?: number;
}

const MobileView: React.FC<Props> = ({
  data,
  index,
  callback,
  showCheckbox = false,
  rank,
}) => {
  const handleCheckboxChange = (checked: boolean) => {
    callback({
      action: "toggle-selection",
      data: { index, checked, productId: data._id },
    });
  };

  const selectable = !data.isSubscribed && !data.isInCart;

  const handleCardTap = () => {
    if (selectable) {
      callback({
        action: "toggle-selection",
        data: {
          index,
          checked: !data.isSelected,
          productId: data._id,
        },
      });
    } else {
      callback({ action: "product-tap", data: { _id: data._id } });
    }
  };

  const handleViewTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    callback({ action: "product-tap", data: { _id: data._id } });
  };

  return (
    <AppCard
      noPadding
      className={clsx("tw:relative tw:overflow-hidden", {
        "tw:border-2 tw:border-blue-300 tw:bg-blue-50": data.isSelected,
      })}
    >
      {showCheckbox && !data.isSubscribed && !data.isInCart && (
        <div className="tw:absolute tw:top-2 tw:left-2 tw:z-10">
          <Checkbox
            checked={data.isSelected || false}
            onCheckedChange={handleCheckboxChange}
            className="tw:bg-white tw:border-2 tw:border-gray-500"
          />
        </div>
      )}

      <div className="tw:absolute tw:top-2 tw:right-2 tw:z-10 tw:flex tw:items-center tw:gap-1">
        <button
          type="button"
          aria-label="View item"
          onClick={handleViewTap}
          className="tw:bg-white tw:rounded-full tw:p-1 tw:shadow tw:border tw:border-gray-200 tw:text-gray-600 hover:tw:text-blue-600"
        >
          <Eye size={14} />
        </button>
        {!data.isSubscribed && !data.isInCart && (
          <ProductMoreMenu data={data} callback={callback} />
        )}
      </div>

      <div
        className="tw:bg-white tw:p-1 tw:cursor-pointer"
        onClick={handleCardTap}
      >
        <div className="tw:flex tw:justify-center tw:items-center tw:relative">
          {data.consumerOffer?.enabled ? (
            <div className="tw:absolute tw:left-1 tw:bottom-1 tw:z-10">
              <ConsumerOfferBadge />
            </div>
          ) : null}
          {data.images && data.images.length > 0 ? (
            <ImgRender
              assetId={data.images[0]}
              alt={data.name}
              className="tw:h-28 tw:object-cover tw:w-28"
            />
          ) : (
            <div className="tw:h-28 tw:w-28 tw:flex tw:items-center tw:justify-center">
              <Box size={28} className="tw:text-gray-400" />
            </div>
          )}
        </div>
      </div>
      <div className="tw:p-2">
        {/* Top-selling rank badge — temporarily disabled.
        {rank ? (
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1.5">
            <span
              className={clsx(
                "tw:inline-flex tw:items-center tw:gap-0.5 tw:font-semibold tw:rounded-md tw:h-5 tw:px-1.5 tw:text-[11px] tw:text-white tw:shadow-sm tw:ring-1 tw:ring-inset tw:ring-white/20",
                rank <= 3
                  ? "tw:bg-gradient-to-r tw:from-amber-500 tw:to-orange-500"
                  : "tw:bg-slate-500"
              )}
            >
              <TrendingUp size={10} strokeWidth={2.5} />#{rank}
            </span>
            {typeof data.totalSubscribed === "number" &&
            data.totalSubscribed > 0 ? (
              <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-slate-400 tw:font-medium">
                <span className="tw:h-1 tw:w-1 tw:rounded-full tw:bg-slate-300" />
                {data.totalSubscribed} subscribed
              </span>
            ) : null}
          </div>
        ) : null}
        */}
        <div
          className="tw:h-16 tw:cursor-pointer"
          onClick={handleCardTap}
        >
          <div className="tw:text-sm tw:md:text-xs tw:font-medium tw:line-clamp-3 tw:mb-2">
            {data.name}
          </div>
        </div>

        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-center">
          <div className="tw:flex tw:flex-col tw:gap-1">
            <span className="tw:text-xs tw:text-blue-600">MRP</span>
            <Amount
              value={data.mrp || 0}
              className="tw:font-medium tw:text-blue-800"
            />
          </div>
          <div>
            {data.isSubscribed ? (
              <span className="tw:text-xs tw:text-green-600">Subscribed</span>
            ) : data.isInCart ? (
              <AppButton
                size="small"
                className="tw:w-full"
                noShadow={true}
                color="danger"
                fill="outline"
                onClick={() =>
                  callback({
                    action: "remove",
                    data: { ...data, index },
                  })
                }
                isLoading={data.isLoading}
              >
                <Trash2 size={12} />
              </AppButton>
            ) : (
              <AppButton
                size="small"
                onClick={() =>
                  callback({
                    action: "subscribe",
                    data: { ...data, index },
                  })
                }
                className="tw:w-full"
                noShadow={true}
                isLoading={data.isLoading}
              >
                {data.groupDeals && data.groupDeals.length > 0 ? (
                  <span className="tw:text-xs">{`${data.groupDeals?.[0]?.values?.length} options`}</span>
                ) : (
                  <Plus />
                )}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default MobileView;
