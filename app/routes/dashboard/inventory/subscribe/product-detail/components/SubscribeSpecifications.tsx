import clsx from "clsx";
import { getPackSize } from "../helper";

export interface SubscribeSpecificationsProps {
  /** Formatted subscribe deal (see InventorySubscribeService.formatDealResponse). */
  deal: any;
  /** Block heading. */
  title?: string;
  className?: string;
}

interface SpecRow {
  label: string;
  value: React.ReactNode;
}

/**
 * "Specifications" — the deal's fixed attributes as a label/value table: ids,
 * pack, tax identity, shelf life and the company behind it. Rows without data
 * are dropped, and the block hides itself when the deal carries none of them.
 * Same table the seller's own item page uses, on subscribe catalog fields.
 */
const SubscribeSpecifications = ({
  deal,
  title = "Specifications",
  className,
}: SubscribeSpecificationsProps) => {
  if (!deal?._id) return null;

  const rows: SpecRow[] = [
    { label: "Deal ID", value: deal.dealId || deal._id || "" },
    { label: "Pack size", value: getPackSize(deal) },
    { label: "HSN code", value: deal.hsn || "" },
    { label: "GST rate", value: deal.gst ? `${deal.gst}%` : "" },
    { label: "Shelf life", value: deal.shelfLife || "" },
    { label: "Company", value: deal.companyName || "" },
    { label: "Brand", value: deal.brand?.name || "" },
    { label: "Category", value: deal.category?.name || "" },
    { label: "Menu", value: deal.menu?.name || "" },
  ].filter((row) => row.value !== "" && row.value != null);

  if (rows.length === 0) return null;

  return (
    <section className={className}>
      <h3 className="app-section-label tw:mb-2 tw:px-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
        {title}
      </h3>

      {/* Rows read like WhatsApp's contact-info list: the value carries the row
          and the label sits under it as the quiet caption. From sm up there is
          room for the classic two-column table, so it flips back. The divider
          is inset by the row's left gutter rather than running edge to edge. */}
      <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:pl-4">
        {rows.map((row, idx) => (
          <div
            key={row.label}
            className={clsx(
              "tw:flex tw:flex-col-reverse tw:gap-0.5 tw:py-2.5 tw:pr-4 tw:sm:flex-row tw:sm:items-center tw:sm:gap-4",
              idx > 0 && "tw:border-t tw:border-slate-100",
            )}
          >
            <span className="tw:text-[11px] tw:text-slate-400 tw:sm:w-40 tw:sm:shrink-0 tw:sm:text-sm tw:sm:text-slate-500">
              {row.label}
            </span>
            <span className="tw:text-sm tw:font-semibold tw:text-slate-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SubscribeSpecifications;
