import React from "react";
import UserBadgeType from "./UserBadgeType";

interface UserBadgeForItemProps {
  networkType?: string;
  subType?: string;
}

const UserBadgeForItem: React.FC<UserBadgeForItemProps> = ({
  networkType,
  subType,
}) => {
  let typeLabel = subType || "N/A";

  if (networkType === "SKSELLER") {
    typeLabel = "SK Seller";
  } else if (networkType === "SKBUYER") {
    typeLabel = "SK Buyer";
  } else if (networkType === "SKRETAILER") {
    typeLabel = "SK Retailer";
  } else if (networkType === "SFSELLER") {
    typeLabel = "SF Seller";
  } else if (networkType === "SKMASTER") {
    typeLabel = "SK Master";
  } else if (networkType === "SKVENDOR") {
    typeLabel = "SK Vendor";
  } else {
    // Fallback: show subtype as-is
    typeLabel = subType || "N/A";
  }

  return <UserBadgeType type={typeLabel} />;
};

export default UserBadgeForItem;
