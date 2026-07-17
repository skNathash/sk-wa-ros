import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";

const MobileView = ({
  products,
  showReceived,
}: {
  products: any[];
  showReceived?: boolean;
}) => {
  const { t } = useTranslation();

  if (!products?.length) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        <Package className="tw:w-12 tw:h-12 tw:mx-auto tw:mb-4 tw:text-gray-300" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="tw:space-y-4">
      {products.map((product) => (
        <div
          key={product._id}
          className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-4 tw:flex tw:flex-col tw:gap-2"
        >
          <div className="tw:font-semibold tw:text-base tw:text-gray-900">
            {product.dealName}
          </div>
          <div className="tw:text-xs tw:text-gray-500">{product.dealRefId}</div>
          <div className="tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2 tw:text-xs tw:text-gray-700">
            <div>
              <span className="tw:font-medium">{t("mrp")}:</span>{" "}
              <Amount value={product.mrp} />
            </div>
            <div>
              <span className="tw:font-medium">{t("price")}:</span>{" "}
              <Amount value={product.price} />
            </div>
            <div>
              <span className="tw:font-medium">{t("ordered")}:</span>{" "}
              {product.quantity ?? 0}
            </div>
            <div>
              <span className="tw:font-medium">{t("received")}:</span>{" "}
              {showReceived ? product.fulfilledQty ?? 0 : "--"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
