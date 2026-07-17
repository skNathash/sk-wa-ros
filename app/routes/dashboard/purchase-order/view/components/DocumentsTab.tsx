import { useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { AlertTriangle, CreditCard, File } from "lucide-react";

interface DocumentsTabProps {
  invoiceDetails?: {
    documentAssetIds?: string[];
  };
  paymentSummary?: Array<{
    proofs?: string[];
    amount?: number;
    paymentDate?: string;
    paymentMethod?: string;
  }>;
  damagedImages?: string[];
}

const DocumentsTab = ({
  invoiceDetails,
  paymentSummary,
  damagedImages,
}: DocumentsTabProps) => {
  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const handleViewImages = (images: string[]) => {
    if (images && images.length > 0) {
      const formattedImages = images.map((assetId) => ({ id: assetId }));
      setImgPreviewModal({ show: true, images: formattedImages });
    }
  };

  const imgPreviewModalCallback = (event: { action: string; data?: any }) => {
    if (event.action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  // Check if there are any documents to show
  const hasInvoiceDocs =
    invoiceDetails?.documentAssetIds &&
    invoiceDetails.documentAssetIds.length > 0;
  const hasPaymentProofs =
    paymentSummary &&
    paymentSummary.some(
      (payment) => payment.proofs && payment.proofs.length > 0
    );
  const hasDamagedImages = damagedImages && damagedImages.length > 0;

  if (!hasInvoiceDocs && !hasPaymentProofs && !hasDamagedImages) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-12 tw:text-gray-500">
        <File className="tw:text-4xl tw:mb-2" />
        <div>No documents found</div>
        <div className="tw:text-xs tw:mt-1">
          This purchase order doesn't have any attached documents.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Invoice Documents */}
      {hasInvoiceDocs && (
        <AppCard title="Invoice Documents" className="tw:mb-6">
          <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:gap-4">
            {invoiceDetails?.documentAssetIds?.map((assetId, index) => (
              <div
                key={assetId}
                className="tw:cursor-pointer tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden tw:hover:border-blue-300 tw:transition-colors"
                onClick={() => handleViewImages([assetId])}
              >
                <ImgRender
                  assetId={assetId}
                  alt={`Invoice Document ${index + 1}`}
                  className="tw:w-full tw:h-32 tw:object-cover"
                />
                <div className="tw:p-2 tw:bg-gray-50">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <File className="tw:text-blue-500 tw:text-sm" />
                    <span className="tw:text-xs tw:font-medium tw:text-gray-700">
                      Invoice {index + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Payment Proofs */}
      {hasPaymentProofs && (
        <AppCard title="Payment Proofs" className="tw:mb-6">
          {paymentSummary.map(
            (payment, paymentIndex) =>
              payment.proofs &&
              payment.proofs.length > 0 && (
                <div key={paymentIndex} className="tw:mb-4 tw:last:mb-0">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:p-2 tw:bg-gray-50 tw:rounded">
                    <CreditCard className="tw:text-green-500" />
                    <span className="tw:text-sm tw:font-medium">
                      Payment {paymentIndex + 1}
                    </span>
                    {payment.amount && (
                      <span className="tw:text-xs tw:text-gray-500">
                        (₹{payment.amount.toLocaleString()})
                      </span>
                    )}
                    {payment.paymentMethod && (
                      <span className="tw:text-xs tw:text-gray-500">
                        - {payment.paymentMethod}
                      </span>
                    )}
                  </div>
                  <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:gap-4">
                    {payment.proofs.map((assetId, proofIndex) => (
                      <div
                        key={assetId}
                        className="tw:cursor-pointer tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden tw:hover:border-green-300 tw:transition-colors"
                        onClick={() => handleViewImages([assetId])}
                      >
                        <ImgRender
                          assetId={assetId}
                          alt={`Payment Proof ${proofIndex + 1}`}
                          className="tw:w-full tw:h-32 tw:object-cover"
                        />
                        <div className="tw:p-2 tw:bg-gray-50">
                          <div className="tw:flex tw:items-center tw:gap-1">
                            <File className="tw:text-green-500 tw:text-sm" />
                            <span className="tw:text-xs tw:font-medium tw:text-gray-700">
                              Proof {proofIndex + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </AppCard>
      )}

      {/* Damaged Images */}
      {hasDamagedImages && (
        <AppCard title="Damaged Items Images" className="tw:mb-6">
          <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-4 tw:lg:grid-cols-5 tw:gap-4">
            {damagedImages.map((assetId, index) => (
              <div
                key={assetId}
                className="tw:cursor-pointer tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden tw:hover:border-red-300 tw:transition-colors"
                onClick={() => handleViewImages([assetId])}
              >
                <ImgRender
                  assetId={assetId}
                  alt={`Damaged Item ${index + 1}`}
                  className="tw:w-full tw:h-32 tw:object-cover"
                />
                <div className="tw:p-2 tw:bg-gray-50">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <AlertTriangle className="tw:text-red-500 tw:text-sm" />
                    <span className="tw:text-xs tw:font-medium tw:text-gray-700">
                      Damaged {index + 1}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AppCard>
      )}

      {/* Image Preview Modal */}
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
      />
    </>
  );
};

export default DocumentsTab;
