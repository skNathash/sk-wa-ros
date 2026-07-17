import React from "react";
import DocumentSection from "./DocumentSection";

interface RawAddress {
  addressProof?: string;
  addressProofNo?: string;
  addressProofFile?: string;
  documentFace?: string;
}

interface AddressProps {
  data?: RawAddress[];
  onRefresh?: () => void;
}

const Address: React.FC<AddressProps> = ({ data, onRefresh }) => {
  return (
    <DocumentSection
      data={data as any}
      title="Address Documents"
      nameKey="addressProof"
      noKey="addressProofNo"
      fileKey="addressProofFile"
      statusKey="addressProofIdStatus"
      remarksKey="addressProofComment"
      storageKey="address"
      useSwiper={true}
      onRefresh={onRefresh}
    />
  );
};

export default Address;
