import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import DownloadCommissionButton from "./DownloadCommissionButton";
import NoData from "~/components/core/no-data/NoData";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import Divider from "~/components/core/divider/Divider";
import AppCard from "~/components/core/card/AppCard";

type MobileViewProps = {
  items: any[];
  loading?: boolean;
};

export default function MobileView({ items, loading }: MobileViewProps) {
  const { t } = useTranslation(["common"]);

  if (!loading && (!items || items.length === 0)) {
    return (
      <AppCard>
        <NoData />
      </AppCard>
    );
  }

  return (
    <div className="tw:space-y-4">
      {loading ? (
        <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:p-4 tw:animate-pulse">
          <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
            <div className="tw:space-y-2">
              <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-32" />
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-40" />
            </div>
            <div className="tw:h-8 tw:bg-gray-200 tw:rounded tw:w-24" />
          </div>
          <div className="tw:h-px tw:bg-gray-200 tw:mb-3" />
          <div className="tw:grid tw:grid-cols-3 tw:gap-4">
            <div className="tw:space-y-1">
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16" />
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-20" />
            </div>
            <div className="tw:space-y-1">
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-12" />
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-24" />
            </div>
            <div className="tw:space-y-1">
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-16" />
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-20" />
            </div>
          </div>
        </div>
      ) : (
        items.map((row, index) => (
          <AppCard key={index}>
            {/* Top Section: Receipt ID, Date/Time, and Download Button */}
            <div className="tw:flex tw:items-start tw:justify-between tw:mb-3">
              <div className="tw:flex-1">
                <div className="tw:text-base tw:font-semibold tw:text-gray-900 tw:mb-1">
                  {t("receiptId")}: {row.receiptId}
                </div>
                <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:text-gray-500">
                  <Calendar size={14} className="tw:text-gray-400" />
                  <DateFormat
                    value={row.createdAt}
                    formatStr="dd MMM yyyy, hh:mm a"
                  />
                </div>
              </div>
              <DownloadCommissionButton receiptId={row.receiptId} />
            </div>

            {/* Divider */}
            <Divider className="tw:my-0 tw:mb-3" />

            {/* Bottom Section: Three Columns */}
            <div className="tw:grid tw:grid-cols-3 tw:gap-4">
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  {t("amount")}
                </div>
                <div className="tw:text-base tw:font-semibold tw:text-red-600">
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="tw:ml-0"
                  />
                </div>
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  {t("tax")}
                </div>
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {row.taxInfo?.gst ?? 0}%
                </div>
              </div>
              <div>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  {t("poId")}
                </div>
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {row.refId ? (
                    <AppLink
                      href={`/dashboard/purchase-order/view/${row.refOrderNo}`}
                      asLink
                      className="tw:text-gray-900 hover:tw:text-blue-600"
                    >
                      {row.refId}
                    </AppLink>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>
          </AppCard>
        ))
      )}
    </div>
  );
}
