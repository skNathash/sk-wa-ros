import clsx from "clsx";
import { MapPin } from "lucide-react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import type { Deal, SellersArrayItem } from "~/types/CommonTypes";
import SellerAddToCart from "../../../components/SellerAddToCart";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";

type Props = {
  loading: boolean;
  silentLoading?: boolean;
  sellers: Array<SellersArrayItem & { deal: Deal }>;
  onAddToCart: (response: { action: string; data: any }) => void;
  onSellerClick: (seller: SellersArrayItem & { deal: Deal }) => void;
  slabOnly?: boolean;
};

const Sellers = ({
  loading,
  silentLoading,
  sellers,
  onAddToCart,
  onSellerClick,
  slabOnly,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:flex-1 tw:overflow-y-auto tw:relative">
      {silentLoading && (
        <div className="tw:absolute tw:inset-0 tw:bg-white/50 tw:backdrop-blur-[1px] tw:z-20 tw:flex tw:items-center tw:justify-center">
          <div className="tw:bg-white tw:p-3 tw:rounded-full tw:shadow-lg tw:border tw:border-gray-100">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        </div>
      )}
      {sellers.length > 0 ? (
        <div>
          {sellers.map((seller, index) => (
            <div
              key={seller.id || index}
              className={clsx({
                "tw:border-b tw:border-gray-200 tw:py-2": true,
                "tw:bg-blue-50/40":
                  seller.priceSlab?.isAvailable && seller.priceSlab?.configId,
                "tw:hidden":
                  slabOnly &&
                  !(
                    seller.priceSlab?.isAvailable && seller.priceSlab?.configId
                  ),
              })}
            >
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                <div className="tw:flex-1">
                  {seller.isConnectedSeller && (
                    <div className="tw:text-xs tw:text-primary tw:mb-1">
                      Your connected seller
                    </div>
                  )}

                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-0.5">
                    <div className="tw:flex-1 tw:min-w-0 tw:flex tw:items-center tw:gap-2">
                      <h5
                        role="button"
                        tabIndex={0}
                        onClick={() => onSellerClick?.(seller)}
                        className={clsx({
                          "tw:font-semibold tw:text-sm tw:truncate tw:cursor-pointer": true,
                          "tw:text-primary": !seller.isSkSeller,
                        })}
                      >
                        {seller.name}
                      </h5>
                      <span className="tw:text-xs tw:bg-white tw:flex tw:items-center tw:gap-0.5 tw:shrink-0 tw:border tw:border-gray-200 tw:px-2 tw:py-0.5 tw:rounded-xs">
                        <MapPin className="tw:w-3 tw:h-3 tw:text-primary" />
                        {seller.distance?.toFixed(1) || 0} km
                      </span>
                    </div>

                    {/* <AppPopover
                    triggerContent={<MoreVertical className="tw:w-4 tw:h-4" />}
                  >
                    <div className="tw:p-2">hello</div>
                  </AppPopover> */}
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                    <div className="tw:text-xs tw:text-gray-600">
                      {seller.city} {seller.district} - {seller.pincode}
                    </div>
                  </div>

                  {seller.b2bScheme?.status === "Running" ? (
                    <>
                      <div className="tw:flex tw:flex-col">
                        <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:gap-1 tw:whitespace-nowrap">
                          <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                          Scheme Price
                        </div>
                        <div className="tw:flex tw:items-center">
                          <div className="tw:text-base tw:font-bold tw:text-orange-600">
                            <Amount
                              value={
                                seller.b2bScheme?.offerPrice || seller.price
                              }
                            />
                          </div>
                          {seller.discountPercentage > 0 && (
                            <span className="tw:text-sm tw:text-orange-600 tw:font-bold tw:ml-2">
                              {seller.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                        <div className="tw:text-[10px] tw:text-gray-500 tw:flex tw:gap-2 tw:mt-0.5">
                          <div className="tw:flex tw:items-center tw:gap-1">
                            <span className="tw:text-gray-400">MRP:</span>
                            <span className="tw:line-through">
                              <Amount value={seller.mrp} />
                            </span>
                          </div>
                          <div className="tw:flex tw:items-center tw:gap-1">
                            <span className="tw:text-gray-400">B2B:</span>
                            <span className="tw:font-medium tw:line-through">
                              <Amount value={seller.networkBasePrice} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tw:flex tw:gap-1 tw:items-center">
                        <div className="tw:text-xs tw:text-gray-500">
                          B2B Price
                        </div>
                        <div className="tw:flex tw:flex-row tw:items-center tw:gap-2">
                          {seller.price != null && (
                            <span className="tw:text-base tw:font-bold tw:text-green-600">
                              <Amount value={seller.price} />
                            </span>
                          )}
                          {seller.discountPercentage > 0 && (
                            <span className="tw:text-xs tw:text-gray-500 tw:line-through">
                              <Amount value={seller.mrp} />
                            </span>
                          )}

                          {seller.discountPercentage > 0 && (
                            <span className="tw:text-sm tw:text-orange-600 tw:font-bold">
                              {seller.discountPercentage}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                    <div className="tw:flex tw:flex-col tw:gap-0.5 tw:items-end">
                      {seller.priceSlab?.isAvailable &&
                      seller.priceSlab?.configId ? (
                        <KingSlabInfo slabs={seller.priceSlab.slab} size="xs" />
                      ) : null}
                      {Number(seller.qty) > 0 ? (
                        <>
                          <SellerAddToCart
                            qty={seller.deal?.inCart?.qty || 0}
                            maxQty={seller.qty}
                            dealId={seller.deal?._id}
                            itemId={seller.deal?.itemId}
                            cartId={seller.deal?.cartId}
                            sellerId={seller.id}
                            callback={onAddToCart}
                            type={seller.deal?.inCart?.status ? 2 : 1}
                            dealRefId={seller.deal.id}
                            isSkSeller={seller.isSkSeller}
                            className="tw:h-6"
                            sellingType={seller.sellingType}
                            packageQty={seller.packageQty || 0}
                          />
                          <div
                            className={clsx(
                              "tw:flex tw:items-center tw:gap-1",
                              {
                                "tw:text-xs tw:font-medium tw:mt-0.5": true,
                                "tw:text-green-600": seller.qty > 0,
                                "tw:text-red-600": seller.qty === 0,
                              },
                            )}
                          >
                            In Stock: {seller.qty}{" "}
                            <SellingTypeDisplay
                              sellingType={seller.sellingType}
                            />
                            <CaseQtyPopover
                              packageQty={seller.packageQty || 0}
                              sellingType={seller.sellingType}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="tw:inline-block">
                          <AppBadge variant="danger">Out of stock</AppBadge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tw:text-center tw:py-8">
          <p className="tw:text-gray-400 tw:text-sm">No sellers available</p>
        </div>
      )}
    </div>
  );
};

export default Sellers;
