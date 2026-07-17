import { useEffect, useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { SwiperOptions } from "swiper/types";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import AppSwiper from "~/components/core/swiper";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  images?: Array<{ id: string; useProxy?: boolean }>;
  initialImageId?: string;
  useProxy?: boolean;
};

const ImgPreviewModal = ({ show, callback, images, initialImageId, useProxy = false }: Props) => {
  const imageList = Array.isArray(images) ? images : [];
  const [activeImage, setActiveImage] = useState<string>();

  useEffect(() => {
    if (show && imageList.length > 0) {
      // If an initial image id is provided, prefer that, otherwise use the first image
      setActiveImage(initialImageId ?? imageList[0]?.id);
    }
  }, [show, imageList, initialImageId]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const getImageProps = (imgId?: string) => {
    if (!imgId) return {};
    return /^https?:\/\//i.test(imgId)
      ? { src: imgId, isAbsolute: true }
      : { assetId: imgId };
  };

  const currentImage = imageList.find((img) => img.id === activeImage);
  const shouldProxy = currentImage?.useProxy ?? useProxy;

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:h-[95vh] tw:md:max-w-3xl"
    >
      <AppModal.Title onClose={handleClose}>Image Preview</AppModal.Title>
      <AppModal.Content className="tw:h-[95vh] tw:relative">
        <div className="tw:w-full tw:h-full tw:rounded-md tw:overflow-hidden">
          <TransformWrapper
            key={activeImage}
            initialScale={1}
            minScale={1}
            maxScale={5}
            centerOnInit
            doubleClick={{ mode: "toggle" }}
          >
            <TransformComponent
              wrapperClass="!tw:w-full !tw:h-full"
              contentClass="!tw:w-full !tw:h-full"
            >
              <ImgRender
                {...getImageProps(activeImage)}
                alt="img"
                size="1000"
                className="tw:w-full tw:h-full tw:object-contain"
                useProxy={shouldProxy}
              />
            </TransformComponent>
          </TransformWrapper>
        </div>

        {imageList.length > 0 && (
          <div className="tw:absolute tw:bottom-0 tw:left-0 tw:right-0 tw:z-50 tw:bg-white tw:p-2">
            <AppSwiper config={swiperConfig}>
              {imageList.map((image) => {
                const isThumbnailProxy = image.useProxy ?? useProxy;
                return (
                  <AppSwiper.Slide key={image.id} isAutoWidth={true}>
                    <div
                      className="tw:w-12 tw:h-12 tw:object-cover tw:rounded-md tw:border-2 tw:border-gray-200 tw:cursor-pointer"
                      onClick={() => setActiveImage(image.id)}
                    >
                      <ImgRender
                        {...getImageProps(image.id)}
                        alt="img"
                        className="tw:w-full tw:h-full tw:object-cover tw:rounded-md"
                        useProxy={isThumbnailProxy}
                      />
                    </div>
                  </AppSwiper.Slide>
                );
              })}
            </AppSwiper>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
  navigation: false,
  pagination: false,
};

export default ImgPreviewModal;
