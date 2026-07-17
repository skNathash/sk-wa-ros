import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import AppBadge from "~/components/core/badge/AppBadge";
import { Calendar, ChevronDown } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import clsx from "clsx";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data = [],
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);

  const [viewMore, setViewMore] = useState(false);

  if (loading) {
    return (
      <div className="tw:p-4">
        <div className="tw:text-center">{t("loading") || "Loading..."}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:p-4">
        <div className="tw:text-center">
          {t("noDataFound") || "No data found"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {data.map((row, idx) => (
        <div
          key={row._id || idx}
          className={clsx(
            "tw:flex tw:items-center tw:justify-between tw:py-3 tw:px-4",
            {
              "tw:hidden": idx >= 2 && !viewMore,
              "tw:bg-gray-50": idx % 2 === 0,
            }
          )}
        >
          <div className="tw:flex-1">
            {/* PO ID and Badge */}
            <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
              <AppLink
                asLink
                href={`/dashboard/purchase-order/view/${
                  row._id || row.poObjId || row.poId
                }`}
                className="tw:text-blue-600 tw:font-medium tw:text-sm"
              >
                {row.poId}
              </AppLink>
              {(row._statusLbl ||
                row.receivedStatus ||
                row.status ||
                row.statusLabel) && (
                <AppBadge variant={(row._statusColor as any) || "success"}>
                  {row._statusLbl || "--"}
                </AppBadge>
              )}
            </div>
            {/* Date */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                <Calendar size={12} />
                <DateFormat value={row.poDate} formatStr="d MMM yyyy, h:mm a" />
              </div>
            </div>
          </div>

          {/* Right side - quantity and price */}
          <div className="tw:text-right tw:text-sm">
            <div className="tw:text-gray-600 tw:mb-1">
              {t("quantity")}:{" "}
              <span className="tw:font-semibold tw:text-gray-900">
                {row.quantity}
              </span>
            </div>
            <div className="tw:text-gray-600">
              {t("totalValue")}:{" "}
              <span className="tw:font-semibold tw:text-green-600">
                <Amount value={row.purchasePrice ?? 0} decimalPlaces={0} />
              </span>
            </div>
          </div>
        </div>
      ))}

      {data.length > 2 && (
        <div className="tw:text-center tw:py-2">
          <AppButton
            fill="clear"
            onClick={() => setViewMore((prev) => !prev)}
            className="tw:text-primary"
          >
            {viewMore ? t("viewLess") : t("viewMore")}
            <ChevronDown
              size={16}
              className={clsx({
                "tw:rotate-180": viewMore,
              })}
            />
          </AppButton>
        </div>
      )}
    </div>
  );
};

export default MobileView;
