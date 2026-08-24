import React, { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FileText, Upload, CheckCircle2, X, FilePlus, Sparkles } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import DocumentsUploadModal from "~/shared/others/modals/documents-upload/DocumentsUploadModal";

import type { PaylaterKycDocument } from "../helper";

type UploadedDocument = PaylaterKycDocument;

const DocumentsStep: React.FC = () => {
  const { setValue, getValues, control } = useFormContext();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const documents: UploadedDocument[] =
    useWatch({ control, name: "documents" }) || [];

  const handleUploadCallback = (result: any) => {
    if (result.action === "submit" && result.data) {
      const newDoc: UploadedDocument = {
        documentType: result.data.documentType,
        referenceNo: result.data.referenceNo,
        frontImage: result.data.frontImage,
        backImage: result.data.backImage,
      };
      const current = getValues("documents") || [];
      setValue("documents", [...current, newDoc]);
      setShowUploadModal(false);
    }
    if (result.action === "close") {
      setShowUploadModal(false);
    }
  };

  const handleRemove = (index: number) => {
    const current: UploadedDocument[] = getValues("documents") || [];
    setValue(
      "documents",
      current.filter((_, i) => i !== index),
    );
  };

  const openPreview = (assetId: string) => {
    if (assetId) {
      const allImages = documents
        .map((doc) => doc.frontImage)
        .filter(Boolean)
        .map((id) => ({ id }));
      setImgPreviewModal({ show: true, images: allImages });
    }
  };

  const autoFilledCount = documents.filter((d) => d.autoFilled).length;

  return (
    <div className="tw:space-y-3">
      {/* Header */}
      <div className="tw:bg-linear-to-r tw:from-indigo-50 tw:to-blue-50 tw:border tw:border-indigo-100 tw:rounded-lg tw:px-3 tw:py-2.5 tw:flex tw:items-start tw:gap-2">
        <div className="tw:w-7 tw:h-7 tw:bg-indigo-500 tw:text-white tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
          <FileText size={14} />
        </div>
        <div className="tw:flex-1">
          <div className="tw:text-xs tw:font-bold tw:text-indigo-900">
            Documents
          </div>
          <p className="tw:text-[11px] tw:text-indigo-700 tw:mt-0.5">
            Upload KYC and supporting proofs. Accepted: JPG, PNG, WEBP · Max 10MB each.
          </p>
        </div>
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 ? (
        <AppCard>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
            <div className="tw:w-7 tw:h-7 tw:bg-green-100 tw:text-green-600 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0">
              <CheckCircle2 size={14} />
            </div>
            <div className="tw:flex-1">
              <h3 className="tw:text-sm tw:font-bold tw:text-gray-800">
                Uploaded Documents
              </h3>
              <p className="tw:text-[10px] tw:text-gray-500">
                Tap image to preview · Tap × to remove
              </p>
            </div>
            <span className="tw:bg-green-100 tw:text-green-700 tw:text-[10px] tw:font-semibold tw:px-2 tw:py-0.5 tw:rounded-full">
              {documents.length} file{documents.length > 1 ? "s" : ""}
            </span>
          </div>
          {autoFilledCount > 0 && (
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-2 tw:text-[10px] tw:text-amber-700 tw:bg-amber-50 tw:border tw:border-amber-100 tw:rounded-md tw:px-2 tw:py-1">
              <Sparkles size={10} />
              <span>
                {autoFilledCount} auto-filled from profile (locked)
              </span>
            </div>
          )}
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className={`tw:relative tw:flex tw:items-center tw:gap-2 tw:p-2 tw:border tw:rounded-lg tw:transition-colors ${
                  doc.autoFilled
                    ? "tw:border-amber-100 tw:bg-amber-50/50"
                    : "tw:border-green-100 tw:bg-green-50 hover:tw:bg-green-100/50"
                }`}
              >
                <div
                  className="tw:w-12 tw:h-12 tw:bg-white tw:rounded-md tw:overflow-hidden tw:shrink-0 tw:cursor-pointer tw:border tw:border-gray-200"
                  onClick={() => openPreview(doc.frontImage)}
                >
                  <ImgRender
                    assetId={doc.frontImage}
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <div className="tw:text-xs tw:font-bold tw:text-gray-900 tw:truncate">
                      {doc.documentType}
                    </div>
                    {doc.autoFilled && (
                      <Sparkles size={10} className="tw:text-amber-500 tw:shrink-0" />
                    )}
                  </div>
                  <div className="tw:text-[10px] tw:text-gray-500 tw:mt-0.5 tw:truncate tw:font-mono">
                    {doc.referenceNo || "No reference"}
                  </div>
                </div>
                {!doc.autoFilled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="tw:absolute tw:top-1 tw:right-1 tw:w-5 tw:h-5 tw:bg-white tw:text-red-500 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:shadow-sm hover:tw:bg-red-500 hover:tw:text-white tw:transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </AppCard>
      ) : (
        <div className="tw:border-2 tw:border-dashed tw:border-gray-200 tw:rounded-lg tw:px-4 tw:py-6 tw:text-center tw:bg-gray-50/50">
          <div className="tw:w-12 tw:h-12 tw:bg-white tw:border tw:border-gray-200 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mx-auto tw:mb-2">
            <FilePlus className="tw:text-gray-400" size={20} />
          </div>
          <div className="tw:text-sm tw:font-semibold tw:text-gray-700">
            No documents uploaded yet
          </div>
          <p className="tw:text-[11px] tw:text-gray-500 tw:mt-1">
            Upload at least one proof document to continue.
          </p>
        </div>
      )}

      {/* Upload Button */}
      <AppButton
        onClick={() => setShowUploadModal(true)}
        color="primary"
        className="tw:w-full tw:justify-center tw:h-10 tw:text-xs tw:font-bold"
      >
        <Upload size={14} className="tw:mr-2" />
        {documents.length > 0 ? "Upload Another Document" : "Upload Document"}
      </AppButton>

      {imgPreviewModal.show && (
        <ImgPreviewModal
          show={imgPreviewModal.show}
          callback={({ action }: { action: string }) => {
            if (action === "close") {
              setImgPreviewModal({ show: false, images: [] });
            }
          }}
          images={imgPreviewModal.images}
        />
      )}

      <DocumentsUploadModal
        show={showUploadModal}
        callback={handleUploadCallback}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        showSubmitButton={true}
      />
    </div>
  );
};

export default DocumentsStep;
