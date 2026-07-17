import { CalendarDays, Printer, ScanBarcode } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

export type GroupedRow = {
  key: string;
  mrp: number;
  expiry: string;
  barcode: string;
  totalQuantity: number;
  expired: boolean;
  expiringSoon: boolean;
  lowStock: boolean;
  outOfStock: boolean;
};

interface DesktopViewProps {
  rows: GroupedRow[];
  onPrint: (row: GroupedRow) => void;
}

const headers = [
  { label: "Barcode", key: "barcode" },
  { label: "MRP", key: "mrp", isRightAligned: true },
  { label: "Expiry", key: "expiry" },
  { label: "In stock", key: "qty", isRightAligned: true },
  { label: "", key: "action", isRightAligned: true },
];

const DesktopView: React.FC<DesktopViewProps> = ({ rows, onPrint }) => {
  return (
    <AppTable container>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>

      <AppTable.Body>
        {rows.map((row) => {
          const { expired, expiringSoon, lowStock } = row;
          return (
            <AppTable.Row key={row.key}>
              <AppTable.Cell>
                {row.barcode ? (
                  <span className="tw:inline-flex tw:items-center tw:gap-2">
                    <span className="tw:inline-flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-md tw:bg-slate-50 tw:text-slate-500 tw:ring-1 tw:ring-slate-200">
                      <ScanBarcode size={13} />
                    </span>
                    <span className="tw:font-mono tw:text-[13px] tw:font-medium tw:text-slate-800 tw:tracking-tight">
                      {row.barcode}
                    </span>
                  </span>
                ) : (
                  <span className="tw:text-gray-400 tw:italic">no barcode</span>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right tw:font-semibold tw:text-slate-900 tw:tabular-nums">
                <Amount value={row.mrp} />
              </AppTable.Cell>

              <AppTable.Cell>
                {row.expiry ? (
                  <span
                    className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs ${
                      expired
                        ? "tw:text-red-600 tw:font-medium"
                        : expiringSoon
                          ? "tw:text-amber-700 tw:font-medium"
                          : "tw:text-gray-700"
                    }`}
                  >
                    <CalendarDays size={12} />
                    <DateFormat value={row.expiry} formatStr="dd MMM yyyy" />
                    {expired && (
                      <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-red-100 tw:text-red-700 tw:text-[10px] tw:font-semibold tw:uppercase">
                        Expired
                      </span>
                    )}
                    {!expired && expiringSoon && (
                      <span className="tw:px-1.5 tw:py-0.5 tw:rounded tw:bg-amber-100 tw:text-amber-800 tw:text-[10px] tw:font-semibold tw:uppercase">
                        Soon
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="tw:text-gray-400">—</span>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right tw:tabular-nums">
                <span
                  className={`tw:inline-flex tw:items-baseline tw:gap-1 ${
                    row.totalQuantity === 0
                      ? "tw:text-gray-400"
                      : lowStock
                        ? "tw:text-amber-700"
                        : "tw:text-gray-900"
                  }`}
                >
                  <span className="tw:font-semibold">{row.totalQuantity}</span>
                  <span className="tw:text-[11px] tw:text-gray-500">units</span>
                </span>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right">
                {row.barcode && (
                  <AppButton
                    size="small"
                    color="primary"
                    onClick={() => onPrint(row)}
                  >
                    <Printer size={14} />
                    Print
                  </AppButton>
                )}
              </AppTable.Cell>
            </AppTable.Row>
          );
        })}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
