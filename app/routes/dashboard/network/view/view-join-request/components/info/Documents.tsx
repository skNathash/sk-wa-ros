import React from "react";
import { File } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";

interface Document {
  businessID?: string;
  businessIDNo?: string;
  businessIDFile?: string;
  documentFace?: string;
  addressProof?: string;
  addressProofNo?: string;
  addressProofFile?: string;
  photoID?: string;
  photoIDNo?: string;
  photoIDFile?: string;
}

interface DocumentsData {
  business?: Document[];
  address?: Document[];
  photo?: Document[];
}

interface DocumentsProps {
  documents: DocumentsData;
}

const Documents: React.FC<DocumentsProps> = ({ documents }) => {
  // Helper function to get GST document number
  const getDocumentNumber = (doc: Document) => {
    return doc.businessIDNo || doc.addressProofNo || doc.photoIDNo || "N/A";
  };

  // Helper function to get GST document file
  const getDocumentFile = (doc: Document) => {
    return doc.businessIDFile || doc.addressProofFile || doc.photoIDFile;
  };

  // Case-insensitive compare helper
  const equalsIgnoreCase = (a?: string, b?: string) =>
    (a || "").toLowerCase() === (b || "").toLowerCase();

  // Get only GST documents (from business/address/photo buckets)
  const getAllDocuments = (): Document[] => {
    const gstDocs: Document[] = [];

    if (documents.business) {
      gstDocs.push(
        ...documents.business.filter((d) =>
          equalsIgnoreCase(d.businessID, "GST")
        )
      );
    }
    if (documents.address) {
      gstDocs.push(
        ...documents.address.filter((d) =>
          equalsIgnoreCase(d.addressProof, "GST")
        )
      );
    }
    if (documents.photo) {
      gstDocs.push(
        ...documents.photo.filter((d) => equalsIgnoreCase(d.photoID, "GST"))
      );
    }

    return gstDocs;
  };

  const allDocuments = getAllDocuments();

  return (
    <AppCard
      title="Buyer GST Document"
      icon="file-text"
      iconClassName="tw:text-purple-600"
    >
      {allDocuments.length > 0 ? (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          {allDocuments.map((doc, index) => {
            const documentNumber = getDocumentNumber(doc);
            const documentFile = getDocumentFile(doc);

            return (
              <div
                key={index}
                className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-gray-50"
              >
                <div className="tw:flex tw:items-start tw:gap-3">
                  {/* Document Icon */}
                  <div className="tw:flex-shrink-0">
                    <div className="tw:w-10 tw:h-10 tw:bg-blue-100 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                      <File size={20} className="tw:text-blue-600" />
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="tw:flex-1 tw:min-w-0">
                    <h4 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-1">
                      GST Certificate
                    </h4>
                    <p className="tw:text-xs tw:text-gray-600 tw:mb-2">
                      Number: {documentNumber}
                    </p>
                  </div>

                  {/* Document Preview */}
                  {documentFile && (
                    <div className="tw:flex-shrink-0">
                      <div className="tw:w-16 tw:h-16 tw:bg-white tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200">
                        <ImgRender
                          assetId={documentFile}
                          alt="GST Certificate"
                          className="tw:w-full tw:h-full tw:object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="tw:text-center tw:py-8">
          <NoData />
          <p className="tw:text-gray-500 tw:text-sm tw:mt-2">
            No documents available
          </p>
        </div>
      )}
    </AppCard>
  );
};

export default Documents;
