import { ChevronDown, PackagePlus } from "lucide-react";
import { useState } from "react";
import ImgRender from "~/components/core/img/ImgRender";

const rowClass =
  "tw:flex tw:items-center tw:justify-between tw:gap-3 tw:py-1.5 tw:text-xs";
const labelClass = "tw:text-muted-foreground";
const valueClass = "tw:font-semibold tw:text-foreground tw:text-right";

/**
 * Read-only half of the subscribe modal: just enough of the catalog deal for
 * the operator to confirm it is the right product before adding stock. The
 * spec rows stay collapsed by default so the stock form is the first thing in
 * reach — only name, code and MRP are always on screen.
 */
const ProductInfo = ({ info }: { info?: any }) => {
  const [expanded, setExpanded] = useState(false);

  const details = [
    info?.brand?.name ? { label: "Brand", value: info.brand.name } : null,
    info?.category?.name
      ? { label: "Category", value: info.category.name }
      : null,
    info?.netWeight ? { label: "Net weight", value: info.netWeight } : null,
    info?.hsn ? { label: "HSN", value: info.hsn } : null,
    info?.gst !== undefined && info?.gst !== ""
      ? { label: "GST", value: `${info.gst}%` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:border tw:border-amber-200 tw:bg-amber-50 tw:px-2.5 tw:py-1.5">
        <PackagePlus className="tw:w-3.5 tw:h-3.5 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
        <p className="tw:text-[11px] tw:leading-snug tw:text-amber-900">
          Not in your store yet — subscribe it to add stock and start billing.
        </p>
      </div>

      <div className="tw:rounded-lg tw:border tw:border-border">
        <div className="tw:flex tw:items-center tw:gap-3 tw:p-2.5">
          <div className="tw:relative tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-lg tw:bg-muted">
            {info?.images?.[0] ? (
              <ImgRender
                assetId={info.images[0]}
                alt={info?.name}
                className="tw:h-full tw:w-full tw:object-cover"
              />
            ) : (
              <span className="tw:text-xl">📦</span>
            )}
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <p className="tw:text-sm tw:font-semibold tw:text-foreground tw:line-clamp-2">
              {info?.name || "—"}
            </p>
            <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:text-muted-foreground">
              {info?.dealId && (
                <span className="tw:font-mono tw:tracking-tight tw:truncate">
                  {info.dealId}
                </span>
              )}
              {info?.mrp != null && (
                <span className="tw:shrink-0 tw:font-semibold tw:text-foreground">
                  MRP ₹{info.mrp}
                </span>
              )}
            </div>
          </div>
        </div>

        {details.length > 0 || info?.barcodes?.[0] ? (
          <>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-expanded={expanded}
              className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-1 tw:border-t tw:border-border tw:py-1.5 tw:text-[11px] tw:font-medium tw:text-muted-foreground tw:hover:text-foreground"
            >
              {expanded ? "Hide details" : "View details"}
              <ChevronDown
                className={`tw:w-3.5 tw:h-3.5 tw:transition-transform ${
                  expanded ? "tw:rotate-180" : ""
                }`}
              />
            </button>

            {expanded && (
              <div className="tw:divide-y tw:divide-border/60 tw:border-t tw:border-border tw:px-3 tw:py-1">
                {info?.barcodes?.[0] ? (
                  <div className={rowClass}>
                    <span className={labelClass}>Barcode</span>
                    <span
                      className={`${valueClass} tw:font-mono tw:tracking-tight tw:truncate`}
                    >
                      {info.barcodes[0]}
                    </span>
                  </div>
                ) : null}
                {details.map((row) => (
                  <div key={row.label} className={rowClass}>
                    <span className={labelClass}>{row.label}</span>
                    <span className={valueClass}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  );
};

export default ProductInfo;
