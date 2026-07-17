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
import CommonService from "~/services/CommonService";
import AppCard from "~/components/core/card/AppCard";
import AuthService from "~/services/AuthService";

const allowedExtensions = ["jpg", "jpeg", "png"];

interface AadharDocumentProps {
  documents?: Array<{
    addressProof?: string;
    addressProofNo?: string;
    addressProofFile?: string;
    documentFace?: string;
  }>;
  onRefresh?: () => void;
}

const AadharDocument: React.FC<AadharDocumentProps> = ({
  documents,
  onRefresh,
}) => {
  const {
    register,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<{ aadharNo: string }>();

  const [frontFile, setFrontFile] = useState<any>(null);
  const [backFile, setBackFile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const toast = useAppToast();

  // Auto-fill form data when documents are provided
  useEffect(() => {
    if (documents && documents.length > 0) {
      // Set the Aadhar number from the first document
      setValue("aadharNo", documents[0].addressProofNo || "");

      // Set front and back files
      const frontDoc = documents.find((doc) => doc.documentFace === "Front");
      const backDoc = documents.find((doc) => doc.documentFace === "Back");

      if (frontDoc?.addressProofFile) {
        setFrontFile({ _id: frontDoc.addressProofFile });
      }
      if (backDoc?.addressProofFile) {
        setBackFile({ _id: backDoc.addressProofFile });
      }
    }
  }, [documents, setValue]);

  const handleSave = async () => {
    let msg = "";

    const formData = getValues();

    if (!formData.aadharNo) {
      msg = "Aadhar number is required";
    } else if (!CommonService.isValidAadhar(formData.aadharNo)) {
      msg = "Invalid Aadhar number";
    } else if (!frontFile?._id) {
      msg = "Aadhar front is required";
    } else if (!backFile?._id) {
      msg = "Aadhar back is required";
    }

    if (msg) {
      toast.show({ msg, color: "danger" });
      return;
    }

    setSaving(true);
    try {
      const aadharNo = getValues("aadharNo");

      // Allowed keys in address objects
      const allowedKeys = [
        "addressProof",
        "addressProofNo",
        "addressProofFile",
        "documentFace",
      ];

      // Fetch existing addresses from locally stored logged-in user
      const user: any = AuthService.getLoggedInUser() || {};
      const existingAddresses: any[] = (user?.documents?.address || []).map(
        (addr: any) => ({
          addressProof: addr?.addressProof,
          addressProofNo: addr?.addressProofNo,
          addressProofFile: addr?.addressProofFile,
          documentFace: addr?.documentFace,
        })
      );

      // Build new/updated Aadhar entries
      const newEntries: any[] = [];
      if (frontFile?._id) {
        newEntries.push({
          addressProof: "Aadhar Card",
          addressProofNo: aadharNo,
          addressProofFile: frontFile._id,
          documentFace: "Front",
        });
      }
      if (backFile?._id) {
        newEntries.push({
          addressProof: "Aadhar Card",
          addressProofNo: aadharNo,
          addressProofFile: backFile._id,
          documentFace: "Back",
        });
      }

      // Merge with existing: replace Aadhar Front/Back if present, keep others
      const filteredExisting = existingAddresses.filter(
        (addr: any) => addr?.addressProof !== "Aadhar Card"
      );

      // Ensure only allowed keys are in each object
      const sanitize = (obj: any) =>
        allowedKeys.reduce((acc: any, key: string) => {
          if (obj[key] !== undefined) acc[key] = obj[key];
          return acc;
        }, {} as any);

      const mergedAddress = [
        ...filteredExisting.map(sanitize),
        ...newEntries.map(sanitize),
      ];

      const response = await FranchiseService.updateFranchise({
        documents: { address: mergedAddress },
      });
      if ((response as any)?.statusCode === 200) {
        toast.show({ msg: "Aadhar saved successfully!", color: "success" });
        onRefresh && onRefresh();
      } else {
        toast.show({
          msg: (response as any)?.message || "Failed to save Aadhar.",
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Failed to save Aadhar.",
        color: "danger",
      });
    }
    setSaving(false);
  };

  return (
    <AppCard title="Aadhaar Details" icon={<File />}>
      <AppInput
        name="aadharNo"
        label="Aadhaar No."
        placeholder="Enter Aadhaar number"
        register={register}
        maxLength={12}
        className="tw:mb-4"
      />
      <div className="tw:grid tw:grid-cols-1 tw:gap-3">
        <div>
          <label className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
            Upload Aadhaar Front
          </label>
          {!frontFile?._id && (
            <FileUpload
              onFileUpload={(r: any) => setFrontFile(r)}
              allowedExtensions={allowedExtensions}
              maxSizeMB={10}
              label="Upload Aadhaar Front"
            >
              <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-3 tw:text-center tw:hover:border-gray-400 tw:transition-colors">
                <Upload className="tw:mx-auto tw:h-6 tw:w-6 tw:text-gray-400 tw:mb-1" />
                <p className="tw:text-xs tw:text-gray-600">Aadhaar Front</p>
              </div>
            </FileUpload>
          )}
          {frontFile?._id && (
            <div className="tw:mt-2">
              <FileUploadPreview
                image={frontFile._id}
                onRemove={() => setFrontFile(null)}
              />
            </div>
          )}
        </div>
        <div>
          <label className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
            Upload Aadhaar Back
          </label>
          {!backFile?._id && (
            <FileUpload
              onFileUpload={(r: any) => setBackFile(r)}
              allowedExtensions={allowedExtensions}
              maxSizeMB={10}
              label="Upload Aadhaar Back"
            >
              <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-3 tw:text-center tw:hover:border-gray-400 tw:transition-colors">
                <Upload className="tw:mx-auto tw:h-6 tw:w-6 tw:text-gray-400 tw:mb-1" />
                <p className="tw:text-xs tw:text-gray-600">Aadhaar Back</p>
              </div>
            </FileUpload>
          )}
          {backFile?._id && (
            <div className="tw:mt-2">
              <FileUploadPreview
                image={backFile._id}
                onRemove={() => setBackFile(null)}
              />
            </div>
          )}
        </div>
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
          Save Aadhaar
        </AppButton>
      </div>
    </AppCard>
  );
};

export default AadharDocument;
