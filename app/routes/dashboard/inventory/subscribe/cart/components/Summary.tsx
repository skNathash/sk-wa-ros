import { DynamicIcon } from "lucide-react/dynamic";
import { useMemo } from "react";
import Amount from "~/components/core/amount/Amount";
import UomPriceService from "~/services/UomPriceService";

const Summary = ({ products }: { products: any[] }) => {
  const summary = useMemo(() => {
    const result = products.reduce(
      (acc, product) => {
        acc.totalProducts += 1;
        acc.totalPrice +=
          Number(
            UomPriceService.toDisplayPrice(product.price, product.unitType),
          ) * Number(product.quantity);
        return acc;
      },
      { totalProducts: 0, totalPrice: 0 },
    );

    return [
      {
        label: "Total Items",
        value: result.totalProducts,
        key: "totalProducts",
        icon: "package-2",
        iconColor: "tw:text-blue-600",
        iconBg: "tw:bg-blue-50",
      },
      {
        label: "Total Price",
        value: result.totalPrice,
        key: "totalPrice",
        icon: "indian-rupee",
        iconColor: "tw:text-amber-600",
        iconBg: "tw:bg-amber-50",
      },
    ];
  }, [products]);

  return (
    <div className="tw:mb-4 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:shadow-sm">
      <div className="tw:flex tw:flex-row tw:divide-x tw:divide-slate-200">
        {summary.map((item: any) => (
          <div
            key={item.key}
            className="tw:flex tw:flex-1 tw:items-center tw:gap-2.5 tw:px-3 tw:py-2.5"
          >
            <div
              className={`tw:flex tw:h-7 tw:w-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md ${item.iconBg}`}
            >
              <DynamicIcon
                name={item.icon}
                className={`${item.iconColor} tw:h-3.5 tw:w-3.5`}
              />
            </div>
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:text-[9px] tw:font-semibold tw:uppercase tw:tracking-[0.14em] tw:text-slate-500">
                {item.label}
              </div>
              <div className="tw:mt-0.5 tw:flex tw:items-end tw:gap-1 tw:leading-none tw:text-slate-900">
                {item.key === "totalPrice" ? (
                  <Amount
                    value={item.value}
                    decimalPlaces={2}
                    className="tw:text-[1.1rem] tw:font-bold"
                  />
                ) : (
                  <span className="tw:text-[1.1rem] tw:font-bold">
                    {item.value}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
