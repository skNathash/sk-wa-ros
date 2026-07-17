import { Calendar, Clock, IndianRupee } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";

type MobileViewProps = {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
};
const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}: MobileViewProps) => {
  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mx-6">
        {data.map((row, idx) => (
          <div
            key={row._id || idx}
            className="tw:bg-white tw:rounded-lg tw:p-4 tw:shadow-sm tw:border tw:border-gray-50"
          >
            <AppLink
              href={row.sourceRedirectionUrl}
              asLink
              className="tw:hover:bg-gray-50"
              noUnderline
            >
              <div className="tw:text-lg tw:font-semibold tw:mb-1">
                {row.notes}
              </div>

              {row.sourceReference && (
                <div className="tw:mb-4">
                  <AppLink
                    href={row.sourceRedirectionUrl}
                    asLink
                    className="tw:inline-block"
                  >
                    <AppBadge
                      variant="light"
                      className="tw:font-mono tw:text-xs"
                    >
                      <code>{row.sourceReference}</code>
                    </AppBadge>
                  </AppLink>
                </div>
              )}

              {/* Header with Date and Statement Type */}
              <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <Calendar size={16} className="tw:text-slate-400" />
                    <DateFormat
                      value={row.paymentDate}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500">
                    <Clock size={14} className="tw:text-slate-400" />
                    <DateFormat value={row.paymentDate} formatStr="hh:mm a" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="tw:mb-3">
                <p className="tw:text-sm tw:md:text-xs tw:text-gray-700 tw:leading-relaxed tw:md:h-20">
                  {row.description || "-"}
                </p>
              </div>

              {/* Reference */}

              {/* Financial Details */}
              <div className="tw:space-y-2 tw:pt-3 tw:border-t tw:border-gray-100">
                <div className="tw:flex tw:justify-between tw:items-center">
                  <span className="tw:text-sm tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                    <IndianRupee
                      size={16}
                      className="tw:text-slate-500 tw:font-medium"
                    />{" "}
                    Amount
                  </span>
                  <Amount
                    value={row.amount ?? 0}
                    decimalPlaces={2}
                    className="tw:text-sm tw:text-red-500 tw:font-bold"
                  />
                </div>
              </div>
            </AppLink>
          </div>
        ))}
      </div>
    </>
  );
};

export default MobileView;
