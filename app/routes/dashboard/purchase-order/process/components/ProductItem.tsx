import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import ProductItemForm from "./ProductItemForm";
import { useTranslation } from "react-i18next";

type ProductItemProps = {
  product: any;
  index: number;
  openedIndex: number;
  onToggle: (index: number) => void;
};

const ProductItem = ({
  product,
  index,
  openedIndex,
  onToggle,
}: ProductItemProps) => {
  const { t } = useTranslation();

  const isOpen = openedIndex === index;

  return (
    <>
      <AppCard
        noPadding
        className={clsx(
          "tw:border tw:hover:shadow-sm"
          // product?._scanned
          //   ? "tw:border-green-500 tw:border-l"
          //   : isOpen && "tw:border-2 tw:border-blue-500"
        )}
      >
        <div className="tw:flex tw:items-start tw:gap-3 tw:p-4">
          <AppLink
            href={`/dashboard/inventory/products/view/${product.dealId}`}
            asLink
          >
            <div className="tw:w-12 tw:h-12 tw:flex tw:items-center tw:justify-center tw:bg-gray-100 tw:rounded"></div>
          </AppLink>

          <div className="tw:flex-1">
            <div className="tw:text-sm tw:font-medium tw:mb-1">
              <AppLink
                href={`/dashboard/inventory/products/view/${product.dealId}`}
                asLink
              >
                {product.dealName}
              </AppLink>
            </div>
            <div className="tw:text-xs tw:text-gray-600">
              {t("id")}: {product.dealRefId}
            </div>
          </div>
        </div>

        <Divider className="tw:my-0!" />

        {/* Summary Information */}
        <div>
          <div className="tw:flex tw:gap-4 tw:flex-wrap tw:text-xs tw:px-4 tw:py-2">
            <div className="tw:text-blue-700 tw:font-medium">
              <span>{t("ordered")}:</span> {product.quantity || 0}
            </div>
            <div className="tw:text-green-700 tw:font-medium">
              <span>{t("received")}:</span> {product.formData?.receivedQty || 0}
            </div>
            <div className="tw:text-red-500 tw:font-medium">
              <span>{t("damaged")}:</span> {product.formData?.damageQty || 0}
            </div>
            <div className="tw:text-gray-600 tw:font-medium">
              <span>{t("mrp")}:</span> <Amount value={product.mrp || 0} />
            </div>
          </div>

          {product.barcode && (
            <div className="tw:text-gray-600 tw:font-medium tw:text-xs">
              <span>{t("barcode")}:</span> {product.barcode}
            </div>
          )}
        </div>

        <Divider className="tw:my-0!" />

        <div
          className={clsx(
            "tw:flex tw:items-center tw:justify-between tw:px-4 tw:pt-3 tw:cursor-pointer",
            {
              "tw:pb-4": !isOpen,
            }
          )}
          onClick={() => {
            onToggle(index);
          }}
        >
          <span className="tw:text-sm tw:font-medium tw:text-gray-700">
            {t("quantityInfo")}
          </span>

          <button
            type="button"
            aria-expanded={isOpen}
            className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded tw:bg-transparent hover:tw:bg-gray-100"
          >
            {isOpen ? (
              <ChevronUp className="tw:w-4 tw:h-4 tw:text-gray-700" />
            ) : (
              <ChevronDown className="tw:w-4 tw:h-4 tw:text-gray-700" />
            )}
          </button>
        </div>

        {isOpen && (
          <ProductItemForm
            orderedQty={product.quantity || 0}
            dealName={product.name}
            productIndex={index}
          />
        )}
      </AppCard>
    </>
  );
};

export default ProductItem;
