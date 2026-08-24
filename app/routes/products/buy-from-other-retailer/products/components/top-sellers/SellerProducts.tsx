import { produce } from "immer";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import AppSwiper from "~/components/core/swiper";
import {
  B2B_DISCOUNT_TYPE,
  DISCOUNT_DECIMAL_PLACES,
} from "~/constants";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import useTheme from "~/hooks/useTheme";
import CartService from "~/services/CartService";
import CommonService from "~/services/CommonService";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import { getSellerProducts } from "./helper";

// A horizontal rail of one seller's catalog, used under each seller block in
// the "Shop by seller" section. Reads the same seller-deals API and renders the
// same card as the seller's catalog tab, so prices, schemes and the add-to-cart
// behaviour match what the buyer sees inside the shop.

type Props = {
  sellerId: string;
  /** How many deals to pull for the rail. */
  count?: number;
  callback?: (data: { action: string; data?: any }) => void;
};

const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: { slidesPerView: 2.4 },
    1024: { slidesPerView: 5 },
  },
};

const SellerProducts = ({ sellerId, count = 10, callback }: Props) => {
  const theme = useTheme();
  const config = useMemo<SwiperOptions>(
    () => ({
      ...swiperConfig,
      breakpoints: {
        ...swiperConfig.breakpoints,
        1024: { slidesPerView: CommonService.getDesktopPerView(theme) },
      },
    }),
    [theme],
  );

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [detailModal, setDetailModal] = useState<{
    show: boolean;
    dealId: string;
  }>({ show: false, dealId: "" });

  const [cartAction, setCartAction] = useState<{
    action: string;
    deal: any;
    dealId: string;
    sellerId: string;
  }>({ action: "", deal: {}, dealId: "", sellerId: "" });

  useEffect(() => {
    if (!sellerId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const loadProducts = async () => {
      try {
        const data = await getSellerProducts(sellerId, count);
        if (active) setProducts(data);
      } catch (err) {
        console.error("Error loading seller products", err);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [sellerId, count]);

  // Mirrors the seller catalog tab: cart changes re-price the row off its slab,
  // group-deal / price-slab hand off to the shared action handler, and a card
  // click opens the product detail modal scoped to this seller.
  const handleCardCallback = (e: any) => {
    const action = e.action;
    const deal = e.data?.data?.data || e.data?.data?.deal;

    if (action === "add" || action === "update" || action === "remove") {
      setProducts(
        produce((draft) => {
          const index = draft.findIndex((item) => item.id === deal.id);
          if (index === -1) return;

          const price = draft[index].price;
          const priceSlabs = draft[index].priceSlabs;
          draft[index].displayPrice = CommonService.getPriceFromSlab(
            { isAvailable: true, slab: priceSlabs },
            deal.quantity,
            price,
          );
          const mrp = draft[index].mrp || draft[index].price || 0;
          draft[index].discount = CommonService.calculateDiscount(
            mrp,
            draft[index].displayPrice,
            DISCOUNT_DECIMAL_PLACES,
            B2B_DISCOUNT_TYPE,
          );
          draft[index].inCart = CartService.isDealInCart(deal.id, sellerId);
        }),
      );
      callback?.({ action, data: e.data });
      return;
    }

    if (action === "group-deal") {
      setCartAction({
        action: "group-deal",
        deal: deal,
        dealId: deal?._id,
        sellerId: deal?.buyFromOtherRetailer?.retailerId || sellerId,
      });
      return;
    }

    if (action === "price-slab") {
      setCartAction({
        action: "price-slab",
        deal: {},
        dealId: deal?.dealId,
        sellerId,
      });
      return;
    }

    if (action === "click") {
      setDetailModal({ show: true, dealId: e.data?.deal?._id });
    }
  };

  const handleModalCallback = useCallback(
    (data: any) => {
      setDetailModal({ show: false, dealId: "" });
      callback?.({ action: "product-detail", data });
    },
    [callback],
  );

  if (loading) {
    return (
      <AppSwiper config={config}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppSwiper.Slide key={`skeleton-${idx}`}>
            <div className="skeleton-loader tw:h-48 tw:w-full tw:rounded-2xl" />
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    );
  }

  if (products.length === 0) return null;

  return (
    <>
      <AppSwiper config={config}>
        {products.map((product: any) => (
          <AppSwiper.Slide key={product._id || product.id}>
            <div className="tw:flex tw:h-full tw:flex-1 tw:flex-col">
              <ProductCard
                data={product}
                callback={handleCardCallback}
                cartType="buy-from-other-retailer"
                tint
              />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>

      <ProductDetailModal
        show={detailModal.show}
        callback={handleModalCallback}
        dealId={detailModal.dealId}
        cartType="buy-from-other-retailer"
        retailerId={sellerId}
      />

      <AddToCartActionHandler
        deal={cartAction.deal}
        action={cartAction.action}
        callback={() =>
          setCartAction({ action: "", deal: {}, dealId: "", sellerId: "" })
        }
        sellerId={cartAction.sellerId}
        dealId={cartAction.dealId}
      />
    </>
  );
};

export default SellerProducts;
