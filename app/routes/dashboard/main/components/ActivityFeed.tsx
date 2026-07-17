import { IndianRupee } from "lucide-react";
import { activityItems, type ActivityItem } from "../data";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Chat-style "Today's activity" feed. Bills align right; alerts align left. */
const ActivityFeed = ({ withHeading = true }: { withHeading?: boolean }) => {
  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      {withHeading && (
        <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between">
          <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
            Today's activity
          </h3>
          <button
            type="button"
            className="tw:text-xs tw:font-semibold tw:text-emerald-600 tw:hover:underline"
          >
            View all
          </button>
        </div>
      )}
      <ul className="tw:space-y-2.5">
        {activityItems.map((item) => (
          <ActivityRow key={item.key} item={item} />
        ))}
      </ul>
    </div>
  );
};

const ActivityRow = ({ item }: { item: ActivityItem }) => {
  // Bills are outgoing "receipts" — align to the right as a green bubble.
  if (item.kind === "bill") {
    return (
      <li className="tw:flex tw:justify-end">
        <div className="tw:flex tw:max-w-[80%] tw:items-center tw:gap-2.5 tw:rounded-2xl tw:rounded-tr-sm tw:bg-emerald-50 tw:px-3 tw:py-2">
          <span className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-600 tw:text-white">
            <IndianRupee className="tw:h-4 tw:w-4" />
          </span>
          <div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
                {item.title}
              </span>
              {item.amount != null && (
                <span className="tw:text-sm tw:font-bold tw:text-emerald-700">
                  {inr(item.amount)}
                </span>
              )}
            </div>
            <p className="tw:text-[11px] tw:text-slate-500">
              {item.meta} · {item.time}
            </p>
          </div>
        </div>
      </li>
    );
  }

  const config = {
    khata: { bubble: "tw:bg-amber-50", badge: "tw:bg-amber-500", amount: "tw:text-amber-700" },
    paid: { bubble: "tw:bg-emerald-50", badge: "tw:bg-emerald-600", amount: "tw:text-emerald-700" },
    lowStock: { bubble: "tw:bg-rose-50", badge: "tw:bg-rose-500", amount: "" },
    approve: { bubble: "tw:bg-indigo-50", badge: "tw:bg-indigo-500", amount: "" },
  }[item.kind];

  const badgeChar =
    item.kind === "khata"
      ? item.avatar
      : item.kind === "paid"
        ? "✓"
        : item.kind === "lowStock"
          ? "!"
          : "?";

  return (
    <li className="tw:flex tw:justify-start">
      <div
        className={`tw:flex tw:max-w-[80%] tw:items-center tw:gap-2.5 tw:rounded-2xl tw:rounded-tl-sm tw:px-3 tw:py-2 ${config.bubble}`}
      >
        <span
          className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-sm tw:font-bold tw:text-white ${config.badge}`}
        >
          {badgeChar}
        </span>
        <div>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
              {item.title}
            </span>
            {item.amount != null && (
              <span className={`tw:text-sm tw:font-bold ${config.amount}`}>
                {inr(item.amount)}
              </span>
            )}
          </div>
          <p className="tw:text-[11px] tw:text-slate-500">
            {item.meta} · {item.time}
          </p>
        </div>
      </div>
    </li>
  );
};

export default ActivityFeed;
