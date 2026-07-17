import {
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  DownloadIcon,
} from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PlatformFeeStatementPlan from "~/shared/accounts/components/platform-fee-statement-plan/PlatformFeeStatementPlan";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  callback: (a: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  loading,
  onLoadMore,
  hasMore,
  loadingMore,
  totalCount,
  loadedCount,
  callback,
}) => {
  const { t } = useTranslation(["common"]);
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

  if (loading && data.length === 0) {
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
    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-3">
      {data.map((row, idx) => {
        const rowId = row._id || `row-${idx}`;
        const isExpanded = expandedItems.has(rowId);

        return (
          <div key={rowId}>
            <AppCard noPadding className="tw:mb-0">
              {/* Header with Date and Transaction Type */}
              <div className="tw:px-4 tw:pt-4 tw:pb-3">
                <div className="tw:flex tw:justify-between tw:items-start">
                  <div className="tw:flex tw:flex-col tw:gap-1.5">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <Calendar size={16} className="tw:text-slate-400" />
                      <DateFormat
                        value={row.createdAt}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500">
                      <Clock size={14} className="tw:text-slate-400" />
                      <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                    </div>
                  </div>
                  <div className="tw:flex tw:flex-col tw:gap-2 tw:items-end">
                    <span
                      className={`wa-tag ${
                        row.transactionType === "Credit"
                          ? "wa-tag-in"
                          : "wa-tag-out"
                      }`}
                    >
                      {row.transactionType?.toUpperCase() || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <Divider className="tw:!my-0" />

              {/* ID Section */}
              {(row.transactionId || row.refId) && (
                <>
                  <div className="tw:px-4 tw:py-3">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:text-sm tw:text-slate-500 tw:font-medium">
                        {t("referenceId")}:
                      </span>
                      {row._tranRedirect?.path ? (
                        <AppLink href={row._tranRedirect.path} asLink>
                          <AppBadge
                            variant="light"
                            className="tw:font-mono tw:text-sm"
                          >
                            {row.transactionId || row.refId}
                          </AppBadge>
                        </AppLink>
                      ) : (
                        <AppBadge
                          variant="light"
                          className="tw:font-mono tw:text-sm"
                        >
                          {row.transactionId || row.refId}
                        </AppBadge>
                      )}

                      {/* download */}
                      {row._showDownloadLink && (
                        <AppButton
                          fill="clear"
                          size="small"
                          onClick={() =>
                            callback({ action: "download", data: row })
                          }
                          className="tw:h-6"
                        >
                          <DownloadIcon />
                        </AppButton>
                      )}
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
                  <div
                    className={`tw:text-sm tw:text-gray-700 tw:flex-1 tw:pr-2 ${
                      !isExpanded ? "tw:line-clamp-1" : "tw:leading-relaxed"
                    }`}
                  >
                    <span className="tw:block">
                      {row.description || row.planName || "-"}
                    </span>

                    {(row.planName || row.planRefId) && (
                      <div className="tw:mt-1 tw:text-xs">
                        {row.planName && (
                          <PlatformFeeStatementPlan
                            planName={row.planName}
                            startDate={row.planStartAt}
                            endDate={row.planEndAt}
                          />
                        )}
                        {row.planRefId && <div>Ref ID: {row.planRefId}</div>}
                      </div>
                    )}
                  </div>
                  <div className="tw:flex-shrink-0 tw:mt-0.5">
                    {isExpanded ? (
                      <ChevronUp size={18} className="tw:text-gray-500" />
                    ) : (
                      <ChevronDown size={18} className="tw:text-gray-500" />
                    )}
                  </div>
                </button>
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
                    value={row.openingBalance ?? 0}
                    decimalPlaces={2}
                    className="tw:text-sm tw:text-slate-600 tw:font-medium"
                  />
                </div>

                {/* Credit/Debit Amount */}
                {row.transactionType === "Credit" ? (
                  <div className="tw:flex tw:justify-between tw:items-center tw:bg-[color:var(--wa-domain-in-bg)] tw:rounded-md tw:px-3 tw:py-2 tw:-mx-1">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <ArrowUp
                        size={16}
                        className="tw:text-[color:var(--wa-domain-in)]"
                      />
                      <span className="tw:text-sm tw:text-gray-700 tw:font-semibold">
                        {t("credit")}
                      </span>
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-sm tw:text-[color:var(--wa-domain-in)] tw:font-bold">
                        +
                      </span>
                      <Amount
                        value={row.amount ?? 0}
                        decimalPlaces={2}
                        className="wa-amount tw:text-base tw:font-bold tw:text-[color:var(--wa-domain-in)]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="tw:flex tw:justify-between tw:items-center tw:bg-[color:var(--wa-domain-out-bg)] tw:rounded-md tw:px-3 tw:py-2 tw:-mx-1">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <ArrowDown
                        size={16}
                        className="tw:text-[color:var(--wa-domain-out)]"
                      />
                      <span className="tw:text-sm tw:text-gray-700 tw:font-semibold">
                        {t("debit")}
                      </span>
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-sm tw:text-[color:var(--wa-domain-out)] tw:font-bold">
                        -
                      </span>
                      <Amount
                        value={row.amount ?? 0}
                        decimalPlaces={2}
                        className="wa-amount tw:text-base tw:font-bold tw:text-[color:var(--wa-domain-out)]"
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
                    value={row.closingBalance ?? 0}
                    decimalPlaces={2}
                    className="tw:text-base tw:text-slate-800 tw:font-bold"
                  />
                </div>
              </div>
            </AppCard>
          </div>
        );
      })}

      {hasMore && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={onLoadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      )}
    </div>
  );
};

export default MobileView;
