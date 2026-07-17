import type { SwiperOptions } from "swiper/types";

export interface SummaryItem {
  key: string;
  label: string;
  value: string | number;
  color: string;
  description?: string;
}

export interface MainSummaryData {
  totalProducts: number;
  lowStock: number;
  inventoryValue: number;
  outOfStock: number;
}

export interface ProductSummaryData {
  summaryData: SummaryItem[];
}

export const swiperConfig: SwiperOptions = {
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  autoplay: {
    delay: 4000,
  },
  breakpoints: {
    0: {
      slidesPerView: "auto",
    },
    768: {
      slidesPerView: 4,
    },
  },
};
