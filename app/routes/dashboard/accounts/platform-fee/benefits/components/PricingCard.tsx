import AppCard from "~/components/core/card/AppCard";
import { CheckCircle, XCircle, Target } from "lucide-react";

export default function PricingCard({
  title,
  subtitle,
  structure,
  structureColor,
  advantages,
  challenges,
  target,
  example,
  totalCost,
  totalCostDetail,
  recommended,
}: {
  title: string;
  subtitle: string;
  structure: string;
  structureColor: "blue" | "orange" | "green";
  advantages: string[];
  challenges: string[];
  target: string;
  example: string;
  totalCost: string;
  totalCostDetail?: string;
  recommended?: boolean;
}) {
  const colorMap = {
    blue: "tw:bg-blue-50 tw:text-blue-700 tw:border-blue-200",
    orange: "tw:bg-orange-50 tw:text-orange-700 tw:border-orange-200",
    green: "tw:bg-emerald-50 tw:text-emerald-700 tw:border-emerald-200",
  };

  return (
    <AppCard noShadow bordered>
      <div className="tw:space-y-3">
        {/* Header */}
        <div className="tw:flex tw:items-start tw:justify-between">
          <div>
            <h3 className="tw:font-bold tw:text-gray-800">{title}</h3>
            <p className="tw:text-xs tw:text-gray-500">{subtitle}</p>
          </div>
          {recommended && (
            <span className="tw:bg-emerald-500 tw:text-white tw:text-xs tw:font-semibold tw:px-2 tw:py-0.5 tw:rounded-full">
              Recommended
            </span>
          )}
        </div>

        {/* Structure */}
        <div
          className={`tw:rounded-md tw:border tw:px-3 tw:py-2 ${colorMap[structureColor]}`}
        >
          <p className="tw:text-xs tw:font-medium tw:mb-0.5">Structure</p>
          <p className="tw:font-bold tw:text-sm">{structure}</p>
        </div>

        {/* Advantages */}
        <div>
          <p className="tw:text-xs tw:font-semibold tw:text-emerald-600 tw:mb-1.5">
            Advantages
          </p>
          <ul className="tw:space-y-1">
            {advantages.map((a, i) => (
              <li key={i} className="tw:flex tw:items-start tw:gap-1.5">
                <CheckCircle className="tw:w-3.5 tw:h-3.5 tw:text-emerald-500 tw:mt-0.5 tw:shrink-0" />
                <span className="tw:text-xs tw:text-gray-700">{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Challenges */}
        <div>
          <p className="tw:text-xs tw:font-semibold tw:text-red-500 tw:mb-1.5">
            Challenges
          </p>
          <ul className="tw:space-y-1">
            {challenges.map((c, i) => (
              <li key={i} className="tw:flex tw:items-start tw:gap-1.5">
                <XCircle className="tw:w-3.5 tw:h-3.5 tw:text-red-400 tw:mt-0.5 tw:shrink-0" />
                <span className="tw:text-xs tw:text-gray-700">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Target */}
        <div className="tw:flex tw:items-center tw:gap-1.5">
          <Target className="tw:w-3.5 tw:h-3.5 tw:text-gray-400" />
          <span className="tw:text-xs tw:text-gray-500">Target: {target}</span>
        </div>

        {/* Example */}
        <div className="tw:bg-gray-50 tw:rounded-md tw:p-2.5 tw:border tw:border-gray-200">
          <p className="tw:text-xs tw:text-gray-500">{example}</p>
          <p className="tw:font-bold tw:text-sm tw:text-gray-800">
            {recommended ? "First Year: " : "Total Cost: "}
            {totalCost}
          </p>
          {totalCostDetail && (
            <p className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
              {totalCostDetail}
            </p>
          )}
        </div>
      </div>
    </AppCard>
  );
}
