import clsx from "clsx";
import { PenLine } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AuthService from "~/services/AuthService";
import { TONES, rbacRoles } from "./helper";
import type { PriceEditType, PriceRowData } from "./helper";

export interface PriceRowProps {
  row: PriceRowData;
  /** Largest figure in the chart — the row bars are scaled against it. */
  max: number;
  onEdit?: (type: PriceEditType) => void;
}

/** One labelled row — figure on the right, proportional bar underneath. */
const PriceRow = ({ row, max, onEdit }: PriceRowProps) => {
  const width = max > 0 ? Math.min(100, (row.value / max) * 100) : 0;
  const tone = TONES[row.tone];
  const editable =
    !!row.editType && !!onEdit && AuthService.isRbacEnabled(rbacRoles.editPrice);

  const body = (
    <>
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <span
          className={clsx(
            "tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide",
            tone.label,
          )}
        >
          {row.label}
          {editable && (
            <span className="tw:ml-1 tw:font-semibold tw:normal-case tw:tracking-normal tw:text-slate-400 tw:group-hover:text-primary">
              · click to edit
            </span>
          )}
        </span>

        <span
          className={clsx(
            "tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:font-bold",
            tone.amount,
            editable &&
              "tw:rounded tw:border tw:border-dashed tw:border-blue-300 tw:px-1.5 tw:py-0.5",
          )}
        >
          <Amount value={row.value} decimalPlaces={row.value % 1 ? 2 : 0} />
          {editable && <PenLine size={11} className="tw:text-slate-400" />}
        </span>
      </div>

      <div className="tw:mt-1 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
        <div
          className={clsx("tw:h-full tw:rounded-full", tone.bar)}
          style={{ width: `${width}%` }}
        />
      </div>
    </>
  );

  if (!editable) return <div className="tw:py-1.5">{body}</div>;

  return (
    <button
      type="button"
      onClick={() => onEdit?.(row.editType!)}
      title={`Edit ${row.label}`}
      className="tw:group tw:block tw:w-full tw:cursor-pointer tw:py-1.5 tw:text-left"
    >
      {body}
    </button>
  );
};

export default PriceRow;
