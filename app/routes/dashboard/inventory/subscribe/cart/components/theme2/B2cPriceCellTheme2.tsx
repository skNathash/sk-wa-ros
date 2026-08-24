import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import useAppToast from "~/hooks/useAppToast";
import UomPriceService from "~/services/UomPriceService";
import {
  DEFAULT_B2C_PRICE_CONFIG,
  resolveB2cPrice,
  type B2cPriceConfigValue,
} from "../B2cPriceConfig";

interface Props {
  /** Current config in API price scale (fixedPrice stored like mrp/price). */
  config?: B2cPriceConfigValue;
  /** Item MRP in API scale, used to derive the on-MRP price. */
  mrp: number;
  unitType?: string;
  onChange: (config: B2cPriceConfigValue) => void;
}

/**
 * The consumer price, as one control on the cart line: how the price is set
 * (off MRP or a flat figure) sits beside the figure it takes, so the two read
 * as one decision — and the whole control keeps the same 32px height as the
 * UOM select and the stock stepper, so the line has a single control band. The
 * resulting customer price is echoed underneath, since in discount mode the
 * number in the field isn't the price the shopper pays.
 */
const B2cPriceCellTheme2 = ({ config, mrp, unitType, onChange }: Props) => {
  const appToast = useAppToast();
  const value = config || DEFAULT_B2C_PRICE_CONFIG;
  const isFixed = value.isFixedPrice;

  const displayFixedPrice = UomPriceService.toDisplayPrice(
    value.fixedPrice,
    unitType,
  );
  const displayEffective = UomPriceService.toDisplayPrice(
    resolveB2cPrice(value, mrp),
    unitType,
  );

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
    let discount = raw === "" ? 0 : Number(raw);
    if (discount < 0) discount = 0;
    if (discount > 99) {
      discount = 99;
      appToast.show({ msg: "Maximum discount is 99%", color: "warning" });
    }
    onChange({ ...value, isFixedPrice: false, discount, fixedPrice: 0 });
  };

  /* Segments of a switch, not chips. The chosen mode carries a soft primary
     tint rather than a solid fill — at this size a saturated block shouted
     louder than the price it qualifies. */
  const modeClass = (active: boolean) =>
    clsx(
      "tw:px-2 tw:text-[9.5px] tw:font-bold tw:uppercase tw:tracking-wider tw:transition-colors",
      active
        ? "tw:bg-primary/10 tw:text-primary"
        : "tw:bg-white tw:text-slate-400 hover:tw:bg-slate-50 hover:tw:text-slate-600",
    );

  const inputClass =
    "no-spinner tw:h-full tw:min-w-0 tw:flex-1 tw:border-0 tw:bg-transparent tw:text-[13px] tw:font-bold tw:tabular-nums tw:text-slate-800 tw:outline-none placeholder:tw:font-normal placeholder:tw:text-slate-300";

  return (
    <div className="tw:flex tw:flex-col tw:gap-1">
      <div className="tw:flex tw:h-8 tw:items-stretch tw:gap-1.5">
        <div className="tw:flex tw:shrink-0 tw:items-stretch tw:divide-x tw:divide-slate-200 tw:overflow-hidden tw:rounded-lg tw:border tw:border-slate-200">
          <button
            type="button"
            onClick={() => onChange({ ...value, isFixedPrice: false })}
            className={modeClass(!isFixed)}
            title="Discount off MRP"
          >
            MRP
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, isFixedPrice: true })}
            className={modeClass(isFixed)}
            title="Flat selling price"
          >
            Fixed
          </button>
        </div>

        {/* The figure gets its own field — border, focus ring and a unit
            adornment — so it's obvious it can be typed into. */}
        <label className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-2 tw:transition focus-within:tw:border-primary focus-within:tw:ring-2 focus-within:tw:ring-primary/15">
          {isFixed && (
            <span className="tw:shrink-0 tw:font-serif tw:text-[12px] tw:text-slate-400">
              ₹
            </span>
          )}
          {isFixed ? (
            <input
              type="number"
              aria-label="Fixed selling price"
              placeholder="0"
              value={displayFixedPrice || ""}
              onChange={(e) => handleFixedPriceChange(e.target.value)}
              className={inputClass}
            />
          ) : (
            <input
              type="number"
              aria-label="Discount off MRP"
              placeholder="0"
              value={value.discount || ""}
              onChange={(e) => handleDiscountChange(e.target.value)}
              className={inputClass}
            />
          )}
          {!isFixed && (
            <span className="tw:shrink-0 tw:text-[12px] tw:font-semibold tw:text-slate-400">
              %
            </span>
          )}
        </label>
      </div>
      <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:leading-none tw:text-slate-400">
        Customer pays
        <Amount
          value={displayEffective}
          decimalPlaces={2}
          className="tw:font-semibold tw:text-slate-600"
        />
      </div>
    </div>
  );
};

export default B2cPriceCellTheme2;
