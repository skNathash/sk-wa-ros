import clsx from "clsx";
import { ArrowRight, BanknoteArrowUp, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import AuthService from "~/services/AuthService";
import MarketplaceRunnerService from "~/services/MarketplaceRunnerService";
import { type RunnerActiveJob } from "../../helper";

/** The stages the runner is "on" while a job is in their hands. */
const ACTIVE_STATUSES = ["Pending", "Accepted", "Shipped", "Reached"];

/**
 * Active-now feed — the jobs the runner is on this minute, each card opening
 * with its stage so the runner can tell a pickup from a drop without reading.
 * The list is fetched live for the logged-in runner.
 */
export default function ActiveJobs() {
  const [jobs, setJobs] = useState<RunnerActiveJob[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const runnerId = AuthService.getRunner<{ _id?: string }>()?._id || "";
        const filter = {
          deliveryAgentId: runnerId,
          status: ACTIVE_STATUSES,
        };

        const [listResponse, countResponse] = await Promise.all([
          MarketplaceRunnerService.getShipmentsByRunner({
            filter,
            sort: { assignedAt: -1 },
          }),
          MarketplaceRunnerService.getShipmentsByRunner({
            filter,
            outputType: "count",
          }),
        ]);
        if (cancelled) return;

        const groups: Record<string, any>[] =
          listResponse?.data?.data?.groups || [];
        const data = groups
          .flatMap((g) => g?.shipments || [])
          .filter((s: any) => ACTIVE_STATUSES.includes(s?.status))
          .map(formatActiveJob);

        setJobs(data);
        setCount(Number(countResponse?.data?.data?.count) || 0);
      } catch (e) {
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && jobs.length === 0) return null;

  return (
    <section className="tw:flex tw:flex-col tw:gap-3 tw:px-4 tw:pt-5">
      <div className="tw:flex tw:items-center tw:gap-2">
        <span className="app-label tw:text-slate-500">Active now</span>
        <span className="tw:text-xs tw:text-slate-400">
          {count} in progress · {jobs.length}
        </span>

        <AppButton fill="clear" size="small" className="tw:ml-auto">
          See all
          <ArrowRight size={13} />
        </AppButton>
      </div>

      {loading && (
        <div className="tw:flex tw:flex-col tw:gap-3">
          <div className="skeleton-loader tw:h-24 tw:w-full tw:rounded-xl" />
          <div className="skeleton-loader tw:h-24 tw:w-full tw:rounded-xl" />
        </div>
      )}

      {jobs.map((job) => (
        <AppCard
          key={job.id}
          className={clsx("runner-job-card tw:mb-0 tw:py-3.5", job._cardCls)}
          bodyClassName="tw:px-4 tw:pl-4.5"
        >
          {/* Stage, order type and code — what the job is, then its time. */}
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className={clsx("runner-job-badge", job._stageCls)}>
              {job._stageLbl}
            </span>
            <span className={clsx("runner-job-badge", job._typeCls)}>
              {job._typeLbl}
            </span>
            <span className="tw:text-xs tw:font-semibold tw:text-slate-500">
              {job.orderCode}
            </span>
            {job._timeLbl && (
              <span className="tw:ml-auto tw:text-xs tw:font-medium tw:text-slate-400">
                {job._timeLbl}
              </span>
            )}
          </div>

          <h3 className="tw:mt-2 tw:truncate tw:text-lg tw:font-bold tw:text-slate-900">
            {job.customerName}
          </h3>

          {/* Where it goes, how far, how much to carry. */}
          <p className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-slate-500">
            <MapPin size={13} className="tw:shrink-0" />
            <span className="tw:truncate">{job._placeLbl}</span>
            {job._distanceLbl && (
              <>
                <span className="tw:text-slate-300">·</span>
                <span>{job._distanceLbl}</span>
              </>
            )}
            {job._itemsLbl && (
              <>
                <span className="tw:text-slate-300">·</span>
                <span>{job._itemsLbl}</span>
              </>
            )}
          </p>

          {/* Cash to collect and the clock, against what the run pays. */}
          <div className="tw:mt-2.5 tw:flex tw:items-center tw:gap-2">
            {job._codLbl && (
              <span className="runner-job-cod">
                <BanknoteArrowUp size={13} />
                COD {job._codLbl}
              </span>
            )}
            {job._etaLbl && (
              <span className="runner-job-eta">{job._etaLbl}</span>
            )}

            {job.earning > 0 && (
              <span className="tw:ml-auto tw:flex tw:items-center tw:text-lg tw:font-bold tw:text-slate-900">
                +
                <Amount value={job.earning} decimalPlaces={0} />
              </span>
            )}
          </div>
        </AppCard>
      ))}
    </section>
  );
}

/** Which statuses read as a pickup leg vs a drop leg, and their card colours. */
function stageFor(status: string) {
  const shipping = status === "Shipped" || status === "Reached";
  return shipping
    ? {
        _cardCls: "runner-job-card--delivering",
        _stageLbl: "Delivering",
        _stageCls: "runner-job-badge--delivering",
      }
    : {
        _cardCls: "runner-job-card--pickup",
        _stageLbl: "Pickup",
        _stageCls: "runner-job-badge--pickup",
      };
}

/** "B2B" / "B2C" with the badge class that colours it. */
function typeFor(orderType: string) {
  const b2b = orderType === "B2B";
  return {
    _typeLbl: b2b ? "B2B" : "B2C",
    _typeCls: b2b ? "runner-job-badge--b2b" : "runner-job-badge--b2c",
  };
}

/** Derive the display fields one active job card renders. */
function formatActiveJob(s: Record<string, any>): RunnerActiveJob {
  const stage = stageFor(s?.status);
  const type = typeFor(s?.orderType || s?.type);
  const items = Array.isArray(s?.items) ? s.items : [];
  const itemCount = items.reduce(
    (sum: number, i: any) => sum + (Number(i.quantity) || 0),
    0,
  );
  const isCod = s?.paymentType === "COD";

  return {
    id: s?._id || s?.shipmentId || s?.orderRefNo,
    orderCode: s?.orderRefNo || "CLB-0000",
    customerName: s?.customerInfo?.name || "Customer",
    earning: Number(s?.deliveryCharge || s?.earning) || 0,
    _cardCls: stage._cardCls,
    _stageLbl: stage._stageLbl,
    _stageCls: stage._stageCls,
    _typeLbl: type._typeLbl,
    _typeCls: type._typeCls,
    _timeLbl: timeLabel(s?.assignedAt),
    _placeLbl: s?.customerInfo?.address?.town || "",
    _distanceLbl: s?.deliveryDistance
      ? `${CommonService.roundedByDecimalPlace(Number(s.deliveryDistance), 1)} km`
      : "",
    _itemsLbl: itemCount ? `${itemCount} items` : "",
    _etaLbl: s?._etaLbl || "ETA 5 min",
    _codLbl:
      isCod && s?.payableAmount
        ? `₹${CommonService.formattedAmount(s.payableAmount, 0)}`
        : "",
  } as RunnerActiveJob;
}

/** "9:52 AM" — when the job came in, or empty when there is no timestamp. */
function timeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}
