import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import CommonService from "~/services/CommonService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import {
  defaultFilter,
  getCount,
  getData,
  prepareParams,
} from "../../../ready-to-unlock/helper";

const ROWS = 5;

const sort: SortProps = { key: "name", value: "asc" };

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
const AVATAR_TONES = [
  "tw:bg-sky-600",
  "tw:bg-cyan-600",
  "tw:bg-primary",
  "tw:bg-violet-600",
  "tw:bg-amber-600",
];

/**
 * Unlock queue — network customers who transact enough to be handed a paylater
 * wallet but don't have one yet, each with the limit to start them on.
 *
 * Reads the customer network list the network management B2C page uses; the
 * full flow lives on the ready-to-unlock page.
 */
const UnlockQueue = () => {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: ROWS,
    startSlNo: 1,
    endSlNo: ROWS,
    totalRecords: 0,
  });

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      try {
        const params = prepareParams(
          defaultFilter,
          paginationRef.current,
          sort,
        );
        const [result, count] = await Promise.all([
          getData(params),
          getCount(params),
        ]);
        setData(result || []);
        setTotal(count || 0);
      } catch (e) {
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, []);

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3">
        <div className="tw:text-base tw:font-semibold tw:text-slate-800">
          Ready to unlock · {total}
        </div>

        <AppLink
          asLink
          href="/dashboard/paylater/ready-to-unlock"
          className="tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-slate-200 tw:px-3 tw:py-1 tw:text-xs tw:font-medium tw:text-slate-600 tw:hover:bg-slate-50"
        >
          Go to unlock
          <ChevronRight size={14} />
        </AppLink>
      </div>

      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-10">
          <AppSpinner className="tw:h-6 tw:w-6" />
        </div>
      ) : !data.length ? (
        <NoData />
      ) : (
        <div className="tw:flex tw:flex-col">
          {data.map((item, index) => (
            <div
              key={item.id || index}
              className="tw:flex tw:items-center tw:gap-3 tw:border-t tw:border-slate-100 tw:px-4 tw:py-3"
            >
              <div
                className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white ${
                  AVATAR_TONES[index % AVATAR_TONES.length]
                }`}
              >
                {item.initials}
              </div>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                  {item.name || "-"}
                </div>
                <div className="tw:text-[11px] tw:text-slate-400">
                  {item.bills} bills · avg{" "}
                  {CommonService.formatCompact(item.avgBillValue)} ·{" "}
                  {item.fulfillmentRate}%
                </div>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:text-sm tw:font-semibold tw:text-violet-600">
                  <Amount value={item.suggestedLimit} decimalPlaces={0} />
                </div>
                <div className="tw:text-[11px] tw:text-slate-400">suggested</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnlockQueue;
