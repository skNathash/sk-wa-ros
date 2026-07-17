import { BriefcaseBusiness, Mail, MapPin, Phone } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { useTranslation } from "react-i18next";

const MoreInfo = ({ data }: { data: any }) => {
  const { t } = useTranslation();
  return (
    <AppCard>
      <div className="tw:flex tw:gap-2 tw:mb-4">
        <BriefcaseBusiness size={16} className="tw:text-blue-500 tw:mt-1" />
        <div>
          <span className="tw:font-medium tw:text-sm">
            {t("primaryBusiness")}
          </span>
          <div className="tw:text-sm tw:text-gray-500">
            {data.primaryBusiness || "--"}
          </div>
        </div>
      </div>

      <div className="tw:flex tw:gap-2 tw:mb-4">
        <MapPin size={16} className="tw:text-blue-500 tw:mt-1" />
        <div>
          <span className="tw:font-medium tw:text-sm">{t("address")}</span>
          <div className="tw:text-sm tw:text-gray-500">
            {data.addressLine1} {data.addressLine2}
            <div className="tw:text-xs tw:text-gray-500">
              {data.district}, {data.state} - {data.pincode}
            </div>
          </div>
        </div>
      </div>

      <div className="tw:flex tw:gap-2">
        <MapPin size={16} className="tw:text-blue-500 tw:mt-1" />
        <div>
          <span className="tw:font-medium tw:text-sm">
            {t("contactPerson")}
          </span>
          <div className="tw:text-sm tw:text-gray-500 tw:mb-1">
            {data.ownerDetails?.name || data.name}
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:mb-1">
            <Phone size={12} className="tw:text-gray-500" /> {data.mobile}
          </div>
          {data.email && (
            <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
              <Mail size={12} className="tw:text-gray-500" /> {data.email}
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default MoreInfo;
