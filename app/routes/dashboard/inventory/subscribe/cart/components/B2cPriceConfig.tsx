import clsx from "clsx";
import { Tag } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import useAppToast from "~/hooks/useAppToast";
import UomPriceService from "~/services/UomPriceService";

export type B2cPriceConfigValue = {
  discount: number;
  fixedPrice: number;
  isFixedPrice: boolean;
};

interface Props {
  /** Current config in API price scale (fixedPrice stored like mrp/price). */
  config?: B2cPriceConfigValue;
  /** Item MRP in API scale, used to derive the on-MRP price. */
  mrp: number;
  unitType?: string;
  /** Emits the full updated config (API scale) on every change. */
  onChange: (config: B2cPriceConfigValue) => void;
}

export const DEFAULT_B2C_PRICE_CONFIG: B2cPriceConfigValue = {
  discount: 0,
  fixedPrice: 0,
  isFixedPrice: false,
};

/**
 * Resolves the effective consumer (B2C) selling price in API scale for a given
 * config + mrp, so callers can show/recompute the final price consistently.
 */
export const resolveB2cPrice = (
  config: B2cPriceConfigValue | undefined,
  mrp: number,
): number => {
  if (!config) return 0;
  if (config.isFixedPrice) return Number(config.fixedPrice) || 0;
  const m = Number(mrp) || 0;
  const d = Number(config.discount) || 0;
  return m - (m * d) / 100;
};

const B2cPriceConfig: React.FC<Props> = ({
  config,
  mrp,
  unitType,
  onChange,
}) => {
  const appToast = useAppToast();
  const value = config || DEFAULT_B2C_PRICE_CONFIG;
  const isFixed = value.isFixedPrice;

  const displayFixedPrice = UomPriceService.toDisplayPrice(
    value.fixedPrice,
    unitType,
  );
  const effectivePrice = resolveB2cPrice(value, mrp);
  const displayEffective = UomPriceService.toDisplayPrice(
    effectivePrice,
    unitType,
  );

  const handleModeChange = (fixed: boolean) => {
    onChange({ ...value, isFixedPrice: fixed });
  };

  const handleFixedPriceChange = (raw: string) => {
    let apiPrice =
      raw === "" ? 0 : Number(UomPriceService.toApiPrice(raw, unitType));
    if (apiPrice < 0) apiPrice = 0;
    // Fixed B2C price cannot exceed the MRP.
    const apiMrp = Number(mrp) || 0;
    if (apiMrp > 0 && apiPrice > apiMrp) apiPrice = apiMrp;
    onChange({
      ...value,
      isFixedPrice: true,
      fixedPrice: apiPrice,
      discount: 0,
    });
  };

  const handleDiscountChange = (raw: string) => {
    let d = raw === "" ? 0 : Number(raw);
    if (d < 0) d = 0;
    if (d > 99) {
      d = 99;
      appToast.show({
        msg: "Maximum discount is 99%",
        color: "warning",
      });
    }
    onChange({ ...value, isFixedPrice: false, discount: d, fixedPrice: 0 });
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-1">
      {/* Mode toggle — full words so rural users read the meaning, not symbols */}
      <div className="tw:grid tw:grid-cols-2 tw:rounded-md tw:border tw:border-gray-300 tw:overflow-hidden tw:text-[9px] tw:font-medium tw:tracking-tight tw:h-5">
        <button
          type="button"
          onClick={() => handleModeChange(false)}
          className={clsx(
            "tw:transition-colors",
            !isFixed
              ? "tw:bg-primary tw:text-white"
              : "tw:bg-white tw:text-gray-600 hover:tw:bg-gray-50",
          )}
        >
          % on MRP
        </button>
        <button
          type="button"
          onClick={() => handleModeChange(true)}
          className={clsx(
            "tw:border-l tw:border-gray-300 tw:transition-colors",
            isFixed
              ? "tw:bg-primary tw:text-white"
              : "tw:bg-white tw:text-gray-600 hover:tw:bg-gray-50",
          )}
        >
          Fixed Price
        </button>
      </div>

      {/* Value input with a clear ₹ / % adornment */}
      <div className="tw:relative">
        {isFixed ? (
          <>
            <span className="tw:absolute tw:left-2 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:text-gray-400">
              ₹
            </span>
            <input
              type="number"
              className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-8 tw:pl-6 tw:pr-2 tw:outline-none tw:text-sm"
              placeholder={
                UomPriceService.isSmallUom(unitType)
                  ? `Price per ${UomPriceService.getDisplayUom(unitType)}`
                  : "Selling price"
              }
              value={displayFixedPrice || ""}
              onChange={(e) => handleFixedPriceChange(e.target.value)}
            />
          </>
        ) : (
          <>
            <input
              type="number"
              className="tw:w-full tw:border tw:border-gray-300 tw:rounded-md tw:h-8 tw:pl-2 tw:pr-6 tw:outline-none tw:text-sm"
              placeholder="Discount"
              value={value.discount || ""}
              onChange={(e) => handleDiscountChange(e.target.value)}
            />
            <span className="tw:absolute tw:right-2 tw:top-1/2 tw:-translate-y-1/2 tw:text-sm tw:text-gray-400">
              %
            </span>
          </>
        )}
      </div>

      {/* Plain-language preview: states the resulting customer price */}
      <div className="tw:flex tw:items-center tw:gap-1 tw:flex-wrap tw:text-[10px] tw:text-gray-500 tw:leading-tight">
        <Tag className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
        <span>Final B2C price</span>
        <Amount
          value={displayEffective}
          decimalPlaces={2}
          className="tw:font-semibold tw:text-gray-700"
        />
        {UomPriceService.isSmallUom(unitType) && unitType && (
          <span>
            /{UomPriceService.getDisplayUom(unitType)} (=&nbsp;
            <Amount
              value={UomPriceService.toBaseUnitPrice(effectivePrice)}
              decimalPlaces={3}
            />
            /{unitType})
          </span>
        )}
      </div>
    </div>
  );
};

export default B2cPriceConfig;
