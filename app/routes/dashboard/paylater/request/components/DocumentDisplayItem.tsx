import { Trash2 } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import { useState } from "react";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  title: string;
  front: string;
  back?: string;
  refNo: string;
  onRemove: () => void;
};

const DocumentDisplayItem = ({
  title,
  front,
  back,
  refNo,
  onRemove,
}: Props) => {
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: { id: string }[];
    initialImageId: string;
  }>({
    show: false,
    images: [],
    initialImageId: "",
  });

  const imgPreviewModalCallback = () => {
    setImgPreviewModal({ show: false, images: [], initialImageId: "" });
  };

  const handleViewImages = (image: string) => {
    let img: { id: string }[] = [];

    if (front) {
      img.push({ id: front });
    }

    if (back) {
      img.push({ id: back });
    }

    setImgPreviewModal({
      show: true,
      images: img,
      initialImageId: image,
    });
  };

  return (
    <>
      <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:bg-white tw:shadow-sm hover:tw:shadow-md tw:transition-shadow">
        <div className="tw:flex tw:items-start tw:justify-between tw:mb-2">
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-1 tw:truncate">
              {title}
            </div>
            {refNo && (
              <div className="tw:text-xs tw:text-gray-500">
                Ref:{" "}
                <span className="tw:font-medium tw:text-gray-700">{refNo}</span>
              </div>
            )}
          </div>
          <AppButton
            size="small"
            fill="outline"
            color="danger"
            onClick={onRemove}
            className="tw:flex-shrink-0 tw:ml-2"
          >
            <Trash2 size={14} />
          </AppButton>
        </div>

        <div
          className={`tw:grid ${
            back ? "tw:grid-cols-2" : "tw:grid-cols-1"
          } tw:gap-2`}
        >
          {front && (
            <div className="tw:border tw:border-gray-200 tw:rounded tw:p-2 tw:bg-gray-50 tw:relative tw:group">
              <div
                className="tw:cursor-pointer tw:overflow-hidden"
                onClick={() => handleViewImages(front)}
              >
                <ImgRender
                  assetId={front}
                  alt={`${title} - Front`}
                  className="tw:w-full tw:h-auto tw:max-h-32 tw:object-contain tw:rounded"
                />
                <div className="tw:absolute tw:bottom-1.5 tw:left-1.5 tw:bg-black tw:bg-opacity-60 tw:text-white tw:text-xs tw:px-1.5 tw:py-0.5 tw:rounded">
                  Front
                </div>
              </div>
            </div>
          )}

          {back && (
            <div className="tw:border tw:border-gray-200 tw:rounded tw:p-2 tw:bg-gray-50 tw:relative tw:group">
              <div
                className="tw:cursor-pointer tw:overflow-hidden"
                onClick={() => handleViewImages(back)}
              >
                <ImgRender
                  assetId={back}
                  alt={`${title} - Back`}
                  className="tw:w-full tw:h-auto tw:max-h-32 tw:object-contain tw:rounded"
                />
                <div className="tw:absolute tw:bottom-1.5 tw:left-1.5 tw:bg-black tw:bg-opacity-60 tw:text-white tw:text-xs tw:px-1.5 tw:py-0.5 tw:rounded">
                  Back
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </>
  );
};

export default DocumentDisplayItem;
