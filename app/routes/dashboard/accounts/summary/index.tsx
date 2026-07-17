import { useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppProgress from "~/components/core/progress/AppProgress";

const Summary = () => {
  const [healthScore, setHealthScore] = useState([
    {
      label: "Cash Flow",
      value: 50,
      color: "success",
    },
    {
      label: "Payment Efficiency",
      value: 50,
      color: "warning",
    },
    {
      label: "Revenue Growth",
      value: 50,
      color: "danger",
    },
  ]);

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      <AppCard title="Financial Health Score">
        {healthScore.map((item) => (
          <div key={item.label} className="tw:mb-4">
            <div className="tw:mb-1 tw:text-sm tw:flex tw:items-center tw:justify-between">
              {item.label}
              <span className="tw:text-xs tw:text-emerald-500">Excellent</span>
            </div>
            <AppProgress
              value={item.value}
              className="tw:h-2"
              color={item.color as any}
            />
          </div>
        ))}
      </AppCard>
    </div>
  );
};

export default Summary;
