import React, { useEffect, useMemo, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import AppSwiper from "~/components/core/swiper";
import ProductCard from "../../../components/ProductCard";
import SellerCatalogService from "~/services/SellerCatalogService";
import { Skeleton } from "~/components/ui/skeleton";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import useAppNav from "~/hooks/useAppNav";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";

interface MenuProductsProps {
  menuId: string;
  menuName: string;
  distance?: number | string;
}

const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  navigation: false,
  pagination: false,
  breakpoints: {
    320: { slidesPerView: 2.2 },
    640: { slidesPerView: 3.2 },
    1024: { slidesPerView: 4.2 },
  },
  autoHeight: false,
};

const MenuProductsSkeleton = ({ config }: { config: SwiperOptions }) => (
  <AppSwiper config={config}>
    {Array.from({ length: 5 }).map((_, idx) => (
      <AppSwiper.Slide key={`menu-product-skeleton-${idx}`}>
        <div className="tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm tw:overflow-hidden">
          <Skeleton className="tw:h-32 tw:w-full tw:rounded-none" />
          <div className="tw:p-3 tw:space-y-2">
            <Skeleton className="tw:h-3 tw:w-3/5" />
            <Skeleton className="tw:h-4 tw:w-4/5" />
            <Skeleton className="tw:h-8 tw:w-full" />
          </div>
        </div>
      </AppSwiper.Slide>
    ))}
  </AppSwiper>
);

const MenuProducts: React.FC<MenuProductsProps> = ({
  menuId,
  menuName,
  distance = DEFAULT_BROWSE_DISTANCE,
}) => {
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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({ dealId: "", show: false });

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!menuId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await SellerCatalogService.getNetworkDeals(
          {
            page: 1,
            count: 10,
            filter: {
              "applicableMenu.menuId": menuId,
            },
          },
          distance,
        );

        const data = response.data?.data || [];
        const formattedProducts = SellerCatalogService.formatProductResponse(
          data,
        );

        if (isMounted) {
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error(`Error fetching products for menu ${menuName}:`, error);
        if (isMounted) {
          setProducts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [distance, menuId, menuName]);

  const handleSeeAllClick = () => {
    appNav.to("/products/buy-from-other-retailer/products/list", {
      menuId,
      menuName,
      distance,
    });
  };

  const handleBuyNow = (data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }
  };

  const handleModalCallback = (data: { action: string; data?: any }) => {
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
      }
    }

    if (data.action === "close") {
      setSellersModal({ dealId: "", show: false });
    }
  };

  if (loading) {
    return (
      <div className="tw:mt-3">
        <MenuProductsSkeleton config={config} />
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="tw:mt-3 tw:mb-1">
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <h3 className="tw:text-xs tw:sm:text-sm tw:font-semibold tw:text-slate-500 tw:uppercase tw:tracking-wider">
          Products
        </h3>
        <span
          className="tw:text-sm tw:text-gray-600 tw:cursor-pointer"
          onClick={handleSeeAllClick}
        >
          See all
        </span>
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

export default MenuProducts;
