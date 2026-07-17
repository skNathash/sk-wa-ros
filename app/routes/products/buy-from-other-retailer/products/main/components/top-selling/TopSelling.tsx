import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import AppSwiper from "~/components/core/swiper";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellerListModal from "../../../modals/seller-list/SellerListModal";
import ProductCard from "../../../components/ProductCard";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import type { SwiperOptions } from "swiper/types";

interface TopSellingProps {
  callback?: (data: { action: string; data: any }) => void;
  distance?: number;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 15,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: { slidesPerView: 2.4 },
    1024: { slidesPerView: 4.2 },
  },
};

const TopSelling: React.FC<TopSellingProps> = ({
  callback,
  distance = DEFAULT_BROWSE_DISTANCE,
}) => {
  const { t } = useTranslation();
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
        const params = SellerCatalogService.getNetworkTopSellingParams({
          page: 1,
          count: 10,
        });
        const response = await SellerCatalogService.getNetworkDeals(
          params,
          distance
        );
        const data = response.data?.data || [];
        setProducts(SellerCatalogService.formatProductResponse(data));
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [distance]);

  const handleSeeAll = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      feature: "topSelling",
      distance: distance,
      title: "Top Selling Products",
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
            })
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
    [callback]
  );

  if (loading) {
    return (
      <div className="tw:mb-4">
        <AppSwiper config={config}>
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
    <div className="tw:mb-4">
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:h-4 tw:w-1 tw:rounded-full tw:bg-primary" />
          <h2 className="tw:text-base tw:font-bold tw:text-slate-900">
            Top Selling Products
          </h2>
        </div>
        <button
          onClick={handleSeeAll}
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-xs tw:font-semibold tw:text-primary tw:hover:opacity-80"
        >
          {t("seeAll")}
          <ChevronRight className="tw:h-3.5 tw:w-3.5" />
        </button>
      </div>

      <AppSwiper config={config}>
        {products.map((product: any, index: number) => (
          <AppSwiper.Slide key={index}>
            <div className="tw:flex tw:flex-col tw:h-full tw:flex-1">
              <ProductCard data={product} callback={handleBuyNow} />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
      />
    </div>
  );
};

export default TopSelling;
