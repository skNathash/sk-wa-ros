import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
import {
  DELIVERY_STATUS_CARDS,
  getDeliveryStatusCounts,
  type DeliveryStatusCounts,
} from "./helper";

interface DeliveryStatusCardsProps {
  className?: string;
}

/**
 * Delivery stage cards shown in the side pane: one selectable row per status
 * with a coloured badge, title, hint and count. Loads its own counts and owns
 * which stage is selected.
 */
const DeliveryStatusCards = ({ className }: DeliveryStatusCardsProps) => {
  const [counts, setCounts] = useState<DeliveryStatusCounts>();
  const [activeKey, setActiveKey] = useState("packing");

  useEffect(() => {
    let cancelled = false;

    getDeliveryStatusCounts()
      .then((result) => {
        if (!cancelled) setCounts(result);
      })
      .catch(() => {
        if (!cancelled) setCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Cards keep their static look and pick up the live count for their key. */
  const items = useMemo(
    () =>
      DELIVERY_STATUS_CARDS.map((card) => ({
        ...card,
        count: counts?.[card.key as keyof DeliveryStatusCounts],
      })),
    [counts],
  );

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-2", className)}>
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveKey(item.key)}
            aria-current={active ? "true" : undefined}
            className={clsx(
              "tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:rounded-xl tw:border tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors",
              active
                ? clsx(item.theme.activeTile, item.theme.activeTileBorder)
                : "tw:border-slate-200 tw:bg-white tw:hover:bg-slate-50",
            )}
          >
            <div className="tw:min-w-0">
              <span
                className={clsx(
                  "tw:inline-block tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wider",
                  item.theme.badgeBg,
                  item.theme.badgeText,
                )}
              >
                {item.badge}
              </span>
              {/* <p className="tw:mt-1 tw:text-sm tw:font-bold tw:text-slate-900">
                {item.title}
              </p> */}
              <p className="tw:text-xs tw:text-slate-500">{item.hint}</p>
            </div>

            <span
              className={clsx(
                "app-amount tw:shrink-0 tw:text-2xl tw:font-bold tw:tabular-nums",
                active ? item.theme.countText : "tw:text-slate-900",
              )}
            >
              {item.count ?? "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default DeliveryStatusCards;
