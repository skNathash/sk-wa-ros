import React from "react";
import {
  AlertCircle,
  Barcode,
  CircleCheck,
  Clock,
  Layers,
  Sparkles,
  Store,
} from "lucide-react";

import { cn } from "~/lib/utils";
import type { ReviewItem } from "../../helper";

/**
 * Pill chips for a review row. Same shape language as the results filter chips
 * (`ResultFilterChips`) — rounded-full, hairline border, small leading icon —
 * so a row's facts read as the same family of tokens across the scan flows.
 */
const Chip: React.FC<{
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ icon, className, children }) => (
  <span
    className={cn(
      "tw:inline-flex tw:items-center tw:gap-1.5 tw:h-7 tw:px-2.5 tw:rounded-full tw:border tw:text-[11px] tw:font-medium tw:whitespace-nowrap tw:[&>svg]:size-3.5 tw:[&>svg]:shrink-0",
      "tw:border-gray-200 tw:bg-white tw:text-gray-700",
      className,
    )}
  >
    {icon}
    {children}
  </span>
);

/** The scanned code itself, kept monospaced so digits stay comparable. */
export const BarcodeChip: React.FC<{ barcode: string; className?: string }> = ({
  barcode,
  className,
}) =>
  barcode ? (
    <Chip
      icon={<Barcode className="tw:text-gray-400" />}
      className={cn("tw:font-mono tw:bg-gray-50", className)}
    >
      {barcode}
    </Chip>
  ) : (
    // An icon-only chip reads as a rendering bug; match the other empty cells.
    <span className="tw:text-xs tw:text-gray-300">—</span>
  );

/** Scanned quantity — only worth a chip when the seller actually counted. */
export const QtyChip: React.FC<{ qty: number; className?: string }> = ({
  qty,
  className,
}) => (
  <Chip icon={<Layers className="tw:text-gray-400" />} className={className}>
    Qty <span className="tw:font-semibold tw:tabular-nums">{qty}</span>
  </Chip>
);

/** Brand, when the matched deal carries one. */
export const BrandChip: React.FC<{ brand: string; className?: string }> = ({
  brand,
  className,
}) => (
  <Chip icon={<Store className="tw:text-gray-400" />} className={className}>
    {brand}
  </Chip>
);

type StatusMeta = {
  Icon: React.ComponentType<{ className?: string }>;
  /** Soft fill + text colour, taken from the item's match badge. */
  bg: string;
  text: string;
  /** Accent rail colour for the card's left edge. */
  dot: string;
  label: string;
  subLabel?: string;
};

/**
 * The row's status presentation. Colours and labels come straight from the
 * item's match badge (`item.badge`) so the status itself never changes — the
 * icons mirror the match summary above the list (Store = SK catalog, Sparkles =
 * SK AI, AlertCircle = no match).
 */
export function statusMeta(item: ReviewItem): StatusMeta {
  if (item.status === "Requested") {
    return {
      Icon: Clock,
      bg: "tw:bg-amber-50",
      text: "tw:text-amber-700",
      dot: "tw:bg-amber-400",
      label: "Already requested",
      subLabel: "Awaiting SK catalog approval",
    };
  }
  if (item.deal?.isSubscribed) {
    return {
      Icon: CircleCheck,
      bg: "tw:bg-gray-100",
      text: "tw:text-gray-600",
      dot: "tw:bg-gray-400",
      label: "Already Subscribed",
    };
  }
  const Icon =
    item.matchStatus === "FoundInSk"
      ? Store
      : item.matchStatus === "FoundInAi"
        ? Sparkles
        : AlertCircle;
  return {
    Icon,
    bg: item.badge.bg,
    text: item.badge.text,
    dot: item.badge.dot,
    label: item.badge.label,
    subLabel: item.badge.subLabel,
  };
}

/**
 * Status as a filled chip. The caveat line (`subLabel`) rides inside the pill
 * as muted trailing text so the row keeps that detail without a second line.
 */
export const StatusChip: React.FC<{
  item: ReviewItem;
  className?: string;
}> = ({ item, className }) => {
  const status = statusMeta(item);
  return (
    <Chip
      icon={<status.Icon className={status.text} />}
      className={cn(
        "tw:border-transparent tw:font-semibold",
        status.bg,
        status.text,
        className,
      )}
    >
      {status.label}
      {/* The caveat keeps the label's ink, dialled back — a grey here would
          wash out against the pill's tinted fill. */}
      {status.subLabel && (
        <span className="tw:font-medium tw:opacity-70">
          · {status.subLabel}
        </span>
      )}
    </Chip>
  );
};

export default Chip;
