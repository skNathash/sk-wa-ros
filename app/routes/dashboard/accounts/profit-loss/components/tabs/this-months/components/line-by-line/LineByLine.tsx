import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import {
  emptyLineByLine,
  getLineByLine,
  type LineByLineData,
  type LineByLineRow,
} from "./helper";

// Every line of the P&L against the month before and the same month last year —
// the block to open when the headline number needs to be argued with.
const LineByLine = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<LineByLineData>(emptyLineByLine);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: LineByLineData;
      try {
        result = await getLineByLine();
      } catch (e) {
        result = emptyLineByLine();
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

  const rowClass = (row: LineByLineRow) => (row.total ? "tw:bg-emerald-50" : "");

  /* The item column stays put while the money columns scroll past it, so it
     carries its own opaque background rather than borrowing the row's. */
  const labelClass = (row: LineByLineRow) =>
    clsx(
      "tw:sticky tw:left-0 tw:z-10 tw:text-xs",
      row.total
        ? "tw:bg-emerald-50 tw:font-bold tw:text-emerald-700"
        : "tw:bg-white tw:font-medium tw:text-gray-700",
    );

  /** Money and movement columns: one line each, digits on a shared grid. */
  const numberClass = (extra: string) =>
    clsx("tw:whitespace-nowrap tw:text-right tw:text-xs tw:tabular-nums", extra);

  /* The period columns are named by the API response, so the header list is
     built from the same data as the rows. */
  const headers: TableHeaderItem[] = [
    {
      label: t("item", { defaultValue: "Item" }),
      key: "item",
      className: "tw:bg-slate-50 tw:sticky tw:left-0 tw:z-20",
    },
    {
      label: data.columns.current,
      key: "current",
      isRightAligned: true,
      className: "tw:bg-slate-50 tw:whitespace-nowrap",
    },
    {
      label: data.columns.previous,
      key: "previous",
      isRightAligned: true,
      className: "tw:bg-slate-50 tw:whitespace-nowrap",
    },
    {
      label: data.columns.lastYear,
      key: "lastYear",
      isRightAligned: true,
      className: "tw:bg-slate-50 tw:whitespace-nowrap",
    },
    {
      label: t("pnlMom", { defaultValue: "MoM" }),
      key: "mom",
      isRightAligned: true,
      className: "tw:bg-slate-50 tw:whitespace-nowrap",
    },
    {
      label: t("pnlYoy", { defaultValue: "YoY" }),
      key: "yoy",
      isRightAligned: true,
      className: "tw:bg-slate-50 tw:whitespace-nowrap",
    },
  ];

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:truncate tw:text-sm tw:font-bold tw:text-gray-800">
          {data.title}
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
        /* The five money columns don't fold usefully on a phone, so the table
           scrolls sideways instead of being restacked. The column widths are
           left to the browser — fixing them clipped the movement figures. */
        <div className="tw:overflow-x-auto thin-scrollbar">
          <AppTable size="sm" minWidth="640px">
            <AppTable.Header>
              <TableHeader headers={headers} />
            </AppTable.Header>
            <AppTable.Body>
              {data.rows.map((row) => (
                <AppTable.Row key={row.key} className={rowClass(row)}>
                  <AppTable.Cell className={labelClass(row)}>
                    {row.label}
                  </AppTable.Cell>
                  <AppTable.Cell
                    className={numberClass(
                      row.total
                        ? "tw:font-bold tw:text-emerald-700"
                        : "tw:font-bold tw:text-gray-900",
                    )}
                  >
                    <Amount value={row.current} decimalPlaces={0} />
                  </AppTable.Cell>
                  <AppTable.Cell className={numberClass("tw:text-gray-400")}>
                    <Amount value={row.previous} decimalPlaces={0} />
                  </AppTable.Cell>
                  <AppTable.Cell className={numberClass("tw:text-gray-400")}>
                    <Amount value={row.lastYear} decimalPlaces={0} />
                  </AppTable.Cell>
                  <AppTable.Cell
                    className={numberClass(
                      clsx("tw:font-semibold", row.momClass),
                    )}
                  >
                    {row.momText}
                  </AppTable.Cell>
                  <AppTable.Cell
                    className={numberClass(
                      clsx("tw:font-semibold", row.yoyClass),
                    )}
                  >
                    {row.yoyText}
                  </AppTable.Cell>
                </AppTable.Row>
              ))}
            </AppTable.Body>
          </AppTable>
        </div>
      )}
    </div>
  );
};

export default LineByLine;
