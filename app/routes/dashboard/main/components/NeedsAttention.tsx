import {
  ChevronRight,
  CircleCheck,
  Clock,
  Hourglass,
  Package,
  TriangleAlert,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { attentionItems, type AttentionItem } from "../data";

const iconMap: Record<AttentionItem["icon"], LucideIcon> = {
  alert: TriangleAlert,
  check: CircleCheck,
  clock: Clock,
  return: Undo2,
  box: Package,
  hourglass: Hourglass,
};

/** "Needs attention" panel — actionable alerts with counts. */
const NeedsAttention = () => {
  const total = attentionItems.reduce((sum, i) => sum + i.count, 0);

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70">
      <div className="tw:flex tw:items-center tw:justify-between">
        <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
          Needs attention
        </p>
        <span className="tw:flex tw:h-5 tw:min-w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-rose-500 tw:px-1.5 tw:text-[11px] tw:font-bold tw:text-white">
          {total}
        </span>
      </div>

      <ul className="tw:mt-2 tw:space-y-1">
        {attentionItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <li key={item.key}>
              <button
                type="button"
                className="tw:group tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-xl tw:px-2 tw:py-2 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
              >
                <span
                  className={`tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg ${item.tone}`}
                >
                  <Icon className="tw:h-4 tw:w-4" />
                </span>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:flex tw:items-center tw:gap-1.5">
                    <span className="tw:text-sm tw:font-semibold tw:text-slate-800">
                      {item.title}
                    </span>
                    <span className="tw:text-[11px] tw:font-bold tw:text-slate-400">
                      ×{item.count}
                    </span>
                  </div>
                  <p className="tw:truncate tw:text-xs tw:text-slate-500">
                    {item.detail}
                  </p>
                </div>
                <ChevronRight className="tw:h-4 tw:w-4 tw:shrink-0 tw:text-slate-300 tw:transition-transform tw:group-hover:translate-x-0.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NeedsAttention;
