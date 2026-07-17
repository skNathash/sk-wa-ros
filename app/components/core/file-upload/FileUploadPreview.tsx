import ImgRender from "../img/ImgRender";

const FileUploadPreview = ({
  image,
  onRemove,
  onImageClick,
  className,
  hideRemove,
}: {
  image: any;
  onRemove?: () => void;
  onImageClick?: (imageId: string) => void;
  className?: string;
  hideRemove?: boolean;
}) => {
  if (!image) return null;
  return (
    <div
      className={`tw:border tw:border-gray-300 tw:rounded-md tw:p-2 tw:flex tw:items-center tw:gap-2 tw:flex-col tw:w-28 ${className}`}
    >
      <div className="tw:cursor-pointer" onClick={() => onImageClick?.(image)}>
        <ImgRender
          assetId={image}
          alt="Photo"
          className="tw:w-20 tw:h-20 tw:object-cover"
        />
      </div>
      {!hideRemove ? (
        <button
          className="tw:text-xs tw:text-red-500 tw:cursor-pointer"
          type="button"
          onClick={onRemove}
        >
          Remove
        </button>
      ) : null}
    </div>
  );
};

export default FileUploadPreview;
