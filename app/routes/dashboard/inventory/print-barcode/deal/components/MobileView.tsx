import { CalendarDays, Printer, ScanBarcode } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import type { GroupedRow } from "./DesktopView";

interface MobileViewProps {
  rows: GroupedRow[];
  onPrint: (row: GroupedRow) => void;
}

const Field: React.FC<{
  label: string;
  align?: "left" | "right";
  children: React.ReactNode;
}> = ({ label, align = "left", children }) => (
  <div
    className={`tw:flex tw:flex-col tw:gap-0.5 ${
      align === "right" ? "tw:items-end tw:text-right" : "tw:items-start"
    }`}
  >
    <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.08em] tw:text-gray-400">
      {label}
    </span>
    <span className="tw:text-sm tw:text-gray-900">{children}</span>
  </div>
);

const MobileView: React.FC<MobileViewProps> = ({ rows, onPrint }) => {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:md:grid-cols-3 tw:gap-3">
      {rows.map((row) => {
        const { expired, expiringSoon, outOfStock, lowStock } = row;

        return (
          <div
            key={row.key}
            className="tw:relative tw:flex tw:flex-col tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:transition tw:hover:border-gray-300"
          >
            <div className="tw:flex tw:flex-1 tw:flex-col tw:p-4">
              {/* Header: barcode hero */}
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:pb-3 tw:border-b tw:border-dashed tw:border-gray-200">
                <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                  <ScanBarcode
                    size={14}
                    className="tw:text-gray-500 tw:shrink-0"
                  />
                  <span className="tw:font-mono tw:text-[13px] tw:font-medium tw:tracking-tight tw:text-gray-900 tw:truncate">
                    {row.barcode || (
                      <span className="tw:font-sans tw:italic tw:text-gray-400 tw:font-normal">
                        no barcode
                      </span>
                    )}
                  </span>
                </div>

                {row.source === "deal" && (
                  <span className="tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-600 tw:ring-1 tw:ring-inset tw:ring-slate-200">
                    Catalog
                  </span>
                )}

                {expired && (
                  <span className="tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-red-700 tw:ring-1 tw:ring-inset tw:ring-red-200">
                    Expired
                  </span>
                )}
                {!expired && expiringSoon && (
                  <span className="tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-amber-700 tw:ring-1 tw:ring-inset tw:ring-amber-200">
                    Soon
                  </span>
                )}
              </div>

              {/* Body: data grid */}
              <div className="tw:grid tw:grid-cols-2 tw:gap-x-4 tw:gap-y-3 tw:py-3">
                <Field label="MRP">
                  <span className="tw:font-semibold tw:tabular-nums">
                    <Amount value={row.mrp} />
                  </span>
                </Field>

                <Field label="In stock" align="right">
                  <span
                    className={`tw:inline-flex tw:items-baseline tw:gap-1 tw:tabular-nums ${
                      outOfStock
                        ? "tw:text-gray-400"
                        : lowStock
                          ? "tw:text-amber-700"
                          : "tw:text-gray-900"
                    }`}
                  >
                    <span className="tw:font-semibold tw:text-base tw:leading-none">
                      {row.totalQuantity}
                    </span>
                    <span className="tw:text-[11px] tw:text-gray-500">
                      units
                    </span>
                  </span>
                </Field>

                <Field label="Expiry">
                  {row.expiry ? (
                    <span
                      className={`tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] ${
                        expired
                          ? "tw:text-red-600 tw:font-medium"
                          : expiringSoon
                            ? "tw:text-amber-700 tw:font-medium"
                            : "tw:text-gray-700"
                      }`}
                    >
                      <CalendarDays size={12} className="tw:shrink-0" />
                      <DateFormat value={row.expiry} formatStr="dd MMM yyyy" />
                    </span>
                  ) : (
                    <span className="tw:text-gray-400">—</span>
                  )}
                </Field>

                <div className="tw:flex tw:items-end tw:justify-end">
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
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
