import React from "react";

type Props = {
  type?: string | null;
};

const UserBadgeType: React.FC<Props> = ({ type }) => {
  const normalized = (type || "").trim().toLowerCase();

  let label = type || "N/A";
  let typeClass = "tw:bg-gray-50 tw:text-gray-600 tw:border tw:border-gray-200";

  if (normalized === "sk seller" || normalized === "skseller") {
    label = "SK Seller";
    typeClass =
      "tw:bg-purple-50 tw:text-purple-700 tw:border tw:border-purple-200";
  } else if (normalized === "sk buyer" || normalized === "skbuyer") {
    label = "SK Buyer";
    typeClass =
      "tw:bg-green-50 tw:text-green-700 tw:border tw:border-green-200";
  } else if (normalized === "sk retailer" || normalized === "skretailer") {
    label = "SK Retailer";
    typeClass =
      "tw:bg-amber-50 tw:text-amber-700 tw:border tw:border-amber-200";
  } else if (normalized === "sf seller" || normalized === "sfseller") {
    label = "SK Retailer";
    typeClass =
      "tw:bg-amber-50 tw:text-amber-700 tw:border tw:border-amber-200";
  } else if (normalized === "sk master" || normalized === "skmaster") {
    label = "SK Master";
    typeClass = "tw:bg-blue-50 tw:text-blue-700 tw:border tw:border-blue-200";
  } else if (normalized === "sk vendor" || normalized === "skvendor") {
    label = "SK Vendor";
    typeClass =
      "tw:bg-indigo-50 tw:text-indigo-700 tw:border tw:border-indigo-200";
  }

  return (
    <div
      className={`tw:text-[10px] tw:font-medium tw:px-1.5 tw:py-0.5 tw:rounded tw:truncate tw:min-w-0 tw:inline-block ${typeClass}`}
      title={label}
    >
      {label}
    </div>
  );
};

export default UserBadgeType;
