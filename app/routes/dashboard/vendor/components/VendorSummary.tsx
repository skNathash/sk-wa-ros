import { AlertTriangle } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";

/**
 * Vendor directory summary strip.
 *
 * Three-column money-first summary matching the shared theme-2 mock:
 * "You owe" (outstanding payable), "Vendor credit" (paylater available) and
 * "Alerts" (vendors needing action).
 *
 * NOTE: values here are STATIC placeholders for the new design pass — wiring
 * to real vendor statistics comes in a follow-up.
 */
const VendorSummary = ({ className }: { className?: string }) => {
  const items = [
    {
      key: "youOwe",
      label: "You owe",
      value: <Amount value={21840} decimalPlaces={0} />,
      hint: "across 8 vendors",
      valueClass: "tw:text-red-600",
    },
    {
      key: "vendorCredit",
      label: "Vendor credit",
      value: <Amount value={3200} decimalPlaces={0} />,
      hint: "paylater from 2 vendors",
      valueClass: "tw:text-green-700",
    },
    {
      key: "alerts",
      label: "Alerts",
      value: (
        <span className="tw:inline-flex tw:items-center tw:gap-1.5">
          <AlertTriangle size={18} className="tw:text-amber-500" />3
        </span>
      ),
      hint: "need action",
      valueClass: "tw:text-gray-900",
    },
  ];

  return (
    <AppCard
      className={`tw:-mx-4 tw:rounded-none! tw:border-x-0! tw:border-t! tw:border-t-gray-200! tw:lg:mx-0 tw:lg:rounded-xl! tw:lg:border-x! ${className ?? ""}`}
      noPadding
    >
      <div className="tw:grid tw:grid-cols-3 tw:divide-x tw:divide-gray-200">
        {items.map((item) => (
          <div key={item.key} className="tw:px-3 tw:py-3">
            <div className="app-label tw:text-gray-500">{item.label}</div>
            <div
              className={`app-amount tw:mt-1 tw:text-lg tw:font-bold ${item.valueClass}`}
            >
              {item.value}
            </div>
            <div className="tw:mt-0.5 tw:text-[11px] tw:text-gray-500">
              {item.hint}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default VendorSummary;
