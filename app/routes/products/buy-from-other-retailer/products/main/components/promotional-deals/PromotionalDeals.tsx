import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSwiper from "~/components/core/swiper";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import ProductCard from "../../../components/ProductCard";
import useAppNav from "~/hooks/useAppNav";
import type { SwiperOptions } from "swiper/types";
import { Sparkles } from "lucide-react";

interface PromotionalDealsProps {
  callback?: (data: { action: string; data: any }) => void;
  distance?: number;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 15,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: { slidesPerView: 2.4 },
    1024: { slidesPerView: 5.5 },
  },
  autoHeight: false,
};

const PromotionalDeals: React.FC<PromotionalDealsProps> = ({
  callback,
  distance = DEFAULT_BROWSE_DISTANCE,
}) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({ dealId: "", show: false });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = SellerCatalogService.getNetworkPromotionalDealParams({
          page: 1,
          count: 10,
        });

        const response = await SellerCatalogService.getNetworkDeals(
          params,
          distance,
        );
        const data = response.data?.data || [];
        setProducts(SellerCatalogService.formatProductResponse(data));
      } catch (error) {
        console.error("Error fetching promotional deals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [distance]);

  const handleSeeAll = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      feature: "promotionalDeals",
      distance: distance,
      title: "Promotional Deals",
    });
  };

  const handleBuyNow = useCallback((data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }
  }, []);

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      if (data.action === CART_ITEM_ADDED) {
        const dealId = data.data?.dealId;
        if (dealId) {
          setProducts((prev) =>
            prev.map((p) => {
              const id = p._id || p.id;
              if (!id) return p;
              if (id === dealId) {
                return {
                  ...p,
                  inCart: true,
                };
              }
              return p;
            }),
          );
          callback?.({
            action: CART_ITEM_ADDED,
            data: { dealId },
          });
        }
      }

      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    [callback],
  );

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
            <p className="tw:text-[10px] tw:text-orange-600 tw:font-medium tw:mt-1"> EXCLUSIVE OFFERS FOR YOU</p>
          </div>
        </div>
        <button 
          onClick={handleSeeAll} 
          className="tw:text-xs tw:font-semibold tw:text-orange-600 hover:tw:text-orange-700 tw:bg-white tw:px-3 tw:py-1.5 tw:rounded-full tw:shadow-sm tw:border tw:border-orange-100 tw:transition-all"
        >
          {t("seeAll")}
        </button>
      </div>

      <div className="tw:min-w-0">
        <AppSwiper config={swiperConfig}>
          {products.map((product: any, index: number) => (
            <AppSwiper.Slide key={index}>
              <div className="tw:transition-transform hover:tw:scale-[1.02]">
                <ProductCard data={product} callback={handleBuyNow} />
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      </div>
      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
        type="PromotionalDeal"
      />
    </div>
  );
};

export default PromotionalDeals;
