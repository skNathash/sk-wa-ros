import React from "react";
import Amount from "~/components/core/amount/Amount";

const Summary: React.FC<{ summary: any[] }> = ({ summary }) => {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:p-4 tw:bg-white tw:rounded-lg tw:border tw:border-gray-200 tw:mb-4">
      <div className="tw:text-sm tw:text-slate-500 tw:mb-1">
        Current Outstanding Balance
      </div>
      <div className="tw:text-2xl tw:font-bold">
        <Amount
          value={summary?.[2]?.value ?? 0}
          decimalPlaces={2}
          className={
            summary?.[2]?.value > 0 ? "tw:text-green-500" : "tw:text-red-500"
          }
        />
      </div>
    </div>
  );
};

export default Summary;
