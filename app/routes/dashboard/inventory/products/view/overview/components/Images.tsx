import type { SwiperOptions } from "swiper/types";
import { Instagram, Play, Youtube } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import VideoPreviewModal from "~/shared/catalog/modals/video-preview/VideoPreviewModal";
import { useRef, useState } from "react";

type Platform = "youtube" | "instagram";

type Props = {
  images: string[];
  youtubeLink?: string;
  instagramLink?: string;
};

type Slide =
  | { kind: "image"; assetId: string }
  | { kind: "video"; platform: Platform; url: string };

const swiperConfig: SwiperOptions = {
  slidesPerView: 1,
  centeredSlides: true,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
};

/** Clickable video block: branded tile with a play icon that opens the modal. */
const VideoThumb = ({
  slide,
  onClick,
}: {
  slide: Extract<Slide, { kind: "video" }>;
  onClick: () => void;
}) => {
  const isYouTube = slide.platform === "youtube";

  return (
    <div
      onClick={onClick}
      className={`tw:cursor-pointer tw:relative tw:h-40 tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-md ${
        isYouTube ? "tw:bg-red-50" : "tw:bg-pink-50"
      }`}
    >
      {isYouTube ? (
        <Youtube size={36} className="tw:text-red-600" />
      ) : (
        <Instagram size={36} className="tw:text-pink-600" />
      )}
      <span className="tw:text-xs tw:font-medium tw:text-gray-700">
        {isYouTube ? "Watch on YouTube" : "Watch on Instagram"}
      </span>

      {/* Play icon overlay */}
      <span className="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center">
        <span className="tw:bg-black/60 tw:text-white tw:rounded-full tw:p-2.5">
          <Play size={22} className="tw:fill-white" />
        </span>
      </span>
    </div>
  );
};

const Images = ({ images, youtubeLink, instagramLink }: Props) => {
  const swiperRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const [videoModal, setVideoModal] = useState<{
    show: boolean;
    platform?: Platform;
    url?: string;
  }>({ show: false });

  const slides: Slide[] = [
    ...images.map((assetId) => ({ kind: "image" as const, assetId })),
    ...(youtubeLink
      ? [{ kind: "video" as const, platform: "youtube" as const, url: youtubeLink }]
      : []),
    ...(instagramLink
      ? [
          {
            kind: "video" as const,
            platform: "instagram" as const,
            url: instagramLink,
          },
        ]
      : []),
  ];

  const imgPreviewModalCallback = (event: { action: string; data?: any }) => {
    if (event.action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  const handleImageClick = () => {
    if (images && images.length > 0) {
      const formattedImages = images.map((assetId) => ({ id: assetId }));
      setImgPreviewModal({ show: true, images: formattedImages });
    }
  };

  const handleVideoClick = (platform: Platform, url: string) => {
    setVideoModal({ show: true, platform, url });
  };

  const swiperCb = (e: any) => {
    if (e.swiper && e.action === "init") {
      swiperRef.current = e.swiper;
    } else if (e.action === "slideChange") {
      setCurrentIndex(e.swiper.realIndex);
    }
  };

  return (
    <div className="tw:h-40 tw:relative">
      <div className="tw:absolute tw:top-0 tw:left-0 tw:bg-white tw:text-black tw:border tw:border-gray-300 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs tw:z-10">
        {currentIndex + 1} / {slides.length}
      </div>
      <AppSwiper config={swiperConfig} callback={swiperCb}>
        {slides.map((slide, index) => (
          <AppSwiper.Slide key={index} className="tw:text-center">
            {slide.kind === "image" ? (
              <div onClick={handleImageClick} className="tw:cursor-pointer">
                <ImgRender
                  assetId={slide.assetId}
                  alt="Product Image"
                  className="tw:h-40 tw:object-cover"
                  size="200"
                />
              </div>
            ) : (
              <VideoThumb
                slide={slide}
                onClick={() => handleVideoClick(slide.platform, slide.url)}
              />
            )}
          </AppSwiper.Slide>
        ))}
      </AppSwiper>

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
      />

      <VideoPreviewModal
        show={videoModal.show}
        platform={videoModal.platform}
        url={videoModal.url}
        callback={() => setVideoModal({ show: false })}
      />
    </div>
  );
};

export default Images;
