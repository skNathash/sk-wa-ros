import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";

type VendorInfoProps = {
  vendor:
    | {
        id?: string;
        name?: string;
        _id?: string;
        redirectionUrl?: string;
        vendorType?: string;
        vendorTypeColor?: string;
      }
    | null
    | undefined;
};

const VendorInfo = ({ vendor }: VendorInfoProps) => {
  const { t } = useTranslation(["common"]);

  if (!vendor?.id) return null;

  return (
    <div className="tw:text-xs tw:text-gray-600 tw:mt-1 tw:flex tw:items-center tw:gap-1">
      <span className="tw:text-slate-500 tw:mr-1 tw:flex tw:items-center tw:gap-1">
        <Building2 size={14} />
        {t("vendor")}:
      </span>
      <div className="tw:flex tw:items-center tw:gap-1">
        {vendor.redirectionUrl ? (
          <AppLink href={vendor.redirectionUrl} asLink>
            {vendor.name || vendor.id}
          </AppLink>
        ) : (
          <span>{vendor.name || vendor.id}</span>
        )}
        {vendor.vendorType ? (
          <AppBadge variant={vendor.vendorTypeColor as any}>
            {vendor.vendorType}
          </AppBadge>
        ) : null}
      </div>
    </div>
  );
};

export default VendorInfo;
