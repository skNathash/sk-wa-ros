import clsx from "clsx";
import React from "react";

/** Small uppercase caption that heads each block of the GST dashboard. */
export const SectionLabel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={clsx(
      "tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.12em] tw:text-gray-500 tw:mb-2",
      className,
    )}
  >
    {children}
  </div>
);

/** Centred spinner shown while a GST dashboard card list is loading. */
export const ListLoader: React.FC = () => (
  <div className="tw:p-8 tw:text-center">
    <div className="tw:inline-block tw:w-12 tw:h-12 tw:border-4 tw:border-gray-200 tw:border-t-primary tw:rounded-full tw:animate-spin" />
    <p className="tw:text-gray-600 tw:text-sm tw:mt-4">Loading...</p>
  </div>
);

const rateAccents = ["#0f766e", "#7c3aed", "#4f46e5", "#dc2626"];

/** Bar/label colour for a GST-rate row, cycled by row order. */
export const getRateAccent = (index: number) =>
  rateAccents[index % rateAccents.length];
