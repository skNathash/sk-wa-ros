import { format, isValid, parse } from "date-fns";
import { useWatch } from "react-hook-form";
import CommonService from "~/services/CommonService";
import {
  AVATAR_COLORS,
  PAYMENT_METHOD_LABELS,
  getEntityTypeLabel,
  getInitials,
} from "../../helper";
import type { RecordPaymentAmountDetails, RecordPaymentFlow } from "../../types";

type Props = {
  flow: RecordPaymentFlow;
};

const Confirm = ({ flow }: Props) => {
  const [amount, entity, paymentMethod, referenceId, paidOn, notes, outstanding] =
    useWatch<RecordPaymentAmountDetails>({
      name: [
        "amount",
        "entity",
        "paymentMethod",
        "referenceId",
        "paidOn",
        "notes",
        "outstanding",
      ],
    }) as [
      number | undefined,
      RecordPaymentAmountDetails["entity"],
      string,
      string,
      string,
      string,
      number | undefined,
    ];

  const isIn = flow === "in";
  const party = entity?.value;
  const partyName = party?.name || "—";
  const partyLabel = party?.type ? getEntityTypeLabel(party.type) : "";
  const initials = getInitials(party?.name);
  const avatarColor =
    AVATAR_COLORS[(party?.name?.length || 0) % AVATAR_COLORS.length];

  const amountValue = Number(amount || 0);
  const amountLabel = `${isIn ? "+" : "-"}₹${CommonService.commaSeparated(
    amountValue,
  )}`;

  const methodLabel = paymentMethod
    ? PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod
    : "—";
  const referenceLabel = referenceId ? `ref ${referenceId}` : "no reference";

  const paidOnDate = paidOn ? parse(paidOn, "yyyy-MM-dd", new Date()) : undefined;
  const validPaidOn = paidOnDate && isValid(paidOnDate) ? paidOnDate : undefined;
  const isToday =
    !!validPaidOn &&
    format(validPaidOn, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const dateLabel = validPaidOn ? format(validPaidOn, "dd MMM yyyy") : "—";
  const shortDateLabel = isToday ? "Today" : dateLabel;
  const timeLabel = format(new Date(), "hh:mm a");

  const outstandingValue = Number(outstanding || 0);
  const remaining = Math.max(outstandingValue - amountValue, 0);
  const advance = Math.max(amountValue - outstandingValue, 0);
  const showBalance = outstandingValue > 0;

  const balanceTitle = isIn
    ? `${partyLabel || "Party"}'s remaining balance after this payment`
    : `Your remaining balance after this payout`;
  const allocationNote = outstandingValue
    ? `Auto-allocate: applied to the oldest open ${
        isIn ? "invoice" : "bill"
      } for ${partyName} first. Books updated in real time.`
    : `This ${
        isIn ? "payment" : "payout"
      } will be recorded as an advance for ${partyName}. Books updated in real time.`;

  return (
    <div>
      {/* Mobile — receipt-style confirm card */}
      <div className="tw:md:hidden">
        <div className="tw:rounded-2xl tw:border-2 tw:border-teal-700 tw:bg-white tw:p-4">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-400">
            Confirm
          </div>
          <div className="tw:mt-1 tw:text-3xl tw:font-extrabold tw:text-teal-800">
            {amountLabel}
          </div>

          <dl className="tw:mt-4 tw:flex tw:flex-col tw:gap-2.5">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
              <dt className="tw:text-sm tw:text-gray-500">
                {isIn ? "From" : "To"}
              </dt>
              <dd className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:truncate">
                {partyName}
              </dd>
            </div>
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
              <dt className="tw:text-sm tw:text-gray-500">Mode</dt>
              <dd className="tw:text-sm tw:font-semibold tw:text-gray-800">
                {methodLabel}
              </dd>
            </div>
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
              <dt className="tw:text-sm tw:text-gray-500">Date</dt>
              <dd className="tw:text-sm tw:font-semibold tw:text-gray-800">
                {shortDateLabel} <span className="tw:text-gray-300">·</span>{" "}
                {timeLabel}
              </dd>
            </div>
            {referenceId ? (
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                <dt className="tw:text-sm tw:text-gray-500">Reference</dt>
                <dd className="tw:text-sm tw:font-semibold tw:text-gray-800 tw:truncate">
                  {referenceId}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="tw:mt-4 tw:rounded-lg tw:bg-teal-50 tw:px-3 tw:py-2.5 tw:text-xs tw:text-teal-900">
            {allocationNote}
          </div>

          {showBalance ? (
            <div className="tw:mt-2 tw:flex tw:items-center tw:justify-between tw:rounded-lg tw:border tw:border-gray-100 tw:px-3 tw:py-2.5">
              <div className="tw:text-xs tw:text-gray-500">
                Balance after this {isIn ? "payment" : "payout"}
              </div>
              <div className="tw:text-sm tw:font-bold tw:text-teal-800">
                ₹{CommonService.commaSeparated(remaining)}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Desktop — wide receipt with party, amount and allocation */}
      <div className="tw:hidden tw:md:block">
        <div className="tw:grid tw:grid-cols-2 tw:gap-6">
          <div>
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-400">
              {isIn ? "From" : "To"}
            </div>
            <div className="tw:mt-2 tw:flex tw:items-center tw:gap-3">
              <span
                className={`tw:w-10 tw:h-10 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold tw:text-white tw:shrink-0 ${avatarColor}`}
              >
                {initials}
              </span>
              <div className="tw:min-w-0">
                <div className="tw:text-base tw:font-bold tw:text-gray-800 tw:truncate">
                  {partyName}
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                  {party?.refId || "—"}
                  {party?.mobile ? ` · ${party.mobile}` : ""}
                </div>
                {partyLabel ? (
                  <div className="tw:text-xs tw:text-gray-500">{partyLabel}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-400">
              {isIn ? "Received" : "Paid"}
            </div>
            <div className="tw:mt-2 tw:text-2xl tw:font-extrabold tw:text-teal-800">
              ₹{CommonService.commaSeparated(amountValue)}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
              via <span className="tw:font-semibold">{methodLabel}</span> ·{" "}
              {referenceLabel}
            </div>
            <div className="tw:text-xs tw:text-gray-500">
              {isIn ? "Received" : "Paid"} on {dateLabel} · {timeLabel}
            </div>
          </div>
        </div>

        <div className="tw:mt-5">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-400">
            Applied against
          </div>
          <div className="tw:mt-2 tw:rounded-lg tw:bg-gray-50 tw:px-4 tw:py-3 tw:text-sm tw:text-gray-600">
            {allocationNote}
            {advance > 0 && outstandingValue > 0 ? (
              <span className="tw:text-amber-600">
                {" "}
                ₹{CommonService.commaSeparated(advance)} beyond the due will be
                held as an advance.
              </span>
            ) : null}
          </div>
        </div>

        {showBalance ? (
          <div className="tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-4 tw:rounded-lg tw:bg-teal-50 tw:border tw:border-teal-100 tw:px-4 tw:py-3">
            <div>
              <div className="tw:text-sm tw:font-semibold tw:text-teal-800">
                {balanceTitle}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                Was ₹{CommonService.commaSeparated(outstandingValue)} · will be ₹
                {CommonService.commaSeparated(remaining)}
              </div>
            </div>
            <div className="tw:text-lg tw:font-bold tw:text-teal-800">
              ₹{CommonService.commaSeparated(remaining)}
            </div>
          </div>
        ) : null}

        {notes ? (
          <div className="tw:mt-3 tw:rounded-lg tw:border tw:border-gray-100 tw:px-4 tw:py-3">
            <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-gray-400">
              Notes
            </div>
            <div className="tw:text-sm tw:text-gray-700 tw:mt-1">{notes}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Confirm;
