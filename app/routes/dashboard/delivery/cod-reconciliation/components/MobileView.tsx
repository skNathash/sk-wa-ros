import React from "react";
import Amount from "~/components/core/amount/Amount";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import { Calendar } from "lucide-react";

interface MobileViewProps {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  tab?: string;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  callback,
  tab,
}) => {
  const { t } = useTranslation(["common"]);
  if (loading) {
    return (
      <div className="tw:space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-32 tw:rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        {t("noDataFound")}
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((row, idx) => (
        <AppCard key={row._id || idx} noPadding className="tw:mb-0">
          {/* Header with ID, Date and Status */}
          <div className="tw:flex tw:justify-between tw:items-start tw:p-4">
            <div className="tw:flex tw:flex-col">
              <div className="tw:font-medium tw:text-gray-900 tw:mb-1">
                {row.settlementId}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                <Calendar size={16} />
                <DateFormat
                  value={row.createdAt}
                  formatStr="dd MMM yyyy, hh:mm a"
                />
              </div>
            </div>
            <AppBadge
              variant={
                row.status === "Settled"
                  ? "success"
                  : row.status === "SettlementInitiated"
                    ? "warning"
                    : "default"
              }
            >
              {row.status}
            </AppBadge>
          </div>

          <Divider className="tw:my-1!" />

          {/* Order ID and Value */}
          <div className="tw:p-4">
            <div className="tw:flex">
              <div className="tw:w-[70%]">
                <KeyValue label="Order ID" size="sm">
                  <AppLink
                    href={`/dashboard/orders/view/${row.orderId}`}
                    asLink
                    showLinkColor
                  >
                    {row.orderRefId}
                  </AppLink>
                </KeyValue>
              </div>
              <KeyValue label="Value" size="sm">
                <Amount
                  value={row.totalAmount}
                  decimalPlaces={2}
                  className="tw:font-semibold"
                />
              </KeyValue>
            </div>

            <div className="tw:flex tw:mt-3">
              <KeyValue
                label="Collection Info"
                size="sm"
                className="tw:w-[70%]"
              >
                <AppLink
                  href={`/dashboard/employee/view/${row.shipmentUserInfo?.id}`}
                  asLink
                  showLinkColor
                >
                  {row.shipmentUserInfo?.name || "-"}
                </AppLink>
              </KeyValue>
              {row.status === "SettlementInitiated" ? (
                <AppButton
                  type="button"
                  onClick={() => callback({ action: "handover", data: row })}
                  size="small"
                >
                  {t("handover")}
                </AppButton>
              ) : (
                <KeyValue label="Settled On" size="sm">
                  {row.settledOn ? (
                    <div className="tw:flex tw:flex-col tw:gap-0.5">
                      <DateFormat
                        value={row.settledOn}
                        formatStr="dd MMM yyyy"
                      />
                      <DateFormat
                        value={row.settledOn}
                        formatStr="hh:mm a"
                        className="tw:text-xs tw:text-gray-500"
                      />
                    </div>
                  ) : (
                    "-"
                  )}
                </KeyValue>
              )}
            </div>
          </div>

          {/* Name and Action or Date */}
        </AppCard>
      ))}
    </div>
  );
};

export default MobileView;
