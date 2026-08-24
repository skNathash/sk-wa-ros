import { endOfDay } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import PaylaterService from "~/services/PaylaterService";

interface TopDueCustomersProps {
  /** Card heading. Defaults to the translated "Due Collection". */
  title?: string;
  /** How many rows to show. Defaults to 10. */
  count?: number;
  className?: string;
}

/**
 * Compact "top due customers" list for the PayLater layout side pane.
 *
 * Reuses the same due-customers source as the analytics Collect card — the
 * `getRequests` endpoint filtered to accounts with a payable amount whose
 * validity has lapsed (see the analytics `collect/helper`) — but renders a
 * trimmed, read-only list sized for the pane instead of the full paginated
 * table.
 */
const TopDueCustomers = ({
  title,
  count = 10,
  className,
}: TopDueCustomersProps) => {
  const { t } = useTranslation();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const resp: any = await PaylaterService.getRequests({
          page: 1,
          count,
          filter: {
            totalPayableAmount: { $gt: 0 },
            validityEndDate: { $lte: endOfDay(new Date()) },
          },
          sort: { totalPayableAmount: -1 },
          isMyNetwork: true,
        });
        const rows = Array.isArray(resp?.data?.data) ? resp.data.data : [];
        const formatted = PaylaterService.formatPaylaterRequest(rows);
        if (mounted) setData(formatted);
      } catch (e) {
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [count]);

  return (
    <AppCard title={title || t("dueCollection")}>
      {loading ? (
        <div className="tw:text-center tw:py-4">
          <AppSpinner />
        </div>
      ) : data.length > 0 ? (
        <div className="tw:flex tw:flex-col tw:text-sm">
          {data.map((item, idx) => (
            <div
              key={item._id ?? idx}
              className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:py-2 tw:border-b tw:border-slate-100 tw:last:border-b-0"
            >
              <div className="tw:min-w-0">
                <AppLink href={item.userRedirectionLink} asLink>
                  <span className="tw:truncate tw:block">
                    {item.userInfo?.name || "-"}
                  </span>
                </AppLink>
                {item.validityEndDate ? (
                  <div className="tw:text-xs tw:text-slate-400">
                    {t("dueOn", { defaultValue: "Due" })}:{" "}
                    <DateFormat
                      value={item.validityEndDate}
                      formatStr="dd MMM yyyy"
                    />
                  </div>
                ) : null}
              </div>
              <span className="tw:font-medium tw:whitespace-nowrap">
                <Amount value={item.totalPayableAmount ?? 0} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <NoData />
      )}
    </AppCard>
  );
};

export default TopDueCustomers;
