import { Percent } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppTable from "~/components/core/table/AppTable";
import type { InvoiceTaxSummary } from "../types";

interface TaxSummaryProps {
  taxSummary?: InvoiceTaxSummary;
}

const TaxSummary = ({ taxSummary }: TaxSummaryProps) => {
  const breakup = taxSummary?.breakup ?? [];
  const stats = [
    { label: "CGST", value: taxSummary?.cgst ?? 0 },
    { label: "SGST", value: taxSummary?.sgst ?? 0 },
    { label: "IGST", value: taxSummary?.igst ?? 0 },
  ];

  return (
    <div className="tw:flex tw:flex-col tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:flex tw:items-center tw:gap-2.5 tw:p-3">
        <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-violet-50 tw:text-violet-600">
          <Percent size={16} />
        </div>
        <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-400">
          Tax Summary
        </div>
      </div>

      {/* CGST / SGST / IGST at a glance */}
      <div className="tw:grid tw:grid-cols-3 tw:gap-px tw:border-t tw:border-gray-100 tw:bg-gray-100">
        {stats.map((s) => (
          <div key={s.label} className="tw:bg-white tw:px-3 tw:py-2.5 tw:text-center">
            <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
              {s.label}
            </div>
            <div className="tw:mt-0.5 tw:text-xs tw:font-semibold tw:text-gray-800 tw:tabular-nums">
              <Amount value={s.value} />
            </div>
          </div>
        ))}
      </div>

      {/* Rate-wise breakup */}
      {breakup.length > 0 && (
        <div className="tw:border-t tw:border-gray-100 tw:px-3 tw:py-3">
          <div className="tw:mb-2 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-400">
            Breakup by Rate
          </div>
          <AppTable size="sm" condensed>
            <AppTable.Header>
              <AppTable.Row noHover>
                <AppTable.Cell>Tax Type</AppTable.Cell>
                <AppTable.Cell className="tw:text-right">%</AppTable.Cell>
                <AppTable.Cell className="tw:text-right">
                  Taxable Amt
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right">Tax Amt</AppTable.Cell>
              </AppTable.Row>
            </AppTable.Header>
            <AppTable.Body>
              {breakup.map((item, i) => (
                <AppTable.Row key={i} noHover>
                  <AppTable.Cell>
                    <span className="tw:font-medium tw:text-gray-700">
                      {item.taxType}
                    </span>
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-right tw:tabular-nums">
                    {item.taxPercent}%
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-right tw:tabular-nums">
                    <Amount value={item.taxableAmount} />
                  </AppTable.Cell>
                  <AppTable.Cell className="tw:text-right tw:font-medium tw:tabular-nums">
                    <Amount value={item.taxAmount} />
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

export default TaxSummary;
