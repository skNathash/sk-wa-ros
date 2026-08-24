import clsx from "clsx";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import NoData from "~/components/core/no-data/NoData";
import type { FilledBinListItem } from "../../helper";

type FilledBinListProps = {
  bins: FilledBinListItem[];
  callback: (bin: {
    rackName: string;
    binName: string;
    binCode?: string;
    binId: string | number;
  }) => void;
  loading?: boolean;
  className?: string;
  /**
   * Bin the surrounding page is already on (the bin view passes the bin in the
   * route). Seeds the highlighted row until the user picks another one.
   */
  activeBinId?: string | number | null;
};

const FilledBinList: React.FC<FilledBinListProps> = ({
  bins,
  callback,
  loading = false,
  className = "",
  activeBinId = null,
}) => {
  const { t } = useTranslation();

  // Row the user last jumped to — the grid scrolls away from the pane, so the
  // list keeps its own marker of "where you are".
  const [selectedBinId, setSelectedBinId] = useState<string | number | null>(
    null,
  );

  const highlightedBinId = selectedBinId ?? activeBinId;

  // Totals across the listed bins.
  const totalItems = bins.reduce((sum, bin) => sum + (bin.itemCount || 0), 0);

  return (
    <div className={clsx(className)}>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-8">
          <div className="tw:h-5 tw:w-5 tw:animate-spin tw:rounded-full tw:border-2 tw:border-primary tw:border-t-transparent" />
        </div>
      ) : bins.length === 0 ? (
        <NoData />
      ) : (
        <>
          {/* Summary strip. Sticks to the top of the pane's scroll viewport so
              the totals stay readable while the (long) bin list scrolls.
              `app-bleed-x` cancels the pane gutter so the hairline under it
              runs the full width of the pane instead of stopping short. */}
          <div className="app-bleed-x tw:sticky tw:top-0 tw:z-10 tw:mb-1 tw:flex tw:items-center tw:gap-4 tw:border-b tw:border-slate-100 tw:bg-white/95 tw:px-4 tw:py-2.5 tw:backdrop-blur">
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-lg tw:font-bold tw:leading-none tw:tabular-nums tw:text-slate-900">
                {bins.length}
              </span>
              <span className="tw:mt-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
                {t("filledBins")}
              </span>
            </div>
            <span className="tw:h-7 tw:w-px tw:bg-slate-200" />
            <div className="tw:flex tw:flex-col">
              <span className="tw:text-lg tw:font-bold tw:leading-none tw:tabular-nums tw:text-slate-900">
                {totalItems}
              </span>
              <span className="tw:mt-1 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
                {t("totalItems")}
              </span>
            </div>
          </div>

          {/* The bleed lives on the list wrapper, not on each row: a `<button>`
              sizes shrink-to-fit at `width: auto`, so the rows stay `w-full` of
              this (widened) block and keep their 1rem inner padding. */}
          <div className="app-bleed-x">
            {bins.map((bin) => {
              const itemLabel =
                bin.itemCount === 1
                  ? t("item", { defaultValue: "item" })
                  : t("items", { defaultValue: "items" });
              const selected =
                highlightedBinId != null &&
                String(highlightedBinId) === String(bin.binId);

              return (
                <button
                  key={`${bin.rackName}-${bin.binName}`}
                  type="button"
                  onClick={() => {
                    setSelectedBinId(bin.binId);
                    callback({
                      rackName: bin.rackName,
                      binName: bin.binName,
                      binCode: bin.binCode,
                      binId: bin.binId,
                    });
                  }}
                  className={clsx(
                    // The 1rem the wrapper's bleed drops is put back inside the
                    // row, so the text keeps its inset while the background and
                    // the bottom hairline run edge to edge.
                    "tw:group tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-4 tw:py-2.5 tw:text-left tw:transition-colors",
                    // The row carries only the accent variable, so the percentage
                    // pill and the fill bar pick up the status hue without
                    // tinting the whole row.
                    bin.accentClass,
                    selected
                      ? "tw:bg-slate-100"
                      : "tw:bg-white tw:hover:bg-slate-50",
                  )}
                >
                  <span
                    className={clsx(
                      "tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:text-sm tw:font-bold",
                      // Tints the rack-initials block with the status hue.
                      bin.statusClass,
                    )}
                  >
                    {bin.initials}
                  </span>

                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                      <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                        {t("bin", { defaultValue: "Bin" })} {bin.displayName}
                      </span>
                      <span
                        className="tw:shrink-0 tw:rounded-full tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:tabular-nums"
                        style={{
                          color: "var(--bin-accent)",
                          backgroundColor:
                            "color-mix(in srgb, var(--bin-accent) 12%, transparent)",
                        }}
                      >
                        {bin.percentageFilled}%
                      </span>
                    </div>

                    {/* Fill bar — the row's at-a-glance capacity read. */}
                    <span className="tw:mt-1.5 tw:block tw:h-1 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                      <span
                        className="tw:block tw:h-full tw:rounded-full"
                        style={{
                          width: `${bin.barWidth}%`,
                          backgroundColor: "var(--bin-accent)",
                        }}
                      />
                    </span>

                    <div className="tw:mt-1 tw:flex tw:items-center tw:justify-between tw:gap-2">
                      <span className="tw:truncate tw:text-xs tw:text-slate-500">
                        {bin.label || "-"}
                      </span>
                      <span className="tw:shrink-0 tw:text-[11px] tw:font-medium tw:text-slate-400 tw:tabular-nums">
                        {bin.itemCount} {itemLabel}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FilledBinList;
