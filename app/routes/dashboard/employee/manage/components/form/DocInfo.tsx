import { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppSelect } from "~/components/core/form";
import { AppInput } from "~/components/core/form/AppInput";
import FranchiseService from "~/services/FranchiseService";
import { useTranslation } from "react-i18next";

const DocInfo = () => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, getValues } = useFormContext();
  const [docs, setDocs] = useState<any[]>([]);

  const [document, documentFile] = useWatch({
    control,
    name: ["document", "documentFile"],
  });

  useEffect(() => {
    const loadDocs = async () => {
      const docs = await FranchiseService.getDocs("photo");
      const localDocs = (docs?.data || []).map((doc: any) => ({
        label: doc.name,
        value: doc.name,
      }));
      setDocs([...localDocs]);
    };
    loadDocs();
  }, []);

  const handleDocumentUpload = (data: any) => {
    // Default upload maps to front (index 0)
    const documentFile = getValues("documentFile") || [];
    const next = [...documentFile];
    next[0] = { id: data._id };
    setValue("documentFile", next);
  };

  const handleDocumentUploadBack = (data: any) => {
    // Back face must be placed at index 1 even if front (index 0) is not present
    const documentFile = getValues("documentFile") || [];
    const next = [...documentFile];
    next[1] = { id: data._id };
    setValue("documentFile", next);
  };

  const clearDocumentIdAt = (index: number) => {
    const documentFile = getValues("documentFile") || [];
    const next = [...documentFile];
    // Clear the slot entirely so checks like `documentFile[0]` become falsy
    // instead of an object with an empty id (which prevented the upload
    // button from showing).
    next[index] = undefined;
    setValue("documentFile", next);
  };

  const removeFrontFace = () => {
    clearDocumentIdAt(0);
  };

  const removeBackFace = () => {
    const documentFile = getValues("documentFile") || [];
    // Back face is normally at index 1; if for some reason it's stored at
    // index 2 (third slot), prefer clearing index 1 when present, else 2.
    const target =
      documentFile[1] !== undefined ? 1 : documentFile[2] !== undefined ? 2 : 1;
    clearDocumentIdAt(target);
  };

  const hasBackFront = (document: string | null) => {
    return document === "Aadhar card";
  };

  return (
    <AppCard title={t("documents")} icon="credit-card">
      <div>
        {/* Document Information Grid */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
          <Controller
            control={control}
            name="document"
            render={({ field }) => (
              <AppSelect
                label={t("document")}
                value={field.value || ""}
                onChange={(val: any) => {
                  // Only clear when the selection actually changes
                  if (val !== document) {
                    setValue("referenceNumber", "");
                    setValue("documentFile", []);
                  }
                  field.onChange(val);
                }}
                placeholder={t("selectDocument")}
                options={docs}
                size="sm"
                inputClassName="tw:w-full"
              />
            )}
          />

          {document && (
            <AppInput
              label={t("referenceNumber")}
              register={control.register}
              name="referenceNumber"
              placeholder={t("enterReferenceNumber")}
              isRequired
              size="sm"
            />
          )}
        </div>

        {/* File Upload Row */}
        {document && (
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mt-4">
            <div>
              <div className="tw:text-xs tw:font-medium tw:mb-2">
                {t("front")}
              </div>
              {documentFile && documentFile[0] ? (
                <FileUploadPreview
                  image={documentFile[0].id}
                  onRemove={removeFrontFace}
                />
              ) : (
                <FileUpload
                  maxSizeMB={5}
                  allowedExtensions={["jpg", "jpeg", "png"]}
                  onFileUpload={handleDocumentUpload}
                  label={t("uploadFront")}
                  note={t("maxSize5mbAllowedJpgJpegPngLower")}
                />
              )}
            </div>

            {hasBackFront(document) || (documentFile && documentFile[1]) ? (
              <div>
                <div className="tw:text-xs tw:font-medium tw:mb-2">
                  {t("back")}
                </div>
                {documentFile && documentFile[1] ? (
                  <FileUploadPreview
                    image={documentFile[1].id}
                    onRemove={removeBackFace}
                  />
                ) : (
                  <FileUpload
                    maxSizeMB={5}
                    allowedExtensions={["jpg", "jpeg", "png"]}
                    onFileUpload={handleDocumentUploadBack}
                    label={t("uploadBack")}
                    note={t("maxSize5mbAllowedJpgJpegPngLower")}
                  />
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default DocInfo;
