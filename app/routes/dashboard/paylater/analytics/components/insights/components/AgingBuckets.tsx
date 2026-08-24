import clsx from "clsx";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import { getAgingBuckets, type AgingBucket } from "../helper";

/**
 * "Aging buckets" card — where the outstanding book sits across days-past-due
 * bands. Each band shows its rupee amount, the customers behind it, and a bar
 * sized against the largest band so the shape of the debt reads at a glance.
 */
const AgingBuckets = () => {
  const [buckets, setBuckets] = useState<AgingBucket[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAging = async () => {
      setLoading(true);
      try {
        const result = await getAgingBuckets();
        setBuckets(result.buckets);
        setTotalOutstanding(result.totalOutstanding);
      } catch (e) {
        setBuckets([]);
        setTotalOutstanding(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAging();
  }, []);

  const max = Math.max(...buckets.map((b) => b.amount), 0);

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-slate-100 tw:px-5 tw:py-4">
        <div className="tw:text-base tw:font-semibold tw:text-slate-800">
          Aging buckets
        </div>
        <div className="tw:shrink-0 tw:text-xs tw:text-slate-400">
          where the {CommonService.formatCompact(totalOutstanding)} sits
        </div>
      </div>

      {loading ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:py-12">
          <AppSpinner className="tw:h-6 tw:w-6" />
        </div>
      ) : !buckets.length ? (
        <div className="tw:flex tw:flex-1 tw:items-center tw:justify-center">
          <NoData />
        </div>
      ) : (
        <div className="tw:flex tw:flex-1 tw:flex-col tw:justify-between tw:gap-5 tw:px-5 tw:py-5">
          {buckets.map((bucket) => (
            <div key={bucket.range}>
              <div className="tw:flex tw:items-center tw:gap-2">
                <span
                  className={clsx(
                    "tw:h-2.5 tw:w-2.5 tw:shrink-0 tw:rounded-sm",
                    bucket.barClassName,
                  )}
                />
                <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
                  {bucket.label}
                </span>
                <span className="tw:text-xs tw:text-slate-400">
                  {bucket.customerCount}{" "}
                  {bucket.customerCount === 1 ? "customer" : "customers"}
                </span>
                <span
                  className={clsx(
                    "tw:ml-auto tw:shrink-0 tw:text-sm tw:font-bold",
                    bucket.textClassName,
                  )}
                >
                  <Amount value={bucket.amount} decimalPlaces={0} />
                </span>
              </div>

              <div className="tw:mt-2 tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                <div
                  className={clsx("tw:h-full tw:rounded-full", bucket.barClassName)}
                  style={{ width: `${max ? (bucket.amount / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgingBuckets;
