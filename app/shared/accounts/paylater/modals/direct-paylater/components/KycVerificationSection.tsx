import React, { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import DocumentsUploadModal from "~/shared/others/modals/documents-upload/DocumentsUploadModal";

export type UploadedKycDocument = {
  documentType: string;
  referenceNo: string;
  frontImage: string;
  backImage?: string;
};

interface KycVerificationSectionProps {
  franchise: Record<string, any>;
  uploadedDocuments?: UploadedKycDocument[];
  onDocumentsChange?: (docs: UploadedKycDocument[]) => void;
  type?: "b2b" | "b2c";
}

const KycVerificationSection: React.FC<KycVerificationSectionProps> = ({
  franchise,
  uploadedDocuments = [],
  onDocumentsChange,
  type = "b2b",
}) => {
  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });
  const [showUploadModal, setShowUploadModal] = useState(false);

  const shopPhotos = franchise?.shopPhotosDetails || [];
  const documents = franchise?.documents || {
    business: [],
    address: [],
    photo: [],
  };

  const allDocImages = [
    ...(documents.business || []),
    ...(documents.address || []),
    ...(documents.photo || []),
  ]
    .map(
      (doc) =>
        doc.businessIDFile || doc.addressProofFile || doc.photoIDFile || doc.id,
    )
    .filter(Boolean);

  const allImages = [
    ...shopPhotos.map((img: any) => img.id || img.fileUrl),
    ...allDocImages,
  ]
    .filter(Boolean)
    .map((id) => ({ id: id as string }));

  const openPreview = (assetId: string) => {
    if (assetId) {
      setImgPreviewModal({
        show: true,
        images: allImages,
      });
    }
  };

  const handleImgPreviewModalCallback = ({ action }: { action: string }) => {
    if (action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  const hasShopPhotos = shopPhotos.length > 0;
  const hasDocuments = allDocImages.length > 0;

  const handleUploadCallback = (result: any) => {
    if (result.action === "submit" && result.data) {
      const newDoc: UploadedKycDocument = {
        documentType: result.data.documentType,
        referenceNo: result.data.referenceNo,
        frontImage: result.data.frontImage,
        backImage: result.data.backImage,
      };
      onDocumentsChange?.([...uploadedDocuments, newDoc]);
      setShowUploadModal(false);
    }
    if (result.action === "close") {
      setShowUploadModal(false);
    }
  };

  const handleRemoveUploaded = (index: number) => {
    const updated = uploadedDocuments.filter((_, i) => i !== index);
    onDocumentsChange?.(updated);
  };

  return (
    <div className="tw:space-y-3">
      <div className="tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded-lg tw:p-2 tw:flex tw:items-start tw:gap-2">
        <AlertCircle className="tw:text-blue-500" size={16} />
        <div>
          <h4 className="tw:text-[11px] tw:font-bold tw:text-blue-900 leading-tight">
            Document Verification
          </h4>
          <p className="tw:text-[10px] tw:text-blue-700 tw:mt-0.5 leading-tight">
            Review uploaded KYC documents and photos. You can also upload new
            documents below.
          </p>
        </div>
      </div>

      {/* Shop Photos - only for b2b */}
      {type === "b2b" && (
        <AppCard>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <ImageIcon className="tw:text-gray-600" size={14} />
            <h3 className="tw:text-xs tw:font-bold tw:text-gray-800">
              Shop Photos
            </h3>
            {hasShopPhotos && (
              <span className="tw:bg-green-100 tw:text-green-700 tw:text-[9px] tw:px-1.5 tw:py-0.5 tw:rounded-full tw:flex tw:items-center tw:gap-1">
                <CheckCircle2 size={8} />
                {shopPhotos.length}
              </span>
            )}
          </div>

          {hasShopPhotos ? (
            <div className="tw:grid tw:grid-cols-4 tw:gap-2">
              {shopPhotos.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="tw:relative tw:aspect-square tw:bg-gray-50 tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200 tw:group tw:cursor-pointer"
                  onClick={() => openPreview(img.id || img.fileUrl)}
                >
                  <ImgRender
                    assetId={img.id || img.fileUrl}
                    alt={`Shop ${idx + 1}`}
                    className="tw:w-full tw:h-full tw:object-cover group-hover:tw:scale-110 tw:transition-transform"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="tw:text-[10px] tw:text-gray-400 tw:py-2 tw:text-center">
              No shop photos uploaded
            </p>
          )}
        </AppCard>
      )}

      {/* KYC Documents */}
      <AppCard>
        <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
          <FileText className="tw:text-gray-600" size={14} />
          <h3 className="tw:text-xs tw:font-bold tw:text-gray-800">
            KYC Documents
          </h3>
        </div>

        {hasDocuments ? (
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            {[
              ...(documents.business || []),
              ...(documents.address || []),
              ...(documents.photo || []),
            ].map((doc, idx) => {
              const assetId =
                doc.businessIDFile ||
                doc.addressProofFile ||
                doc.photoIDFile ||
                doc.id;
              const title =
                doc.businessID || doc.addressProof || doc.photoID || "Document";
              const number =
                doc.businessIDNo || doc.addressProofNo || doc.photoIDNo;

              if (!assetId) return null;

              return (
                <div
                  key={idx}
                  className="tw:flex tw:items-center tw:gap-2 tw:p-2 tw:border tw:border-gray-100 tw:bg-white tw:rounded-lg tw:hover:tw:border-blue-200 tw:transition-colors tw:cursor-pointer"
                  onClick={() => openPreview(assetId)}
                >
                  <div className="tw:w-10 tw:h-10 tw:bg-gray-100 tw:rounded-md tw:overflow-hidden tw:flex-shrink-0">
                    <ImgRender
                      assetId={assetId}
                      className="tw:w-full tw:h-full tw:object-cover"
                    />
                  </div>
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:text-[10px] tw:font-bold tw:text-gray-900 tw:truncate">
                      {title}
                    </div>
                    {number && (
                      <div className="tw:text-[9px] tw:text-gray-500 tw:mt-0.5 tw:truncate">
                        No: {number}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="tw:text-[10px] tw:text-gray-400 tw:py-2 tw:text-center">
            No KYC documents uploaded
          </p>
        )}
      </AppCard>

      {/* Uploaded Documents (new) */}
      {uploadedDocuments.length > 0 && (
        <AppCard>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <Upload className="tw:text-green-600" size={14} />
            <h3 className="tw:text-xs tw:font-bold tw:text-gray-800">
              Newly Uploaded
            </h3>
            <span className="tw:bg-green-100 tw:text-green-700 tw:text-[9px] tw:px-1.5 tw:py-0.5 tw:rounded-full tw:flex tw:items-center tw:gap-1">
              <CheckCircle2 size={8} />
              {uploadedDocuments.length}
            </span>
          </div>
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            {uploadedDocuments.map((doc, idx) => (
              <div
                key={idx}
                className="tw:relative tw:flex tw:items-center tw:gap-2 tw:p-2 tw:border tw:border-green-100 tw:bg-green-50 tw:rounded-lg"
              >
                <div
                  className="tw:w-10 tw:h-10 tw:bg-gray-100 tw:rounded-md tw:overflow-hidden tw:flex-shrink-0 tw:cursor-pointer"
                  onClick={() => openPreview(doc.frontImage)}
                >
                  <ImgRender
                    assetId={doc.frontImage}
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:text-[10px] tw:font-bold tw:text-gray-900 tw:truncate">
                    {doc.documentType}
                  </div>
                  <div className="tw:text-[9px] tw:text-gray-500 tw:mt-0.5 tw:truncate">
                    No: {doc.referenceNo}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveUploaded(idx)}
                  className="tw:absolute tw:top-1 tw:right-1 tw:w-4 tw:h-4 tw:bg-red-100 tw:text-red-500 tw:rounded-full tw:flex tw:items-center tw:justify-center hover:tw:bg-red-200 tw:transition-colors"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Upload Button */}
      <AppButton
        onClick={() => setShowUploadModal(true)}
        color="primary"
        fill="outline"
        className="tw:w-full tw:justify-center tw:h-9 tw:text-xs tw:font-bold"
      >
        <Upload size={14} className="tw:mr-2" />
        Upload KYC Document
      </AppButton>

      {imgPreviewModal.show && (
        <ImgPreviewModal
          show={imgPreviewModal.show}
          callback={handleImgPreviewModalCallback}
          images={imgPreviewModal.images}
        />
      )}

      <DocumentsUploadModal
        show={showUploadModal}
        callback={handleUploadCallback}
        onClose={() => setShowUploadModal(false)}
        title="Upload KYC Document"
        showSubmitButton={true}
      />
    </div>
  );
};

export default KycVerificationSection;
