import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import UomPriceService from "~/services/UomPriceService";

const DisplayPrice = ({
  price,
  uom,
  decimalPlaces,
  className,
  uomClassName,
  hideDefaultUom = false,
  hideUom = false,
}: {
  price: number;
  uom?: string;
  decimalPlaces?: number;
  className?: string;
  uomClassName?: string;
  hideDefaultUom?: boolean;
  hideUom?: boolean;
}) => {
  const displayPrice = UomPriceService.toDisplayPrice(price, uom);
  const displayUom = UomPriceService.getDisplayUom(uom);
  // For small uoms (gm/ml) show 4 decimals for finer precision, else 2.
  const effectiveDecimals =
    decimalPlaces ?? (UomPriceService.isSmallUom(uom) ? 4 : 2);
  const showUom =
    !hideUom &&
    !!displayUom &&
    !(hideDefaultUom && String(displayUom).toLowerCase() === "unit");

  return (
    <span className={className}>
      <Amount value={Number(displayPrice)} decimalPlaces={effectiveDecimals} />
      {showUom && (
        <span
          className={clsx("tw:text-xs tw:text-gray-500 tw:ml-1", uomClassName)}
        >
          / {displayUom}
        </span>
      )}
    </span>
  );
};

export default DisplayPrice;
