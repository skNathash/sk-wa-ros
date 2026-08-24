import clsx from "clsx";
import { CalendarDays, ShoppingBag, TrendingUp, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import {
  fetchProfileStats,
  SALES_WINDOW_DAYS,
  type ProfileOverviewModel,
  type ProfileStats,
} from "./helper";

interface ProfileStatTilesProps {
  model: ProfileOverviewModel;
}

const EMPTY_STATS: ProfileStats = {
  salesAmount: 0,
  orders: 0,
  staffTotal: 0,
  staffLabel: "",
};

/** How the store is doing — since it joined, and over the last window. */
const ProfileStatTiles: React.FC<ProfileStatTilesProps> = ({ model }) => {
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);

  useEffect(() => {
    let cancelled = false;
    fetchProfileStats().then((next) => {
      if (!cancelled) setStats(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    {
      key: "joined",
      icon: CalendarDays,
      label: "Joined",
      value: model.tenure || "—",
      hint: model.registeredOn,
      accent: "tw:bg-emerald-50 tw:text-emerald-600",
    },
    {
      key: "sales",
      icon: TrendingUp,
      label: `Sales · ${SALES_WINDOW_DAYS}d`,
      value: <Amount value={stats.salesAmount} decimalPlaces={0} />,
      hint: `last ${SALES_WINDOW_DAYS} days`,
      accent: "tw:bg-amber-50 tw:text-amber-600",
    },
    {
      key: "orders",
      icon: ShoppingBag,
      label: "Orders",
      value: stats.orders.toLocaleString(),
      hint: "B2C + B2B · lifetime",
      accent: "tw:bg-blue-50 tw:text-blue-600",
    },
    {
      key: "staff",
      icon: Users,
      label: "Staff",
      value: String(stats.staffTotal),
      hint: stats.staffLabel,
      accent: "tw:bg-violet-50 tw:text-violet-600",
    },
  ];

  return (
    <div className="tw:grid tw:h-full tw:grid-cols-2 tw:gap-3 tw:xl:grid-cols-4">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.key}
            className="tw:flex tw:flex-col tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4"
          >
            {/* The icon box sets this row's height, so every tile's value
                line lands on the same baseline even when a label wraps. */}
            <div className="tw:flex tw:min-h-8 tw:items-center tw:gap-2">
              <span
                className={clsx(
                  "tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                  tile.accent,
                )}
              >
                <Icon className="tw:h-4 tw:w-4" />
              </span>
              <span className="tw:min-w-0 tw:text-[10px] tw:font-bold tw:uppercase tw:leading-tight tw:tracking-wider tw:text-gray-400">
                {tile.label}
              </span>
            </div>
            <div className="tw:mt-3 tw:truncate tw:text-xl/7 tw:font-bold tw:tabular-nums tw:text-gray-900">
              {tile.value}
            </div>
            <div className="tw:mt-auto tw:truncate tw:pt-1 tw:text-[11px] tw:leading-4 tw:text-gray-500">
              {tile.hint || " "}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileStatTiles;
