import { ImagePlus } from "lucide-react";
import React, { useState } from "react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppInput } from "~/components/core/form";
import AppSelect from "~/components/core/form/AppSelect";
import InpLabel from "~/components/core/form/InpLabel";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";

interface DocumentSubmissionModalProps {
  show: boolean;
  callback: (data: any) => void;
  onClose: () => void;
  title?: string;
  data?: any;
  /** Proof container to preselect when the modal opens (defaults to address). */
  defaultProofType?: string;
}

type FormData = {
  proofType: string;
  documentType: string;
  referenceNo: string;
  frontImg: string;
  backImg: string;
};

const proofOptions = [
  { value: "address", label: "Address" },
  { value: "business", label: "Business" },
  { value: "photo", label: "ID" },
];

const DocumentSubmissionModal: React.FC<DocumentSubmissionModalProps> = ({
  show,
  callback,
  title = "Submit Document",
  data,
  defaultProofType = "address",
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    getValues,
    control,
  } = useForm<FormData>({
    defaultValues: {
      proofType: "address",
      documentType: "",
      referenceNo: "",
      frontImg: "",
      backImg: "",
    },
  });

  const { show: showToast } = useAppToast();

  const [docOptions, setDocOptions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // whether to show back-face upload block (for Aadhaar etc)
  const [showBackFace, setShowBackFace] = useState(false);

  // Watch front/back image strings
  const frontImg = useWatch({ control, name: "frontImg" }) || "";
  const backImg = useWatch({ control, name: "backImg" }) || "";
  // Watch proofType from the form so components and effects can react to it
  const proofTypeValue = useWatch({ control, name: "proofType" }) || "";

  const fetchDocsForProofType = async (proofType: string) => {
    if (!proofType) return;
    setLoading(true);
    try {
      const resp = await FranchiseService.getDocs(proofType);
      const options = (resp?.data || [])
        .sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""))
        .map((d: any) => ({ value: d.name, label: d.name }));
      options.unshift({ value: "Choose", label: "Select Document Type" });
      setDocOptions(options);
    } catch (error) {
      // swallow - UI can remain functional
    } finally {
      setLoading(false);
    }
  };

  const onProofTypeChange = (chngFn: (v: any) => void) => async (val: any) => {
    // Set form value first so UI reflects selection immediately
    chngFn(val);

    // reset any uploaded images
    setValue("frontImg", "");
    setValue("backImg", "");
    setValue("documentType", "");
    setValue("referenceNo", "");

    // Fetch document types for the newly selected proof type
    await fetchDocsForProofType(val);
  };

  const onDocTypeChange = (chngFn: (v: any) => void) => (val: any) => {
    chngFn(val);

    // determine if selected doc requires back face (Aadhaar)
    const label = (val || "").toString().toLowerCase();
    const needsBack = label.includes("aadhar") || label.includes("aadhaar");
    setShowBackFace(needsBack);
    // reset uploaded images so user can re-upload both faces when doc type changes
    setValue("frontImg", "");
    setValue("backImg", "");
  };

  // Add uploaded file to appropriate image key (front/back)
  const onFileUpload = (fileObj: any, face: "front" | "back") => {
    const fileId = fileObj?._id || "";
    if (face === "front") {
      setValue("frontImg", fileId, { shouldValidate: true });
    } else {
      setValue("backImg", fileId, { shouldValidate: true });
    }
  };

  // Remove front/back image
  const handleRemoveFront = () => {
    setValue("frontImg", "", { shouldValidate: true });
  };
  const handleRemoveBack = () => {
    setValue("backImg", "", { shouldValidate: true });
  };

  const validateDocumentSubmission = () => {
    const data = getValues();

    // Check mandatory fields
    if (!data.documentType) {
      return { msg: "Please select a document type", status: false };
    }
    if (!data.referenceNo?.trim()) {
      return { msg: "Reference No is required", status: false };
    }
    // Image presence checks
    if (!data.frontImg) {
      return { msg: "Please upload the document", status: false };
    }

    // Check for Aadhar Card or PAN Card (assuming label or value contains 'aadhar' or 'pan')
    const selectedDoc = docOptions.find(
      (d: any) => d.value === data.documentType || d.label === data.documentType
    );
    const docLabel = (selectedDoc?.label || "").toLowerCase();
    const exactLabel = selectedDoc?.label || "";
    if (docLabel.includes("aadhar") && !data.backImg) {
      return {
        msg: "Please upload both front and back of the document",
        status: false,
      };
    }

    // Aadhaar validation
    if (docLabel.includes("aadhar")) {
      const aadhaar = data.referenceNo;
      // Aadhaar must be 12 digits and not all digits the same
      if (!/^\d{12}$/.test(aadhaar)) {
        return {
          msg: "Please enter a valid 12-digit Aadhaar number",
          status: false,
        };
      }
      if (/^(\d)\1{11}$/.test(aadhaar)) {
        return {
          msg: "Please enter a valid 12-digit Aadhaar number",
          status: false,
        };
      }
    }

    // PAN validation for exact labels
    if (exactLabel === "Pancard" || exactLabel === "Company PAN Number") {
      const pan = (data.referenceNo || "").trim();
      if (!CommonService.isValidPan(pan)) {
        return { msg: "Please provide valid PAN No.", status: false };
      }
    }

    // GST validation for exact labels
    if (exactLabel === "GST" || exactLabel === "GST Certificate") {
      const gst = (data.referenceNo || "").trim();
      if (!CommonService.isValidGst(gst)) {
        return { msg: "Please provide valid GST No.", status: false };
      }
    }

    return { msg: "", status: true };
  };

  const onSubmit = async () => {
    const user = AuthService.getLoggedInUser();
    const validation = validateDocumentSubmission();
    if (!validation.status) {
      showToast({ msg: validation.msg, color: "danger" });
      return;
    }
    if (!user?._id) {
      showToast({ msg: "User not found.", color: "danger" });
      return;
    }
    setSubmitting(true);
    try {
      const formData = getValues();
      const images: string[] = [];
      if (formData.frontImg) images.push(formData.frontImg);
      if (formData.backImg) images.push(formData.backImg);
      // Determine proof type from form (proofType) or fallback to watched proofTypeValue
      const proofType = formData.proofType || proofTypeValue;
      if (!proofType) {
        showToast({ msg: "Please select proof type.", color: "danger" });
        setSubmitting(false);
        return;
      }

      // Prepare payload based on selected proofType
      let docKey: string, noKey: string, fileKey: string, statusKey: string;
      if (proofType === "photo") {
        docKey = "photoID";
        noKey = "photoIDNo";
        fileKey = "photoIDFile";
        statusKey = "photoIdStatus";
      } else if (proofType === "address") {
        docKey = "addressProof";
        noKey = "addressProofNo";
        fileKey = "addressProofFile";
        statusKey = "addressProofIdStatus";
      } else if (proofType === "business") {
        docKey = "businessID";
        noKey = "businessIDNo";
        fileKey = "businessIDFile";
        statusKey = "businessIDStatus";
      } else {
        showToast({ msg: "Invalid document type.", color: "danger" });
        setSubmitting(false);
        return;
      }

      const updatedDocs: any[] = [];

      // If front image present, add a Front or Front/Back entry.
      // Note: fileKey should store a single string id (front or back image id).
      if (formData.frontImg) {
        updatedDocs.push({
          [docKey]: formData.documentType,
          [noKey]: formData.referenceNo,
          [fileKey]: formData.frontImg,
          documentFace: "Front",
        });
      }

      // If back image present, add a separate Back-only entry with only back image
      if (formData.backImg) {
        updatedDocs.push({
          [docKey]: formData.documentType,
          [noKey]: formData.referenceNo,
          [fileKey]: formData.backImg,
          documentFace: "Back",
        });
      }

      // Build payload: append new entries to existing documents container based on proofType
      // Determine the container key to use in user's documents (photo/address/business)
      const containerKey = proofType; // one of 'photo' | 'address' | 'business'

      const rawExistingDocs = Array.isArray(user?.documents?.[containerKey])
        ? user.documents[containerKey]
        : [];

      // Sanitize existing docs to the allowed structure so keys are consistent
      const allowedKeys = [docKey, noKey, fileKey, "documentFace", statusKey];
      const existingDocs = rawExistingDocs.map((d: any) => {
        const obj: any = {};
        allowedKeys.forEach((k) => {
          if (d && Object.prototype.hasOwnProperty.call(d, k)) {
            obj[k] = d[k];
          }
        });
        return obj;
      });

      const mergedAddress = [...existingDocs, ...updatedDocs];

      // Only include document entries that have a file id in the expected fileKey.
      // This avoids sending placeholder/empty entries.
      const sanitizedMerged = mergedAddress.filter((entry: any) => {
        // The fileKey variable is in the outer scope and contains the key name for file id
        return Boolean(entry && entry[fileKey]);
      });

      // Preserve other document containers (photo/address/business) when updating one.
      // Use user's existing documents as base to avoid wiping other keys on the server.
      const existingDocsAll: any =
        user && user.documents ? { ...user.documents } : {};

      // Ensure known keys exist as arrays so the API receives consistent shapes.
      const knownKeys = ["photo", "address", "business"];
      knownKeys.forEach((k) => {
        if (!Array.isArray(existingDocsAll[k])) existingDocsAll[k] = [];
        // Strip any _id fields from existing entries to avoid sending DB identifiers
        existingDocsAll[k] = existingDocsAll[k].map((entry: any) => {
          if (!entry || typeof entry !== "object") return entry;
          const { _id, ...rest } = entry;
          return rest;
        });
      });

      // Replace only the container we're updating
      existingDocsAll[containerKey] = sanitizedMerged;

      const payload = {
        documents: existingDocsAll,
      };

      const res = await FranchiseService.updateFranchise(payload);
      if (res.statusCode === 200) {
        let msg = "";
        if (proofType === "photo") {
          msg = "Photo Proof updated successfully!";
        } else if (proofType === "address") {
          msg = "Address Proof updated successfully!";
        } else if (proofType === "business") {
          msg = "Business Proof updated successfully!";
        }
        showToast({ msg, color: "success" });
        callback({ action: "success" });
      } else {
        showToast({
          msg: res.data?.message || "Failed to update document.",
          color: "danger",
        });
      }
    } catch (e) {
      showToast({
        msg: "Failed to update document. Please try again.",
        color: "danger",
      });
    }
    setSubmitting(false);
  };

  const onClose = () => {
    callback({ action: "close" });
  };

  // When the modal opens, reset the form fields and load document types
  useEffect(() => {
    if (show) {
      // Reset form to defaults
      reset({
        proofType: defaultProofType,
        documentType: "",
        referenceNo: "",
        frontImg: "",
        backImg: "",
      });

      // Load document types for the default proof type
      fetchDocsForProofType(defaultProofType);
      // ensure back-face flag is reset
      setShowBackFace(false);
    }
    // only run when `show` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AppModal show={show} callback={onClose}>
      <AppModal.Title onClose={onClose} noShadow>
        <div className="tw:font-semibold">{title}</div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:grid tw:grid-cols-2 tw:gap-4">
          <Controller
            control={control}
            name="proofType"
            render={({ field }) => (
              <AppSelect
                label="Proof Type"
                options={proofOptions}
                value={field.value}
                onChange={onProofTypeChange(field.onChange)}
                placeholder="Select proof type"
                className="tw:mb-4"
                inputClassName="tw:w-full"
                isRequired={true}
              />
            )}
          />

          <Controller
            control={control}
            name="documentType"
            render={({ field }) => (
              <AppSelect
                label="Document Type"
                options={docOptions}
                value={field.value}
                onChange={onDocTypeChange(field.onChange)}
                error={errors.documentType?.message as string}
                placeholder="Select document type"
                disabled={loading}
                className="tw:mb-4"
                inputClassName="tw:w-full"
                isRequired={true}
              />
            )}
          />
        </div>
        <AppInput
          name="referenceNo"
          label="Reference No"
          register={register}
          error={errors.referenceNo?.message as string}
          placeholder="Enter reference number"
          className="tw:mb-4"
          isRequired={true}
        />
        <div>
          <InpLabel isRequired>Upload Document</InpLabel>
          <div className="tw:grid tw:grid-cols-2 tw:gap-4">
            {/* Front face: show preview if frontImg exists, otherwise show uploader */}
            {frontImg ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:flex-col tw:bg-gray-50 tw:p-2 tw:rounded">
                <FileUploadPreview
                  image={frontImg}
                  onRemove={handleRemoveFront}
                  className="tw:bg-white"
                />
                {showBackFace ? (
                  <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
                    Front
                  </div>
                ) : null}
              </div>
            ) : (
              <FileUpload
                onFileUpload={(resp: any) => onFileUpload(resp, "front")}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload document or drag and drop files"
                  className="tw:p-4 tw:border tw:border-dashed tw:border-gray-300 tw:rounded tw:text-center hover:tw:cursor-pointer focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary-300"
                >
                  <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:space-y-2">
                    <div className="tw:text-gray-400 tw:flex tw:justify-center">
                      <ImagePlus size={36} />
                    </div>
                    <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                      Click to upload
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      Accepts PNG, JPG, JPEG — Max 10MB
                    </div>
                  </div>
                </div>
              </FileUpload>
            )}

            {/* Back face: only show when needed */}
            {showBackFace && (
              <>
                {backImg ? (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:flex-col tw:bg-gray-50 tw:p-2 tw:rounded">
                    <FileUploadPreview
                      image={backImg}
                      onRemove={handleRemoveBack}
                      className="tw:bg-white"
                    />
                    <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
                      Back
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    onFileUpload={(resp: any) => onFileUpload(resp, "back")}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Upload back side of document or drag and drop files"
                      className="tw:p-4 tw:border tw:border-dashed tw:border-gray-300 tw:rounded tw:text-center hover:tw:cursor-pointer focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary-300"
                    >
                      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:space-y-2">
                        <div className="tw:text-gray-400 tw:flex tw:justify-center">
                          <ImagePlus size={36} />
                        </div>
                        <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                          Click to upload back side
                        </div>
                        <div className="tw:text-xs tw:text-gray-500">
                          Accepts PNG, JPG, JPEG — Max 10MB
                        </div>
                      </div>
                    </div>
                  </FileUpload>
                )}
              </>
            )}
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2 tw:px-4">
          <AppButton
            type="button"
            fill="outline"
            color="medium"
            onClick={onClose}
          >
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            color="primary"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default DocumentSubmissionModal;
