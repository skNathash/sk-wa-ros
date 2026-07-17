import React from "react";
import AppPopover from "~/components/core/popover/AppPopover";
import Amount from "~/components/core/amount/Amount";
import type { SellerDeal } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

type Props = {
  salesAnalytics?: SellerDeal["salesAnalytics"];
};

const ranges = [
  { key: "last7Days", label: "Last 7d" },
  { key: "last15Days", label: "Last 15d" },
  { key: "last30Days", label: "Last 30d" },
  { key: "last45Days", label: "Last 45d" },
  { key: "last60Days", label: "Last 60d" },
  { key: "last90Days", label: "Last 90d" },
] as const;

const DealSummaryPopover: React.FC<Props> = ({ salesAnalytics }) => {
  const { t } = useTranslation(["common"]);
  return (
    <>
      <div className="tw:text-sm tw:font-medium tw:mb-2">
        {t("salesSummary")}
      </div>

      {/* Header row for the 3-column grid */}
      <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:text-xs tw:font-semibold tw:text-slate-600 tw:border-b tw:pb-2 tw:mb-2">
        <div>{t("days")}</div>
        <div className="tw:text-center">{t("units")}</div>
        <div className="tw:text-right">{t("value")}</div>
      </div>

      <div className="tw:flex tw:flex-col tw:gap-2">
        {ranges.map((r) => {
          const data = (salesAnalytics as any)?.[r.key] || {
            quantity: 0,
            value: 0,
          };
          return (
            <div
              key={r.key}
              className="tw:grid tw:grid-cols-3 tw:items-center tw:gap-4 tw:text-xs"
            >
              <div className="tw:text-slate-600">{r.label}</div>
              <div className="tw:text-center tw:font-medium">
                {data.quantity || 0}
              </div>
              <div className="tw:text-right tw:text-slate-600">
                <Amount value={data.value || 0} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default DealSummaryPopover;
