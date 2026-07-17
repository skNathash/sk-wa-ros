import React, { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import ProductService from "~/services/ProductService";
import CommonService from "~/services/CommonService";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import { AuthService } from "~/services/AuthService";
import { Skeleton } from "~/components/ui/skeleton";
import SellerCatalogService from "~/services/SellerCatalogService";

type Props = {
  categoryId: string;
  brandId: string;
  dealId: string;
  callback: (a: { action: string; data?: any }) => void;
  onProductClick?: (dealId: string) => void;
  cartType?: "normal" | "buyer";
};

const slideOptions: SwiperOptions = {
  spaceBetween: 10,
  slidesOffsetAfter: 12,
  slidesOffsetBefore: 12,
  mousewheel: {
    forceToAxis: true,
  },
  breakpoints: {
    300: {
      slidesPerView: 1.2,
    },
    768: {
      slidesPerView: 1.9,
    },
  },
};

const getSellerProducts = async (
  categoryId: string,
  brandId: string,
  dealId: string,
) => {
  const response = await SellerCatalogService.getProducts({
    page: 1,
    count: 20,
    filter: {
      "applicableCategory.categoryId": categoryId,
      "applicableBrand.brandId": brandId,
      "applicableDeal.dealId": dealId,
    },
    parent: true,
  });
  return {
    data: SellerCatalogService.formatProductResponse(response.data?.data || []),
  };
};

const getData = async (categoryId: string, brandId: string, dealId: string) => {
  const isBuyerLogin = AuthService.isBuyerUser();
  if (isBuyerLogin) {
    return await getSellerProducts(categoryId, brandId, dealId);
  }

  const p = {
    filter: {
      category: categoryId,
      brand: brandId,
      deal: dealId,
    },
  };

  const r = await ProductService.getSimilarDeals(p);
  const data = Array.isArray(r.data)
    ? r.data.filter((x: any) => x.maxQty > 0)
    : [];
  return { data: CommonService.gridViewSplit(data, 4) };
};

function SimilarProductSlide({
  categoryId,
  brandId,
  dealId,
  callback,
  onProductClick,
  cartType,
}: Props) {
  const [data, setData] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(true);

  const [cartAction, setCartAction] = useState<{ action: string; deal: any }>({
    action: "",
    deal: {},
  });

  // Determine cartType based on user type if not provided
  const finalCartType =
    cartType || (AuthService.isBuyerUser() ? "buyer" : "normal");

  const init = useCallback(async () => {
    setLoading(true);
    setData([]);
    const r = await getData(categoryId, brandId, dealId);

    setData(r.data);
    setLoading(false);
  }, [brandId, categoryId, dealId]);

  useEffect(() => {
    init();
  }, [init]);

  const productCb = (e: any) => {
    if (e.action === "click" && e?.data?.deal?._id && onProductClick) {
      onProductClick(e.data.deal._id);
      return;
    }

    callback(e);
    if (e.data.isActionHandler) {
      setCartAction({ action: e.action, deal: e.data.deal });
    }
  };

  const cartActionCb = () => {
    const t = setTimeout(() => {
      clearTimeout(t);
      setCartAction({ action: "", deal: {} });
    }, 500);
  };

  return (
    <>
      {loading ? (
        <div className="tw:px-4">
          <Skeleton />
        </div>
      ) : null}

      {data.length ? (
        <div className="tw:py-4 tw:mb-4 tw:bg-white tw:rounded-lg">
          <div className="tw:text-sm tw:font-semibold tw:mb-3">
            Similar Products
          </div>
          <AppSwiper config={slideOptions}>
            {data.map((group, index) => (
              <AppSwiper.Slide key={index}>
                <div className="grid grid-cols-2 gap-4">
                  {group.map((x: any) => (
                    <ProductCard
                      key={x._id}
                      bgStyle={{}}
                      imgBgStyle={{}}
                      data={x}
                      type={2}
                      callback={productCb}
                      cartType={finalCartType}
                      useBusyLoader={true}
                    />
                  ))}
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      ) : null}

      {/* <AddToCartActionHandler
        action={cartAction.action}
        deal={cartAction.deal}
        callback={cartActionCb}
      /> */}
    </>
  );
}

export default SimilarProductSlide;
