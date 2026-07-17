import React from "react";
import DocumentSection from "./DocumentSection";

interface RawDoc {
  photoID?: string;
  photoIDNo?: string;
  photoIDFile?: string;
  documentFace?: string;
}

interface IdProps {
  data?: RawDoc[];
  onRefresh?: () => void;
}

const Id: React.FC<IdProps> = ({ data, onRefresh }) => {
  return (
    <DocumentSection
      data={data as any}
      title="ID Documents"
      nameKey="photoID"
      noKey="photoIDNo"
      fileKey="photoIDFile"
      storageKey="photo"
      onRefresh={onRefresh}
      statusKey="photoIdStatus"
      remarksKey="photoIDComment"
    />
  );
};

export default Id;
