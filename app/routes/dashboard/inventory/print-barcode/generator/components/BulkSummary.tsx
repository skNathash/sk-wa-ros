import { Boxes, X } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import type { BulkBarcodeItem } from "../helper";

type Props = {
  items: BulkBarcodeItem[];
  onRemove?: (item: BulkBarcodeItem) => void;
};

const BulkSummary: React.FC<Props> = ({ items, onRemove }) => {
  const totalLabels = items.reduce(
    (sum, it) => sum + Math.max(Number(it.quantity) || 1, 1),
    0,
  );
  const canRemove = items.length > 1;

  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-slate-50/80">
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-200 tw:px-3 tw:py-2.5">
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-slate-900">
          <span className="tw:inline-flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary/10 tw:text-primary">
            <Boxes size={15} />
          </span>
          {items.length} {items.length === 1 ? "product" : "products"}
        </div>
        <span className="tw:text-[11px] tw:text-slate-500">
          {totalLabels} {totalLabels === 1 ? "label" : "labels"}
        </span>
      </div>
      <AppScrollArea className="tw:[&_[data-slot=scroll-area-viewport]]:max-h-64">
        <div className="tw:divide-y tw:divide-slate-200">
          {items.map((it) => (
            <div
              key={`${it.id}-${it.barcode}`}
              className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2"
            >
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-[13px] tw:font-medium tw:text-slate-800">
                  {it.name || "—"}
                </div>
                <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:text-[11px] tw:text-slate-500">
                  <span className="tw:font-mono">{it.barcode}</span>
                  {Number(it.mrp) > 0 && (
                    <span>
                      MRP{" "}
                      <Amount
                        value={Number(it.mrp)}
                        decimalPlaces={2}
                        showSymbol
                      />
                    </span>
                  )}
                </div>
              </div>
              <span className="tw:shrink-0 tw:rounded-md tw:bg-white tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-slate-600 tw:ring-1 tw:ring-slate-200">
                ×{Math.max(Number(it.quantity) || 1, 1)}
              </span>
              {canRemove && (
                <button
                  type="button"
                  onClick={() => onRemove?.(it)}
                  title="Remove product"
                  className="tw:inline-flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:text-slate-400 tw:transition tw:hover:bg-rose-50 tw:hover:text-rose-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </AppScrollArea>
    </div>
  );
};

export default BulkSummary;
