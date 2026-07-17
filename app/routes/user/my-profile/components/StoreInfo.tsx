import React from "react";
import ProfileAccordion from "./ProfileAccordion";
import KeyValue from "~/components/core/key-value/KeyValue";
import { MapPin, Edit } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

interface StoreDetails {
  storeName?: string;
  address?: string;
}

interface StoreInfoProps {
  profile: {
    storeDetails?: StoreDetails;
    finance_details?: { gstNo?: string };
    pan_no?: string;
    primary_business?: string;
    secondary_business?: string;
    name?: string;
  };
}

const StoreInfo: React.FC<StoreInfoProps & { onEdit?: () => void }> = ({
  profile,
  onEdit,
}) => {
  const {
    storeDetails,
    finance_details,
    pan_no,
    primary_business,
    secondary_business,
    name,
  } = profile || {};
  return (
    <ProfileAccordion title="Store Information" icon={<MapPin />}>
      <div className="tw:space-y-2 tw:relative">
        {onEdit && (
          <AppButton
            size="small"
            fill="clear"
            className="tw:absolute tw:top-0 tw:right-0"
            onClick={onEdit}
          >
            <Edit className="tw:text-base tw:mr-1" size={16} />
            Edit
          </AppButton>
        )}
        <KeyValue label="Store Name">
          {storeDetails?.storeName || name || "-"}
        </KeyValue>
        <KeyValue label="GST No">{finance_details?.gstNo || "-"}</KeyValue>
        <KeyValue label="PAN No">{pan_no || "-"}</KeyValue>
        <KeyValue label="Address">{storeDetails?.address || "-"}</KeyValue>
        <KeyValue label="Primary Business">{primary_business || "-"}</KeyValue>
        <KeyValue label="Secondary Business">
          {secondary_business || "-"}
        </KeyValue>
      </div>
    </ProfileAccordion>
  );
};

export default StoreInfo;
