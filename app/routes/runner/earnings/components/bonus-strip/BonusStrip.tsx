import clsx from "clsx";
import { WEEK_BONUSES } from "./helper";

/**
 * The three add-ons the week carries beside base pay. Pulled out of the
 * breakdown card into tiles because these are the lines the runner can still
 * move this week — the rest of the maths is already settled.
 */
export default function BonusStrip() {
  return (
    <section className="tw:grid tw:grid-cols-3 tw:gap-2.5 tw:px-4 tw:pt-4">
      {WEEK_BONUSES.map((bonus) => (
        <div key={bonus.key} className={clsx("runner-earn-tile", bonus._tileCls)}>
          <span className="app-label">{bonus.label}</span>
          <p className="app-amount tw:text-xl tw:font-bold">
            {bonus._amountLbl}
          </p>
        </div>
      ))}
    </section>
  );
}
