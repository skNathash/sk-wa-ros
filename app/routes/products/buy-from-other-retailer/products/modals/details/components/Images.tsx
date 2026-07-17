import React from "react";
import AppSwiper from "~/components/core/swiper";
import ImgRender from "~/components/core/img/ImgRender";
import type { SwiperOptions } from "swiper/types";
import { PRD_IMG_RESOLUTION } from "~/constants";

type Props = {
  images?: string[];
  alt?: string;
  className?: string;
};

const swiperConfig: SwiperOptions = {
  slidesPerView: 1,
  spaceBetween: 10,
};

const Images = ({ images = [], alt = "", className = "" }: Props) => {
  if (!images || images.length === 0) {
    return (
      <div className={`tw:flex tw:items-center tw:justify-center ${className}`}>
        <div className="tw:text-gray-400">📦</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <AppSwiper config={swiperConfig}>
        {images.map((imgId, idx) => (
          <AppSwiper.Slide key={idx}>
            <div className="tw:w-full tw:h-40 tw:flex tw:items-center tw:justify-center">
              <ImgRender
                assetId={imgId}
                alt={alt}
                size={PRD_IMG_RESOLUTION}
                className="tw:w-full tw:h-full tw:object-contain"
              />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

export default Images;
