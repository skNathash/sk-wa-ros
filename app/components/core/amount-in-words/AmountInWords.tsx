import React from "react";
import clsx from "clsx";

interface AmountInWordsProps {
  value: number;
  className?: string;
  showSymbol?: boolean;
}

const formatAmountInWords = (value: number): string => {
  const absValue = Math.abs(value);

  if (absValue < 1000) {
    return value.toString();
  }

  const sign = value < 0 ? "-" : "";

  if (absValue >= 10000000) {
    const cr = absValue / 10000000;
    const formatted = Number.isInteger(cr) ? cr.toString() : cr.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}${formatted} Cr`;
  }

  if (absValue >= 100000) {
    const lakh = absValue / 100000;
    const formatted = Number.isInteger(lakh) ? lakh.toString() : lakh.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}${formatted} Lakh`;
  }

  if (absValue >= 1000) {
    const k = absValue / 1000;
    const formatted = Number.isInteger(k) ? k.toString() : k.toFixed(2).replace(/\.?0+$/, "");
    return `${sign}${formatted} K`;
  }

  return value.toString();
};

const AmountInWords: React.FC<AmountInWordsProps> = ({
  value,
  className = "",
  showSymbol = true,
}) => {
  return (
    <span className={clsx(className)}>
      {showSymbol && <span className="tw:font-serif">₹</span>}
      {formatAmountInWords(value)}
    </span>
  );
};

export default AmountInWords;
