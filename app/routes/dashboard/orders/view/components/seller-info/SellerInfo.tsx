import AppCard from "~/components/core/card/AppCard";
import { useTranslation } from "react-i18next";
import { Mail, MapPin, Phone } from "lucide-react";

const SellerInfo = ({ data }: { data: any }) => {
  const { t } = useTranslation();

  return (
    <AppCard className="mb-4" title={t("sellerInfo")} icon="user">
      <div className="tw:font-medium tw:mb-2">
        {data?.franchiseName || "N/A"}
      </div>

      {data?.mobile && (
        <div className="tw:flex tw:gap-2 tw:text-slate-500 tw:items-center tw:mb-2">
          <Phone size={12} />
          <span className="tw:text-xs">{data?.mobile || "N/A"}</span>
        </div>
      )}

      {data?.email && (
        <div className="tw:flex tw:gap-2 tw:text-slate-500 tw:items-center tw:mb-2">
          <Mail size={12} />
          <span className="tw:text-xs">{data.email}</span>
        </div>
      )}

      {/* Display delivery address if available */}
      {data?.address && (
        <div className="tw:flex tw:gap-2 tw:text-slate-500 tw:mb-2">
          <MapPin size={12} className="tw:mt-1" />
          <span className="tw:text-xs tw:flex-1">
            {[
              data?.address?.addressLine1,
              data?.address?.addressLine2,
              data?.address?.city,
              data?.address?.state,
              data?.address?.pincode,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
      )}
    </AppCard>
  );
};

export default SellerInfo;
