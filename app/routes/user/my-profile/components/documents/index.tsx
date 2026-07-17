import { Upload } from "lucide-react";
import { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DocumentSubmissionModal from "~/routes/user/my-profile/modals/DocumentSubmissionModal";
import Address from "./Address";
import Business from "./Business";
import Id from "./Id";

interface DocumentsProps {
  className?: string;
  documents?: {
    address?: Array<{
      addressProof?: string;
      addressProofNo?: string;
      addressProofFile?: string;
      documentFace?: string;
    }>;
    photo?: Array<{
      photoID?: string;
      photoIDNo?: string;
      photoIDFile?: string;
      documentFace?: string;
    }>;
    business?: Array<{
      businessID?: string;
      businessIDNo?: string;
      businessIDFile?: string;
      documentFace?: string;
    }>;
  };
  onRefresh?: () => void;
}

const Documents: React.FC<DocumentsProps> = ({
  className,
  documents,
  onRefresh,
}) => {
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);

  const handleSubmissionCallback = (data: any) => {
    // close modal on any action; trigger refresh if submission succeeded
    setShowSubmissionModal(false);
    if (data && data.action === "success") {
      onRefresh && onRefresh();
    }
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
        <div className="tw:mb-2">
          <div className="tw:text-lg tw:font-medium">
            Your Store Documents{" "}
            <span className="tw:text-red-500 tw:font-bold">*</span>{" "}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:font-normal tw:mb-3">
            Manage your submitted documents
          </div>
        </div>
        <AppButton
          size="small"
          color="primary"
          onClick={() => setShowSubmissionModal(true)}
        >
          <Upload />
          Upload
        </AppButton>
      </div>

      <Address data={documents?.address} onRefresh={onRefresh} />
      <Business data={documents?.business} onRefresh={onRefresh} />
      <Id data={documents?.photo} onRefresh={onRefresh} />

      <DocumentSubmissionModal
        show={showSubmissionModal}
        callback={handleSubmissionCallback}
        onClose={() => setShowSubmissionModal(false)}
      />
    </>
  );
};

export default Documents;
