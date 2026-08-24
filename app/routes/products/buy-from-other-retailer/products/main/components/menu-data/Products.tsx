import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppButton from "~/components/core/button/AppButton";
import AppSwiper from "~/components/core/swiper";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import type { Deal } from "~/types/CommonTypes";
import ProductCard from "../../../components/ProductCard";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import CommonService from "~/services/CommonService";

interface ProductsProps {
  menuId: string;
  menuName: string;
  products?: Deal[];
  callback: (data: { action: string; data: any }) => void;
  distance?: number;
}

const Products: React.FC<ProductsProps> = ({
  menuId,
  menuName,
  products = [],
  callback,
  distance = DEFAULT_BROWSE_DISTANCE,
}) => {
  const { t } = useTranslation();
  const appNav = useAppNav();
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

  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({ dealId: "", show: false });

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
          callback({
            action: CART_ITEM_ADDED,
            data: { dealId },
          });
        }
      }

      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    []
  );

  const handleSeeAll = (menu: any) => {
    if (!menu) return;
    appNav.to("/products/buy-from-other-retailer/products/list", {
      menuId,
      menuName,
      distance,
    });
  };

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-3">
        <h3 className="tw:text-xs tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          {t("featuredProducts")}
        </h3>
        {products && products.length >= 10 && (
          <AppButton
            size="small"
            fill="clear"
            className="tw:!p-0 tw:!h-auto tw:text-primary tw:font-bold"
            onClick={() => handleSeeAll({ _id: menuId, name: menuName })}
          >
            {t("seeAll")}
          </AppButton>
        )}
      </div>

      <AppSwiper config={config}>
        {products.map((product: any) => (
          <AppSwiper.Slide key={product.id || product._id}>
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

export default Products;

const swiperConfig: SwiperOptions = {
  spaceBetween: 15,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: { slidesPerView: 2 },
    640: { slidesPerView: 3 },
    1024: { slidesPerView: 4.2 },
  },
};
