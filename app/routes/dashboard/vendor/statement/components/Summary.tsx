import React from "react";
import Amount from "~/components/core/amount/Amount";

const Summary: React.FC<{ summary: any[] }> = ({ summary }) => {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:p-4">
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

  // return (
  //   <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4">
  //     {summary.map((item, idx) => (
  //       <div
  //         key={idx}
  //         className="tw:flex tw:flex-col tw:justify-center tw:items-start tw:p-4 tw:border-b tw:border-r tw:last:border-r-0 tw:border-gray-200"
  //       >
  //         <span className="tw:text-gray-500 tw:text-sm tw:mb-1">
  //           {item.label}
  //         </span>
  //         <span
  //           className={`tw:font-bold tw:text-xl ${
  //             item.color ? item.color : "tw:text-gray-900"
  //           }`}
  //         >
  //           {item.loading ? <AppSpinner /> : <Amount value={item.value} />}
  //         </span>
  //       </div>
  //     ))}
  //   </div>
  // );
};

export default Summary;
