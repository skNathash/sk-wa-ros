import clsx from "clsx";
import { Phone } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { useDebouncedCallback } from "use-debounce";
import AppBadge from "~/components/core/badge/AppBadge";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type RunnerFilter,
  type RunnerGroup,
} from "./helper";

/**
 * Live shipments grouped by the runner carrying them — the tracker pane's
 * list. The search box narrows the group query itself, so paging and the
 * count always follow the filter rather than only the page already loaded.
 */
const RUNNER_PARAM = "runner";

const Runners = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get(RUNNER_PARAM) || "";

  const [data, setData] = useState<RunnerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const { register, getValues } = useForm<RunnerFilter>({
    defaultValues: {
      search: "",
    },
  });

  // Initial load / search change — back to page one, count refreshed.
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    try {
      const params = prepareParams(getValues(), paginationRef.current);
      setData(await getData(params));
      paginationRef.current.totalRecords = await getCount(params);
    } catch (e) {
      setData([]);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const result = await getData(
        prepareParams(getValues(), paginationRef.current),
      );
      setData((prev) => [...prev, ...result]);
    } catch (e) {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage - 1,
      };
    } finally {
      setLoadingMore(false);
    }
  }, [getValues, loadingMore]);

  useEffect(() => {
    applyFilter();
  }, []);

  const debounceSearch = useDebouncedCallback(() => applyFilter(), 500);

  const handleSearchChange = () => {
    debounceSearch();
  };

  return (
    <div className="app-bleed-x">
      <div className="tw:px-4 tw:mb-4">
        <AppInput
          placeholder="Search by agent name"
          register={register}
          name="search"
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className="tw:divide-y tw:divide-slate-100">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`runner-skeleton-${index}`}
              className="tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:px-3 tw:py-2"
            >
              <div className="skeleton-loader tw:size-9 tw:shrink-0 tw:rounded-lg" />
              <div className="tw:min-w-0 tw:flex-1">
                <div className="skeleton-loader tw:h-3.5 tw:w-28 tw:rounded" />
                <div className="skeleton-loader tw:mt-1 tw:h-3 tw:w-36 tw:rounded" />
              </div>
              <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
                <div className="skeleton-loader tw:h-5 tw:w-16 tw:rounded-md" />
                <div className="skeleton-loader tw:h-3 tw:w-10 tw:rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="tw:px-4 tw:py-3 tw:text-xs tw:text-slate-400">
          No runner is carrying a shipment right now.
        </p>
      ) : (
        <>
          <div className="tw:divide-y tw:divide-slate-100">
            {data.map((shipment) => (
              <button
                key={shipment.id}
                type="button"
                onClick={() =>
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.set(RUNNER_PARAM, shipment.id);
                      return next;
                    },
                    { replace: true, preventScrollReset: true },
                  )
                }
                className={clsx(
                  "tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:px-3 tw:py-2 tw:text-left tw:transition-colors",
                  shipment.id === selectedId
                    ? "tw:bg-emerald-50"
                    : "tw:hover:bg-slate-50",
                )}
              >
                {/* Runner initials, standing in for their photo. */}
                <span
                  className={clsx(
                    "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-xs tw:font-bold tw:tabular-nums tw:text-white",
                    "tw:bg-emerald-500 tw:uppercase",
                  )}
                >
                  {shipment._initials}
                </span>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                      {shipment.agentName}
                    </span>
                  </div>
                  <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1.5 tw:truncate tw:text-[11px] tw:text-slate-500">
                    <Phone size={12} className="tw:shrink-0" />
                    {shipment.agentMobile}
                  </p>
                </div>

                {/* Stage, and how long the customer is still waiting. */}
                <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
                  <AppBadge
                    variant="primary"
                    className="tw:font-semibold tw:uppercase"
                  >
                    ON Route
                  </AppBadge>
                  <span className="tw:text-xs tw:text-slate-500">10 min</span>
                </div>
              </button>
            ))}
          </div>

          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            loadedCount={data.length}
            totalCount={paginationRef.current.totalRecords}
            loaderType="button"
          />
        </>
      )}
    </div>
  );
};

export default Runners;
