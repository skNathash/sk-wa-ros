import React, { useMemo } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";

interface ScannedBarcodeCardProps {
  /** The scanned code or typed product name — shown on the label strip. */
  code: string;
  /** Quantity captured for this scan — shown in the corner badge. */
  qty: number;
  /** Position in the scanned list; drives which tint the card gets. */
  index?: number;
  onEdit?: () => void;
  onRemove?: () => void;
  className?: string;
}

// Soft paper tints, rotated per card so a wall of scans stays readable.
const TINTS = [
  { card: "tw:bg-amber-50 tw:border-amber-200", strip: "tw:bg-amber-100/70" },
  { card: "tw:bg-sky-50 tw:border-sky-200", strip: "tw:bg-sky-100/70" },
  { card: "tw:bg-emerald-50 tw:border-emerald-200", strip: "tw:bg-emerald-100/70" },
  { card: "tw:bg-violet-50 tw:border-violet-200", strip: "tw:bg-violet-100/70" },
  { card: "tw:bg-rose-50 tw:border-rose-200", strip: "tw:bg-rose-100/70" },
];

// Bar widths in px — the pattern is derived from the code itself so the same
// scan always draws the same "barcode", and two different scans look different.
const BAR_WIDTHS = [1, 1, 2, 3];
const GAP_WIDTHS = [1, 2, 1, 3];
const BAR_COUNT = 26;

const buildBars = (code: string) => {
  const src = code || "0";
  let seed = 0;
  for (let i = 0; i < src.length; i++) {
    seed = (seed * 31 + src.charCodeAt(i)) % 100003;
  }
  const bars: Array<{ w: number; gap: number }> = [];
  let v = seed || 7;
  for (let i = 0; i < BAR_COUNT; i++) {
    v = (v * 1103515245 + 12345) % 2147483647;
    bars.push({
      w: BAR_WIDTHS[v % BAR_WIDTHS.length],
      gap: GAP_WIDTHS[(v >> 5) % GAP_WIDTHS.length],
    });
  }
  return bars;
};

const ScannedBarcodeCard: React.FC<ScannedBarcodeCardProps> = ({
  code,
  qty,
  index = 0,
  onEdit,
  onRemove,
  className = "",
}) => {
  const bars = useMemo(() => buildBars(code), [code]);
  const tint = TINTS[index % TINTS.length];

  return (
    <div
      className={`tw:group tw:relative tw:rounded-2xl tw:border tw:p-2.5 tw:pb-2 tw:shadow-sm tw:transition-shadow hover:tw:shadow-md ${tint.card} ${className}`}
    >
      {/* Captured badge — the check + count reads as "scanned, N units". */}
      <span className="tw:absolute tw:-top-2 tw:-right-1.5 tw:z-10 tw:inline-flex tw:items-center tw:gap-0.5 tw:rounded-full tw:bg-teal-600 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-bold tw:text-white tw:shadow-sm tw:ring-2 tw:ring-white">
        <Check className="tw:h-3 tw:w-3" strokeWidth={3} />
        <span className="tw:tabular-nums">{qty}</span>
      </span>

      {/* Barcode plate. */}
      <div className="tw:flex tw:h-14 tw:items-center tw:justify-center tw:gap-0 tw:overflow-hidden tw:rounded-lg tw:bg-white tw:px-2">
        {bars.map((b, i) => (
          <React.Fragment key={i}>
            <span
              className="tw:h-9 tw:shrink-0 tw:bg-gray-900"
              style={{ width: `${b.w}px` }}
            />
            <span className="tw:shrink-0" style={{ width: `${b.gap}px` }} />
          </React.Fragment>
        ))}
      </div>

      {/* Human-readable strip under the bars, like a printed label. */}
      <div
        className={`tw:mt-1.5 tw:rounded-md tw:px-1.5 tw:py-1 tw:text-center ${tint.strip}`}
      >
        <span
          className="tw:block tw:truncate tw:font-mono tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-gray-700"
          title={code}
        >
          {code}
        </span>
      </div>

      {(onEdit || onRemove) && (
        <div className="tw:mt-1.5 tw:flex tw:items-center tw:justify-center tw:gap-1.5">
          {onEdit && (
            <button
              type="button"
              aria-label="Edit"
              onClick={onEdit}
              className="tw:inline-flex tw:h-7 tw:w-7 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:bg-white/80 tw:text-gray-600 tw:transition-colors hover:tw:bg-white hover:tw:text-gray-900 active:tw:bg-gray-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-gray-300"
            >
              <Pencil className="tw:h-3.5 tw:w-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              aria-label="Remove"
              onClick={onRemove}
              className="tw:inline-flex tw:h-7 tw:w-7 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-red-100 tw:bg-white/80 tw:text-red-600 tw:transition-colors hover:tw:bg-red-50 active:tw:bg-red-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-red-300"
            >
              <Trash2 className="tw:h-3.5 tw:w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScannedBarcodeCard;
