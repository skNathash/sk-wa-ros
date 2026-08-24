import clsx from "clsx";
import { formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import { CheckCircle2, ChevronRight, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import {
  getApprovalRequests,
  type PaylaterApprovalKind,
  type PaylaterApprovalRow,
} from "./helper";

/** Avatar tints, cycled so adjacent rows stay distinguishable. */
const AVATAR_TONES = [
  "tw:bg-indigo-600",
  "tw:bg-emerald-600",
  "tw:bg-amber-600",
  "tw:bg-sky-600",
];

const initialsOf = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** "3d ago" for a timestamp the API sends, or nothing if it is unusable. */
const relativeLabel = (value?: string) => {
  if (!value) return "";
  try {
    const date = parseISO(value);
    if (!isValid(date)) return "";
    return `${formatDistanceToNowStrict(date)} ago`;
  } catch (e) {
    return "";
  }
};

/** Header label + icon per queue. */
const KIND_META: Record<
  PaylaterApprovalKind,
  { label: string; icon: React.ReactNode; empty: string }
> = {
  pending: {
    label: "Approval pending",
    icon: <Clock size={12} />,
    empty: "Nothing waiting on a decision",
  },
  approved: {
    label: "Recently approved",
    icon: <CheckCircle2 size={12} />,
    empty: "No approvals yet",
  },
};

interface PaylaterApprovalsProps {
  /** Which queue this block lists. Defaults to the one that needs work. */
  kind?: PaylaterApprovalKind;
  /** Rows shown. */
  limit?: number;
  /** Show the footer link into the full approvals page. Defaults to true. */
  showSeeAll?: boolean;
  className?: string;
}

/**
 * One approval list for the PayLater pane — either the requests still waiting
 * on a decision (oldest first, the order they should be worked) or the ones
 * just approved (newest first). Rows link into the request view; the footer
 * opens the full approvals page.
 */
const PaylaterApprovals = ({
  kind = "pending",
  limit = 5,
  showSeeAll = true,
  className,
}: PaylaterApprovalsProps) => {
  const appNav = useAppNav();

  const [rows, setRows] = useState<PaylaterApprovalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchRows = async () => {
      setLoading(true);
      try {
        const page = await getApprovalRequests(kind, limit);
        if (!mounted) return;
        setRows(page.rows);
        setTotal(page.total);
      } catch (e) {
        if (!mounted) return;
        setRows([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRows();
    return () => {
      mounted = false;
    };
  }, [kind, limit]);

  const handleOpen = useCallback(
    (row: PaylaterApprovalRow) => appNav.to(row.href),
    [appNav],
  );

  const handleSeeAll = useCallback(
    () => appNav.to("/dashboard/paylater/approvals", { tab: "approvals" }),
    [appNav],
  );

  const isPending = kind === "pending";
  const meta = KIND_META[kind];

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      {/* Header — the section label with how deep the queue is. */}
      <div className="tw:flex tw:items-center tw:gap-1.5">
        <span
          className={clsx(
            isPending ? "tw:text-amber-500" : "tw:text-emerald-500",
          )}
        >
          {meta.icon}
        </span>
        <p className="app-pane-label">
          {meta.label}
          {total ? ` · ${total}` : ""}
        </p>
      </div>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:gap-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="tw:h-13 tw:animate-pulse tw:rounded-xl tw:bg-slate-100"
            />
          ))}
        </div>
      ) : !rows.length ? (
        <p className="tw:rounded-xl tw:bg-slate-50 tw:px-2.5 tw:py-3 tw:text-center tw:text-[11px] tw:text-slate-400">
          {meta.empty}
        </p>
      ) : (
        <div className="tw:flex tw:flex-col tw:divide-y tw:divide-slate-100">
          {rows.map((row, index) => (
            <button
              key={row.id}
              type="button"
              onClick={() => handleOpen(row)}
              className="tw:flex tw:w-full tw:items-center tw:gap-2.5 tw:rounded-xl tw:px-1 tw:py-2.5 tw:text-left tw:hover:bg-slate-50"
            >
              <div
                className={clsx(
                  "tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                  AVATAR_TONES[index % AVATAR_TONES.length],
                )}
              >
                {initialsOf(row.userName)}
              </div>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:flex tw:items-center tw:gap-1.5">
                  <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                    {row.userName}
                  </p>
                  {row.userCategory && (
                    <span className="tw:shrink-0 tw:rounded-full tw:bg-slate-100 tw:px-1.5 tw:py-0.5 tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-500">
                      {row.userCategory}
                    </span>
                  )}
                </div>
                <p
                  className={clsx(
                    "tw:mt-0.5 tw:truncate tw:text-[11px] tw:font-medium",
                    isPending ? "tw:text-amber-600" : "tw:text-emerald-600",
                  )}
                >
                  {/* Pending rows lead with what still blocks them — KYC —
                      while approved rows just say when they cleared. */}
                  {isPending
                    ? `KYC ${row.kycStatus || "-"}`
                    : "Approved"}
                  {relativeLabel(row.date) ? ` · ${relativeLabel(row.date)}` : ""}
                </p>
              </div>

              <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-1">
                {row.amount > 0 && (
                  <span className="tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-800">
                    <Amount value={row.amount} decimalPlaces={0} />
                  </span>
                )}
                <ChevronRight size={16} className="tw:text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      )}

      {showSeeAll && (
        <AppButton
          size="small"
          color="light"
          fill="outline"
          className="tw:w-full"
          onClick={handleSeeAll}
        >
          Open approval queue
        </AppButton>
      )}
    </div>
  );
};

export default PaylaterApprovals;
