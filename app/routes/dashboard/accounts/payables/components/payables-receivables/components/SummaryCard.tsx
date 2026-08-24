import clsx from "clsx";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Amount from "~/components/core/amount/Amount";

interface SummaryCardProps {
  type: "payables" | "receivables";
  amount: number;
  parties: number;
  partyLabel?: string;
}

const SummaryCard = ({
  type,
  amount,
  parties,
  partyLabel,
}: SummaryCardProps) => {
  const isPayables = type === "payables";
  const Icon = isPayables ? ArrowUpRight : ArrowDownLeft;
  const eyebrow = isPayables ? "You owe" : "Owed to you";
  const partiesText = `${parties} ${parties === 1 ? "party" : "parties"}`;

  return (
    <div
      className={clsx(
        "tw:relative tw:overflow-hidden tw:rounded-2xl tw:p-5 tw:text-white tw:shadow-sm tw:mb-4",
        isPayables ? "summary-card-out" : "summary-card-in",
      )}
    >
      {/* Oversized, near-invisible direction glyph — one quiet flourish for depth. */}
      <Icon
        aria-hidden
        strokeWidth={1.25}
        className="tw:absolute tw:-right-4 tw:-bottom-6 tw:w-32 tw:h-32 tw:text-white/[0.08]"
      />

      <div className="tw:relative">
        <span className="app-label tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-white/70">
          {eyebrow}
        </span>

        <div className="tw:flex tw:flex-wrap tw:items-baseline tw:gap-x-3 tw:gap-y-0.5 tw:mt-1.5">
          <Amount
            value={amount}
            decimalPlaces={2}
            className="tw:text-[2rem] tw:md:text-4xl tw:font-extrabold tw:leading-none tw:text-white"
          />
        </div>

        <div className="tw:mt-3.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
          {partyLabel && (
            <span className="tw:rounded-full tw:bg-white/20 tw:px-2.5 tw:py-0.5 tw:text-[11px] tw:font-semibold">
              {partyLabel}
            </span>
          )}
          <span className="tw:rounded-full tw:bg-black/15 tw:px-2.5 tw:py-0.5 tw:text-[11px] tw:font-medium tw:text-white/85">
            {partiesText}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
