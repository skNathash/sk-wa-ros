import {
  Building2,
  CircleAlert,
  CheckCircle2,
  Eye,
  IndianRupee,
  Mail,
  Phone,
  Truck,
  XCircle,
  MapPin,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import AppButton from "~/components/core/button/AppButton";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import Rbac from "~/components/core/rbac/Rbac";
import VendorBrandChip from "~/shared/vendor/components/vendor-brand-chip/VendorBrandChip";

const rbacRoles = {
  pay: ["ACCOUNTS.RECORD-PAYMENT"],
};

const DesktopView = ({
  item,
  callback,
  isSkSeller,
}: {
  item: Record<string, any>;
  callback: (a: { action: string; data: Record<string, any> }) => void;
  isSkSeller?: boolean;
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:grid tw:grid-cols-7 tw:border-b tw:border-gray-200 tw:p-4">
      <div className="tw:flex tw:gap-2 tw:col-span-3">
        <div>
          <span className="tw:bg-gray-100 tw:rounded-md tw:p-2 tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center">
            <Building2 size={20} className="tw:text-gray-500" />
          </span>
        </div>
        <div>
          <div className="tw:mb-2">
            <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between">
              <div className="tw:font-semibold tw:text-base tw:flex tw:items-center tw:gap-2 tw:mb-2">
                <AppLink
                  asLink={true}
                  href={`/dashboard/vendor/view/${item._id}`}
                  className="tw:text-inherit tw:no-underline hover:tw:underline"
                >
                  {item.name}
                </AppLink>
                {/* VendorTypeBadge moved next to ID */}
                {item._vendorType ? (
                  <VendorTypeBadge
                    type={item._vendorType}
                    color={item._vendorTypeColor}
                    description={item._vendorTypeInfo}
                  />
                ) : null}
              </div>
            </div>

            <div className="tw:text-xs tw:text-gray-500 tw:mb-2 tw:flex tw:items-center tw:gap-2">
              <span>
                <span className="tw:font-medium">ID: </span>
                <span className="tw:break-words">
                  {item.vendorId || item._id}
                </span>
              </span>
              {/* VendorTypeBadge moved to name */}
            </div>
          </div>

          {item._contact.email ? (
            <div className="tw:flex tw:gap-2 tw:items-center tw:mb-1">
              <Mail size={12} className="tw:text-gray-500" />
              <span className="tw:text-xs tw:text-gray-500">
                {item._contact.email || t("nA")}
              </span>
            </div>
          ) : null}

          <div className="tw:flex tw:gap-2 tw:items-center">
            <Phone size={12} className="tw:text-gray-500" />
            <span className="tw:text-xs tw:text-gray-500">
              {item._contact?.mobile}
            </span>
            {typeof item.isOtpVerified === "boolean" && (
              <span className="tw:ml-1 tw:flex tw:items-center tw:gap-1">
                {item.isOtpVerified ? (
                  <>
                    <CheckCircle2 size={14} className="tw:text-green-600" />
                    <span className="tw:text-green-600 tw:text-xs">
                      Verified
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="tw:text-orange-600" />
                    <span className="tw:text-orange-600 tw:text-xs">
                      Not verified
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      <div>
        <KeyValue label={t("totalPurchase")} size="sm">
          <div>
            <Amount
              value={item.summary?.totalPOValue || 0}
              decimalPlaces={2}
              className="tw:font-medium tw:mb-2 tw:block"
            />

            <KeyValue label={t("distance")} size="sm">
              <span className="tw:flex tw:items-center tw:gap-1">
                <MapPin size={12} className="tw:text-gray-500" />
                {item._distance ?? "--"} km
              </span>
            </KeyValue>
          </div>
        </KeyValue>
      </div>

      <div>
        <KeyValue label={t("brands")} size="sm">
          <VendorBrandChip
            sourceAllBrands={item.sourceAllBrands}
            sourceableBrands={item.sourceableBrands}
          />
        </KeyValue>
      </div>

      <div>
        <div>
          {item.summary?.pendingDeliveries > 0 && item.vendorType !== "OWN" && (
            <AppBadge variant="warning" className="tw:mb-2">
              <Truck size={16} className="tw:text-orange-800" />
              <span className="tw:text-orange-800">
                {item.summary?.pendingDeliveries || 0} {t("pendingDeliveries")}
              </span>
            </AppBadge>
          )}
        </div>
        {/* Payment Summary Badges */}
        {item.summary?.unpaidInvoices > 0 && item.vendorType !== "OWN" && (
          <AppBadge variant="danger">
            <CircleAlert size={16} className="tw:text-red-800" />
            <span className="tw:text-red-800">
              {item.summary?.unpaidInvoices || 0} {t("unpaid")}
            </span>
          </AppBadge>
        )}
      </div>

      <div className="tw:flex tw:justify-end">
        <AppButton
          color="light"
          fill="outline"
          size="small"
          onClick={() => callback({ action: "view", data: item })}
        >
          <Eye size={16} />
          <span>{t("view")}</span>
        </AppButton>
        {item.vendorType !== "OWN" && (
          <Rbac roles={rbacRoles.pay}>
            {item.summary?.unpaidInvoices > 0 && (
              <AppButton
                color="primary"
                fill="solid"
                size="small"
                className="tw:ml-2"
                onClick={() => callback({ action: "pay", data: item })}
              >
                <IndianRupee size={16} />
                <span>{t("pay")}</span>
              </AppButton>
            )}
          </Rbac>
        )}
      </div>
    </div>
  );
};

export default DesktopView;
