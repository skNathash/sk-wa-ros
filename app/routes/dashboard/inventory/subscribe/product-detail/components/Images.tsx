import { useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper/AppSwiper";

type ImagesProps = {
  images: string[];
  className?: string;
};

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 8,
};

export default function Images({ images, className }: ImagesProps) {
  const assets =
    images && images.length > 0 ? images : ["placeholder-asset-id"];
  const [activeIndex, setActiveIndex] = useState<number>(0);

  return (
    <div className={`tw:h-full ${className ?? ""}`}>
      <AppCard noPadding className="tw:h-full tw:mb-0">
        <div className="tw:p-4">
          <div className="tw:w-full tw:h-56 tw:sm:h-72 tw:md:h-80 tw:flex tw:items-center tw:justify-center tw:bg-white tw:overflow-hidden">
            <ImgRender
              key={assets[activeIndex]}
              assetId={assets[activeIndex]}
              alt={`image-${activeIndex + 1}`}
              className="tw:max-w-full tw:max-h-full tw:object-contain tw:block"
            />
          </div>

          <div className="tw:mt-3">
            <AppSwiper config={swiperOptions} className="tw:py-2">
              {assets.map((assetId, idx) => (
                <AppSwiper.Slide
                  key={idx}
                  className={`tw:flex tw:items-center tw:justify-center tw:cursor-pointer tw:px-1`}
                  isAutoWidth={true}
                >
                  <button
                    onClick={() => setActiveIndex(idx)}
                    className={`tw:outline-none tw:rounded-md tw:overflow-hidden tw:border  ${
                      activeIndex === idx
                        ? "tw:border-blue-400"
                        : "tw:border-gray-200"
                    }`}
                  >
                    <ImgRender
                      assetId={assetId}
                      alt={`thumb-${idx + 1}`}
                      className="tw:h-16 tw:w-16 tw:object-cover"
                    />
                  </button>
                </AppSwiper.Slide>
              ))}
            </AppSwiper>
          </div>
        </div>
      </AppCard>
    </div>
  );
}
