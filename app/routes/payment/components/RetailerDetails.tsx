import React from "react";

interface RetailerDetailsProps {
  parentDetails: {
    name?: string;
    address?: {
      full_address?: string;
    };
    OwnerMobileNo?: string;
    _id?: string;
  } | null;
}

const RetailerDetails: React.FC<RetailerDetailsProps> = ({ parentDetails }) => {
  return (
    <div className="tw:bg-gray-100 tw:p-6 tw:rounded-md tw:shadow-lg tw:space-y-6">
      <h3 className="tw:!text-xl tw:font-bold tw:mb-4">
        Request Order Details
      </h3>
      <p className="tw:text-gray-700 tw:mb-6">
        By selecting "Request Order," you can place an order without making an
        immediate payment. This option is ideal for situations where you need
        flexibility .
      </p>
      <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:lg:gap-6 tw:gap-4">
        <div>
          <p className="tw:text-gray-600 tw:font-medium">Retailer Name:</p>
          <p className="tw:text-gray-900 tw:font-semibold">
            {parentDetails?.name || "N/A"}
          </p>
        </div>
        <div>
          <p className="tw:text-gray-600 tw:font-medium">Mobile Number:</p>
          <p className="tw:text-gray-900 tw:font-semibold">
            {parentDetails?.OwnerMobileNo || "N/A"}
          </p>
        </div>
        <div>
          <p className="tw:text-gray-600 tw:font-medium">FID:</p>
          <p className="tw:text-gray-900 tw:font-semibold">
            {parentDetails?._id || "N/A"}
          </p>
        </div>
        <div>
          <p className="tw:text-gray-600 tw:font-medium">Address:</p>
          <p className="tw:text-gray-900 tw:font-semibold">
            {parentDetails?.address?.full_address || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetailerDetails;
