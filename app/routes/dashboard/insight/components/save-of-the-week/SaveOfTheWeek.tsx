import { clsx } from "clsx";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";

interface SaveOfTheWeekProps {
  savedAmount?: number;
  missedAmount?: number;
  className?: string;
}

/**
 * "Save of the week" hero card. Highlights savings vs. missed opportunities.
 */
const SaveOfTheWeek = ({
  savedAmount = 1240,
  missedAmount = 380,
  className,
}: SaveOfTheWeekProps) => {
  return (
    <div
      className={clsx(
        "tw:rounded-2xl tw:bg-[#075e54] tw:p-4 tw:text-white tw:shadow-sm",
        className,
      )}
    >
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:flex-1">
          <p className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-100/80">
            Save of the week
          </p>
          <div className="tw:mt-1 tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
            <span className="tw:text-sm tw:font-medium tw:text-emerald-50">
              + You saved
            </span>
            <Amount
              value={savedAmount}
              showSymbol={true}
              className="tw:text-lg tw:font-bold"
            />
            <span className="tw:text-sm tw:font-medium tw:text-emerald-50">
              · missed
            </span>
            <Amount
              value={missedAmount}
              showSymbol={true}
              className="tw:text-lg tw:font-bold tw:text-emerald-100"
            />
          </div>
        </div>
        <AppButton
          size="small"
          fill="outline"
          color="light"
          className="tw:rounded-full tw:border-white/40 tw:bg-white/10 tw:text-white tw:hover:bg-white/20 tw:shrink-0"
        >
          See
        </AppButton>
      </div>
    </div>
  );
};

export default SaveOfTheWeek;
