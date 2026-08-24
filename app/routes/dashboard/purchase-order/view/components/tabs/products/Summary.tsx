import React from "react";

interface SummaryProps {
  totalProducts: number;
  totalUnits: number;
  receivedProducts: number;
  receivedUnits: number;
  notReceivedProducts: number;
  notReceivedUnits: number;
}

type Stat = {
  label: string;
  value: number;
  labelClass?: string;
};

/**
 * Flat product stats strip — sits flush inside the white products block,
 * no card chrome of its own.
 */
const Summary: React.FC<SummaryProps> = ({
  totalProducts,
  totalUnits,
  receivedProducts,
  receivedUnits,
  notReceivedProducts,
  notReceivedUnits,
}) => {
  const stats: Stat[] = [
    { label: "Total Products", value: totalProducts },
    { label: "Total Units", value: totalUnits },
    {
      label: "Received Products",
      value: receivedProducts,
      labelClass: "tw:text-emerald-700",
    },
    {
      label: "Received Units",
      value: receivedUnits,
      labelClass: "tw:text-emerald-700",
    },
  ];

  if (notReceivedProducts > 0) {
    stats.push(
      {
        label: "Not Received Products",
        value: notReceivedProducts,
        labelClass: "tw:text-red-600",
      },
      {
        label: "Not Received Units",
        value: notReceivedUnits,
        labelClass: "tw:text-red-600",
      },
    );
  }

  return (
    <div className="tw:border-b tw:border-emerald-100/80 tw:bg-emerald-50">
      <div
        className={`tw:grid tw:gap-3 tw:px-3 tw:py-3 tw:md:gap-4 tw:md:px-4 ${
          stats.length > 4
            ? "tw:grid-cols-2 tw:sm:grid-cols-3 tw:lg:grid-cols-6"
            : "tw:grid-cols-2 tw:sm:grid-cols-4"
        }`}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="tw:min-w-0">
            <p
              className={`tw:text-[10px] tw:md:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wider tw:truncate ${
                stat.labelClass ?? "tw:text-emerald-800/70"
              }`}
            >
              {stat.label}
            </p>
            <p className="tw:mt-1 tw:text-base tw:md:text-lg tw:font-bold tw:leading-none tw:tabular-nums tw:text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
