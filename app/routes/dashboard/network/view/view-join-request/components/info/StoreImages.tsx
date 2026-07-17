import React, { useMemo, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";

interface StoreImage {
  id?: string;
  fileUrl?: string;
}

interface StoreImagesProps {
  images: StoreImage[];
}

const StoreImages: React.FC<StoreImagesProps> = ({ images }) => {
  const displayImages = images || [];

  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const formattedImages = useMemo(
    () =>
      displayImages
        .map((image) => image.id || image.fileUrl)
        .filter(Boolean)
        .map((assetId) => ({ id: assetId as string })),
    [displayImages]
  );

  const openAtIndex = (index: number) => {
    if (formattedImages.length > 0) {
      // Rotate images so clicked image becomes first/active
      const rotated = [
        ...formattedImages.slice(index),
        ...formattedImages.slice(0, index),
      ];
      setImgPreviewModal({ show: true, images: rotated });
    }
  };

  const handleImgPreviewModalCallback = ({ action }: { action: string }) => {
    if (action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  return (
    <>
      <AppCard
        title="Buyer Store Images"
        icon="image"
        iconClassName="tw:text-green-600"
      >
        {displayImages.length > 0 ? (
          <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-4 tw:gap-4">
            {displayImages.map((image, index) => (
              <div
                key={index}
                className="tw:relative tw:aspect-square tw:bg-gray-100 tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200 tw:cursor-pointer"
                onClick={() => openAtIndex(index)}
              >
                <ImgRender
                  assetId={image.id || image.fileUrl}
                  alt={`Store Image ${index + 1}`}
                  className="tw:w-full tw:h-full tw:object-cover tw:hover:scale-105 tw:transition-transform tw:duration-200"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="tw:text-center tw:py-8">
            <NoData />
            <p className="tw:text-gray-500 tw:text-sm tw:mt-2">
              No store images available
            </p>
          </div>
        )}
      </AppCard>
      {imgPreviewModal.show && (
        <ImgPreviewModal
          show={imgPreviewModal.show}
          callback={handleImgPreviewModalCallback}
          images={imgPreviewModal.images}
        />
      )}
    </>
  );
};

export default StoreImages;
