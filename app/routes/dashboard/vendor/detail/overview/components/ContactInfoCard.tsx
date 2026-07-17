import { Mail, MapPin, Phone, Tags, User } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";

interface ContactInfoCardProps {
  data: {
    contactPerson: string;
    email: string;
    phone: string;
    address: string;
    categories: string[];
  };
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ data }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard title={t("vendorDetails")} icon="user">
      <div className="tw:flex tw:flex-col tw:gap-4 tw:text-sm">
        <div className="tw:flex tw:gap-2 tw:items-start">
          <User size={16} className="tw:text-slate-500" />
          <span className="tw:flex-1">{data.contactPerson || t("nA")}</span>
        </div>
        {data.email ? (
          <div className="tw:flex tw:gap-2 tw:items-start">
            <Mail size={16} className="tw:text-slate-500" />
            <span className="tw:flex-1">{data.email || t("nA")}</span>
          </div>
        ) : null}
        <div className="tw:flex tw:gap-2 tw:items-start">
          <Phone size={16} className="tw:text-slate-500" />
          <span className="tw:flex-1">{data.phone || t("nA")}</span>
        </div>
        <div className="tw:flex tw:gap-2 tw:items-start">
          <MapPin size={16} className="tw:text-slate-500" />
          <span className="tw:max-w-xs tw:flex-1 tw:text-gray-500">
            {data.address || "--"}
          </span>
        </div>
        {/* <div className="tw:flex tw:gap-2 tw:items-start">
          <Tags size={16} className="tw:text-slate-500" />
          <span className="tw:text-right tw:max-w-xs">
            {data.categories?.join(", ")}
          </span>
        </div> */}
      </div>
    </AppCard>
  );
};

export default ContactInfoCard;
