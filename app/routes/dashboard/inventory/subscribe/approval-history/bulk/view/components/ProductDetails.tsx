import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";

export interface ProductInfo {
  name: string;
  category: { id: string | number; name: string };
  brand: { id: string | number; name: string };
  price: number;
  mrp: number;
  barcode: string;
  description?: string;
  images?: string[];
  unitType?: string;
}

interface ProductDetailsProps {
  product: ProductInfo;
  label?: string;
  variant?: "desktop" | "mobile";
}

const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  label,
  variant = "desktop",
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <div
      className={
        variant === "mobile"
          ? "tw:mb-2 tw:p-2 tw:bg-gray-50 tw:rounded"
          : "tw:space-y-1"
      }
    >
      {label && (
        <div
          className={variant === "mobile" ? "tw:font-bold tw:mb-1" : undefined}
        >
          {label}
        </div>
      )}
      <div className="tw:font-bold">{product.name || "--"}</div>
      <div className="tw:text-gray-600">
        {product.brand?.name || "--"}
        {product.brand?.name && product.category?.name ? " - " : ""}
        {product.category?.name || ""}
      </div>
    </div>
  );
};

export default ProductDetails;
