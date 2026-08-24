import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import CommonService from "~/services/CommonService";
import type { TableHeaderItem } from "~/types/CommonTypes";
import {
  emptySeasonality,
  getSeasonality,
  type SeasonalityData,
} from "./helper";

/**
 * Cell fill for a margin, scaled against the best and worst month on the grid
 * rather than against a fixed range — a shop working at 17–22% and one working
 * at 4–9% both need the same amount of contrast to read their own seasons.
 */
const cellStyle = (margin: number, low: number, high: number) => {
  const span = high - low || 1;
  const weight = Math.min(1, Math.max(0, (margin - low) / span));
  /* 0.35 → 0.9 opacity: even the weakest month stays clearly filled, so an
     empty cell is unmistakably "no data" and not "a bad month". */
  const alpha = 0.35 + weight * 0.55;

  return {
    background: `rgba(16, 145, 96, ${alpha.toFixed(2)})`,
    color: weight > 0.55 ? "#ffffff" : "#065f46",
  };
};

/**
 * Two financial years of margin, month by month, so the shape of the shop's
 * year is visible at a glance — which months carry it, which ones need cash put
 * aside, and whether this year is running ahead of the last.
 */
const SeasonalityHeatmap = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<SeasonalityData>(emptySeasonality);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: SeasonalityData;
      try {
        result = await getSeasonality();
      } catch (e) {
        result = emptySeasonality();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const margins = data.rows
    .flatMap((row) => row.cells)
    .map((cell) => cell.margin)
    .filter((margin): margin is number => margin !== null);

  const low = margins.length ? Math.min(...margins) : 0;
  const high = margins.length ? Math.max(...margins) : 0;

  /* The year label leads the row, then one column per month on the grid. */
  const headers: TableHeaderItem[] = [
    { label: "", key: "year", width: "48px", className: "tw:bg-transparent" },
    ...data.months.map((month) => ({
      label: month,
      key: month,
      isCentered: true,
      className:
        "tw:bg-transparent tw:pb-1 tw:text-[11px] tw:font-normal tw:text-gray-500",
    })),
  ];

  return (
    <div className="tw:mb-3 tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlSeasonality", {
            defaultValue: "Seasonality heatmap · margin % by month",
          })}
        </div>
        <div className="tw:shrink-0 tw:text-[11px] tw:text-gray-400">
          {data.note}
        </div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <>
          {/* Twelve columns don't fold to a phone, so the grid scrolls sideways
              with the year labels leading each row. */}
          <div className="tw:overflow-x-auto tw:px-4 tw:pt-3">
            <AppTable
              size="sm"
              minWidth="760px"
              className="tw:border-separate tw:border-spacing-1"
            >
              <AppTable.Header>
                <TableHeader headers={headers} noBg />
              </AppTable.Header>
              <AppTable.Body>
                {data.rows.map((row) => (
                  <AppTable.Row key={row.key} noHover className="tw:border-0">
                    <AppTable.Cell className="tw:p-0 tw:pr-2 tw:text-xs tw:font-bold tw:text-gray-700">
                      {row.label}
                    </AppTable.Cell>
                    {row.cells.map((cell) => (
                      <AppTable.Cell
                        key={`${row.key}-${cell.month}`}
                        className="tw:p-0"
                      >
                        {cell.margin === null ? (
                          <div className="tw:rounded-md tw:bg-gray-50 tw:py-2 tw:text-center tw:text-xs tw:text-gray-300">
                            —
                          </div>
                        ) : (
                          <div
                            className="tw:rounded-md tw:py-2 tw:text-center tw:text-xs tw:font-semibold"
                            style={cellStyle(cell.margin, low, high)}
                          >
                            {CommonService.roundedByDecimalPlace(cell.margin, 2)}%
                          </div>
                        )}
                      </AppTable.Cell>
                    ))}
                  </AppTable.Row>
                ))}
              </AppTable.Body>
            </AppTable>
          </div>

          {/* What the grid is saying, in words — the part a seller can act on. */}
          {data.read && (
            <div className="tw:px-4 tw:py-3 tw:text-[11px] tw:text-gray-500">
              <span className="tw:font-bold tw:text-gray-700">
                {t("pnlRead", { defaultValue: "Read:" })}
              </span>{" "}
              {data.read}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SeasonalityHeatmap;
