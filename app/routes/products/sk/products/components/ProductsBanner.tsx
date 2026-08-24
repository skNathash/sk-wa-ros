import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";

// Hardcoded promo banners for now — text-based store offer cards. Replace with a
// real banner feed once available.
type Banner = {
  store: string;
  tag?: string;
  title: string;
  subtitle: string;
  cta: string;
  bg: string;
};

const BANNERS: Banner[] = [
  {
    store: "Sri Ganesh Store",
    tag: "Promoted",
    title: "Monsoon 10% off",
    subtitle: "On atta · rice · oil",
    cta: "Shop",
    bg: "#075e54",
  },
  {
    store: "Ravi Bros",
    title: "Same-day delivery",
    subtitle: "Order by 2 PM",
    cta: "Shop",
    bg: "#2e5aa8",
  },
  {
    store: "Lakshmi Traders",
    tag: "New",
    title: "Flat ₹50 off",
    subtitle: "On orders above ₹999",
    cta: "Shop",
    bg: "#c85a1d",
  },
];

const swiperConfig: SwiperOptions = {
  // Peek the next banner on mobile (1.2 slides); single full-width slide at lg+.
  slidesPerView: 1.2,
  spaceBetween: 12,
  // Inset the first/last slide from the screen edges so the edge-to-edge banner
  // still has breathing room on mobile.
  slidesOffsetBefore: 16,
  slidesOffsetAfter: 16,
  loop: true,
  autoplay: { delay: 5000, disableOnInteraction: false },
  pagination: { clickable: true },
  breakpoints: {
    1024: {
      slidesPerView: 1,
      spaceBetween: 10,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
    },
  },
};

const BannerCard = ({ banner }: { banner: Banner }) => (
  <div
    className="tw:relative tw:h-40 tw:overflow-hidden tw:rounded-lg tw:p-4 tw:flex tw:flex-col tw:justify-between"
    style={{ backgroundColor: banner.bg }}
  >
    {/* Decorative arc in the corner for depth, echoing the screenshot. */}
    <span
      aria-hidden
      className="tw:absolute tw:-right-8 tw:-bottom-8 tw:h-32 tw:w-32 tw:rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
    />
    <span
      aria-hidden
      className="tw:absolute tw:-right-2 tw:top-6 tw:h-20 tw:w-20 tw:rounded-full"
      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
    />

    <div className="tw:relative tw:z-10">
      <p className="app-label tw:text-white/70">
        {banner.store}
        {banner.tag ? ` · ${banner.tag}` : ""}
      </p>
      <h3 className="app-heading-serif tw:mt-2 tw:text-2xl tw:font-semibold tw:text-white tw:leading-tight">
        {banner.title}
      </h3>
      <p className="tw:mt-1 tw:text-sm tw:text-white/80">{banner.subtitle}</p>
    </div>

    <div className="tw:relative tw:z-10">
      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:bg-black/25 tw:px-3 tw:py-1.5 tw:text-sm tw:font-medium tw:text-white">
        {banner.cta} <span aria-hidden>→</span>
      </span>
    </div>
  </div>
);

const ProductsBanner = () => {
  return (
    // Break out of the page padding so the banner runs edge-to-edge on mobile;
    // reset the negative margin at lg+ where it sits inside the content column.
    <div className="tw:pt-4 tw:mb-6 tw:-mx-4 tw:lg:mx-0">
      <AppSwiper config={swiperConfig} className="tw:w-full">
        {BANNERS.map((banner, index) => (
          <AppSwiper.Slide key={index}>
            <BannerCard banner={banner} />
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default ProductsBanner;
