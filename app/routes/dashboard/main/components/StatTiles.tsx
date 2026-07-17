import { Clock, ReceiptText, Star, Wallet, type LucideIcon } from "lucide-react";
import { statTiles, type StatTile } from "../data";

const iconMap: Record<StatTile["icon"], LucideIcon> = {
  receipt: ReceiptText,
  wallet: Wallet,
  clock: Clock,
  star: Star,
};

/** Row of four headline stat tiles (Bills, On khata, Peak hour, Top seller). */
const StatTiles = () => {
  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-4">
      {statTiles.map((tile) => {
        const Icon = iconMap[tile.icon];
        return (
          <div
            key={tile.key}
            className="tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-slate-200/70"
          >
            <div className="tw:flex tw:items-center tw:gap-2">
              <span
                className={`tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-lg ${tile.tone}`}
              >
                <Icon className="tw:h-4 tw:w-4" />
              </span>
              <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
                {tile.label}
              </span>
            </div>
            <p className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-slate-900">
              {tile.value}
            </p>
            <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
              {tile.hint}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatTiles;
