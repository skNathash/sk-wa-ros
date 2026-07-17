import { Check, Search, Trash2 } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { Input } from "~/components/ui/input";
import type { TableHeaderItem } from "~/types/CommonTypes";
import type { InvoiceItem } from "../../types";
import { calcDiscountPercent, calcPriceFromDiscount } from "../../helper";

interface DesktopViewProps {
  items: InvoiceItem[];
  isPreview?: boolean;
  onUpdateItem?: (index: number, data: Partial<InvoiceItem>) => void;
  onRemoveItem?: (index: number) => void;
  onSelectDeal?: (index: number) => void;
}

const DesktopView = ({
  items,
  isPreview,
  onUpdateItem,
  onRemoveItem,
  onSelectDeal,
}: DesktopViewProps) => {
  const handleChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string,
  ) => {
    const numericFields = ["mrp", "price", "qty", "discountAmount"];
    if (!numericFields.includes(field)) {
      onUpdateItem?.(index, { [field]: value });
      return;
    }

    let num = value === "" ? 0 : Number(value);
    if (isNaN(num)) return;
    num = Math.max(0, num);

    const current = items[index];
    const sel = current.selected;
    const mrp = sel?.mrp ?? current.mrp ?? 0;

    if (field === "price") {
      const discountAmount = calcDiscountPercent(mrp, num);
      onUpdateItem?.(index, { price: num, discountAmount });
    } else if (field === "discountAmount") {
      const disc = Math.min(100, num);
      // Price is derived from MRP and the discount %.
      const price = calcPriceFromDiscount(mrp, disc);
      onUpdateItem?.(index, { discountAmount: disc, price });
    } else if (field === "mrp") {
      // If the new MRP is below the price, cap the price at the new MRP.
      const currentPrice = sel?.price ?? current.price ?? 0;
      const price = num < currentPrice ? num : currentPrice;
      const discountAmount = calcDiscountPercent(num, price);
      onUpdateItem?.(index, { mrp: num, price, discountAmount });
    } else if (field === "qty") {
      // Qty does not affect the per-unit discount %.
      onUpdateItem?.(index, { qty: num });
    }
  };

  const headers: TableHeaderItem[] = [
    { label: "#", width: "32px" },
    { label: "Item" },
    { label: "HSN", width: "80px" },
    { label: "Barcode", width: "112px" },
    { label: "MRP", width: "80px", isCentered: true },
    { label: "Price", width: "80px", isCentered: true },
    { label: "Qty", width: "80px", isCentered: true },
    { label: "Discount", width: "80px", isCentered: true },
    // GST excluded from calculation
    // { label: "Tax", width: "64px", isCentered: true },
    { label: "Total", width: "96px" },
    ...(onRemoveItem ? [{ label: " ", width: "32px" }] : []),
  ];

  return (
    <AppTable size="sm" condensed container stickyHeader>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {items.map((item, index) => {
          const sel = item.selected;
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

          return (
            <AppTable.Row key={item.lineNumber}>
              <AppTable.Cell>{item.lineNumber}</AppTable.Cell>

              {/* Item Name */}
              <AppTable.Cell>
                {isPreview ? (
                  <span className="tw:text-[11px]">
                    {sel?.dealName ?? item.name ?? ""}
                  </span>
                ) : (
                  <>
                    <Input
                      value={sel?.dealName ?? item.name ?? ""}
                      onChange={(e) =>
                        handleChange(index, "name", e.target.value)
                      }
                      className={`tw:h-7 tw:text-[11px]! ${!sel ? "tw:border-red-300 tw:bg-red-50/50" : sel.isPending ? "tw:border-amber-300 tw:bg-amber-50/50" : "tw:border-green-300 tw:bg-green-50/50"}`}
                    />
                    {sel?.isPending ? (
                      <div className="tw:mt-0.5 tw:text-[10px] tw:text-amber-700 tw:italic">
                        New product — pending verification
                      </div>
                    ) : sel ? (
                      <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1">
                        <Check size={11} className="tw:text-green-600" />
                        <span className="tw:text-[10px] tw:text-green-600">
                          SK Catalog Matched
                        </span>
                        {sel.skId && (
                          <span className="tw:text-[10px] tw:text-gray-400 tw:font-mono">
                            SK PID: {sel.skId}
                          </span>
                        )}
                        {onSelectDeal && (
                          <button
                            type="button"
                            onClick={() => onSelectDeal(index)}
                            className="tw:text-[10px] tw:text-blue-600 tw:hover:underline tw:ml-1"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    ) : onSelectDeal ? (
                      <button
                        type="button"
                        onClick={() => onSelectDeal(index)}
                        className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-amber-700 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded tw:px-1.5 tw:py-0.5 tw:w-full tw:hover:bg-amber-100 tw:transition-colors tw:cursor-pointer"
                      >
                        <Search size={10} />
                        <span>
                          Not found in SK Catalog — tap to select SK Catalog
                          deal
                        </span>
                      </button>
                    ) : (
                      <span className="tw:text-[10px] tw:text-red-500 tw:mt-0.5">
                        Not found in SK Catalog
                      </span>
                    )}
                  </>
                )}
              </AppTable.Cell>

              {/* HSN */}
              <AppTable.Cell>
                {isPreview ? (
                  <span className="tw:text-[11px]">{hsn ?? ""}</span>
                ) : (
                  <Input
                    value={hsn ?? ""}
                    onChange={(e) => handleChange(index, "hsn", e.target.value)}
                    className="tw:h-7 tw:text-[11px]! tw:w-20"
                  />
                )}
              </AppTable.Cell>

              {/* Barcode */}
              <AppTable.Cell>
                {isPreview ? (
                  <span className="tw:text-[11px]">{barcode ?? ""}</span>
                ) : (
                  <Input
                    value={barcode ?? ""}
                    onChange={(e) =>
                      handleChange(index, "barcode", e.target.value)
                    }
                    className="tw:h-7 tw:text-[11px]! tw:w-28"
                  />
                )}
              </AppTable.Cell>

              {/* MRP */}
              <AppTable.Cell className="tw:text-center">
                {isPreview ? (
                  <span className="tw:text-[11px]">
                    <Amount value={mrp ?? 0} />
                  </span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    value={mrp || ""}
                    onChange={(e) => handleChange(index, "mrp", e.target.value)}
                    className="tw:h-7 tw:text-[11px]! tw:w-20 tw:text-center"
                  />
                )}
              </AppTable.Cell>

              {/* Price */}
              <AppTable.Cell className="tw:text-center">
                {isPreview ? (
                  <span className="tw:text-[11px]">
                    <Amount value={price ?? 0} />
                  </span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    value={price || ""}
                    onChange={(e) =>
                      handleChange(index, "price", e.target.value)
                    }
                    className="tw:h-7 tw:text-[11px]! tw:w-20 tw:text-center"
                  />
                )}
              </AppTable.Cell>

              {/* Qty */}
              <AppTable.Cell className="tw:text-center">
                {isPreview ? (
                  <span className="tw:text-[11px]">{qty ?? 0}</span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    value={qty || ""}
                    onChange={(e) => handleChange(index, "qty", e.target.value)}
                    className="tw:h-7 tw:text-[11px]! tw:w-20 tw:text-center"
                  />
                )}
              </AppTable.Cell>

              {/* Discount */}
              <AppTable.Cell className="tw:text-center">
                {isPreview ? (
                  <span className="tw:text-[11px]">{discount ?? 0}%</span>
                ) : (
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={discount || ""}
                    onChange={(e) =>
                      handleChange(index, "discountAmount", e.target.value)
                    }
                    className="tw:h-7 tw:text-[11px]! tw:w-20 tw:text-center"
                  />
                )}
              </AppTable.Cell>

              {/* Tax — GST excluded from calculation */}
              {/* <AppTable.Cell className="tw:text-center">
                <div className="tw:flex tw:flex-col tw:items-center">
                  <span className="tw:text-[11px]">
                    {gst ? `${gst}%` : "-"}
                  </span>
                  <span className="tw:text-[11px] tw:text-gray-500">
                    <Amount value={item.tax} />
                  </span>
                </div>
              </AppTable.Cell> */}

              {/* Total */}
              <AppTable.Cell className="tw:font-semibold tw:text-[11px] tw:text-right">
                <Amount value={item.totalAmount} />
              </AppTable.Cell>

              {/* Actions */}
              {onRemoveItem && (
                <AppTable.Cell>
                  <button
                    onClick={() => onRemoveItem(index)}
                    className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded tw:text-gray-400 tw:hover:text-red-600 tw:hover:bg-red-50 tw:transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </AppTable.Cell>
              )}
            </AppTable.Row>
          );
        })}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
