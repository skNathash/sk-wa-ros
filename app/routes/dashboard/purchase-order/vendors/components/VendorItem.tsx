import { Mail, MapPin, Phone } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import VendorBrandChip from "~/shared/vendor/components/vendor-brand-chip/VendorBrandChip";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import { useTranslation } from "react-i18next";

interface VendorItemProps {
  vendor: any;
  callback: (a: { action: string; data: any }) => void;
}

const VendorItem: React.FC<VendorItemProps> = ({ vendor, callback }) => {
  const { t } = useTranslation(["common"]);
  const handleViewVendor = (e: React.MouseEvent) => {
    e.stopPropagation();
    callback({ action: "viewVendor", data: vendor });
  };

  return (
    <div
      className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-4 tw:bg-white tw:border tw:border-gray-200 tw:p-4 tw:rounded-md tw:mb-4 tw:hover:border-primary tw:hover:shadow-lg tw:transition-all tw:duration-300 tw:cursor-pointer"
      onClick={handleViewVendor}
    >
      <div>
        <div className="tw:font-semibold tw:text-base tw:mb-1">
          <AppLink
            asLink
            href={`/dashboard/vendor/view/${vendor._id}`}
            className="tw:text-primary tw:hover:text-primary-dark"
          >
            {vendor.name}
          </AppLink>
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:text-xs tw:text-slate-500 tw:mb-1 tw:flex tw:gap-2 tw:items-center">
            {t("id")}: {vendor.vendorId}
            {vendor._vendorType ? (
              <VendorTypeBadge
                type={vendor._vendorType}
                color={vendor._vendorTypeColor}
                description={vendor._vendorTypeInfo}
                className="tw-ml-2"
              />
            ) : null}
          </div>
          {/* <div className="tw:text-xs tw:text-slate-500 tw:mb-1">
            <AppBadge
              variant={vendor.status === "Pending" ? "warning" : "success"}
            >
              {vendor.status === "Pending"
                ? t("pending")
                : vendor.status === "Active"
                ? t("active")
                : t("inactive")}
            </AppBadge>
          </div> */}
        </div>
      </div>

      <div className="tw:space-y-1">
        <p className="tw:text-sm tw:text-slate-600 tw:flex tw:items-center tw:gap-1">
          <Phone size={10} />
          {vendor.contact?.[0]?.mobile}
        </p>
        {vendor.contact?.[0]?.email && (
          <p className="tw:text-sm tw:text-slate-600 tw:flex tw:items-center tw:gap-1">
            <Mail size={12} />
            {vendor.contact?.[0]?.email}
          </p>
        )}
        <p className="tw:text-xs tw:text-slate-600 tw:flex tw:gap-1 tw:line-clamp-2">
          <MapPin size={12} className="tw:mt-1.5" />
          <span className="tw:flex-1 tw:line-clamp-3">
            {vendor._fullAddress}
          </span>
        </p>
      </div>

      <div className="tw:self-center">
        <VendorBrandChip
          sourceAllBrands={vendor.sourceAllBrands}
          sourceableBrands={vendor.sourceableBrands}
        />
      </div>

      <div className="tw:grid tw:grid-cols-2 tw:gap-2">
        <KeyValue label={t("pendingPo")} size="sm">
          <span className="tw:text-red-600 tw:font-medium">
            {vendor?.summary?.pendingPo ?? 0}
          </span>
        </KeyValue>
        <KeyValue label={t("lastPo")} size="sm">
          {vendor?.summary?.lastPoDate ? (
            <DateFormat
              value={vendor?.summary?.lastPoDate}
              formatStr="dd MMM yyyy"
              className="tw:font-medium"
            />
          ) : (
            "--"
          )}
        </KeyValue>
      </div>
    </div>
  );
};

export default VendorItem;
