import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import FranchiseService from "~/services/FranchiseService";
import useAppToast from "~/hooks/useAppToast";
import { File, Save, Upload } from "lucide-react";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import AppCard from "~/components/core/card/AppCard";
import AuthService from "~/services/AuthService";

const allowedExtensions = ["jpg", "jpeg", "png"];

interface GSTDocumentProps {
  documents?: Array<{
    businessID?: string;
    businessIDNo?: string;
    businessIDFile?: string;
    documentFace?: string;
  }>;
  onRefresh?: () => void;
}

const GSTDocument: React.FC<GSTDocumentProps> = ({ documents, onRefresh }) => {
  const {
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<{ gstNo: string }>();

  const [gstFile, setGstFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const toast = useAppToast();

  // Auto-fill form data when documents are provided (array input)
  useEffect(() => {
    if (documents && documents.length > 0) {
      const gstDoc = documents[0];
      if (gstDoc) {
        setValue("gstNo", gstDoc.businessIDNo || "");
        if (gstDoc.businessIDFile) {
          setGstFile({ _id: gstDoc.businessIDFile });
        }
      }
    }
  }, [documents, setValue]);

  const handleSave = async () => {
    const formData = getValues();
    if (!formData.gstNo) {
      toast.show({ msg: "GST number is required", color: "danger" });
      return;
    }
    if (!gstFile?._id) {
      toast.show({ msg: "GST certificate is required", color: "danger" });
      return;
    }

    setSaving(true);
    try {
      const gstNo = getValues("gstNo");

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

      // New GST entry
      const newEntries: any[] = [
        {
          businessID: "GST",
          businessIDNo: gstNo,
          businessIDFile: gstFile?._id,
          documentFace: "Front",
        },
      ];

      // Remove existing GST entries, keep others
      const filteredExisting = existingBusiness.filter(
        (d: any) => d?.businessID !== "GST"
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
        toast.show({ msg: "GST saved successfully!", color: "success" });
        onRefresh && onRefresh();
      } else {
        toast.show({
          msg: (response as any)?.message || "Failed to save GST.",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({ msg: e?.message || "Failed to save GST.", color: "danger" });
    }
    setSaving(false);
  };

  return (
    <AppCard title="GST Details" icon={<File />}>
      <AppInput
        name="gstNo"
        label="GST No."
        placeholder="Enter GST number"
        register={register}
      />
      <div className="tw:mt-3">
        <label className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
          Upload GST Certificate
        </label>
        {!gstFile?._id && (
          <FileUpload
            onFileUpload={(r: any) => setGstFile(r)}
            allowedExtensions={allowedExtensions}
            maxSizeMB={10}
            label="Upload GST Certificate"
          >
            <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-4 tw:text-center tw:hover:border-gray-400 tw:transition-colors">
              <Upload className="tw:mx-auto tw:h-8 tw:w-8 tw:text-gray-400 tw:mb-2" />
              <p className="tw:text-sm tw:text-gray-600">
                Click to upload GST certificate
              </p>
              <p className="tw:text-xs tw:text-gray-500 tw:mt-1">
                JPG, PNG (Max 5MB)
              </p>
            </div>
          </FileUpload>
        )}
        {gstFile?._id && (
          <div className="tw:mt-3">
            <FileUploadPreview
              image={gstFile._id}
              onRemove={() => setGstFile(null)}
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
          Save GST
        </AppButton>
      </div>
    </AppCard>
  );
};

export default GSTDocument;
