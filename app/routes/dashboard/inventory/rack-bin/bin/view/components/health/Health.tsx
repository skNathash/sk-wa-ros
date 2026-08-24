import clsx from "clsx";
import { AlertTriangle, Check } from "lucide-react";
import { useEffect, useState } from "react";
import NoData from "~/components/core/no-data/NoData";
import {
  getBinHealth,
  type BinHealth,
  type CheckStatus,
  type HealthAction,
  type HealthCheck,
} from "./helper";

const RADIUS = 40;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// The ring, the grade word and the score all carry the same tone so the card
// reads at a glance without a legend.
const TONE: Record<BinHealth["tone"], { arc: string; text: string }> = {
  good: { arc: "var(--primary)", text: "tw:text-primary" },
  fair: { arc: "#d97706", text: "tw:text-amber-600" },
  poor: { arc: "#dc2626", text: "tw:text-red-600" },
};

// Status badge on each check row. Passing rows get the solid mark; the two
// failure grades are tinted rather than solid so a long list stays calm.
const CHECK_TONE: Record<CheckStatus, { badge: string; detail: string }> = {
  pass: { badge: "tw:bg-primary tw:text-white", detail: "tw:text-primary" },
  warn: {
    badge: "tw:bg-amber-50 tw:text-amber-600",
    detail: "tw:text-amber-700",
  },
  fail: { badge: "tw:bg-red-50 tw:text-red-600", detail: "tw:text-red-700" },
};

const FIX_BUTTON: Record<Exclude<CheckStatus, "pass">, string> = {
  warn: "tw:bg-amber-700 tw:hover:bg-amber-800",
  fail: "tw:bg-red-600 tw:hover:bg-red-700",
};

export interface HealthCallback {
  action: "fix-check" | "run-action";
  data: HealthCheck | HealthAction;
}

interface HealthProps {
  binId: string;
  /** Bumped by the host after a mutation to re-pull the score. */
  refresh?: number;
  callback?: (a: HealthCallback) => void;
}

/** Score ring with the value in the middle. */
const ScoreRing = ({ health }: { health: BinHealth }) => {
  const pct = health.maxScore
    ? Math.min(1, Math.max(0, health.score / health.maxScore))
    : 0;

  return (
    <div className="tw:relative tw:shrink-0">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        className="tw:-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke="var(--wa-cream, #efeae2)"
          strokeWidth={STROKE}
        />
        <circle
          cx="48"
          cy="48"
          r={RADIUS}
          fill="none"
          stroke={TONE[health.tone].arc}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="tw:absolute tw:inset-0 tw:flex tw:flex-col tw:items-center tw:justify-center">
        <span
          className={clsx(
            "app-amount tw:text-2xl tw:font-bold tw:leading-none",
            TONE[health.tone].text,
          )}
        >
          {health.score}
        </span>
        <span className="tw:mt-0.5 tw:text-[10px] tw:text-slate-400">
          / {health.maxScore}
        </span>
      </div>
    </div>
  );
};

/**
 * "Health" tab of the bin view — a scored checklist of what is right and wrong
 * with a bin (fullness, item placement, category match, barcodes, expiry,
 * stock-outs) plus the recommended actions that raise the score.
 *
 * Failing rows and actions surface a button; the host decides what tapping it
 * does via {@link HealthCallback} (the bin view jumps to the offending deal in
 * the Products tab).
 */
const Health = ({ binId, refresh, callback }: HealthProps) => {
  const [health, setHealth] = useState<BinHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const data = await getBinHealth(binId);
      if (!active) return;
      setHealth(data);
      setLoading(false);
    };
    if (binId) load();
    return () => {
      active = false;
    };
  }, [binId, refresh]);

  if (loading) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-3">
        <div className="tw:h-32 tw:animate-pulse tw:rounded-2xl tw:bg-white" />
        <div className="tw:h-64 tw:animate-pulse tw:rounded-2xl tw:bg-white" />
      </div>
    );
  }

  if (!health) return <NoData />;

  return (
    <div className="tw:flex tw:flex-col tw:gap-5">
      {/* Score */}
      <div className="tw:flex tw:items-center tw:gap-4 tw:rounded-2xl tw:bg-white tw:p-4 tw:ring-1 tw:ring-slate-100">
        <ScoreRing health={health} />
        <div className="tw:min-w-0 tw:flex-1">
          <p className="app-label tw:text-primary">
            Bin Health · {health.gradeLabel}
          </p>
          <p className="app-heading-serif tw:mt-1 tw:text-xl tw:font-bold tw:text-slate-800">
            {health.headline}
          </p>
          {health.subline ? (
            <p className="tw:mt-1 tw:text-xs tw:text-slate-500">
              {health.subline}
            </p>
          ) : null}
        </div>
      </div>

      {/* Checks */}
      {health.checks.length ? (
        <div>
          <p className="app-label tw:px-1 tw:text-slate-400">
            Checks · {health.checks.length} · {health.passCount} Pass ·{" "}
            {health.fixCount} Fix
          </p>
          <div className="tw:mt-2 tw:divide-y tw:divide-slate-100 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:ring-1 tw:ring-slate-100">
            {health.checks.map((check) => (
              <div
                key={check.key}
                className="tw:flex tw:items-start tw:gap-3 tw:p-4"
              >
                <span
                  className={clsx(
                    "tw:mt-0.5 tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full",
                    CHECK_TONE[check.status].badge,
                  )}
                >
                  {check.status === "pass" ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <AlertTriangle size={15} />
                  )}
                </span>

                <span className="tw:min-w-0 tw:flex-1">
                  <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-800">
                    {check.title}
                  </span>
                  {check.detail ? (
                    <span
                      className={clsx(
                        "tw:mt-0.5 tw:block tw:text-xs",
                        CHECK_TONE[check.status].detail,
                      )}
                    >
                      {check.detail}
                    </span>
                  ) : null}
                </span>

                {/* Only offer a button when there is somewhere to go — a
                    bin-level check like fullness flags no deal. */}
                {check.status !== "pass" && check.deals.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      callback?.({ action: "fix-check", data: check })
                    }
                    className={clsx(
                      "tw:shrink-0 tw:cursor-pointer tw:rounded-md tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:text-white tw:transition-colors",
                      FIX_BUTTON[check.status],
                    )}
                  >
                    {check.fixLabel || "Fix"}
                    {check.deals.length > 1 ? ` ${check.deals.length}` : ""}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Recommended actions */}
      {health.actions.length ? (
        <div>
          <p className="app-label tw:px-1 tw:text-primary">
            Recommended Actions
          </p>
          <div className="tw:mt-2 tw:divide-y tw:divide-slate-100 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:ring-1 tw:ring-slate-100">
            {health.actions.map((action) => (
              <div key={action.key} className="tw:p-4">
                <p className="tw:text-sm tw:font-semibold tw:text-slate-800">
                  {action.title}
                </p>
                {action.detail ? (
                  <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
                    {action.detail}
                  </p>
                ) : null}
                {action.ctaLabel && action.deals.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      callback?.({ action: "run-action", data: action })
                    }
                    className="tw:mt-3 tw:cursor-pointer tw:rounded-md tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-white tw:transition-opacity tw:hover:opacity-90"
                  >
                    {action.ctaLabel}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Health;
