import React from "react";

export default function BenefitsComboBanner() {
  return (
    <div
      className="tw:rounded-2xl tw:p-4 tw:sm:p-5 tw:border tw:border-dashed tw:border-slate-300/80 tw:flex tw:flex-col tw:sm:flex-row tw:items-start tw:sm:items-center tw:gap-3.5 tw:shadow-2xs"
      style={{
        background:
          "linear-gradient(90deg, #FCF7EE 0%, #F5F7FD 50%, #EBF2FC 100%)",
      }}
    >
      <div className="tw:bg-[#1E2B3E] tw:text-white tw:text-xs tw:font-bold tw:tracking-wider tw:px-3 tw:py-1.5 tw:rounded-lg tw:shrink-0 tw:uppercase">
        SAVE 8%
      </div>
      <p className="tw:text-sm tw:sm:text-base tw:text-slate-700 tw:leading-relaxed">
        <strong className="tw:font-semibold tw:text-[#182638]">
          Combine Stock + Shop
        </strong>{" "}
        on the same bill — one invoice, one auto-repay date, 8% off both plan
        fees. Most retailers add the second plan around month 3.
      </p>
    </div>
  );
}
