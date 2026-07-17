import React from "react";
import AppSwiper from "~/components/core/swiper";
import ImgRender from "~/components/core/img/ImgRender";
import AppCard from "~/components/core/card/AppCard";

interface StorePhotosProps {
  photos: string[];
}

const StorePhotos: React.FC<StorePhotosProps> = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <AppCard title="Store Photos">
      <AppSwiper config={swiperOptions}>
        {photos.map((id) => (
          <AppSwiper.Slide key={id} isAutoWidth={true}>
            <div className="tw:border tw:border-gray-300 tw:rounded-md tw:p-2 tw:flex tw:items-center tw:justify-center">
              <ImgRender
                assetId={id}
                alt="Store Photo"
                className="tw:w-32 tw:h-32 tw:object-cover"
              />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </AppCard>
  );
};

const swiperOptions = {
  slidesPerView: "auto" as const,
  spaceBetween: 10,
  pagination: false,
  navigation: false,
};

export default StorePhotos;
