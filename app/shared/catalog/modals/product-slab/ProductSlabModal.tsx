import { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SellerCatalogService from "~/services/SellerCatalogService";
import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import { PRD_IMG_RESOLUTION, DISCOUNT_DECIMAL_PLACES } from "~/constants";
import { AppTable, TableHeader } from "~/components/core/table";
import CommonService from "~/services/CommonService";
import { CART_ITEM_ADDED, CART_ITEM_REMOVED } from "~/constants";
import AddToCart from "~/components/feature/products/add-to-cart/AddToCart";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import type { TableHeaderItem } from "~/types/CommonTypes";
import SellingTypeDisplay from "../../components/SellingTypeDsiplay";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  sellerId: string;
  dealId: string;
};

const headers: TableHeaderItem[] = [
  { label: "Quantity" },
  { label: "Discount", isCentered: true },
  { label: "B2B Price", isCentered: true },
];

const ProductSlabModal: React.FC<Props> = ({
  show,
  callback,
  sellerId,
  dealId,
}) => {
  const [loading, setLoading] = useState(true);
  const [slabs, setSlabs] = useState<any[]>([]);
  const [deal, setDeal] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  useEffect(() => {
    if (show) {
      setLoading(true);
      setSlabs([]);
      setDeal(null);

      const fetchDeal = async () => {
        let params: Record<string, any> = {
          filter: { dealId: dealId },
          parent: true,
        };

        if (sellerId) {
          params = {
            ...params,
            sellerId,
          };
        }

        const dealResp = await SellerCatalogService.getProducts(params);
        const d = dealResp.data?.data?.[0] || null;
        const formatted = d
          ? SellerCatalogService.formatProductResponse([d], {
              view: "buyer",
            })?.[0]
          : null;

        if (sellerId && formatted) {
          formatted.buyFromOtherRetailer = {
            status: true,
            retailerId: String(sellerId),
          };

          // Fetch multi-carts and check if this deal is present in the specific
          // retailer's cart. If present, update `inCart`, `cartId` and `itemId` on
          // the formatted deal so UI components (AddToCart, etc.) can reflect
          // the correct cart state.
          try {
            const cartsResp = await SellerCatalogService.getMultiCarts();
            const carts = cartsResp.data?.data || [];

            const matchedCart = (carts || []).find((c: any) => {
              const fid = c?.franchiseInfo?.id;
              return String(fid) === String(sellerId);
            });

            if (matchedCart) {
              const cartItem = (matchedCart.items || []).find((it: any) => {
                return String(it?.deal?.id) === String(formatted._id);
              });

              if (cartItem) {
                formatted.inCart = {
                  status: true,
                  qty: Number(cartItem.quantity) || 0,
                };
                formatted.cartId = matchedCart._id || "";
                formatted.itemId = cartItem.itemId || "";
              } else {
                formatted.inCart = { status: false };
              }
            }
          } catch (e) {
            console.warn("Error fetching retailer carts:", e);
          }
        }

        // prepare slab data: compute price for each slab using product MRP and slab discount
        const preparedSlabs = (formatted?.priceSlabs || []).map(
          (s: any, idx: number) => {
            const minQuantity = s.min ?? null;
            const maxQuantity = s.max ?? null;
            const discountPercentage = s.discount ?? 0;
            const price = s.offerPrice || 0;
            return {
              ...s,
              _key: s._id || `slab-${idx}`,
              minQuantity,
              maxQuantity,
              discountPercentage,
              price,
            };
          },
        );

        setDeal(formatted || null);
        setSlabs(preparedSlabs || []);
        setLoading(false);
      };
      void fetchDeal();
    }
  }, [show, dealId, sellerId]);

  const onClose = () => {
    callback({ action: "close", data: { deal } });
  };

  const handleAddToCartCallback = (res: any) => {
    const action = res?.action;

    if (action === "add" || action === "update" || action === CART_ITEM_ADDED) {
      const qty = res.data?.data?.quantity || 0;

      const priceSlabObj =
        deal?.priceSlabs && deal.priceSlabs.length > 0
          ? { isAvailable: true, slab: deal.priceSlabs }
          : null;

      const basePrice = deal?.price || deal?.mrp || 0;
      const p = CommonService.getPriceFromSlab(priceSlabObj, qty, basePrice);
      setCurrentPrice(p);
    }

    if (action === "remove" || action === CART_ITEM_REMOVED) {
      setCurrentPrice(deal?.displayPrice || deal?.mrp || 0);
    }
  };

  const mrp = deal?.mrp ?? 0;
  const baseDisplayPrice = deal?.displayPrice ?? deal?.mrp ?? 0;
  const effectiveDisplayPrice =
    typeof currentPrice === "number" ? currentPrice : baseDisplayPrice;
  const discountPercent = CommonService.calculateDiscount(
    mrp,
    effectiveDisplayPrice,
    DISCOUNT_DECIMAL_PLACES,
  );

  return (
    <AppModal show={show} callback={onClose}>
      <AppModal.Title onClose={onClose}>Slab Discount</AppModal.Title>
      <AppModal.Content>
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner />
          </div>
        ) : (
          <div>
            {deal ? (
              <div className="tw:space-y-3">
                {/* Product Info Card - Compact */}
                <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3">
                  <div className="tw:flex tw:items-start tw:gap-3">
                    {/* Product Image */}
                    <div className="tw:w-16 tw:h-16 tw:flex-shrink-0 tw:bg-white tw:border tw:border-gray-200 tw:rounded-md tw:p-1.5 tw:flex tw:items-center tw:justify-center tw:shadow-sm">
                      <ImgRender
                        assetId={deal.images?.[0] ?? ""}
                        className="tw:w-full tw:h-full tw:object-contain"
                        size={PRD_IMG_RESOLUTION}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="tw:flex-1 tw:min-w-0">
                      {/* Product Name */}
                      <h2 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:leading-tight tw:mb-2">
                        {deal.name}
                      </h2>

                      {/* Pricing & Action Row: two-column flex with justify-between */}
                      <div className="tw:flex tw:justify-between tw:items-start tw:gap-3">
                        {/* Left Column - Pricing Info */}
                        <div className="tw:flex-1">
                          <div className="tw:text-[10px] tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide">
                            B2B Price
                          </div>

                          {/* Price and Discount */}
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                            <span className="tw:text-xl tw:font-bold tw:text-green-600 tw:leading-none">
                              <Amount
                                value={effectiveDisplayPrice}
                                decimalPlaces={2}
                              />
                            </span>

                            {discountPercent > 0 && (
                              <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:font-bold tw:bg-green-600 tw:text-white tw:px-1.5 tw:py-0.5 tw:rounded tw:leading-none">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </div>

                          {/* MRP scratched */}
                          {mrp > baseDisplayPrice && (
                            <div className="tw:mt-1 tw:flex tw:items-baseline tw:gap-1">
                              <span className="tw:text-[10px] tw:text-gray-400 tw:uppercase">
                                MRP
                              </span>
                              <span className="tw:text-xs tw:text-gray-400 tw:line-through tw:font-medium tw:ml-1">
                                <Amount value={mrp} decimalPlaces={2} />
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Add to Cart */}
                        <div className="tw:flex-shrink-0 tw:self-center">
                          <div className="tw:flex tw:flex-col tw:items-end">
                            <AddToCart
                              deal={deal}
                              callback={handleAddToCartCallback}
                              ignorePriceSlab={true}
                              cartType="buy-from-other-retailer"
                            />

                            <div className="tw:text-xs tw:text-green-600 tw:mt-2 tw:flex tw:items-center tw:gap-1">
                              In stock:{" "}
                              {typeof deal?.maxQty === "number"
                                ? deal.maxQty
                                : "—"}{" "}
                              {deal?.sellingType || ""}
                              <CaseQtyPopover
                                packageQty={deal?.packageQty || 0}
                                sellingType={deal?.sellingType || ""}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Section */}
                <div className="tw:space-y-2">
                  {/* Price Slab Section */}
                  {slabs && slabs.length > 0 && (
                    <div className="tw:border-t tw:border-gray-200 tw:pt-2">
                      <div className="tw:text-xs tw:text-gray-500 tw:mt-2">
                        Add more quantity to earn a larger discount on this
                        product.
                      </div>

                      {deal?.sellingType && deal.sellingType !== "UNIT" && (
                        <div className="tw:text-xs tw:font-medium tw:text-blue-600 tw:bg-blue-50 tw:px-2 tw:py-1.5 tw:rounded tw:mt-2">
                          1{" "}
                          <SellingTypeDisplay sellingType={deal.sellingType} />{" "}
                          = {deal.packageQty || 0} units
                        </div>
                      )}

                      <AppTable
                        bordered
                        condensed
                        className="tw:border-gray-200 tw:border tw:mt-2"
                      >
                        <AppTable.Header>
                          <TableHeader headers={headers} />
                        </AppTable.Header>

                        <AppTable.Body>
                          {slabs.map((s: any, idx: number) => (
                            <AppTable.Row key={s._key}>
                              <AppTable.Cell>
                                {idx === slabs.length - 1 ||
                                s.maxQuantity == null
                                  ? `${s.minQuantity} and above`
                                  : `${s.minQuantity} to ${s.maxQuantity}`}{" "}
                                units
                              </AppTable.Cell>

                              <AppTable.Cell className="tw:text-center">
                                {s.discountPercentage}%
                              </AppTable.Cell>

                              <AppTable.Cell className="tw:text-center">
                                <Amount value={s.price} decimalPlaces={2} />
                              </AppTable.Cell>
                            </AppTable.Row>
                          ))}
                        </AppTable.Body>
                      </AppTable>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="tw:p-4 tw:text-center tw:text-gray-500">
                <div className="tw:text-xs">No product data available</div>
              </div>
            )}
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ProductSlabModal;
