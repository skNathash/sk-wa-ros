import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { File, Save, Upload } from "lucide-react";
import useAppToast from "~/hooks/useAppToast";
import AppCard from "~/components/core/card/AppCard";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";

const allowedExtensions = ["jpg", "jpeg", "png"];

interface FssaiDocumentProps {
  documents?: Array<{
    businessID?: string;
    businessIDNo?: string;
    businessIDFile?: string;
    documentFace?: string;
  }>;
  onRefresh?: () => void;
}

const FssaiDocument: React.FC<FssaiDocumentProps> = ({
  documents,
  onRefresh,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<{ fssaiNo: string }>();
  const toast = useAppToast();
  const [fssaiFile, setFssaiFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Auto-fill form data when documents are provided (array input)
  useEffect(() => {
    if (documents && documents.length > 0) {
      const fssaiDoc = documents[0];
      if (fssaiDoc) {
        setValue("fssaiNo", fssaiDoc.businessIDNo || "");
        if (fssaiDoc.businessIDFile) {
          setFssaiFile({ _id: fssaiDoc.businessIDFile });
        }
      }
    }
  }, [documents, setValue]);

  const handleSave = async () => {
    const formData = getValues();
    if (!formData.fssaiNo) {
      toast.show({ msg: "FSSAI number is required", color: "danger" });
      return;
    }
    if (!fssaiFile?._id) {
      toast.show({ msg: "FSSAI license is required", color: "danger" });
      return;
    }

    setSaving(true);
    try {
      const fssaiNo = getValues("fssaiNo");

      const allowedKeys = [
        "businessID",
        "businessIDNo",
        "businessIDFile",
        "documentFace",
      ];

      const user: any = AuthService.getLoggedInUser() || {};
      const existingBusiness: any[] = (user?.documents?.business || []).map(
        (d: any) => ({
          businessID: d?.businessID,
          businessIDNo: d?.businessIDNo,
          businessIDFile: d?.businessIDFile,
          documentFace: d?.documentFace,
        })
      );

      const newEntries: any[] = [
        {
          businessID: "FSSAI",
          businessIDNo: fssaiNo,
          businessIDFile: fssaiFile?._id,
          documentFace: "Front",
        },
      ];

      const filteredExisting = existingBusiness.filter(
        (d: any) => d?.businessID !== "FSSAI"
      );

      const sanitize = (obj: any) =>
        allowedKeys.reduce((acc: any, key: string) => {
          if (obj[key] !== undefined) acc[key] = obj[key];
          return acc;
        }, {} as any);

      const mergedBusiness = [
        ...filteredExisting.map(sanitize),
        ...newEntries.map(sanitize),
      ];

      const response = await FranchiseService.updateFranchise({
        documents: { business: mergedBusiness },
      });
      if ((response as any)?.statusCode === 200) {
        toast.show({ msg: "FSSAI saved successfully!", color: "success" });
        onRefresh && onRefresh();
      } else {
        toast.show({
          msg: (response as any)?.message || "Failed to save FSSAI.",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Failed to save FSSAI.",
        color: "danger",
      });
    }
    setSaving(false);
  };

  return (
    <AppCard title="FSSAI Details" icon={<File />}>
      <AppInput
        name="fssaiNo"
        label="FSSAI No."
        placeholder="Enter FSSAI number"
        register={register}
        error={errors.fssaiNo?.message}
        className="tw:mb-4"
      />
      <div className="tw:mt-3">
        <label className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
          Upload FSSAI License
        </label>
        {!fssaiFile?._id && (
          <FileUpload
            onFileUpload={(r: any) => setFssaiFile(r)}
            allowedExtensions={allowedExtensions}
            maxSizeMB={10}
            label="Upload FSSAI License"
          >
            <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:hover:border-gray-400 tw:transition-colors">
              <Upload className="tw:mx-auto tw:h-8 tw:w-8 tw:text-gray-400 tw:mb-2" />
              <p className="tw:text-sm tw:text-gray-600">
                Click to upload FSSAI license
              </p>
              <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                JPG, PNG (Max 5MB)
              </p>
            </div>
          </FileUpload>
        )}
        {fssaiFile?._id && (
          <div className="tw:mt-3">
            <FileUploadPreview
              image={fssaiFile._id}
              onRemove={() => setFssaiFile(null)}
            />
          </div>
        )}
      </div>
      <div className="tw:flex tw:justify-end tw:mt-3">
        <AppButton
          type="button"
          color="success"
          size="small"
          onClick={handleSave}
          isLoading={saving}
        >
          <Save className="tw:w-4 tw:h-4 tw:mr-1" />
          Save FSSAI
        </AppButton>
      </div>
    </AppCard>
  );
};

export default FssaiDocument;
