import { ImagePlus, X } from "lucide-react";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";

interface ImagePickerProps {
  /** Asset ids currently attached to the pre-owned listing. */
  value: string[];
  onChange: (images: string[]) => void;
  /** Images carried over from the source deal — shown greyed out once removed. */
  sourceImages?: string[];
  error?: string;
}

/**
 * Image field for the pre-owned intake — starts with the source product's
 * images and lets the user drop the ones that don't match the unit in hand,
 * or shoot fresh photos of the actual unit.
 */
const ImagePicker = ({
  value,
  onChange,
  sourceImages = [],
  error,
}: ImagePickerProps) => {
  const removed = sourceImages.filter((id) => !value.includes(id));

  const handleUpload = (response: any) => {
    const id = response?._id || response?.data?._id;
    if (!id || value.includes(id)) return;
    onChange([...value, id]);
  };

  return (
    <div>
      <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between">
        <span className="tw:text-sm tw:font-medium tw:text-slate-700">
          Images
        </span>
        <span className="tw:text-xs tw:text-slate-400">
          {value.length} selected
        </span>
      </div>

      <div className="tw:flex tw:flex-wrap tw:gap-2 tw:md:gap-3">
        {value.map((assetId) => (
          <div
            key={assetId}
            className="tw:relative tw:h-20 tw:w-20 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:md:h-24 tw:md:w-24"
          >
            <ImgRender
              assetId={assetId}
              alt="pre-owned unit"
              className="tw:h-full tw:w-full tw:object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((id) => id !== assetId))}
              aria-label="Remove image"
              className="tw:absolute tw:top-1 tw:right-1 tw:cursor-pointer tw:rounded-full tw:bg-black/60 tw:p-1 tw:text-white"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <FileUpload
          onFileUpload={handleUpload}
          accept="image/*"
          allowedExtensions={["jpg", "jpeg", "png", "webp"]}
          maxSizeMB={5}
          label="Upload unit images"
        >
          <div className="tw:flex tw:h-20 tw:w-20 tw:cursor-pointer tw:flex-col tw:md:h-24 tw:md:w-24 tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:border tw:border-dashed tw:border-slate-300 tw:bg-slate-50 tw:text-slate-500 tw:hover:bg-slate-100">
            <ImagePlus size={20} />
            <span className="tw:text-[11px] tw:font-medium">Add photo</span>
          </div>
        </FileUpload>
      </div>

      {/* Dropped source images stay one tap away — a removal is usually a
          second-guess, not a decision. */}
      {removed.length > 0 && (
        <div className="tw:mt-3">
          <div className="tw:mb-1.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
            Removed from source product
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {removed.map((assetId) => (
              <button
                key={assetId}
                type="button"
                onClick={() => onChange([...value, assetId])}
                className="tw:h-14 tw:w-14 tw:cursor-pointer tw:overflow-hidden tw:rounded-lg tw:border tw:border-slate-200 tw:opacity-50 tw:hover:opacity-100"
                title="Add back"
              >
                <ImgRender
                  assetId={assetId}
                  alt="source"
                  className="tw:h-full tw:w-full tw:object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="tw:mt-1 tw:text-xs tw:text-red-500">{error}</div>
      )}
    </div>
  );
};

export default ImagePicker;
