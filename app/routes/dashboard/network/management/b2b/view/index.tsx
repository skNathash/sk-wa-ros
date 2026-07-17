import React from "react";
import { useParams } from "react-router";

const B2BViewPage: React.FC = () => {
  const { id } = useParams();
  // TODO: Fetch retailer details using id
  return (
    <div className="tw-p-6">
      <h1 className="tw-text-2xl tw-font-bold tw-mb-4">B2B Retailer Details</h1>
      <div>Retailer ID: {id}</div>
      {/* Render retailer details here */}
    </div>
  );
};

export default B2BViewPage;
