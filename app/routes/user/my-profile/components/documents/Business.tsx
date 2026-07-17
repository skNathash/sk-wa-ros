import React from "react";
import DocumentSection from "./DocumentSection";

interface RawBusiness {
  businessID?: string;
  businessIDNo?: string;
  businessIDFile?: string;
  documentFace?: string;
}

interface BusinessProps {
  data?: RawBusiness[];
  onRefresh?: () => void;
}

const Business: React.FC<BusinessProps> = ({ data, onRefresh }) => {
  return (
    <DocumentSection
      data={data as any}
      title="Business Documents"
      nameKey="businessID"
      noKey="businessIDNo"
      fileKey="businessIDFile"
      storageKey="business"
      onRefresh={onRefresh}
      statusKey="businessIDStatus"
      remarksKey="businessIDComment"
    />
  );
};

export default Business;
