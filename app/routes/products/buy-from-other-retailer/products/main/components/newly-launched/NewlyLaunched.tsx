import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSwiper from "~/components/core/swiper";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import ProductCard from "../../../components/ProductCard";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import type { SwiperOptions } from "swiper/types";

interface NewlyLaunchedProps {
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
  autoHeight: false,
};

const NewlyLaunched: React.FC<NewlyLaunchedProps> = ({
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
        const params = SellerCatalogService.getNetworkNewlyLaunchedParams({
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
        console.error("Error fetching newly launched products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [distance]);

  const handleSeeAll = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      feature: "newlyLaunched",
      distance: distance,
      title: "Newly Launched",
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
      <AppSwiper config={config}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <AppSwiper.Slide key={`skeleton-${idx}`}>
            <div className="tw:flex tw:flex-col tw:h-full tw:flex-1">
              <div className="skeleton-loader tw:w-full tw:h-36 tw:rounded-md"></div>
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="tw:mb-6">
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
        <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
          Newly Launched
        </h2>
        <button
          onClick={handleSeeAll}
          className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
        >
          {t("seeAll")} <span aria-hidden>→</span>
        </button>
      </div>

      <div className="tw:min-w-0">
        <AppSwiper config={config}>
          {products.map((product: any, index: number) => (
            <AppSwiper.Slide key={index}>
              <ProductCard data={product} callback={handleBuyNow} />
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      </div>
      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
      />
    </div>
  );
};

export default NewlyLaunched;
