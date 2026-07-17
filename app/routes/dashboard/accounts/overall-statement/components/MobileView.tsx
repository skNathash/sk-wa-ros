import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface StatementData {
  _id: string;
  paymentDate: string | Date;
  notes?: string;
  sourceReference?: string;
  statementType?: "credit" | "debit";
  amount?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  sourceType?: string;
  _sourceTypeLbl?: string;
  sourceVariantColor?: string;
  sourceRedirectionUrl?: string;
  [key: string]: any;
}

interface MobileViewProps {
  loading?: boolean;
  data: StatementData[];
  callback: (payload: { action: string; data?: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ loading, data, callback }) => {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="tw:space-y-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="tw:animate-pulse">
            <div className="tw:bg-gray-200 tw:h-32 tw:rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <div className="tw:space-y-4">
      {data.map((row, idx) => {
        const rowId = row._id || `row-${idx}`;
        const isExpanded = expandedItems.has(rowId);
        const hasVendorInfo =
          row._vendorInfo?.id ||
          (row.toParty?.type === "vendor" && row.toParty?.redirectionUrl);

        return (
          <AppLink
            key={rowId}
            className="tw:block"
            noUnderline
            asLink
            href={row.sourceRedirectionUrl}
          >
            <div
              onClick={(e) => {
                if (row.sourceType === "PAYMENT") {
                  e.preventDefault();
                  callback({ action: "viewPayment", data: row });
                }
              }}
            >
              <AppCard noPadding>
                {/* Header with Date and Statement Type */}
                <div className="tw:px-4 tw:pt-4 tw:pb-3">
                  <div className="tw:flex tw:justify-between tw:items-start">
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <Calendar size={16} className="tw:text-slate-400" />
                        <DateFormat
                          value={row.paymentDate}
                          formatStr="dd MMM yyyy"
                        />
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500">
                        <Clock size={14} className="tw:text-slate-400" />
                        <DateFormat
                          value={row.paymentDate}
                          formatStr="hh:mm a"
                        />
                      </div>
                    </div>
                    <div className="tw:flex tw:flex-col tw:gap-2 tw:items-end">
                      <AppBadge
                        variant={
                          row.statementType === "credit" ? "success" : "danger"
                        }
                        className="tw:text-xs"
                      >
                        {row.statementType?.toUpperCase() || "-"}
                      </AppBadge>
                      {row.sourceType && row._sourceTypeLbl && (
                        <AppBadge
                          variant={(row.sourceVariantColor as any) || "primary"}
                        >
                          {row._sourceTypeLbl}
                        </AppBadge>
                      )}
                    </div>
                  </div>
                </div>

                <Divider className="tw:!my-0" />

                {/* ID Section - Always visible above opening balance */}
                {row.sourceReference && (
                  <>
                    <div className="tw:px-4 tw:py-3">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <span className="tw:text-sm tw:text-slate-500 tw:font-medium">
                          ID:
                        </span>
                        <AppBadge
                          variant="light"
                          className="tw:font-mono tw:text-sm"
                        >
                          {row.sourceReference}
                        </AppBadge>
                      </div>
                    </div>
                    <Divider className="tw:!my-0" />
                  </>
                )}

                {/* Collapsible Description Section */}
                <div className="tw:px-4 tw:py-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpanded(rowId);
                    }}
                    className="tw:w-full tw:flex tw:items-start tw:justify-between tw:text-left tw:cursor-pointer tw:gap-2"
                  >
                    <p
                      className={`tw:text-sm tw:text-gray-700 tw:flex-1 tw:pr-2 ${
                        !isExpanded ? "tw:line-clamp-1" : "tw:leading-relaxed"
                      }`}
                    >
                      {row.notes || "-"}
                    </p>
                    <div className="tw:flex-shrink-0 tw:mt-0.5">
                      {isExpanded ? (
                        <ChevronUp size={18} className="tw:text-gray-500" />
                      ) : (
                        <ChevronDown size={18} className="tw:text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div
                      className="tw:mt-3 tw:pt-3 tw:space-y-3"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      {/* Vendor Info */}
                      {hasVendorInfo && (
                        <div className="tw:text-sm tw:text-gray-700">
                          <span className="tw:text-slate-500 tw:mr-1">
                            {t("vendor")}:
                          </span>
                          <span className="tw:font-regular">
                            {row._vendorInfo?.id
                              ? row._vendorInfo.name || row._vendorInfo.id
                              : row.toParty?.name || row.toParty?.refId || "-"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Divider className="tw:!my-0" />

                {/* Financial Details */}
                <div className="tw:px-4 tw:py-4 tw:space-y-3">
                  {/* Opening Balance */}
                  <div className="tw:flex tw:justify-between tw:items-center">
                    <span className="tw:text-sm tw:text-gray-600 tw:font-medium">
                      {t("openingBalance")}
                    </span>
                    <Amount
                      value={row.balanceBefore ?? 0}
                      decimalPlaces={2}
                      className="tw:text-sm tw:text-slate-600 tw:font-medium"
                    />
                  </div>

                  {/* Credit/Debit Amount */}
                  {row.statementType === "credit" ? (
                    <div className="tw:flex tw:justify-between tw:items-center tw:bg-green-50 tw:rounded-md tw:px-3 tw:py-2 tw:-mx-1">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <ArrowUp size={16} className="tw:text-green-600" />
                        <span className="tw:text-sm tw:text-gray-700 tw:font-semibold">
                          {t("credit")}
                        </span>
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1">
                        <span className="tw:text-sm tw:text-green-600 tw:font-bold">
                          +
                        </span>
                        <Amount
                          value={row.amount ?? 0}
                          decimalPlaces={2}
                          className="tw:text-base tw:text-green-600 tw:font-bold"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="tw:flex tw:justify-between tw:items-center tw:bg-red-50 tw:rounded-md tw:px-3 tw:py-2 tw:-mx-1">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <ArrowDown size={16} className="tw:text-red-600" />
                        <span className="tw:text-sm tw:text-gray-700 tw:font-semibold">
                          {t("debit")}
                        </span>
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1">
                        <span className="tw:text-sm tw:text-red-600 tw:font-bold">
                          -
                        </span>
                        <Amount
                          value={row.amount ?? 0}
                          decimalPlaces={2}
                          className="tw:text-base tw:text-red-600 tw:font-bold"
                        />
                      </div>
                    </div>
                  )}

                  <Divider className="tw:!my-0" />

                  {/* Closing Balance */}
                  <div className="tw:flex tw:justify-between tw:items-center tw:mt-2">
                    <span className="tw:text-base tw:font-semibold tw:text-gray-700">
                      {t("closingBalance")}
                    </span>
                    <Amount
                      value={row.balanceAfter ?? 0}
                      decimalPlaces={2}
                      className="tw:text-base tw:text-slate-800 tw:font-bold"
                    />
                  </div>
                </div>
              </AppCard>
            </div>
          </AppLink>
        );
      })}
    </div>
  );
};

export default MobileView;
