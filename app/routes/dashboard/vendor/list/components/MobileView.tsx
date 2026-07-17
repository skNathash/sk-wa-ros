import {
  Building2,
  CircleAlert,
  CheckCircle2,
  Eye,
  IdCard,
  MapPin,
  Phone,
  Truck,
  XCircle,
  IndianRupee,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import { useTranslation } from "react-i18next";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import VendorBrandChip from "~/shared/vendor/components/vendor-brand-chip/VendorBrandChip";

const MobileView = ({
  item,
  callback,
  isSkSeller,
}: {
  item: Record<string, any>;
  callback: (a: { action: string; data: Record<string, any> }) => void;
  isSkSeller?: boolean;
}) => {
  const { t } = useTranslation(["common"]);

  const hasAlerts =
    item.summary?.pendingDeliveries > 0 || item.summary?.unpaidInvoices > 0;

  return (
    <AppCard className="tw:mb-4" noPadding={true}>
      {/* Identity + amount */}
      <div className="tw:flex tw:gap-3 tw:px-4 tw:py-4 tw:border-b tw:border-gray-200">
        {/* Avatar */}
        <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-gray-100 tw:text-gray-400">
          <Building2 size={22} />
        </div>

        {/* Identity */}
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1">
            <AppLink
              asLink={true}
              href={`/dashboard/vendor/view/${item._id}`}
              className="tw:min-w-0 tw:truncate tw:font-semibold tw:text-base tw:text-inherit tw:no-underline hover:tw:underline"
            >
              {item.name}
            </AppLink>
            {item._vendorType ? (
              <VendorTypeBadge
                type={item._vendorType}
                color={item._vendorTypeColor}
                description={item._vendorTypeInfo}
              />
            ) : null}
          </div>

          <div className="tw:mt-2 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-500">
            <IdCard size={14} className="tw:shrink-0 tw:text-gray-400" />
            <span className="tw:truncate">
              <span className="tw:text-gray-700">
                {t("id")}: {item.vendorId}
              </span>
              {item._contact?.email && (
                <>
                  <span className="tw:mx-1 tw:text-gray-300">·</span>
                  <span>{item._contact.email}</span>
                </>
              )}
            </span>
          </div>

          <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1">
            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-700">
              <Phone size={14} className="tw:shrink-0 tw:text-gray-400" />
              <span>{item._contact?.mobile || "--"}</span>
            </div>

            {typeof item.isOtpVerified === "boolean" &&
              (item.isOtpVerified ? (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:bg-green-50 tw:px-1.5 tw:py-0.5 tw:text-green-700">
                  <CheckCircle2 className="tw:h-3.5 tw:w-3.5" />
                  <span className="tw:text-[11px] tw:leading-none">
                    Verified
                  </span>
                </span>
              ) : (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded tw:bg-orange-50 tw:px-1.5 tw:py-0.5 tw:text-orange-700">
                  <XCircle className="tw:h-3.5 tw:w-3.5" />
                  <span className="tw:text-[11px] tw:leading-none">
                    Not verified
                  </span>
                </span>
              ))}
          </div>
        </div>

        {/* Amount + distance */}
        <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:text-right">
          <Amount
            value={item.summary?.totalPOValue || 0}
            decimalPlaces={2}
            className="tw:font-semibold tw:text-base tw:text-primary"
          />
          <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-0.5 tw:text-xs tw:text-gray-500">
            <MapPin size={12} className="tw:shrink-0 tw:text-red-500" />
            <span>{item._distance ?? "--"} km</span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="tw:flex tw:flex-wrap tw:gap-2 tw:px-4 tw:py-3 tw:border-b tw:border-gray-200">
          {item.summary?.pendingDeliveries > 0 && (
            <AppBadge variant="warning">
              <Truck size={16} className="tw:text-orange-800" />
              <span className="tw:text-orange-800">
                {item.summary?.pendingDeliveries || 0} {t("pendingDeliveries")}
              </span>
            </AppBadge>
          )}

          {item.summary?.unpaidInvoices > 0 && (
            <AppBadge variant="danger">
              <CircleAlert size={16} className="tw:text-red-800" />
              <span className="tw:text-red-800">
                {item.summary?.unpaidInvoices || 0} {t("unpaid")}
              </span>
            </AppBadge>
          )}
        </div>
      )}

      {/* Brands + actions */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
          <span className="tw:shrink-0 tw:text-xs tw:text-gray-500">
            {t("brands")}
          </span>
          <div className="tw:min-w-0 tw:overflow-hidden">
            <VendorBrandChip
              sourceAllBrands={item.sourceAllBrands}
              sourceableBrands={item.sourceableBrands}
            />
          </div>
        </div>

        <div className="tw:flex tw:shrink-0 tw:gap-2">
          {item.summary?.unpaidInvoices > 0 && (
            <AppButton
              color="primary"
              fill="solid"
              size="small"
              onClick={() => callback({ action: "pay", data: item })}
            >
              <IndianRupee size={16} />
              <span>{t("pay")}</span>
            </AppButton>
          )}

          <AppButton
            color="light"
            fill="outline"
            size="small"
            onClick={() => callback({ action: "view", data: item })}
          >
            <Eye size={16} />
            <span>{t("view")}</span>
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default MobileView;
