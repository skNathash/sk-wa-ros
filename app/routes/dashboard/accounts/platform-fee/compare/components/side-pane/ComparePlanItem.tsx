import clsx from "clsx";
import React from "react";
import type { ComparePlanItemData, ComparePlanType } from "./helper";

interface ComparePlanItemProps {
  plan: ComparePlanItemData;
  type: ComparePlanType;
}

/** Hover accent per plan shape — amber for stock, blue for shop. */
const HOVER_CLASS: Record<ComparePlanType, string> = {
  stock: "hover:tw:border-amber-400 hover:tw:bg-amber-50/20",
  shop: "hover:tw:border-blue-400 hover:tw:bg-blue-50/20",
};

const NAME_HOVER_CLASS: Record<ComparePlanType, string> = {
  stock: "group-hover:tw:text-amber-900",
  shop: "group-hover:tw:text-blue-900",
};

/** One JUMP TO row, shared by both plan shapes. */
const ComparePlanItem: React.FC<ComparePlanItemProps> = ({ plan, type }) => (
  <button
    type="button"
    onClick={() =>
      document
        .getElementById(plan.id)
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
    className={clsx(
      "tw:w-full tw:flex tw:items-center tw:justify-between tw:px-3.5 tw:py-2.5 tw:rounded-xl tw:bg-white tw:border tw:border-slate-200/90 tw:shadow-2xs tw:cursor-pointer tw:transition-all tw:text-left group",
      HOVER_CLASS[type],
    )}
  >
    <span
      className={clsx(
        "tw:font-bold tw:text-sm tw:text-[#183B47]",
        NAME_HOVER_CLASS[type],
      )}
    >
      {plan.name}
    </span>
    <span className="tw:font-bold tw:text-sm tw:text-[#3B82F6]">
      {plan.value}
    </span>
  </button>
);

export default ComparePlanItem;
