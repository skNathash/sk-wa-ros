import { useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { useTranslation } from "react-i18next";

const PhotoInfo = () => {
  const { t } = useTranslation(["common"]);
  const { setValue, control } = useFormContext();
  const photo = useWatch({ control, name: ["photo"] });

  const handlePhotoUpload = (data: any) => {
    setValue("photo", { id: data._id });
  };

  const handlePhotoRemove = () => {
    setValue("photo", undefined);
  };

  return (
    <AppCard title={t("employeePhoto")} icon="camera">
      <div className="tw:flex tw:items-center tw:gap-4">
        <div className="tw:flex-shrink-0 tw:w-28 tw:h-28 tw:rounded-full tw:border tw:border-gray-200 tw:overflow-hidden tw:flex tw:items-center tw:justify-center">
          <FileUploadPreview
            image={photo?.[0]?.id || ""}
            onRemove={handlePhotoRemove}
          />
        </div>
        <div className="tw:flex-1">
          <div className="tw:text-sm tw:font-medium tw:mb-2">
            {t("uploadEmployeePhoto")}
          </div>
          <FileUpload
            maxSizeMB={5}
            allowedExtensions={["jpg", "jpeg", "png"]}
            onFileUpload={handlePhotoUpload}
            label={t("uploadPhoto")}
            note={t("maxSize5mbAllowedJpgJpegPng")}
          />
        </div>
      </div>
    </AppCard>
  );
};

export default PhotoInfo;
