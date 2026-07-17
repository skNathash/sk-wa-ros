import { useEffect, useState } from "react";
import AppSwiper from "~/components/core/swiper";
import { getIntroSlides } from "./helper";
import ImgRender from "~/components/core/img/ImgRender";
import type { SwiperOptions } from "swiper/types";
import { X, XCircle } from "lucide-react";
import StorageService from "~/services/StorageService";

const swiperOptions: SwiperOptions = {
  slidesPerView: 1,
  spaceBetween: 0,
  pagination: true,
  loop: false,
  autoplay: {
    delay: 4000,
    stopOnLastSlide: true,
  },
};

const IntroModal = ({
  show,
  callback,
  feature,
}: {
  show: boolean;
  callback: (action: { action: string; data?: any }) => void;
  feature: "create-catalog";
}) => {
  const [slides, setSlides] = useState<any[]>([]);

  useEffect(() => {
    if (show) {
      setSlides(getIntroSlides(feature));
    }
  }, [feature, show]);

  const onClose = () => {
    StorageService.set("fint-" + feature, true);
    callback({ action: "close" });
  };

  if (!show) return null;

  return (
    <div className="tw:fixed tw:top-0 tw:left-0 tw:w-full tw:h-full tw:bg-black/50 tw:bg-opacity-50 tw:z-50">
      <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
        <div className="tw:relative tw:max-w-sm tw:w-full tw:mx-6 md:tw:mx-auto">
          <button
            className="tw:absolute tw:-top-2 tw:right-2 tw:z-50 tw:cursor-pointer tw:bg-white/80 tw:rounded-full tw:p-1"
            onClick={onClose}
          >
            <X className="tw:text-gray-500" size={16} />
          </button>
          <AppSwiper config={swiperOptions}>
            {slides.map((slide, index) => (
              <AppSwiper.Slide key={index}>
                <div className="tw:text-center tw:text-gray-600 tw:text-sm tw:relative tw:p-4 tw:rounded-lg tw:bg-white/80">
                  <ImgRender
                    src="/intro/bg.jpg"
                    className="tw:absolute tw:top-0 tw:left-0 tw:w-full tw:h-full tw:object-cover tw:z-0"
                  />
                  <div className="tw:relative tw:z-10">
                    <ImgRender
                      src={slide.image}
                      className="tw:w-full tw:object-contain"
                    />
                    <div>
                      <h3 className="tw:text-2xl tw:font-bold tw:mb-2">
                        {slide.title}
                      </h3>
                      <p className="tw:text-slate-500 tw:text-sm tw:mb-4 tw:h-20">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      </div>
    </div>
  );
};

export default IntroModal;
