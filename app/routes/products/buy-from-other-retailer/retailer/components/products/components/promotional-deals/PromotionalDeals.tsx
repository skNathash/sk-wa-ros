import { merge } from "lodash";
import { Sparkles } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import ProductSlide from "~/components/feature/products/product-slide/ProductSlide";
import SellerCatalogService from "~/services/SellerCatalogService";

interface PromotionalDealsProps {
  sellerId?: string;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 10,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: { slidesPerView: 2.4 },
    1024: { slidesPerView: 7.5 },
  },
  autoHeight: false,
};

const PromotionalDeals: React.FC<PromotionalDealsProps> = ({ sellerId }) => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const baseParams = SellerCatalogService.getBaseParamsToBuyProduct();
        const response = await SellerCatalogService.getProducts(
          merge(baseParams, {
            page: 1,
            count: 100,
            sellerId: sellerId,
            filter: {
              isPromotionalDeal: true,
            },
          }),
        );
        const data = response.data?.data || [];
        setProducts(
          SellerCatalogService.formatProductResponse(data, {
            view: "buyer",
          }),
        );
      } catch (error) {
        console.error("Error fetching promotional deals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBuyNow = (data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
    }
  };

  if (loading) {
    return (
      <div className="tw:mb-6">
        <AppSwiper config={swiperConfig}>
          {Array.from({ length: 5 }).map((_, idx) => (
            <AppSwiper.Slide key={`skeleton-${idx}`}>
              <div className="tw:flex tw:flex-col tw:h-full tw:flex-1">
                <div className="skeleton-loader tw:w-full tw:h-36 tw:rounded-md"></div>
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="tw:mb-6 tw:bg-gradient-to-r tw:from-orange-50 tw:to-rose-50 tw:p-4 tw:rounded-xl tw:border tw:border-orange-100">
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:bg-orange-500 tw:p-1.5 tw:rounded-lg">
            <Sparkles className="tw:w-4 tw:h-4 tw:text-white" />
          </div>
          <div>
            <h2 className="tw:text-lg tw:font-bold tw:text-slate-900 tw:leading-none">
              Promotional Deals
            </h2>
            <p className="tw:text-[10px] tw:text-orange-600 tw:font-medium tw:mt-1">
              {" "}
              EXCLUSIVE OFFERS FOR YOU
            </p>
          </div>
        </div>
        {/* <button
          onClick={handleSeeAll}
          className="tw:text-xs tw:font-semibold tw:text-orange-600 hover:tw:text-orange-700 tw:bg-white tw:px-3 tw:py-1.5 tw:rounded-full tw:shadow-sm tw:border tw:border-orange-100 tw:transition-all"
        >
          {t("seeAll")}
        </button> */}
      </div>

      <div className="tw:min-w-0">
        <ProductSlide
          data={products}
          callback={handleBuyNow}
          type={1}
          cartType="buy-from-other-retailer"
          retailerId={sellerId}
        />
      </div>
    </div>
  );
};

export default PromotionalDeals;
