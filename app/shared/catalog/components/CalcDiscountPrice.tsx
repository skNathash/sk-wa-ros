import React from "react";
import Amount from "~/components/core/amount/Amount";

interface CalcDiscountPriceProps {
  value: number;
  discount?: number; // discount in percent (e.g., 10 for 10%)
}

/**
 * Displays the price after applying the discount.
 * If discount is not provided or zero, shows the original value.
 */
const CalcDiscountPrice: React.FC<CalcDiscountPriceProps> = ({
  value,
  discount = 0,
}) => {
  // Calculate discounted price
  const discountedPrice =
    discount > 0 ? value - (value * discount) / 100 : value;

  return <Amount value={discountedPrice} />;
};

export default CalcDiscountPrice;
