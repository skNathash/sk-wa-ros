import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import CommonService from "~/services/CommonService";
import { pnlPalette } from "~/shared/accounts/pnl-format";
import {
  emptyProfitDrivers,
  getProfitDrivers,
  type ProfitDriver,
  type ProfitDriversData,
} from "./helper";

/**
 * Six-point sparkline under a category name. It is drawn inline rather than
 * with the chart library: at this size a chart wrapper costs more than the
 * polyline it would render, and the row only needs the shape of the trend.
 */
const Sparkline = ({ item }: { item: ProfitDriver }) => {
  const points = item.trend;
  if (points.length < 2) return null;

  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 20 - ((value - min) / span) * 18;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 22"
      preserveAspectRatio="none"
      className="tw:h-5 tw:w-24"
      aria-hidden="true"
    >
      <polyline
        points={path}
        fill="none"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        stroke={item.declining ? pnlPalette.revenue : pnlPalette.profit}
      />
    </svg>
  );
};

// The five categories carrying the month's gross profit, so the next buying
// decision starts from what is actually earning.
const ProfitDrivers = () => {
  const { t } = useTranslation(["common"]);

  const [data, setData] = useState<ProfitDriversData>(emptyProfitDrivers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: ProfitDriversData;
      try {
        result = await getProfitDrivers();
      } catch (e) {
        result = emptyProfitDrivers();
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

  const headers: TableHeaderItem[] = [
    { label: t("category"), key: "category", width: "46%" },
    {
      label: t("pnlRevShort", { defaultValue: "Rev" }),
      key: "revenue",
      width: "18%",
      isRightAligned: true,
    },
    {
      label: t("pnlGpShort", { defaultValue: "GP" }),
      key: "grossProfit",
      width: "18%",
      isRightAligned: true,
    },
    {
      label: t("margin", { defaultValue: "Margin" }),
      key: "margin",
      width: "18%",
      isRightAligned: true,
    },
  ];

  return (
    <div className="tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:px-4 tw:py-3">
        <div className="tw:text-sm tw:font-bold tw:text-gray-800">
          {t("pnlTopDrivers", { defaultValue: "Top 5 profit drivers" })}
        </div>
        <div className="tw:text-[11px] tw:text-gray-400">{data.note}</div>
      </div>

      {loading ? (
        <div className="tw:p-6 tw:text-center">
          <AppSpinner />
        </div>
      ) : (
        <AppTable size="sm" fixedLayout>
          <AppTable.Header>
            <TableHeader headers={headers} />
          </AppTable.Header>
          <AppTable.Body>
            {data.items.map((item) => (
              <AppTable.Row key={item.key}>
                <AppTable.Cell>
                  <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
                    {item.label}
                  </div>
                  <Sparkline item={item} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right tw:text-xs tw:text-gray-600">
                  {CommonService.formatCompact(item.revenue)}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right tw:text-xs tw:font-bold tw:text-emerald-700">
                  {CommonService.formatCompact(item.grossProfit)}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right tw:text-xs tw:text-gray-600">
                  {item.margin}%
                </AppTable.Cell>
              </AppTable.Row>
            ))}
          </AppTable.Body>
        </AppTable>
      )}
    </div>
  );
};

export default ProfitDrivers;
