import type { FC } from "react";
import clsx from "clsx";
import { ArrowRight, Check, MapPin } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

interface HandOffCardDesktopProps {
  data: any;
  index: number;
  onClick?: (data: any) => void;
  onCancel?: (data: any) => void;
  onView?: (data: any) => void;
}

/**
 * Hand-off desktop card — a compact horizontal single-row queue item.
 *
 * Mirrors the desktop reference: a round initials avatar on the left, the
 * customer name, an arrow into the CLB ref with its channel badge, the
 * recipient · place · items meta line, and on the right the HANDOFF tag with
 * the assigned time. Clicking the row opens the order detail; the HANDOFF tag
 * starts the verify + hand-off flow.
 */
const HandOffCardDesktop: FC<HandOffCardDesktopProps> = ({
  data,
  index,
  onClick,
  onView,
}) => {
  const customer = data?.deliveryAgent?.name || "—";
  const orderRef = `#${data?.order?.orderRefNo || data?.invoiceNumber || "—"}`;
  const orderType = data?.order?.type || "B2C";

  const recipient = data?.deliveryAddress?.recipientName || "";
  const address = data?.deliveryAddress;
  const place = address?.city || address?.district || "";
  const itemCount = data?.totalUnits ?? 0;

  const time = data?.assignedAt;

  // Deterministic accent for the avatar so neighbours never collide.
  const avatars = [
    "tw:bg-blue-500",
    "tw:bg-rose-500",
    "tw:bg-emerald-500",
    "tw:bg-amber-500",
    "tw:bg-violet-500",
    "tw:bg-teal-500",
  ];
  const avatarClass = avatars[index % avatars.length];

  const initial = customer?.trim()?.charAt(0)?.toUpperCase() || "?";

  const metaParts = [
    recipient,
    place,
    itemCount != null ? `${itemCount} items` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div className="tw:flex tw:flex-col tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:transition-all tw:hover:border-blue-200">
      <div
        className="tw:flex tw:cursor-pointer tw:items-center tw:gap-3 tw:rounded-t-xl tw:px-4 tw:py-3"
        onClick={() => onView?.(data)}
      >
        {/* Avatar. */}
        <span
          className={clsx(
            "tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-base tw:font-bold tw:text-white",
            avatarClass,
          )}
        >
          {initial}
        </span>

        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
          {/* Title — name → ref + badge. */}
          <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5">
            <span className="tw:truncate tw:text-sm tw:font-bold tw:tracking-tight tw:text-slate-900">
              {customer}
            </span>
            <ArrowRight
              size={14}
              className="tw:shrink-0 tw:text-slate-400"
              strokeWidth={2}
            />
            <button
              type="button"
              className="tw:shrink-0 tw:font-mono tw:text-sm tw:font-bold tw:tracking-tight tw:text-slate-900 tw:transition-colors tw:hover:text-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(data);
              }}
            >
              {orderRef}
            </button>
            <AppBadge variant="primary" size="sm">
              {orderType}
            </AppBadge>
          </div>

          {/* Meta — recipient · place · items. */}
          {metaParts.length > 0 && (
            <p className="tw:flex tw:min-w-0 tw:items-center tw:gap-1 tw:text-[12px] tw:text-slate-500">
              <MapPin size={12} className="tw:shrink-0 tw:text-slate-400" />
              <span className="tw:truncate">{metaParts.join(" · ")}</span>
            </p>
          )}
        </div>

        {/* Right — HANDOFF tag + time. */}
        <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(data);
            }}
            className="tw:inline-flex tw:items-center tw:rounded tw:bg-rose-50 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.08em] tw:text-rose-600 tw:transition-colors tw:hover:bg-rose-100"
          >
            Handoff
          </button>
          {time && (
            <DateFormat
              value={time}
              formatStr="MMM d, h:mm a"
              className="tw:text-[11px] tw:leading-none tw:text-slate-400"
            />
          )}
        </div>
      </div>

      {/* Action footer — right-aligned, sized to content so the actions recede
          behind the row instead of outweighing it. */}
      <div className="tw:flex tw:items-center tw:justify-end tw:gap-2 tw:border-t tw:border-slate-100 tw:px-4 tw:py-2.5">
        <AppButton
          fill="clear"
          color="dark"
          size="small"
          noShadow
          className="tw:px-2 tw:text-slate-500"
        >
          Cancel
        </AppButton>
        <AppButton
          size="small"
          onClick={(e) => {
            e?.stopPropagation?.();
            onClick?.(data);
          }}
        >
          <Check size={14} />
          Verify + hand off
        </AppButton>
      </div>
    </div>
  );
};

export default HandOffCardDesktop;
