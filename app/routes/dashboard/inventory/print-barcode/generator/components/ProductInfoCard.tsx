import React from "react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";

type ProductInfo = {
  name: string;
  id: string;
  refId: string;
  barcode: string;
  mrp: string;
  expiry: string;
  quantity: string;
};

type Props = {
  productInfo: ProductInfo;
};

const Meta: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <span className="tw:inline-flex tw:items-baseline tw:gap-1">
    <span className="tw:text-slate-500">{label}</span>
    <span className="tw:font-medium tw:text-slate-800">{children}</span>
  </span>
);

const ProductInfoCard: React.FC<Props> = ({ productInfo }) => {
  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-slate-50/80 tw:px-3 tw:py-2.5">
      <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
        {productInfo.name || "No product selected"}
      </div>
      <div className="tw:mt-1 tw:flex tw:flex-wrap tw:gap-x-3 tw:gap-y-0.5 tw:text-[11px]">
        {productInfo.refId && <Meta label="ID">{productInfo.refId}</Meta>}
        {productInfo.barcode && (
          <Meta label="Barcode">{productInfo.barcode}</Meta>
        )}
        {productInfo.mrp && (
          <Meta label="MRP">
            <Amount
              value={Number(productInfo.mrp) || 0}
              decimalPlaces={2}
              showSymbol={false}
            />
          </Meta>
        )}
        {productInfo.expiry && (
          <Meta label="Expiry">
            <DateFormat
              value={productInfo.expiry}
              formatStr="dd MMM yyyy"
            />
          </Meta>
        )}
      </div>
    </div>
  );
};

export type { ProductInfo };

export default ProductInfoCard;
