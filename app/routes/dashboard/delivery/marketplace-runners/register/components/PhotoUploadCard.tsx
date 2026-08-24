import { UploadCloud, X } from "lucide-react";
import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";

type PhotoField = "photo" | "aadhaarFront" | "aadhaarBack";

/**
 * Photo upload for the runner-registration KYC step. Scoped here (not the
 * shared core uploader) so the dropzone look stays local to this flow. Renders
 * a dashed dropzone when empty and a clickable thumbnail with a remove control
 * once an image is in — the whole card re-opens the picker via FileUpload's
 * click handler, so "tap to replace" needs no extra wiring.
 */
const PhotoUploadCard = ({
  field,
  label,
  note,
}: {
  field: PhotoField;
  label: string;
  note?: ReactNode;
}) => {
  const { control, setValue } = useFormContext();
  const value = useWatch({ control, name: field });

  const onFileUpload = (data: any) => setValue(field, { id: data._id });

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    setValue(field, null);
  };

  return (
    <FileUpload
      maxSizeMB={5}
      allowedExtensions={["jpg", "jpeg", "png"]}
      onFileUpload={onFileUpload}
    >
      {value?.id ? (
        <div className="tw:group tw:relative tw:border tw:border-slate-200 tw:rounded-xl tw:overflow-hidden tw:bg-white">
          <ImgRender
            assetId={value.id}
            alt={label}
            className="tw:w-40 tw:h-40 tw:object-cover"
          />
          <button
            type="button"
            title="Remove"
            onClick={handleRemove}
            className="tw:absolute tw:top-2 tw:right-2 tw:w-7 tw:h-7 tw:rounded-full tw:bg-white/90 tw:shadow tw:text-slate-600 tw:flex tw:items-center tw:justify-center tw:hover:text-red-600 tw:transition-colors"
          >
            <X size={14} />
          </button>
          <div className="tw:px-2 tw:py-1.5 tw:text-center tw:text-xs tw:text-slate-500">
            Tap to replace
          </div>
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:px-6 tw:py-8 tw:min-h-36 tw:border-2 tw:border-dashed tw:border-slate-300 tw:rounded-xl tw:bg-slate-50 tw:hover:border-slate-400 tw:hover:bg-slate-100 tw:transition-colors">
          <div className="tw:w-11 tw:h-11 tw:rounded-full tw:bg-white tw:shadow-sm tw:flex tw:items-center tw:justify-center tw:text-slate-500">
            <UploadCloud size={22} />
          </div>
          <span className="tw:text-sm tw:font-medium tw:text-slate-700">
            {label}
          </span>
          {note ? (
            <span className="tw:text-xs tw:text-slate-500 tw:text-center">
              {note}
            </span>
          ) : null}
        </div>
      )}
    </FileUpload>
  );
};

export default PhotoUploadCard;
