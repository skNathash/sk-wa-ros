import clsx from "clsx";
import { ArrowRight, MapPin, Search, Star, Store, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppProgress from "~/components/core/progress/AppProgress";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import type { PaginationState } from "~/types/CommonTypes";
import type { AssignRunnerOrder } from "../../helper";
import {
  assignRunner,
  getCount,
  getData,
  prepareParams,
  type Runner,
} from "./helper";

interface RunnersProps {
  /** The drop being assigned — the runner is picked for this order. */
  order: AssignRunnerOrder;
  /** Fired once the shipment call succeeds, so the page can refresh. */
  onAssigned: () => void;
}

/** Shared caption above each stat value. */
const STAT_LABEL =
  "tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400";

/** Closest runners first — the nearby query is a distance search. */
const SORT = { key: "distance", value: "asc" } as const;

/**
 * Nearby runners for the picked drop, ranked by how close they are, with the
 * load and ETA a dispatcher needs to choose between them.
 */
export default function Runners({ order, onAssigned }: RunnersProps) {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const { register, getValues } = useForm({ defaultValues: { search: "" } });

  const [data, setData] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [assigningId, setAssigningId] = useState("");
  const [confirmingRunner, setConfirmingRunner] = useState<Runner | null>(null);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<Record<string, any>>({ tab: "all" });

  // Initial load / filter change — back to page one, counts refreshed.
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
      const result = await getData(
        prepareParams(filterRef.current, paginationRef.current, SORT),
      );
      setData(result);

      // The runner count drives pagination.
      const total = await getCount(
        prepareParams(filterRef.current, paginationRef.current, SORT),
      );
      paginationRef.current.totalRecords = total;
    } catch (e) {
      setData([]);
      paginationRef.current.totalRecords = 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    const next = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      paginationRef.current = next;
      const result = await getData(prepareParams(filterRef.current, next, SORT));
      setData((prev) => [...prev, ...result]);
    } catch (e) {
      paginationRef.current.activePage = next.activePage - 1;
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  useEffect(() => {
    applyFilter();
  }, []);

  /** Runners on shift among the ones loaded — the chip beside the title. */
  const onlineCount = useMemo(
    () => data.filter((runner) => runner.isAvailable).length,
    [data],
  );

  const handleSearchChange = useDebouncedCallback(() => {
    filterRef.current = { ...filterRef.current, search: getValues("search") };
    applyFilter();
  }, 500);

  const handleAssign = useCallback(
    async (runner: Runner) => {
      setAssigningId(runner.id);
      try {
        const response = await assignRunner(order, runner);
        if (response.statusCode === 200 || response.statusCode === 201) {
          appToast.show({
            msg: `Assigned to ${runner.name}`,
            color: "success",
          });
          onAssigned();
        } else {
          appToast.show({
            msg: response.data?.message || "Failed to assign the runner",
            color: "danger",
          });
        }
      } catch (e: any) {
        appToast.show({
          msg: e?.message || "Failed to assign the runner",
          color: "danger",
        });
      } finally {
        setAssigningId("");
      }
    },
    [order, appToast, onAssigned],
  );

  return (
    <div className="tw:flex tw:flex-col tw:gap-2">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-2">
          <Target size={16} className="tw:shrink-0 tw:text-emerald-600" />
          <h3 className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
            Best runners for this drop
          </h3>
          {onlineCount > 0 && (
            <span className="tw:shrink-0 tw:rounded-full tw:bg-emerald-50 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-emerald-600">
              {onlineCount} online
            </span>
          )}
        </div>

        {/* Desk-only escape hatch — on mobile the marketplace is reachable
            from the empty state and the delivery menu. */}
        <button
          type="button"
          className="tw:hidden tw:items-center tw:gap-1.5 tw:text-[13px] tw:font-semibold tw:text-emerald-600 tw:hover:text-emerald-700 tw:md:inline-flex"
          onClick={() =>
            appNav.to("/dashboard/delivery/marketplace-runners", {
              orderId: order._id,
            })
          }
        >
          <MapPin size={14} />
          Also try Marketplace
          <ArrowRight size={14} />
        </button>
      </div>

      <AppInput
        name="search"
        register={register}
        placeholder="Search runner · vehicle"
        leftIcon={<Search size={16} />}
        className="tw:w-full"
        onChange={handleSearchChange}
      />

      {loading ? (
        <BusyLoader show={true} />
      ) : data.length === 0 ? (
        <NoData>
          <div className="tw:text-center tw:max-w-sm">
            <div className="tw:mb-4 tw:flex tw:justify-center">
              <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
                <Store className="tw:text-slate-400" size={32} />
              </div>
            </div>
            <h3 className="tw:text-sm tw:font-semibold tw:text-slate-700 tw:mb-2">
              No runners nearby
            </h3>
            <p className="tw:text-sm tw:text-slate-500 tw:leading-relaxed">
              No delivery runner is available around the store right now. Try
              again in a while or hire one from the marketplace.
            </p>
            <AppButton
              size="small"
              color="primary"
              className="tw:mt-4"
              onClick={() =>
                appNav.to("/dashboard/delivery/marketplace-runners", {
                  orderId: order._id,
                })
              }
            >
              <Store size={14} />
              Browse marketplace runners
            </AppButton>
          </div>
        </NoData>
      ) : (
        <>
          <div className="tw:mt-2 tw:space-y-2">
            {data.map((runner, index) => (
              <div
                key={runner.id}
                className="tw:flex tw:flex-col tw:gap-2.5 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:shadow-sm tw:md:flex-row tw:md:items-center tw:md:gap-4 tw:md:rounded-xl"
              >
                {/* On mobile the identity and the actions share the top row;
                    on desktop the wrapper dissolves so everything sits on one
                    line, with the stats ordered between them. */}
                <div className="tw:flex tw:items-center tw:gap-3 tw:md:contents">
                  {/* Identity — rank, avatar, name and vehicle/rating meta. */}
                  <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3">
                    <span
                      className={clsx(
                        "tw:w-5 tw:shrink-0 tw:text-center tw:text-lg tw:font-bold tw:tabular-nums",
                        index === 0 ? "tw:text-emerald-600" : "tw:text-slate-400",
                      )}
                    >
                      {index + 1}
                    </span>

                    <InitialsAvatar
                      initials={runner.initials}
                      name={runner.name}
                      size={40}
                      className={
                        runner.isAvailable
                          ? "tw:ring-2 tw:ring-emerald-400 tw:ring-offset-2"
                          : undefined
                      }
                    />

                    <div className="tw:min-w-0 tw:flex-1">
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        <h4 className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
                          {runner.name}
                        </h4>
                        {runner.isAvailable && (
                          <span className="tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full tw:bg-emerald-500" />
                        )}
                      </div>

                      <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-slate-500">
                        <span className="tw:truncate">{runner.meta}</span>
                        {runner.ratingLbl && (
                          <>
                            <span className="tw:text-slate-300">·</span>
                            <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-0.5 tw:font-semibold tw:text-slate-700">
                              <Star
                                size={11}
                                className="tw:fill-amber-400 tw:text-amber-400"
                              />
                              {runner.ratingLbl}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions — top-match badge and the assign CTA. */}
                  <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:md:order-3">
                    {runner.isTop && (
                      <AppBadge variant="success" size="sm">
                        TOP
                      </AppBadge>
                    )}

                    <AppButton
                      size="small"
                      color="primary"
                      isLoading={assigningId === runner.id}
                      disabled={Boolean(assigningId)}
                      onClick={() => setConfirmingRunner(runner)}
                    >
                      Assign
                    </AppButton>
                  </div>
                </div>

                {/* Stat columns — load, ETA and fit score. */}
                <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:border-t tw:border-slate-100 tw:pt-2.5 tw:md:order-2 tw:md:flex tw:md:shrink-0 tw:md:gap-6 tw:md:border-t-0 tw:md:pt-0">
                  <div className="tw:min-w-0 tw:md:w-28">
                    <span className={STAT_LABEL}>Load</span>
                    <span className="tw:block tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-900">
                      {runner.loadLbl}
                    </span>
                    <AppProgress
                      value={runner.loadPct}
                      color={runner.loadColor}
                      className="tw:mt-1.5 tw:h-1.5 tw:w-full"
                    />
                  </div>

                  <div className="tw:min-w-0 tw:md:w-32">
                    <span className={STAT_LABEL}>
                      ETA<span className="tw:hidden tw:md:inline"> to drop</span>
                    </span>
                    <span className="tw:block tw:text-sm tw:font-bold tw:tabular-nums tw:text-blue-600 tw:md:text-slate-900">
                      {runner.etaLbl}
                    </span>
                    {runner.viaLbl && (
                      <span className="tw:block tw:truncate tw:text-[11px] tw:text-slate-500">
                        {runner.viaLbl}
                      </span>
                    )}
                  </div>

                  <div className="tw:min-w-0 tw:md:w-28">
                    <span className={STAT_LABEL}>
                      Fit<span className="tw:hidden tw:md:inline"> score</span>
                    </span>
                    <span className="tw:block tw:text-sm tw:font-bold tw:tabular-nums tw:text-emerald-600">
                      {runner.fitScore}
                      <span className="tw:md:hidden">%</span>
                    </span>
                    <AppProgress
                      value={runner.fitScore}
                      color={runner.fitColor}
                      className="tw:mt-1.5 tw:h-1.5 tw:w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            loadedCount={data.length}
            totalCount={paginationRef.current.totalRecords}
          />
        </>
      )}

      <AppAlertDialog
        show={Boolean(confirmingRunner)}
        title={`Assign ${confirmingRunner?.name ?? ""}?`}
        description="Confirm this runner for the drop. This will assign the shipment to them."
        okText="Assign"
        cancelText="Cancel"
        onConfirm={() => {
          const runner = confirmingRunner;
          setConfirmingRunner(null);
          if (runner) handleAssign(runner);
        }}
        onCancel={() => setConfirmingRunner(null)}
      />
    </div>
  );
}
