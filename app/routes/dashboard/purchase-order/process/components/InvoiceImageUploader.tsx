import clsx from "clsx";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useTranslation } from "react-i18next";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";

const getImageProps = (imgId?: string) => {
  if (!imgId) return {};
  return /^https?:\/\//i.test(imgId)
    ? { src: imgId, isAbsolute: true }
    : { assetId: imgId };
};

interface InvoiceImageUploaderProps {
  label: string;
  files?: { id: string; useProxy?: boolean }[] | null;
  onFileUpload: (response: any) => void;
  onRemove: (index: number) => void;
  allowedExtensions?: string[];
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

/**
 * Modern image uploader: an empty-state drop card that turns into a
 * thumbnail strip with an inline "add more" tile once files are attached.
 */
const InvoiceImageUploader = ({
  label,
  files,
  onFileUpload,
  onRemove,
  allowedExtensions = ["jpg", "jpeg", "png"],
  accept = "image/jpeg,image/png",
  maxSizeMB = 10,
  className,
}: InvoiceImageUploaderProps) => {
  const { t } = useTranslation("common");
  const uploaded = files || [];

  const formats = allowedExtensions.join(" · ").toUpperCase();

  const uploadProps = {
    onFileUpload,
    allowedExtensions,
    accept,
    maxSizeMB,
  };

  return (
    <div className={className}>
      <p className="tw:text-sm tw:font-medium tw:mb-2">{label}</p>

      {uploaded.length === 0 ? (
        <FileUpload {...uploadProps}>
          <div
            className={clsx(
              "tw:group tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-2",
              "tw:rounded-xl tw:border-2 tw:border-dashed tw:border-border tw:bg-muted/40",
              "tw:px-4 tw:py-6 tw:text-center tw:transition-colors tw:duration-200",
              "tw:hover:border-primary/60 tw:hover:bg-primary/5",
            )}
          >
            <div
              className={clsx(
                "tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-full",
                "tw:bg-primary/10 tw:text-primary tw:transition-colors",
                "tw:group-hover:bg-primary tw:group-hover:text-white",
              )}
            >
              <UploadCloud size={20} />
            </div>
            <p className="tw:text-xs tw:text-muted-foreground">
              {t("dropzone.hint", { formats, maxSizeMB })}
            </p>
            <span
              className={clsx(
                "tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full",
                "tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:text-white",
                "tw:transition-colors tw:group-hover:bg-primary/90",
              )}
            >
              <ImagePlus size={14} />
              {t("dropzone.browse")}
            </span>
          </div>
        </FileUpload>
      ) : (
        <>
          <p className="tw:text-xs tw:text-muted-foreground tw:mb-2">
            {t("dropzone.attached", { count: uploaded.length })}
          </p>
          <div className="tw:flex tw:flex-wrap tw:gap-3">
            {uploaded.map((image, index) => (
              <div
                key={`${image.id}-${index}`}
                className={clsx(
                  "tw:group tw:relative tw:h-24 tw:w-24 tw:overflow-hidden",
                  "tw:rounded-xl tw:border tw:border-border tw:bg-muted tw:shadow-sm",
                )}
              >
                <ImgRender
                  {...getImageProps(image.id)}
                  alt={t("dropzone.attachment", { index: index + 1 })}
                  className="tw:h-full tw:w-full tw:object-cover"
                  useProxy={image.useProxy}
                />
                <button
                  type="button"
                  aria-label={t("dropzone.remove")}
                  onClick={() => onRemove(index)}
                  className={clsx(
                    "tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center",
                    "tw:bg-black/55 tw:opacity-0 tw:transition-opacity tw:cursor-pointer",
                    "tw:group-hover:opacity-100 tw:focus:opacity-100",
                  )}
                >
                  <span className="tw:flex tw:h-8 tw:w-8 tw:items-center tw:justify-center tw:rounded-full tw:bg-red-500 tw:text-white">
                    <Trash2 size={15} />
                  </span>
                </button>
              </div>
            ))}

            <FileUpload {...uploadProps}>
              <div
                className={clsx(
                  "tw:flex tw:h-24 tw:w-24 tw:flex-col tw:items-center tw:justify-center tw:gap-1",
                  "tw:rounded-xl tw:border-2 tw:border-dashed tw:border-border",
                  "tw:text-xs tw:text-muted-foreground tw:transition-colors",
                  "tw:hover:border-primary/60 tw:hover:text-primary",
                )}
              >
                <ImagePlus size={18} />
                {t("dropzone.addMore")}
              </div>
            </FileUpload>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceImageUploader;
