import clsx from "clsx";
import { Phone, Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import type { PaginationState } from "~/types/CommonTypes";
import {
  getCount,
  getData,
  prepareParams,
  type ByRunnerFilter,
  type ByRunnerGroup,
} from "./helper";

/**
 * The tracker's "By Runner" tab — every runner carrying a live shipment,
 * ranked by the toolbar's sort. Unlike the side-pane list this is a full-width
 * grid page: the search box narrows the group query itself, so paging and the
 * count always follow the filter rather than only the page already loaded.
 */
const ByRunner = () => {
  const [data, setData] = useState<ByRunnerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const { register, getValues } = useForm<ByRunnerFilter>({
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
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div className="app-full-bleed tw:mb-4 tw:bg-white tw:px-4 tw:py-3">
        <AppInput
          placeholder="Search by agent name"
          register={register}
          name="search"
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:xl:grid-cols-3 tw:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <AppCard
              key={`by-runner-skeleton-${index}`}
              className="tw:flex tw:items-center tw:gap-3"
            >
              <div className="skeleton-loader tw:size-11 tw:shrink-0 tw:rounded-lg" />
              <div className="tw:min-w-0 tw:flex-1">
                <div className="skeleton-loader tw:h-4 tw:w-28 tw:rounded" />
                <div className="skeleton-loader tw:mt-1.5 tw:h-3 tw:w-36 tw:rounded" />
              </div>
              <div className="skeleton-loader tw:h-6 tw:w-16 tw:rounded-md" />
            </AppCard>
          ))}
        </div>
      ) : data.length === 0 ? (
        <AppCard className="tw:py-12 tw:text-center">
          <p className="tw:text-sm tw:text-slate-400">
            No runner is carrying a shipment right now.
          </p>
        </AppCard>
      ) : (
        <>
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:xl:grid-cols-3 tw:gap-4">
            {data.map((runner) => {
              const delivered = Number(runner.count) || 0;
              const progress = Math.min((delivered / 5) * 100, 100);
              return (
                <AppCard
                  key={runner.id}
                  noPadding
                  className="tw:mb-0 tw:flex tw:flex-col tw:gap-2.5 tw:transition-colors tw:hover:bg-slate-50"
                >
                  <div className="tw:flex tw:flex-col tw:gap-2.5 tw:p-2">
                    <div className="tw:flex tw:items-start tw:gap-3">
                      {/* Runner initials, standing in for their photo. */}
                      <span
                        className={clsx(
                          "tw:flex tw:size-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-base tw:font-bold tw:tabular-nums",
                          "tw:bg-orange-500 tw:text-white tw:uppercase",
                          "tw:ring-2 tw:ring-emerald-400 tw:ring-offset-2 tw:ring-offset-white",
                        )}
                      >
                        {runner._initials}
                      </span>

                      <div className="tw:min-w-0 tw:flex-1">
                        <span className="tw:block tw:truncate tw:text-[15px] tw:font-semibold tw:text-slate-900">
                          {runner.agentName}
                        </span>
                        <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-0.5 tw:text-xs tw:text-slate-500">
                        <span className="tw:inline-flex tw:items-center tw:gap-1">
                          <Phone
                            size={12}
                            className="tw:shrink-0 tw:text-slate-400"
                          />
                          <span className="tw:font-medium tw:tracking-wide">
                            {runner.agentMobile}
                          </span>
                        </span>
                          <span aria-hidden className="tw:text-slate-300">
                            ·
                          </span>
                          <span className="tw:inline-flex tw:items-center tw:gap-1">
                            <Star
                              size={12}
                              className="tw:fill-amber-400 tw:text-amber-400"
                            />
                            <span className="tw:font-medium">4.9</span>
                          </span>
                          <span aria-hidden className="tw:text-slate-300">
                            ·
                          </span>
                          <span className="tw:font-medium">
                            {delivered} km today
                          </span>
                        </div>
                      </div>

                      <AppBadge
                        variant="success"
                        size="xs"
                        className="tw:shrink-0 tw:uppercase"
                      >
                        Online
                      </AppBadge>
                    </div>

                    {/* Delivery progress toward the daily goal. */}
                    <div className="tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                      <div
                        className="tw:h-full tw:rounded-full tw:bg-orange-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="tw:text-xs tw:font-medium tw:text-slate-600">
                      {delivered}/5 orders
                      <span aria-hidden className="tw:mx-1.5 tw:text-slate-300">
                        ·
                      </span>
                      {delivered * 2} lifetime
                    </div>
                  </div>
                </AppCard>
              );
            })}
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

export default ByRunner;
