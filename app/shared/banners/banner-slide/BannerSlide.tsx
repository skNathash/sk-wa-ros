import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ImgRender from "~/components/core/img/ImgRender";
import BannerService from "~/services/BannerService";
import useAppNav from "~/hooks/useAppNav";

interface BannerSlideProps {
  placeholder: string;
  retailerId?: string;
  onBannerClick?: (banner: any) => void;
}

const BannerSlide = ({
  placeholder,
  retailerId,
  onBannerClick,
}: BannerSlideProps) => {
  const [banners, setBanners] = useState<any[]>([]);
  const appNav = useAppNav();

  useEffect(() => {
    loadBanners();
  }, [placeholder]);

  const loadBanners = async () => {
    try {
      const res = await BannerService.getValidBanners(retailerId, {
        filter: {
          "placeholderInfo.code": placeholder,
          type: "B2B",
        },
      });
      const data = Array.isArray(res?.data?.data) ? res.data?.data : [];
      setBanners(data);
    } catch {
      setBanners([]);
    }
  };

  const handleBannerClick = useCallback(
    (banner: any) => {
      const bannerType = banner.bannerType;
      const condition = banner.bannerForCondition;

      if (!bannerType || bannerType === "NoAction" || !condition) return;

      const params: Record<string, string> = {};

      switch (bannerType) {
        case "Brand":
          if (condition.brands?.length) {
            params.brandId = condition.brands
              .map((b: any) => b.brandId || b.id)
              .join(",");
            params.brandName = condition.brands
              .map((b: any) => b.name || "")
              .join(",");
          }
          break;
        case "Category":
          if (condition.categories?.length) {
            params.categoryId = condition.categories
              .map((c: any) => c.id)
              .join(",");
            params.categoryName = condition.categories
              .map((c: any) => c.name || "")
              .join(",");
          }
          break;
        case "Product":
          if (condition.deals?.length) {
            params.productId = condition.deals.map((d: any) => d.id).join(",");
          }
          break;
        case "BrandCategory":
          if (condition.brands?.length) {
            params.brandId = condition.brands
              .map((b: any) => b.brandId || b.id)
              .join(",");
            params.brandName = condition.brands
              .map((b: any) => b.name || "")
              .join(",");
          }
          if (condition.categories?.length) {
            params.categoryId = condition.categories
              .map((c: any) => c.id)
              .join(",");
            params.categoryName = condition.categories
              .map((c: any) => c.name || "")
              .join(",");
          }
          break;
        case "Keywords":
          if (condition.keyword || condition.keywords) {
            params.search = condition.keyword || condition.keywords;
          }
          break;
        case "Menu":
          if (condition.menus?.length) {
            params.menuId = condition.menus.map((m: any) => m.id).join(",");
            params.menuName = condition.menus
              .map((m: any) => m.name || "")
              .join(",");
          }
          break;
      }

      if (Object.keys(params).length) {
        params.inventoryTab = "products";
        params.scrollToProduct = Date.now().toString();
        if (banner.title) params.bannerTitle = banner.title;
        onBannerClick?.(banner);
        appNav.to(
          "/products/buy-from-other-retailer/retailer/" + retailerId,
          params,
        );
      }
    },
    [appNav, retailerId],
  );

  if (!banners.length) return null;

  const swiperConfig: SwiperOptions = {
    slidesPerView: "auto",
    spaceBetween: 10,
    loop: true,
    autoplay: { delay: 8000, disableOnInteraction: false },
    pagination: { clickable: true },
  };

  return (
    <AppSwiper
      config={swiperConfig}
      className="tw:w-full tw:rounded-lg tw:overflow-hidden"
    >
      {banners.map((banner, index) => (
        <AppSwiper.Slide key={banner._id || index} isAutoWidth={true}>
          <div
            className="tw:cursor-pointer tw:rounded-lg tw:overflow-hidden"
            onClick={() => handleBannerClick(banner)}
          >
            <ImgRender
              assetId={banner.bannerImage?.assetId}
              alt={banner.title || "Banner"}
              className="tw:w-full tw:h-auto tw:object-cover tw:rounded-lg"
              width={banner.placeholderInfo?.dimension?.width}
              height={banner.placeholderInfo?.dimension?.height}
              ignoreSize={true}
            />
          </div>
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

export default BannerSlide;
