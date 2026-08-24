import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import ImgRender from "~/components/core/img/ImgRender";
import BannerService from "~/services/BannerService";
import useAppNav from "~/hooks/useAppNav";

interface BannerSlideProps {
  placeholder: string;
  retailerId?: string;
  // "valid" (default) pulls a retailer's placeholder banners and links into that
  // retailer's storefront. "network" pulls the franchise network feed and links
  // into the network browse (list/search) routes.
  source?: "valid" | "network";
  // Delivery radius used to scope the banner feed. Accepts a km number or "all"
  // (mirrors the seller-catalog network APIs: "all" => a very large radius so the
  // backend effectively ignores distance filtering).
  distance?: number | string;
  onBannerClick?: (banner: any) => void;
}

const NETWORK_LIST_PATH = "/products/buy-from-other-retailer/products/list";
const NETWORK_SEARCH_PATH = "/products/buy-from-other-retailer/products/search";
const RETAILER_PATH = "/products/buy-from-other-retailer/retailer/";

// Resolve a distance into the numeric radius the banner/network APIs expect.
// "all" (or an invalid value) becomes a very large radius. Undefined stays
// undefined so callers that don't scope by distance send no distance at all.
const resolveDistance = (
  distance?: number | string,
): number | undefined => {
  if (distance === undefined || distance === null || distance === "")
    return undefined;
  if (distance === "all") return 1000000000;
  const parsed = Number(distance);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1000000000;
};

const BannerSlide = ({
  placeholder,
  retailerId,
  source = "valid",
  distance,
  onBannerClick,
}: BannerSlideProps) => {
  const [banners, setBanners] = useState<any[]>([]);
  const appNav = useAppNav();

  useEffect(() => {
    loadBanners();
  }, [placeholder, source, retailerId, distance]);

  const loadBanners = async () => {
    try {
      const filter: Record<string, any> = { type: "B2B" };
      if (placeholder) filter["placeholderInfo.code"] = placeholder;

      const params: Record<string, any> = { filter };
      const radius = resolveDistance(distance);
      if (radius !== undefined) params.distance = radius;

      const res =
        source === "network"
          ? await BannerService.getNetworkBanners(params)
          : await BannerService.getValidBanners(retailerId, params);
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

      // Source banners jump straight to a specific retailer's storefront rather
      // than a filtered browse route.
      if (bannerType === "Source") {
        const sourceEntity =
          condition.sources?.[0] || condition.sellers?.[0] || null;
        const sellerId =
          sourceEntity?.id ||
          sourceEntity?._id ||
          sourceEntity?.sellerId ||
          sourceEntity?.sellerRefId ||
          "";
        if (!sellerId) return;

        const retailerParams: Record<string, string> = {};
        if (distance !== undefined && distance !== null && distance !== "") {
          retailerParams.distance = String(distance);
        }
        if (banner.title) retailerParams.bannerTitle = banner.title;

        onBannerClick?.(banner);
        appNav.to(RETAILER_PATH + sellerId, retailerParams);
        return;
      }

      if (Object.keys(params).length) {
        if (banner.title) params.bannerTitle = banner.title;
        // Scope the destination browse to the same delivery radius the banner
        // feed was loaded with.
        if (distance !== undefined && distance !== null && distance !== "") {
          params.distance = String(distance);
        }
        onBannerClick?.(banner);

        if (source === "network") {
          // Keyword banners search the network catalog; the rest browse a
          // filtered network product list.
          if (bannerType === "Keywords") {
            appNav.to(NETWORK_SEARCH_PATH, {
              search: params.search,
              ...(params.distance ? { distance: params.distance } : {}),
            });
          } else {
            appNav.to(NETWORK_LIST_PATH, params);
          }
          return;
        }

        params.inventoryTab = "products";
        params.scrollToProduct = Date.now().toString();
        appNav.to(RETAILER_PATH + retailerId, params);
      }
    },
    [appNav, retailerId, source, distance, onBannerClick],
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
