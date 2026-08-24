import clsx from "clsx";
import { ArrowRight, BadgeCheck, Check, Store } from "lucide-react";
import { useMemo, useState } from "react";
import type { CompareField } from "../helper";
import FieldValue from "./FieldValue";

type Props = {
  fields: CompareField[];
  onImageClick?: (images: any[]) => void;
  /** label for the right hand column, e.g. "Linked catalog item" */
  finalLabel?: string;
};

const CompareTable = ({
  fields,
  onImageClick,
  finalLabel = "Updated by StoreKing",
}: Props) => {
  const [onlyChanges, setOnlyChanges] = useState(false);

  const changedCount = useMemo(
    () => fields.filter((f) => f.changed).length,
    [fields]
  );

  const visible = onlyChanges ? fields.filter((f) => f.changed) : fields;

  return (
    <div>
      {/* Summary + filter */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:mb-3">
        <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm">
          {changedCount ? (
            <>
              <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-5 tw:h-5 tw:px-1.5 tw:rounded-full tw:bg-amber-100 tw:text-amber-800 tw:text-xs tw:font-semibold">
                {changedCount}
              </span>
              <span className="tw:text-gray-700">
                of {fields.length} details were updated by StoreKing
              </span>
            </>
          ) : (
            <>
              <Check size={16} className="tw:text-emerald-600" />
              <span className="tw:text-gray-700">
                Approved exactly as you submitted it
              </span>
            </>
          )}
        </div>

        {changedCount ? (
          <button
            type="button"
            onClick={() => setOnlyChanges((v) => !v)}
            className={clsx(
              "tw:text-xs tw:font-medium tw:px-2.5 tw:py-1 tw:rounded-full tw:border tw:transition-colors",
              onlyChanges
                ? "tw:bg-amber-50 tw:border-amber-300 tw:text-amber-800"
                : "tw:bg-white tw:border-gray-300 tw:text-gray-600 tw:hover:border-gray-400"
            )}
          >
            {onlyChanges ? "Showing changes only" : "Show changes only"}
          </button>
        ) : null}
      </div>

      {/* Column captions — desktop only */}
      <div className="tw:hidden tw:md:grid tw:grid-cols-[10rem_1fr_1fr] tw:gap-x-4 tw:px-3 tw:pb-1.5">
        <div />
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
          <Store size={12} />
          You submitted
        </div>
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-semibold tw:tracking-wide tw:text-blue-600 tw:uppercase">
          <BadgeCheck size={12} />
          {finalLabel}
        </div>
      </div>

      <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden tw:divide-y tw:divide-gray-100">
        {visible.map((f) => (
          <div
            key={f.key}
            className={clsx(
              "tw:px-3 tw:py-2.5 tw:border-l-3",
              f.changed
                ? "tw:bg-amber-50/60 tw:border-l-amber-400"
                : "tw:bg-white tw:border-l-transparent"
            )}
          >
            <div className="tw:md:grid tw:md:grid-cols-[10rem_1fr_1fr] tw:md:gap-x-4 tw:md:items-start">
              {/* Label */}
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1 tw:md:mb-0">
                <span className="tw:text-xs tw:font-medium tw:text-gray-500">
                  {f.label}
                </span>
                {f.changed ? (
                  <span className="tw:md:hidden tw:text-[10px] tw:font-semibold tw:text-amber-700 tw:bg-amber-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                    Updated
                  </span>
                ) : null}
              </div>

              {f.changed ? (
                <>
                  {/* Retailer value — replaced, so de-emphasised */}
                  <div className="tw:min-w-0">
                    <div className="tw:md:hidden tw:text-[10px] tw:font-semibold tw:text-gray-400 tw:uppercase tw:mb-0.5">
                      You submitted
                    </div>
                    <FieldValue
                      value={f.submitted}
                      type={f.type}
                      muted
                      onImageClick={onImageClick}
                    />
                  </div>

                  {/* StoreKing value */}
                  <div className="tw:min-w-0 tw:mt-1.5 tw:md:mt-0">
                    <div className="tw:md:hidden tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:text-blue-600 tw:uppercase tw:mb-0.5">
                      <ArrowRight size={10} />
                      {finalLabel}
                    </div>
                    <FieldValue
                      value={f.final}
                      type={f.type}
                      className="tw:font-semibold"
                      onImageClick={onImageClick}
                    />
                  </div>
                </>
              ) : (
                /* Unchanged — show the value once across both columns */
                <div className="tw:min-w-0 tw:md:col-span-2 tw:flex tw:items-start tw:justify-between tw:gap-3">
                  <FieldValue
                    value={f.submitted}
                    type={f.type}
                    onImageClick={onImageClick}
                  />
                  <span className="tw:hidden tw:md:inline tw:shrink-0 tw:text-[10px] tw:text-gray-400 tw:mt-0.5">
                    unchanged
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {!visible.length ? (
          <div className="tw:px-3 tw:py-6 tw:text-center tw:text-sm tw:text-gray-500">
            No changes to show.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CompareTable;
