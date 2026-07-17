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
import FranchiseService from "~/services/FranchiseService";
import CommonService from "~/services/CommonService";

interface DocumentsUploadModalProps {
  show: boolean;
  callback: (data: any) => void;
  onClose: () => void;
  title?: string;
  data?: any;
  showSubmitButton?: boolean;
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

const DocumentsUploadModal: React.FC<DocumentsUploadModalProps> = ({
  show,
  callback,
  title = "Upload Document",
  data,
  showSubmitButton = false,
  defaultProofType = "address",
}) => {
  const {
    register,
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
      (d: any) =>
        d.value === data.documentType || d.label === data.documentType,
    );
    const docLabel = (selectedDoc?.label || "").toLowerCase();
    const exactLabel = selectedDoc?.label || "";
    // Do not make back-image mandatory. If a document (like Aadhaar) supports
    // a back face we show the UI but it's not required to submit.

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

  const handleSubmit = () => {
    const validation = validateDocumentSubmission();
    if (!validation.status) {
      showToast({ msg: validation.msg, color: "danger" });
      return;
    }

    const formData = getValues();
    const selectedDoc = docOptions.find(
      (d: any) => d.value === formData.documentType,
    );

    callback({
      action: "submit",
      data: {
        documentType: selectedDoc?.label || formData.documentType,
        referenceNo: formData.referenceNo.trim(),
        frontImage: formData.frontImg,
        backImage: formData.backImg || undefined,
      },
    });

    // Reset form and close
    reset({
      proofType: defaultProofType,
      documentType: "",
      referenceNo: "",
      frontImg: "",
      backImg: "",
    });
    setShowBackFace(false);
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  // Restrict Aadhaar reference input to digits and max 12 chars.
  // Uses `getValues` to determine the selected document type and
  // `setValue` to ensure the form value is kept in sync after cleaning.
  const handleReferenceChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedDoc = (getValues().documentType || "")
      .toString()
      .toLowerCase();
    let val = event.target.value || "";

    const isAadhaar =
      selectedDoc.includes("aadhar") || selectedDoc.includes("aadhaar");

    if (isAadhaar) {
      // Remove non-digits and cap to 12 chars
      val = val.replace(/\D/g, "").slice(0, 12);
      // Reflect cleaned value in the input element so the user sees it
      event.target.value = val;
      // Update the form value explicitly to ensure react-hook-form has the cleaned value
      setValue("referenceNo", val, { shouldValidate: true });
    }
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
    <AppModal show={show} callback={handleClose}>
      <AppModal.Title onClose={handleClose} noShadow>
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
          onChange={handleReferenceChange}
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
            onClick={handleClose}
          >
            Cancel
          </AppButton>
          {showSubmitButton && (
            <AppButton
              type="button"
              color="primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              Add Document
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default DocumentsUploadModal;
