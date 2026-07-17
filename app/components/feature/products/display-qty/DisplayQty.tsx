import CommonService from "~/services/CommonService";

const DisplayQty = ({
  qty,
  isLooseQty,
  noConv = false,
  uom,
  hideDefaultUom = false,
}: {
  qty: number;
  isLooseQty: boolean;
  noConv?: boolean;
  uom?: string;
  hideDefaultUom?: boolean;
}) => {
  if (uom) {
    if (hideDefaultUom && String(uom).toLowerCase() === "unit") {
      return <span>{qty}</span>;
    }
    if (uom === "gm" && qty >= 1000) {
      return (
        <span>{CommonService.roundedByDecimalPlace(qty / 1000, 2)} kg</span>
      );
    }
    if (uom === "ml" && qty >= 1000) {
      return (
        <span>{CommonService.roundedByDecimalPlace(qty / 1000, 2)} L</span>
      );
    }
    return (
      <span>
        {qty} {uom}
      </span>
    );
  }
  return (
    <>
      {isLooseQty ? (
        <span>
          {noConv ? qty : CommonService.roundedByDecimalPlace(qty / 1000, 2)} kg
        </span>
      ) : (
        <span>
          {qty}
          {!hideDefaultUom && ` ${qty > 1 ? "units" : "unit"}`}
        </span>
      )}
    </>
  );
};

export default DisplayQty;
