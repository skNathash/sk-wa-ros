import Amount from "~/components/core/amount/Amount";
import CommonService from "~/services/CommonService";
import clsx from "clsx";

type DisplayProfitProps = {
  price: number;
  offerPrice: number;
  className?: string;
};

const DisplayProfit = ({
  price,
  offerPrice,
  className,
}: DisplayProfitProps) => {
  const profit = CommonService.calculateProfit(price, offerPrice);
  return (
    <Amount
      value={profit}
      decimalPlaces={2}
      className={clsx(className, {
        "tw:text-green-600": profit >= 0,
        "tw:text-red-600": profit < 0,
      })}
    />
  );
};

export default DisplayProfit;
