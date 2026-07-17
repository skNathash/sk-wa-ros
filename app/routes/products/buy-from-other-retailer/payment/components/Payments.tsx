import { CreditCard, HandCoins, Wallet } from "lucide-react";
import { useState } from "react";

const defaultOptions = [
  {
    label: "COD",
    value: "cod",
    icon: <HandCoins size={18} />,
  },
  {
    label: "Prepaid",
    value: "prepaid",
    icon: <Wallet size={18} />,
  },
  {
    label: "Paylater",
    value: "paylater",
    icon: <CreditCard size={18} />,
  },
];

type PaymentOption = {
  label: string;
  value: string;
  icon?: any;
};

const Payments = ({
  onPrepaid,
  options,
}: {
  onPrepaid?: () => void;
  options?: PaymentOption[] | any[];
}) => {
  const [selected, setSelected] = useState("cod");

  const resolvedOptions: PaymentOption[] = Array.isArray(options)
    ? options.map((o: any) => ({
        label: o.label || o.name || o.value,
        value: o.value || o.code || o.id,
      }))
    : defaultOptions;

  // if provided options are empty, fallback to default
  const finalOptions =
    resolvedOptions.length > 0 ? resolvedOptions : defaultOptions;

  const handleClick = (value: string) => {
    setSelected(value);
    if (value === "prepaid") {
      onPrepaid?.();
    }
  };

  return (
    <div className="tw:grid tw:grid-cols-3 tw:gap-2">
      {finalOptions.map((option) => {
        const isSelected = selected === option.value;
        return (
          <div
            key={option.value}
            className={`tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-1.5 tw:cursor-pointer tw:border-2 tw:rounded-xl tw:p-3 tw:transition-all ${
              isSelected
                ? "tw:border-blue-600 tw:bg-blue-50 tw:text-blue-700 tw:shadow-sm"
                : "tw:border-gray-100 tw:bg-white tw:text-gray-400 hover:tw:border-gray-200"
            }`}
            onClick={() => handleClick(option.value)}
          >
            <div>{option.icon || null}</div>
            <div className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-tight tw:text-center">
              {option.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Payments;
