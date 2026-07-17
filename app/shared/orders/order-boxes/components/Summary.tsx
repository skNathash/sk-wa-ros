import { Boxes as BoxesIcon, IndianRupee, Layers, Package } from "lucide-react";
import Amount from "~/components/core/amount/Amount";

type SummaryProps = {
  boxesCount: number;
  value: number;
  items: number;
  units: number;
};

const Summary = ({ boxesCount, value, items, units }: SummaryProps) => {
  const cells = [
    {
      label: "Boxes",
      value: boxesCount,
      icon: BoxesIcon,
      bg: "tw:bg-indigo-50",
      fg: "tw:text-indigo-600",
    },
    {
      label: "Value",
      value,
      icon: IndianRupee,
      bg: "tw:bg-emerald-50",
      fg: "tw:text-emerald-600",
    },
    {
      label: "Items",
      value: items,
      icon: Package,
      bg: "tw:bg-amber-50",
      fg: "tw:text-amber-600",
    },
    {
      label: "Units",
      value: units,
      icon: Layers,
      bg: "tw:bg-purple-50",
      fg: "tw:text-purple-600",
    },
  ];

  return (
    <div className="tw:overflow-hidden tw:rounded-md tw:border tw:bg-white tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:divide-y tw:divide-gray-200 tw:md:divide-y-0 tw:md:divide-x tw:mb-4">
      {cells.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="tw:flex tw:items-center tw:gap-3 tw:p-3"
          >
            <div
              className={`tw:shrink-0 tw:h-10 tw:w-10 tw:flex tw:items-center tw:justify-center tw:rounded-md ${c.bg}`}
            >
              <Icon className={`tw:h-5 tw:w-5 ${c.fg}`} />
            </div>

            <div className="tw:flex tw:flex-col">
              <div className="tw:text-base tw:font-semibold md:tw:text-lg tw:tabular-nums">
                {c.label === "Value" ? <Amount value={c.value} /> : c.value}
              </div>
              <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-gray-500">
                {c.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Summary;
