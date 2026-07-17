import { Eye, Building2, Phone } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface Props {
  row: Record<string, any>;
  callback?: (args: { action: string; data?: any }) => void;
}

const VendorMobileItem: React.FC<Props> = ({ row }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard noPadding className="tw:mb-0">
      {/* Vendor Name and ID */}
      <div className="tw:px-4 tw:py-4 tw:border-b tw:border-gray-200">
        <div className="tw:font-medium tw:text-base tw:text-gray-900">
          {row.isSellerOrder ? (
            <div>{row?.from?.name}</div>
          ) : (
            <AppLink
              href={`/dashboard/vendor/view/${row?.from?.id}`}
              className="tw:font-semibold tw:block tw:line-clamp-2"
              asLink
            >
              {row?.from?.name}
            </AppLink>
          )}
          <div className="tw:flex tw:gap-2 tw:items-center">
            <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
              {t("id")} : {row?.from?.refId ?? "-"}
            </div>
            {row?.from?.mobile && (
              <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:flex tw:items-center tw:gap-1">
                <Phone size={12} />
                {row?.from?.mobile || "-"}
                {row._vendorType && (
                  <span className="tw:ml-2">
                    <VendorTypeBadge
                      type={row._vendorType}
                      color={row._vendorTypeColor}
                      description={row._vendorTypeInfo}
                      className="tw:text-[10px]"
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="tw:px-4 tw:py-4">
        <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:items-center tw:mb-2">
          <KeyValue label={t("receivedQty")} size="sm">
            <span className="tw:text-green-600 tw:font-bold">
              {row.totalReceivedQty ?? row.quantity ?? 0}
            </span>
          </KeyValue>

          <KeyValue label={t("receivedValue")} size="sm">
            <Amount
              value={row.totalReceivedValue ?? 0}
              className="tw:text-green-500 tw:font-semibold"
            />
          </KeyValue>

          <KeyValue label={t("lastReceivedDate")} size="sm">
            {row.lastReceived ? (
              <DateFormat value={row.lastReceived} formatStr="dd MMM yyyy" />
            ) : (
              "-"
            )}
          </KeyValue>
        </div>
      </div>
    </AppCard>
  );
};

export default VendorMobileItem;
