import clsx from "clsx";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import { useCallback } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import {
  CART_ITEM_ADDED,
  CART_ITEM_REMOVED,
  PRD_IMG_RESOLUTION,
} from "~/constants";
import { AuthService } from "~/services/AuthService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import AddToCart from "../add-to-cart/AddToCart";
import KingSlabInfo from "../king-slab/KingSlabInfo";
import type { BuyCartType } from "~/types/CommonTypes";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import DisplayQty from "../display-qty/DisplayQty";

type Props = {
  data: any;
  callback: (a: { action: string; data?: any }) => void;
  imgBgStyle?: any;
  bgStyle?: any;
  cartType?: BuyCartType;
  useBusyLoader?: boolean;
};

const ProductCardTwo = ({
  data,
  callback,
  imgBgStyle,
  bgStyle,
  cartType,
  useBusyLoader = false,
}: Props) => {
  let finalCartType =
    cartType || (AuthService.isBuyerUser() ? "buyer" : "normal");

  if (cartType === "buy-from-other-retailer") {
    finalCartType = "buy-from-other-retailer";
  }

  const onCartCb = useCallback(
    (e: any) => {
      callback(e);
    },
    [callback],
  );

  const onAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (data.alreadyInCart) {
      callback({ action: CART_ITEM_REMOVED, data: { deal: data } });
      return;
    }
    callback({
      action: CART_ITEM_ADDED,
      data: { deal: data },
    });
  };

  const viewCoinDashboard = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    callback({
      action: "link",
      data: { path: "/dashboard/kc-statement", params: {} },
    });
  };

  const viewBrand = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (data._noBrandRedirect) {
      return;
    }
    e.stopPropagation();
    callback({ action: "brand", data: { brand: data.brand } });
  };

  return (
    <AppCard className="tw:mb-1 tw:py-2 tw:relative" bodyClassName="tw:p-3">
      <div onClick={() => callback({ action: "click" })}>
        {data.consumerOffer?.enabled ? (
          <span className="tw:absolute tw:top-1 tw:left-1 tw:z-30">
            <ConsumerOfferBadge />
          </span>
        ) : null}

        {/* Discount Badge - Top Right Corner */}
        {data.discount > 0 && (data.displayPrice || data.mrp) !== data.mrp && (
          <div
            className={`tw:absolute tw:top-1 tw:right-1 ${data.b2bScheme?.status === "Running" ? "tw:bg-orange-500" : "tw:bg-emerald-500"} tw:text-white tw:text-[10px] tw:font-bold tw:px-1.5 tw:py-0.5 tw:rounded-sm tw:shadow-md tw:min-w-[40px] tw:flex tw:items-center tw:justify-center`}
          >
            {data.discount}%
          </div>
        )}

        {/* Image Section */}
        <div
          className="tw:relative tw:flex tw:items-center tw:justify-center tw:h-24 tw:mb-1"
          style={imgBgStyle}
        >
          {data?.images?.length ? (
            <ImgRender
              assetId={data.images[0]}
              alt={data.name}
              className="tw:h-full tw:object-contain"
              size={PRD_IMG_RESOLUTION}
            />
          ) : (
            <div className="tw:w-full tw:h-24 tw:flex tw:items-center tw:justify-center tw:bg-gray-200">
              <div className="tw:text-gray-400 tw:text-3xl">📦</div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div>
          {/* Brand */}
          <div
            className="tw:text-xs tw:text-gray-500 tw:mb-1 tw:line-clamp-1"
            onClick={viewBrand}
          >
            {data?.brand?._displayName || "BRAND"}
          </div>

          {/* Product Name */}
          <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:mb-2 tw:line-clamp-2 tw:overflow-hidden tw:break-words tw:h-10">
            {data.name}
          </div>

          {/* Pack Size / CSA */}
          <div className="tw:text-xs tw:text-gray-500 tw:mb-3 tw:line-clamp-1">
            {data.sellInLooseQty ? (
              <span>
                {data.packSize} {data.uom}
              </span>
            ) : (
              <span>{data.displayCsa?.value}</span>
            )}
          </div>

          {/* Price and Add to Cart */}
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-3 tw:min-h-12">
            <div className="tw:flex tw:flex-col">
              {data.b2bScheme?.status === "Running" ? (
                <>
                  <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1">
                    <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                    Scheme
                  </div>
                  <Amount
                    value={data.displayPrice || data.mrp}
                    className="tw:text-lg tw:font-bold tw:text-orange-600"
                    showSymbol={true}
                    decimalPlaces={2}
                  />
                  <div className="tw:text-[10px] tw:text-gray-400 tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span>MRP:</span>
                      <span className="tw:line-through">
                        <Amount value={data.mrp} decimalPlaces={2} />
                      </span>
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-gray-400">B2B:</span>
                      <span className="tw:font-medium tw:line-through">
                        <Amount value={data.b2bPrice} decimalPlaces={2} />
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {data.isFree ? (
                    <span className="tw:text-lg tw:font-bold tw:text-green-600">
                      FREE!
                    </span>
                  ) : (
                    <Amount
                      value={data.displayPrice || data.mrp}
                      className="tw:text-lg tw:font-bold tw:text-green-600"
                      showSymbol={true}
                      decimalPlaces={2}
                    />
                  )}
                  {data.discount > 0 &&
                    (data.displayPrice || data.mrp) !== data.mrp && (
                      <div className="tw:text-xs tw:text-gray-400">
                        <span>MRP </span>
                        <span className="tw:line-through">
                          <Amount value={data.mrp} decimalPlaces={2} />
                        </span>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className="tw:flex-shrink-0 tw:relative">
              {data.isOfferDeal ? (
                <button
                  onClick={onAdd}
                  className={clsx(
                    "tw:min-w-8 tw:h-8 tw:px-2 tw:rounded tw:font-medium tw:text-sm tw:transition-colors",
                    {
                      "tw:bg-green-600 tw:text-white hover:tw:bg-green-700":
                        !data.alreadyInCart,
                      "tw:bg-red-600 tw:text-white hover:tw:bg-red-700":
                        data.alreadyInCart,
                    },
                  )}
                >
                  {data.alreadyInCart ? "REMOVE" : "ADD"}
                </button>
              ) : (
                <>
                  {!data.isOutOfStock ? (
                    <AddToCart
                      deal={data}
                      callback={onCartCb}
                      cartType={finalCartType}
                      useBusyLoader={useBusyLoader}
                    />
                  ) : null}
                </>
              )}
              {data.priceSlabs?.length > 0 && !data.isOutOfStock && (
                <div
                  className="tw:absolute tw:-top-6 tw:right-1 tw:z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <KingSlabInfo slabs={data.priceSlabs} size="xs" />
                </div>
              )}
            </div>
          </div>

          {/* Stock Status */}
          {data.isOutOfStock || data.maxQty > 0 ? (
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px]">
              {!data.isOutOfStock ? (
                <>
                  <span className="tw:text-gray-400">Stock:</span>
                  <span className="tw:text-gray-700 tw:font-medium">
                    <DisplayQty
                      qty={data.maxQty || data.stock || 0}
                      isLooseQty={false}
                      uom={data.selectedStockUom}
                      hideDefaultUom={true}
                    />
                    {!data.selectedStockUom && (
                      <>
                        {" "}
                        <SellingTypeDisplay sellingType={data.sellingType} />
                      </>
                    )}
                  </span>
                  <CaseQtyPopover
                    packageQty={data.packageQty}
                    sellingType={data.sellingType}
                  />
                </>
              ) : (
                <span className="tw:text-red-500 tw:font-medium">
                  Out of stock
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
};

export default ProductCardTwo;
