import { Trash2 } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import SellerCatalogService from "~/services/SellerCatalogService";
import AddToCart from "../../components/AddToCart";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface ProductItemProps {
  item: {
    deal: {
      id: string;
      refId: string;
      name: string;
      type: string;
    };
    category: {
      id: string;
      categoryId: string;
      name: string;
    };
    brand: {
      id: string;
      brandId: string;
      name: string;
    };
    weight: {
      unit: string;
    };
    itemId: string;
    hsn: string;
    tax: number;
    images: string[];
    isCustomerRequestedItem: boolean;
    quantity: number;
    mrp: number;
    purchasePrice: number;
    availableStock: number;
    uom: string;
    isConsumerOffer: boolean;
    _id: string;
    snapshots: any[];
    priceSlab?: any;
    discountPerc?: number;
    packageQty: number;
    sellingType: string;
    selectedStockUom?: string;
    basePrice?: number;
    discountInfo?: {
      discountType?: string;
    };
  };
  selected?: boolean;
  callback: (a: { action: string; data: any }) => void;
  sellerId: string;
  cartId?: string;
}

const ProductItem: React.FC<ProductItemProps> = ({
  item,
  callback,
  cartId,
  sellerId,
}) => {
  const handleRemove = () => {
    callback({ action: "remove", data: item });
  };

  const getFormattedSlabs = () => {
    const raw = item.priceSlab || null;
    if (!raw) return [];

    return SellerCatalogService.formatPriceSlab(raw).slab || [];
  };

  const formattedSlabs = getFormattedSlabs();

  return (
    <div className="tw:relative tw:bg-white tw:px-2 tw:py-4 tw:mb-0 tw:border-b tw:border-gray-200 last:tw:border-b-0">
      <button
        onClick={handleRemove}
        className="tw:absolute tw:top-2 tw:right-2 tw:text-gray-400 tw:hover:tw:text-red-500 tw:transition-colors tw:z-10 tw:cursor-pointer"
      >
        <Trash2 size={16} />
      </button>

      <div className="tw:flex tw:gap-2">
        {/* Product Image */}
        <div className="tw:shrink-0">
          {item.images.length > 0 ? (
            <ImgRender
              assetId={item.images[0]}
              alt={item.deal.name}
              className="tw:w-14 tw:h-14 tw:object-cover tw:rounded"
            />
          ) : (
            <div className="tw:w-14 tw:h-14 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center">
              <span className="tw:text-gray-400 tw:text-[10px]">No Image</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="tw:flex-1 tw:min-w-0">
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-0.5 tw:pr-5 tw:line-clamp-2">
            {item.deal.name}
          </h3>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:text-xs tw:text-gray-600 tw:mb-1.5 ">
            <span>ID: {item.deal.refId}</span>
            <span>Brand: {item.brand.name}</span>
          </div>

          {/* Price and Quantity Controls */}
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
            <div className="tw:flex tw:flex-col tw:gap-0.5">
              {item.discountInfo?.discountType === "OfferOfTheDay" ? (
                <>
                  <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1 tw:whitespace-nowrap">
                    <span className="tw:w-1 tw:h-1 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                    Scheme Price
                  </div>
                  <div className="tw:flex tw:flex-col">
                    <div className="tw:flex tw:items-baseline tw:gap-0.5">
                      <Amount
                        value={item.purchasePrice}
                        className="tw:text-base tw:font-bold tw:text-orange-600"
                      />
                      {item.selectedStockUom && (
                        <span className="tw:text-[10px] tw:text-orange-600">
                          /{item.selectedStockUom}
                        </span>
                      )}
                    </div>
                    <div className="tw:text-[10px] tw:text-gray-500 tw:flex tw:flex-col tw:md:flex-row tw:md:gap-3">
                      <div className="tw:flex tw:items-center tw:gap-1">
                        <span className="tw:text-gray-400">MRP:</span>
                        <span className="tw:line-through">
                          <Amount value={item.mrp} decimalPlaces={2} />
                        </span>
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1">
                        <span className="tw:text-gray-400">B2B:</span>
                        <span className="tw:font-medium tw:line-through">
                          <Amount
                            value={item.basePrice || 0}
                            decimalPlaces={2}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <Amount
                    value={item.purchasePrice}
                    className="tw:text-base tw:font-bold tw:text-emerald-600"
                  />
                  {item.selectedStockUom && (
                    <span className="tw:text-[10px] tw:text-gray-500">
                      /{item.selectedStockUom}
                    </span>
                  )}
                  {item.mrp !== item.purchasePrice && (
                    <>
                      <Amount
                        value={item.mrp}
                        className="tw:text-xs tw:text-gray-400 tw:line-through"
                      />
                      {item.discountPerc && item.discountPerc > 0 && (
                        <span className="tw:text-xs tw:text-red-500 tw:ml-1">
                          {item.discountPerc}% OFF
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="tw:relative tw:flex tw:flex-col tw:gap-1 tw:items-end">
              <AddToCart
                qty={item.quantity}
                maxQty={item.availableStock}
                dealId={item.deal.id}
                itemId={item.itemId}
                cartId={cartId}
                sellerId={sellerId}
                type={2}
                callback={callback}
                dealRefId={item.deal.refId}
                sellingType={item.sellingType}
                packageQty={item.packageQty || 0}
                selectedStockUom={item.selectedStockUom}
              />

              <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                In Stock:{" "}
                <DisplayQty
                  qty={item.availableStock}
                  isLooseQty={false}
                  uom={
                    item.selectedStockUom != "unit" ? item.selectedStockUom : ""
                  }
                  hideDefaultUom={true}
                />{" "}
                {item.selectedStockUom == "unit" && (
                  <SellingTypeDisplay sellingType={item.sellingType} />
                )}
                <CaseQtyPopover
                  packageQty={item.packageQty || 0}
                  sellingType={item.sellingType}
                />
              </div>
              {formattedSlabs && formattedSlabs.length > 0 && (
                <div className="tw:absolute tw:-top-6 tw:right-0 tw:z-20">
                  <KingSlabInfo slabs={formattedSlabs} size="xs" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
