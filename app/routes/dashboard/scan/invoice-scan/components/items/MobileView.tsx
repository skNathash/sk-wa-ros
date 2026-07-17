import { Check, Search, Trash2 } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import type { InvoiceItem } from "../../types";
import { calcDiscountPercent } from "../../helper";

interface MobileViewProps {
  items: InvoiceItem[];
  onEditItem: (index: number) => void;
  onRemoveItem?: (index: number) => void;
  onSelectDeal?: (index: number) => void;
}

const MobileView = ({
  items,
  onEditItem,
  onRemoveItem,
  onSelectDeal,
}: MobileViewProps) => {
  return (
    <div className="tw:space-y-2.5">
      {items.map((item, index) => {
        const sel = item.selected;
        const name = sel?.dealName ?? item.name;
        const hsn = sel?.hsn ?? item.hsn;
        const barcode = sel?.barcode ?? item.barcode;
        const mrp = sel?.mrp ?? item.mrp;
        const price = sel?.price ?? item.price;
        const qty = sel?.qty ?? item.qty;
        // Discount % derived from MRP and price.
        const discount = calcDiscountPercent(mrp, price);
        // GST excluded from calculation
        // const gst =
        //   sel?.gst ??
        //   (item.cgstPercent || 0) +
        //     (item.sgstPercent || 0) +
        //     (item.igstPercent || 0);
        // Editing is only offered when the row is interactive (not in the
        // read-only preview, where the parent withholds the item actions).
        const canEdit = !!onRemoveItem;

        return (
          <div
            key={item.lineNumber}
            className="tw:overflow-hidden tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white"
          >
            <div className="tw:flex tw:items-start tw:gap-2 tw:p-3">
              <span className="tw:mt-0.5 tw:flex tw:size-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded tw:bg-gray-100 tw:text-[10px] tw:font-semibold tw:text-gray-500">
                {item.lineNumber}
              </span>
              <div
                className={`tw:min-w-0 tw:flex-1 ${canEdit ? "tw:cursor-pointer" : ""}`}
                onClick={canEdit ? () => onEditItem(index) : undefined}
              >
                <div className="tw:text-[13px] tw:font-semibold tw:leading-snug tw:text-gray-900">
                  {name}
                </div>
                {(hsn || barcode) && (
                  <div className="tw:mt-0.5 tw:font-mono tw:text-[10px] tw:text-gray-400">
                    {hsn && <span>HSN {hsn}</span>}
                    {hsn && barcode && <span> · </span>}
                    {barcode && <span>{barcode}</span>}
                  </div>
                )}
              </div>
              {onRemoveItem && (
                <button
                  onClick={() => onRemoveItem(index)}
                  className="tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded tw:text-gray-400 tw:transition-colors tw:hover:bg-red-50 tw:hover:text-red-600"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Catalog match status */}
            <div className="tw:px-3">
              {sel?.isPending ? (
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-md tw:bg-amber-50 tw:px-2 tw:py-1 tw:text-[11px] tw:text-amber-700">
                  New product — pending verification
                </div>
              ) : sel ? (
                <div className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-md tw:bg-green-50 tw:px-2 tw:py-1">
                  <Check size={13} className="tw:shrink-0 tw:text-green-600" />
                  <span className="tw:text-[11px] tw:font-medium tw:text-green-700">
                    SK Catalog Matched
                  </span>
                  {sel.skId && (
                    <span className="tw:font-mono tw:text-[10px] tw:text-green-600/70">
                      #{sel.skId}
                    </span>
                  )}
                  {onSelectDeal && (
                    <button
                      type="button"
                      onClick={() => onSelectDeal(index)}
                      className="tw:ml-auto tw:text-[11px] tw:font-medium tw:text-blue-600 tw:hover:underline"
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : onSelectDeal ? (
                <button
                  type="button"
                  onClick={() => onSelectDeal(index)}
                  className="tw:flex tw:w-full tw:items-center tw:gap-1.5 tw:rounded-md tw:bg-red-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-red-600 tw:transition-colors tw:hover:bg-red-100"
                >
                  <Search size={12} className="tw:shrink-0" />
                  Not in SK Catalog — tap to select a deal
                </button>
              ) : (
                <div className="tw:rounded-md tw:bg-red-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-red-600">
                  Not in SK Catalog
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="tw:mt-2.5 tw:grid tw:grid-cols-3 tw:divide-x tw:divide-gray-100 tw:border-t tw:border-gray-100 tw:text-center">
              <div className="tw:py-2">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  MRP
                </div>
                <div className="tw:text-xs tw:font-medium tw:text-gray-800">
                  <Amount value={mrp} />
                </div>
              </div>
              <div className="tw:py-2">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  Price
                </div>
                <div className="tw:text-xs tw:font-medium tw:text-gray-800">
                  <Amount value={price} />
                </div>
              </div>
              <div className="tw:py-2">
                <div className="tw:text-[10px] tw:uppercase tw:tracking-wide tw:text-gray-400">
                  Qty
                </div>
                <div className="tw:text-xs tw:font-medium tw:text-gray-800">
                  {qty}
                </div>
              </div>
            </div>

            {/* Total row */}
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:border-t tw:border-gray-100 tw:bg-gray-50/70 tw:px-3 tw:py-2">
              <div className="tw:flex tw:gap-3 tw:text-[11px] tw:text-gray-500">
                {discount > 0 && <span>Disc {discount}%</span>}
                {/* GST excluded from calculation */}
                {/* <span>
                  Tax {gst}% (<Amount value={item.tax} />)
                </span> */}
              </div>
              <div className="tw:text-right">
                <span className="tw:text-[10px] tw:text-gray-400">Total </span>
                <span className="tw:text-sm tw:font-bold tw:text-gray-900">
                  <Amount value={item.totalAmount} />
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileView;
