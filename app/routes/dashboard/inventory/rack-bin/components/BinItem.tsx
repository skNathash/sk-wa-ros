import clsx from "clsx";
import React from "react";
import { useTranslation } from "react-i18next";
import type { BinFillStatus } from "../helper";

interface BinItemProps {
  binName: string;
  binId: string;
  items: { name: string; sku: string; quantity: number; id?: string }[];
  capacity: number;
  used: number;
  status: BinFillStatus;
  className?: string;
  animate?: boolean;
  callback: (params: { action: string; data: any }) => void;
}

/**
 * One bin tile in the rack grid. The fill state arrives as a `bin-*` class
 * (see rack-bin.css) which carries both the tint and `--bin-accent`; everything
 * tinted below reads that single variable, so the tile stays colour-agnostic.
 *
 * The tile is deliberately two lines: bin address + item count on top, the
 * bin's lead product + fill percentage underneath. A bin holding more than one
 * product shows the first name with a `+n` tail rather than a stacked list, so
 * every tile in the grid keeps the same height and the rack reads as a column
 * of equal rows.
 */
const BinItem: React.FC<BinItemProps> = ({
  binName,
  binId,
  items,
  capacity,
  used,
  status,
  className,
  animate,
  callback,
}) => {
  const { t } = useTranslation();

  const percent = capacity ? Math.round((used / capacity) * 100) : 0;

  const openBin = () => callback({ action: "view-bin", data: { binId, items } });

  if (status === "empty") {
    return (
      <div
        className={clsx(
          "tw:flex tw:min-h-[68px] tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:border tw:border-dashed tw:p-3",
          className,
        )}
        onClick={openBin}
      >
        <span className="app-label tw:text-slate-500">
          {t("bin")} {binName}
        </span>
        <span className="tw:text-xs tw:text-slate-400">{t("empty")}</span>
      </div>
    );
  }

  const itemCount = items?.length || 0;
  const leadItem = items?.[0];
  const extraItems = Math.max(itemCount - 1, 0);

  return (
    <div
      className={clsx(
        "tw:cursor-pointer tw:rounded-xl tw:border tw:p-3 tw:transition-shadow tw:hover:shadow-sm",
        className,
        animate && "tw:animate-pulse tw:bg-yellow-100!",
      )}
      onClick={openBin}
      title={leadItem?.name}
    >
      {/* Bin address + how much is in it — the two things you scan for. The
          address carries its own "Bin" prefix and trails the row count, so the
          tile reads as "Bin A01, 2 items". */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span className="tw:min-w-0 tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
          {t("bin")} {binName}
          <span className="tw:text-[11px] tw:font-normal tw:text-slate-500">
            , {itemCount}{" "}
            {itemCount === 1
              ? t("item", { defaultValue: "item" })
              : t("items", { defaultValue: "items" })}
          </span>
        </span>
        <span className="app-amount tw:shrink-0 tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-900">
          {used}
        </span>
      </div>

      {/* Lead product + fill percentage, both in the quiet supporting weight. */}
      <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span className="tw:min-w-0 tw:truncate tw:text-xs tw:text-slate-500">
          {leadItem?.name || t("noItems", { defaultValue: "No items" })}
          {extraItems > 0 ? (
            <span className="tw:font-semibold tw:text-slate-400">
              {" "}
              +{extraItems}
            </span>
          ) : null}
        </span>
        <span
          className="tw:shrink-0 tw:text-xs tw:font-semibold tw:tabular-nums"
          style={{ color: "var(--bin-accent)" }}
        >
          {percent}%
        </span>
      </div>
    </div>
  );
};

export default BinItem;
