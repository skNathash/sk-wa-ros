import Amount from "app/components/core/amount/Amount";
import AppBadge from "app/components/core/badge/AppBadge";
import AppButton from "app/components/core/button/AppButton";
import AppCard from "app/components/core/card/AppCard";
import ImgRender from "app/components/core/img/ImgRender";
import clsx from "clsx";
import { Box, CheckCircle2, Eye, Plus, PlusCircle, Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "~/components/ui/checkbox";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
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
  };
  index: number;
  callback: (params: { action: string; data?: any }) => void;
  showCheckbox?: boolean;
}

const MobileListview: React.FC<Props> = ({
  data,
  index,
  callback,
  showCheckbox = false,
}) => {
  const { t } = useTranslation(["inventorySubscribe"]);

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
      className={clsx("tw:relative", {
        "tw:border-2 tw:border-blue-300 tw:bg-blue-50": data.isSelected,
      })}
    >
      <div className="tw:flex tw:gap-2 tw:p-2">
        {/* Left Section - Checkbox and Image */}
        <div className="tw:flex tw:items-start tw:gap-2 tw:flex-shrink-0">
          {showCheckbox && !data.isSubscribed && !data.isInCart && (
            <div className="tw:absolute tw:top-2 tw:left-2 tw:z-10">
              <Checkbox
                checked={data.isSelected || false}
                onCheckedChange={handleCheckboxChange}
                className="tw:bg-white tw:border-2 tw:border-gray-500 tw:shadow-sm"
              />
            </div>
          )}
          <div
            className="tw:relative tw:cursor-pointer"
            onClick={handleCardTap}
          >
            {data.consumerOffer?.enabled ? (
              <div className="tw:absolute tw:left-1 tw:bottom-1 tw:z-10">
                <ConsumerOfferBadge />
              </div>
            ) : null}
            {data.images && data.images.length > 0 ? (
              <ImgRender
                assetId={data.images[0]}
                alt={data.name}
                className="tw:h-20 tw:w-20 tw:object-cover tw:rounded"
              />
            ) : (
              <div className="tw:h-20 tw:w-20 tw:flex tw:items-center tw:justify-center tw:rounded">
                <Box size={24} className="tw:text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Product Details and Actions */}
        <div className="tw:flex-1 tw:flex tw:flex-col tw:justify-between tw:min-w-0">
          {/* Top Section - Product Name and More Menu */}
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-2 tw:mb-1">
            <div className="tw:flex-1 tw:min-w-0">
              <div
                className="tw:text-sm tw:font-medium tw:line-clamp-2 tw:mb-1 tw:cursor-pointer"
                onClick={handleCardTap}
              >
                {data.name}
              </div>
            </div>
            <div className="tw:flex-shrink-0 tw:flex tw:items-center tw:gap-1">
              <button
                type="button"
                aria-label="View item"
                onClick={handleViewTap}
                className="tw:p-1 tw:rounded tw:text-gray-600 hover:tw:text-blue-600"
              >
                <Eye size={16} />
              </button>
              {!data.isSubscribed && !data.isInCart && (
                <ProductMoreMenu data={data} callback={callback} />
              )}
            </div>
          </div>

          {/* Bottom Section - Price and Action Button */}
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:flex tw:items-center tw:gap-2 tw:flex-1">
              <span className="tw:text-xs tw:text-blue-600">MRP:</span>
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
                  className="tw:w-10 tw:h-10 tw:p-0"
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
                  <Trash2 size={16} />
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
                  className="tw:h-8"
                  noShadow={true}
                  isLoading={data.isLoading}
                >
                  {data.groupDeals && data.groupDeals.length > 0 ? (
                    <span className="tw:text-xs">{`${data.groupDeals?.[0]?.values?.length} options`}</span>
                  ) : (
                    <Plus size={16} />
                  )}
                </AppButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default MobileListview;
