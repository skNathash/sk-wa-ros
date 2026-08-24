import BannerSlide from "~/shared/banners/banner-slide/BannerSlide";

// Network (buy-from-other-retailer) home banners. Delegates to the shared
// BannerSlide in "network" mode, which fetches the franchise network banner
// feed and links each banner into the network browse routes.
const ProductsBanner = ({ distance }: { distance?: number | string }) => {
  return (
    // Break out of the page padding so the banner runs edge-to-edge on mobile;
    // reset the negative margin at lg+ where it sits inside the content column.
    <div className="tw:pt-4 tw:mb-6 tw:-mx-4 tw:lg:mx-0">
      <BannerSlide placeholder="" source="network" distance={distance} />
    </div>
  );
};

export default ProductsBanner;
