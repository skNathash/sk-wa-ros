import type { FC } from "react";
import clsx from "clsx";
import { Banknote, Check, KeyRound, MapPin } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";

interface HandOffCardProps {
  data: any;
  index: number;
  onClick?: (data: any) => void;
  onCancel?: (data: any) => void;
  onView?: (data: any) => void;
}

/**
 * Hand-off queue card — the shipment about to leave the counter.
 *
 * Mirrors the reference layout: the CLB ref with its HANDOFF + channel badges
 * on top, the runner name, the delivery meta line (place · items · weight),
 * the recipient line, the COD / OTP chips, and the runner's pickup OTP in a
 * dashed red band, then the Cancel / Verify actions and the timestamp. Tapping
 * the card or the verify action opens the hand-off flow.
 */
const HandOffCard: FC<HandOffCardProps> = ({ data, index, onClick, onView }) => {
  const orderRef = data?.order?.orderRefNo || "—";
  const orderType = data?.order?.type || "B2C";

  const customer = data?.deliveryAgent?.name || "—";
  const address = data?.deliveryAddress;
  const place = address?.city || address?.district || "";

  const itemCount = data?.totalUnits ?? 0;
  const weight = data?.totalWeight;

  const runner = data?.deliveryAddress?.recipientName || "Customer";

  const isCod = data?.paymentType === "COD";
  const amount = data?.order?.value;

  const time = data?.assignedAt;

  const otp = data?.approveAuthCode || "";
  const otpDigits = String(otp || "").padEnd(4, "·").split("").slice(0, 4);

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

  const metaParts = [
    place,
    itemCount != null ? `${itemCount} items` : null,
    weight != null ? `${Number(weight).toFixed(1)} kg` : null,
  ].filter((part): part is string => Boolean(part));

  return (
    <div
      className="tw:flex tw:cursor-pointer tw:flex-col tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:transition-all tw:hover:border-blue-200"
      onClick={() => onView?.(data)}
    >
      {/* Header — ref + badges. */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1">
        <span className="tw:font-mono tw:text-sm tw:font-bold tw:tracking-tight tw:text-slate-900">
          {orderRef}
        </span>
        <AppBadge variant="danger" size="sm">
          Handoff
        </AppBadge>
        <AppBadge variant="primary" size="sm">
          {orderType}
        </AppBadge>
      </div>

      {/* Customer + meta. */}
      <div className="tw:min-w-0">
        <p className="tw:truncate tw:text-lg tw:font-bold tw:leading-snug tw:text-slate-900">
          {customer}
        </p>

        {metaParts.length > 0 && (
          <p className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-1 tw:text-[12px] tw:text-slate-500">
            <MapPin size={12} className="tw:shrink-0 tw:text-slate-400" />
            <span>{metaParts.join(" · ")}</span>
          </p>
        )}

        <p className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1 tw:text-[12px] tw:text-slate-500">
          <span className="tw:font-medium tw:text-slate-600">Recipient:</span>
          <span className="tw:truncate">{runner}</span>
        </p>
      </div>

      {/* COD + OTP chips. */}
      {amount != null && (
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          <span
            className={clsx(
              "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:px-2 tw:py-1 tw:text-[11px] tw:font-bold",
              isCod ? "tw:bg-emerald-50 tw:text-emerald-700" : "tw:bg-slate-100 tw:text-slate-600",
            )}
          >
            <Banknote size={12} />
            {isCod ? "COD" : "Prepaid"}
            <Amount value={amount} decimalPlaces={0} />
          </span>

          {otpDigits[0] !== "·" && (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:bg-amber-50 tw:px-2 tw:py-1 tw:text-[11px] tw:font-bold tw:text-amber-700">
              <KeyRound size={12} />
              OTP {otpDigits.join("-")}
            </span>
          )}
        </div>
      )}

      {/* Runner OTP band — dashed red, matches the reference. */}
      {otpDigits[0] !== "·" && (
        <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-dashed tw:border-red-300 tw:bg-red-50/60 tw:px-3 tw:py-1.5">
          <p className="tw:shrink-0 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-red-600">
            Runner OTP
          </p>
          <div className="tw:flex tw:justify-center tw:gap-1">
            {otpDigits.map((digit, i) => (
              <span
                key={i}
                className="tw:flex tw:h-6 tw:w-5 tw:items-center tw:justify-center tw:rounded tw:bg-white tw:text-xs tw:font-bold tw:tabular-nums tw:text-red-700 tw:ring-1 tw:ring-red-100"
              >
                {digit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action footer + timestamp. */}
      <div className="tw:mt-auto tw:flex tw:items-center tw:gap-2">
        <AppButton fill="outline" color="light" size="small" className="tw:h-9 tw:flex-1">
          Cancel
        </AppButton>
        <AppButton
          size="small"
          className="tw:h-9 tw:flex-[1.6]"
          onClick={(e) => {
            e?.stopPropagation?.();
            onClick?.(data);
          }}
        >
          <Check size={14} />
          Verify + hand off
        </AppButton>
      </div>

      {time && (
        <DateFormat
          value={time}
          formatStr="MMM d, h:mm a"
          className="tw:-mt-1 tw:block tw:text-right tw:text-[11px] tw:text-slate-400"
        />
      )}
    </div>
  );
};

export default HandOffCard;
