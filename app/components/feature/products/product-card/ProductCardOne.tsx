import { useCallback } from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import { PRD_IMG_RESOLUTION } from "~/constants";
import { AuthService } from "~/services/AuthService";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import type { BuyCartType } from "~/types/CommonTypes";
import AddToCart from "../add-to-cart/AddToCart";
import DisplayQty from "../display-qty/DisplayQty";
import KingSlabInfo from "../king-slab/KingSlabInfo";

type Props = {
  data: any;
  callback: (a: { action: string; data?: any }) => void;
  imgBgStyle?: any;
  cartType?: BuyCartType;
  useBusyLoader?: boolean;
  hideAddToCart?: boolean;
};

const ProductCardOne = ({
  data,
  callback,
  imgBgStyle = {},
  cartType,
  useBusyLoader = false,
  hideAddToCart = false,
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

  const viewBrand = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (data._noBrandRedirect) {
      return;
    }
    e.stopPropagation();
    callback({ action: "brand", data: { brand: data.brand[0] } });
  };

  return (
    <div
      className="tw:relative tw:p-2 tw:pcr-1 tw:cursor-pointer tw:border tw:border-gray-200 tw:rounded-md tw:bg-white tw:h-full tw:flex tw:flex-col"
      onClick={() => callback({ action: "click" })}
    >
      <div className="tw:relative tw:flex tw:flex-col tw:flex-1">
        {data.consumerOffer?.enabled ? (
          <span className="tw:absolute tw:top-1 tw:left-1 tw:z-30">
            <ConsumerOfferBadge />
          </span>
        ) : null}

        {!data._hideDiscount &&
        data.discount > 0 &&
        (data.displayPrice || data.mrp) !== data.mrp ? (
          <div
            className={`tw:absolute tw:-top-1 tw:-right-1 ${data.b2bScheme?.status === "Running" ? "tw:bg-orange-500" : "tw:bg-emerald-500"} tw:text-white tw:text-[10px] tw:font-bold tw:px-1.5 tw:py-0.5 tw:rounded-full tw:shadow-md tw:min-w-[40px] tw:flex tw:items-center tw:justify-center`}
          >
            {data.discount}%
          </div>
        ) : null}

        <div className="text-center" style={imgBgStyle}>
          <ImgRender
            assetId={data.images[0] ?? ""}
            className="tw:w-full tw:h-36 tw:lg:h-32 tw:inline-block tw:object-contain"
            size={PRD_IMG_RESOLUTION}
          />
        </div>
        <div className="tw:text-app-gray-5 tw:text-xs tw:h-4 tw:mb-1">
          <button onClick={viewBrand}>{data?.brand[0]?._displayName}</button>
        </div>

        <div className="tw:mb-1.5 tw:h-9">
          <div className="tw:line-clamp-2 tw:text-xs tw:font-semibold">
            {data.name}
          </div>
        </div>

        {/* <div className="tw:text-xs tw:text-app-gray-4 tw:mb-1 tw:h-4">
          <div className="tw:line-clamp-1">{data.netWeight}</div>
        </div> */}

        <div className="tw:mt-1 tw:flex tw:flex-col tw:flex-1 tw:gap-1.5">
          <div className="tw:flex tw:flex-col tw:min-w-0">
            {data.b2bScheme?.status === "Running" ? (
              <>
                <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1 tw:whitespace-nowrap tw:leading-tight">
                  <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                  Scheme
                </div>
                <div className="tw:flex tw:items-baseline tw:gap-2 tw:flex-wrap tw:leading-tight">
                  <div className="tw:text-base tw:font-bold tw:text-orange-600">
                    <Amount
                      value={data.displayPrice || data.mrp}
                      decimalPlaces={2}
                    />
                  </div>
                  <div className="tw:text-[10px] tw:text-gray-400 tw:flex tw:items-center tw:gap-2">
                    <span className="tw:line-through">
                      <Amount value={data.mrp} decimalPlaces={2} />
                    </span>
                    <span className="tw:line-through">
                      <Amount value={data.b2bPrice} decimalPlaces={2} />
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="tw:text-[10px] tw:text-gray-400 tw:leading-tight">
                  B2B Price
                </div>
                <div className="tw:flex tw:items-baseline tw:gap-1.5 tw:leading-tight">
                  <div className="tw:text-base tw:font-bold tw:text-green-600">
                    <Amount
                      value={data.displayPrice || data.mrp}
                      decimalPlaces={2}
                    />
                  </div>
                  {data.discount > 0 &&
                    (data.displayPrice || data.mrp) !== data.mrp && (
                      <span className="tw:text-[10px] tw:text-gray-400 tw:line-through">
                        <Amount value={data.mrp} decimalPlaces={2} />
                      </span>
                    )}
                </div>
              </>
            )}
          </div>

          <div className="tw:relative tw:w-full">
            {hideAddToCart ? null : !data.isOutOfStock ? (
              <>
                <AddToCart
                  deal={data}
                  callback={onCartCb}
                  cartType={finalCartType}
                  useBusyLoader={useBusyLoader}
                  fullWidth
                />
                {data.priceSlabs?.length > 0 && (
                  <div className="tw:absolute tw:-top-6 tw:-right-1 tw:z-20">
                    <KingSlabInfo slabs={data.priceSlabs} size="xs" />
                  </div>
                )}
              </>
            ) : (
              <span className="tw:text-xs tw:text-gray-600">Out of stock</span>
            )}
          </div>

          {data.maxQty > 0 && (
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-gray-400">
              <span>Stock</span>
              <span className="tw:text-gray-600 tw:font-medium">
                <DisplayQty
                  qty={data.maxQty || 0}
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
                className="tw:inline-block tw:self-center"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCardOne;
