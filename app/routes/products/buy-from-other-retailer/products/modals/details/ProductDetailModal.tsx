import { produce } from "immer";
import React, { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CartService from "~/services/CartService";
import SellerCatalogService from "~/services/SellerCatalogService";
import { merge } from "lodash";
import Images from "./components/Images";
import SellersList from "./components/SellersList";

interface ProductDetailModalProps {
  show: boolean;
  dealId: string;
  callback: (p: { show: boolean; data?: any }) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  show,
  dealId,
  callback,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [product, setProduct] = useState<any>(null);

  const fetchDetail = async () => {
    if (!show || !dealId) return;
    setLoading(true);
    setProduct(null);
    try {
      const resp = await SellerCatalogService.getNetworkDeals(
        merge({}, SellerCatalogService.getBaseParamsToBuyProduct(), {
          filter: { dealId: dealId },
          parent: true,
        }),
      );

      const d = resp?.data?.data?.[0] || {};
      const formatted = d?.dealId
        ? SellerCatalogService.formatProductResponse([d], {
            view: "buyer",
          })?.[0]
        : null;

      // Prepare sellers with deal/cart info similar to SellerListModal
      if (formatted) {
        try {
          const cartResp = await CartService.getNetworkMultiCarts();
          const cartData = cartResp.data?.data || [];

          const sellersWithDeal = (formatted.sellers || []).map(
            (seller: any) => {
              const cartForSeller = cartData.find(
                (cart: any) => cart.franchiseInfo.id === seller.id,
              );
              const cartItem = cartForSeller?.items.find(
                (item: any) =>
                  item.deal.id === d.dealId || item.deal.id === formatted._id,
              );

              return {
                ...seller,
                deal: {
                  ...formatted,
                  inCart: {
                    status: !!cartItem,
                    qty: cartItem?.quantity || 0,
                  },
                  cartId: cartForSeller?._id,
                  itemId: cartItem?.itemId,
                  maxQty: seller.qty,
                  price: seller.price?.price ?? seller.price,
                  mrp: seller.mrp,
                  buyFromOtherRetailer: {
                    retailerId: seller.id,
                    status: true,
                  },
                },
              };
            },
          );

          formatted.sellers = sellersWithDeal;
        } catch (e) {
          // If cart fetch fails, keep original sellers
        }
      }

      setProduct(formatted);
      try {
        callback?.({ show: true, data: formatted });
      } catch (e) {
        // ignore callback errors
      }
    } catch (e) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [show, dealId]);

  const handleClose = () => {
    try {
      callback({ show: false });
    } catch (e) {}
    setProduct(null);
  };
  // Update seller inCart data after add/update/remove from cart
  const handleSellerAddToCart = useCallback(
    (resp: any) => {
      setProduct(
        produce((draft: any) => {
          const seller = (draft?.sellers || []).find(
            (s: any) => s.id === resp?.data?.sellerId,
          );
          if (seller) {
            seller.deal.itemId = resp?.data?.itemId;
            seller.deal.cartId = resp?.data?.cartId;
            seller.deal.inCart = {
              status: resp?.data?.quantity > 0,
              qty: resp?.data?.qty,
            };
          }
        }),
      );
    },
    [callback],
  );

  // sellers rendering replaced by SellersList component

  return (
    <AppModal
      show={show}
      callback={handleClose}
      backdropDismiss={true}
      className="tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        {product?.name || "Product details"}
      </AppModal.Title>

      <AppModal.Content className="tw:flex tw:flex-col tw:gap-4 tw:py-3 tw:h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:py-6">
            <AppSpinner />
          </div>
        ) : (
          <>
            <div className="tw:flex tw:flex-col tw:gap-3">
              <Images images={product?.images || []} alt={product?.name} />

              <div>
                <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
                  {product?.name || "Product"}
                </div>

                <div className="tw:mt-1 tw:flex tw:items-center tw:gap-3">
                  <div>
                    <Amount
                      value={product?.displayPrice ?? product?.mrp ?? 0}
                      className="tw:text-lg tw:font-semibold tw:text-green-600"
                      showSymbol={true}
                      decimalPlaces={2}
                    />
                  </div>

                  {product?.discount > 0 &&
                  (product?.displayPrice || product?.mrp) !== product?.mrp ? (
                    <div className="tw:text-xs tw:text-gray-400 tw:line-clamp-1">
                      <span className="tw:line-through">
                        <Amount value={product?.mrp ?? 0} decimalPlaces={2} />
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="tw:pt-2 tw:border-t tw:border-app-gray-2">
              <div className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-2">
                Sellers
              </div>
              <SellersList
                loading={false}
                silentLoading={false}
                sellers={product?.sellers || []}
                onAddToCart={handleSellerAddToCart}
              />
            </div>
          </>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ProductDetailModal;
