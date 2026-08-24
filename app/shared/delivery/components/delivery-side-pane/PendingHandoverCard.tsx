import clsx from "clsx";
import { ChevronRight, IndianRupee } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import useAppNav from "~/hooks/useAppNav";
import { getPendingHandover, type PendingHandover } from "./helper";

interface PendingHandoverCardProps {
  className?: string;
}

/**
 * Cash the riders are still holding. The amount is the same "Pending Handover"
 * figure the COD reconciliation page shows on its summary, so the pane never
 * disagrees with the page it opens. Tapping it goes there to settle up.
 */
const PendingHandoverCard = ({ className }: PendingHandoverCardProps) => {
  const appNav = useAppNav();

  const [handover, setHandover] = useState<PendingHandover>();

  useEffect(() => {
    let cancelled = false;

    getPendingHandover()
      .then((result) => {
        if (!cancelled) setHandover(result);
      })
      .catch(() => {
        if (!cancelled) setHandover({ count: 0, amount: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!handover) {
    return (
      <div className={clsx("skeleton-loader tw:h-16 tw:rounded-xl", className)} />
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        appNav.to("/dashboard/delivery/cod-reconciliation", {
          tab: "cod-reconciliation",
        })
      }
      className={clsx(
        "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-xl tw:bg-orange-50 tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors tw:hover:bg-orange-100",
        className,
      )}
    >
      <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-orange-100 tw:text-orange-600">
        <IndianRupee size={16} />
      </span>

      <span className="tw:min-w-0 tw:flex-1">
        <span className="app-amount tw:block tw:text-lg tw:font-bold tw:leading-none tw:tabular-nums tw:text-orange-600">
          <Amount value={handover.amount} showSymbol />
        </span>
        <span className="tw:mt-1 tw:block tw:truncate tw:text-[11px] tw:font-bold tw:tracking-wide tw:text-orange-700">
          Pending Handover
        </span>
        <span className="tw:mt-0.5 tw:block tw:truncate tw:text-[11px] tw:text-slate-500">
          {handover.count} {handover.count === 1 ? "settlement" : "settlements"}{" "}
          to collect
        </span>
      </span>

      <ChevronRight size={16} className="tw:shrink-0 tw:text-orange-400" />
    </button>
  );
};

export default PendingHandoverCard;
