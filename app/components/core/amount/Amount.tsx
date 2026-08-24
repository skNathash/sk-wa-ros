import React from "react";
import CommonService from "~/services/CommonService";
import clsx from "clsx";

interface AmountProps {
  value: number;
  decimalPlaces?: number;
  className?: string;
  showSymbol?: boolean;
}

/**
 * Amount component for displaying currency values with rupee symbol and proper formatting
 *
 * @param value - The numeric value to display
 * @param decimalPlaces - Number of decimal places to round to (default: 2)
 * @param className - Additional CSS classes
 * @param showSymbol - Whether to show the rupee symbol (default: true)
 */
const Amount: React.FC<AmountProps> = ({
  value,
  decimalPlaces = 2,
  className = "",
  showSymbol = true,
}) => {
  const formattedValue = CommonService.formattedAmount(value, decimalPlaces);

  return (
    <span className={clsx("app-amount", className)}>
      {showSymbol && <span className="tw:font-serif">₹</span>}
      {formattedValue}
    </span>
  );
};

export default Amount;
