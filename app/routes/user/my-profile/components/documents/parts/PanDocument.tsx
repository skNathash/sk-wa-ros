import { File, Save, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppInput } from "~/components/core/form/AppInput";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";

const allowedExtensions = ["jpg", "jpeg", "png"];

interface PanDocumentProps {
  documents?: Array<{
    businessID?: string;
    businessIDNo?: string;
    businessIDFile?: string;
    documentFace?: string;
  }>;
  onRefresh?: () => void;
}

const PanDocument: React.FC<PanDocumentProps> = ({ documents, onRefresh }) => {
  const {
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<{ panNo: string }>();

  const [panFile, setPanFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const toast = useAppToast();

  // Auto-fill form data when documents are provided (array input)
  useEffect(() => {
    if (documents && documents.length > 0) {
      const panDoc = documents[0];
      if (panDoc) {
        setValue("panNo", panDoc.businessIDNo || "");
        if (panDoc.businessIDFile) {
          setPanFile({ _id: panDoc.businessIDFile });
        }
      }
    }
  }, [documents, setValue]);

  const handleSave = async () => {
    const formData = getValues();

    if (!formData.panNo) {
      toast.show({ msg: "PAN number is required", color: "danger" });
      return;
    }

    if (!CommonService.isValidPan(formData.panNo)) {
      toast.show({ msg: "Invalid PAN number", color: "danger" });
      return;
    }

    if (!panFile?._id) {
      toast.show({ msg: "PAN card is required", color: "danger" });
      return;
    }

    setSaving(true);
    try {
      const panNo = getValues("panNo");

      // Allowed keys for business docs
      const allowedKeys = [
        "businessID",
        "businessIDNo",
        "businessIDFile",
        "documentFace",
      ];

      // Existing business docs from logged-in user
      const user: any = AuthService.getLoggedInUser() || {};
      const existingBusiness: any[] = (user?.documents?.business || []).map(
        (d: any) => ({
          businessID: d?.businessID,
          businessIDNo: d?.businessIDNo,
          businessIDFile: d?.businessIDFile,
          documentFace: d?.documentFace,
        })
      );

      // New PAN entry
      const newEntries: any[] = [
        {
          businessID: "Pancard",
          businessIDNo: panNo,
          businessIDFile: panFile?._id,
          documentFace: "Front",
        },
      ];

      // Remove existing PAN entries, keep others
      const filteredExisting = existingBusiness.filter(
        (d: any) => d?.businessID !== "Pancard"
      );

      // Sanitize objects to allowed keys only
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
        toast.show({ msg: "PAN saved successfully!", color: "success" });
        onRefresh && onRefresh();
      } else {
        toast.show({
          msg: (response as any)?.message || "Failed to save PAN.",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({ msg: e?.message || "Failed to save PAN.", color: "danger" });
    }
    setSaving(false);
  };

  return (
    <AppCard title="PAN Details" icon={<File />}>
      <AppInput
        name="panNo"
        label="PAN No."
        placeholder="Enter PAN number"
        register={register}
        maxLength={10}
        className="tw:mb-4"
      />
      <div>
        <label className="tw:text-sm tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
          Upload PAN Card
        </label>
        <FileUpload
          onFileUpload={(r: any) => setPanFile(r)}
          allowedExtensions={allowedExtensions}
          maxSizeMB={10}
          label="Upload PAN Card"
        >
          <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:hover:border-gray-400 tw:transition-colors">
            <Upload className="tw:mx-auto tw:h-8 tw:w-8 tw:text-gray-400 tw:mb-2" />
            <p className="tw:text-sm tw:text-gray-600">
              Click to upload PAN card
            </p>
            <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
              JPG, PNG (Max 5MB)
            </p>
          </div>
        </FileUpload>
        {panFile?._id && (
          <div className="tw:mt-3">
            <FileUploadPreview
              image={panFile._id}
              onRemove={() => setPanFile(null)}
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
          Save PAN
        </AppButton>
      </div>
    </AppCard>
  );
};

export default PanDocument;
