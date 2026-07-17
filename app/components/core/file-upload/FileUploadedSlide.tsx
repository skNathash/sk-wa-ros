import type { SwiperOptions } from "swiper/types";
import ImgRender from "../img/ImgRender";
import AppSwiper from "../swiper";

const getImageProps = (imgId?: string) => {
  if (!imgId) return {};
  return /^https?:\/\//i.test(imgId)
    ? { src: imgId, isAbsolute: true }
    : { assetId: imgId };
};

const FileUploadedSlide = ({
  images,
  onRemove,
  onImageClick,
  hideRemove,
}: {
  images: any[] | null;
  onRemove: (index: number) => void;
  onImageClick?: (imageId: string, index: number) => void;
  hideRemove?: boolean;
}) => {
  return (
    <AppSwiper config={swiperOptions}>
      {images?.map((image, index) => (
        <AppSwiper.Slide key={image.id} isAutoWidth={true}>
          <div className="tw:border tw:border-gray-300 tw:rounded-md tw:p-2 tw:flex tw:items-center tw:gap-2 tw:flex-col">
            <div
              className="tw:w-20 tw:h-20 tw:cursor-pointer"
              onClick={() => onImageClick?.(image.id, index)}
            >
              <ImgRender
                {...getImageProps(image.id)}
                alt="Product"
                className="tw:w-full tw:h-full tw:object-cover"
                useProxy={image.useProxy}
              />
            </div>
            {!hideRemove && (
              <button
                className="tw:text-xs tw:text-red-500"
                onClick={() => onRemove(index)}
              >
                Remove
              </button>
            )}
          </div>
        </AppSwiper.Slide>
      ))}
    </AppSwiper>
  );
};

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
  pagination: false,
  navigation: false,
};

export default FileUploadedSlide;
