import { Package, Trash2 } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import CommonService from "~/services/CommonService";
import { useTranslation } from "react-i18next";

interface PoPreviewProps {
  /** Cart `items[]` — rendered as returned by the API. */
  products: Record<string, any>[];
  /** Cart `cartSummary` — rendered as returned by the API. */
  summary?: Record<string, any>;
  callback?: ({ action, data }: { action: string; data: any }) => void;
}

const PoPreview = ({ products, summary = {}, callback }: PoPreviewProps) => {
  const { t } = useTranslation(["common"]);
  const handleRemoveProduct = (product: Record<string, any>, index: number) => {
    if (callback) {
      callback({ action: "remove", data: { index, dealId: product.dealId } });
    }
  };

  const itemCount = summary.totalItems ?? products.length;

  return (
    <AppCard>
      <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
        <Package className="tw:w-5 tw:h-5 tw:text-orange-600" />
        <h3 className="tw:text-lg tw:font-semibold">{t("selectedProducts")}</h3>
        <span className="tw:text-sm tw:text-gray-500">
          ({itemCount} {t("items")})
        </span>
      </div>
      <div className="tw:space-y-3">
        {products.map((product, index) => (
          <div
            key={product.dealId}
            className="tw:flex tw:flex-col tw:md:flex-row tw:justify-between tw:p-3 tw:border tw:border-gray-200 tw:rounded-lg"
          >
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:font-medium tw:mb-2 tw:line-clamp-4">
                {product.dealName}
              </div>

              <div className="tw:flex tw:gap-4 tw:flex-row tw:items-center tw:flex-wrap">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">
                    {t("mrp")}:
                  </span>
                  <span className="tw:text-sm tw:font-medium tw:truncate">
                    <Amount value={product.mrp} decimalPlaces={2} />
                  </span>
                </div>

                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">
                    {t("qty") || "Qty"}:
                  </span>
                  <span className="tw:text-sm tw:font-medium">
                    {product.quantity || 0} {product.uom || ""}
                  </span>
                </div>

                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:text-xs tw:text-gray-500">
                    {t("purchasePrice")}:
                  </span>
                  <span className="tw:text-sm tw:text-blue-600 tw:font-medium">
                    <Amount value={product.purchasePrice} decimalPlaces={2} />
                  </span>
                </div>

                {Number(product.mrp) > 0 ? (
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:text-xs tw:text-gray-500">
                      {t("discount")}:
                    </span>
                    <span className="tw:text-sm tw:font-medium">
                      {CommonService.calculateDiscount(
                        Number(product.mrp),
                        Number(product.purchasePrice) || 0,
                      )}
                      %
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="tw:mt-3 tw:md:mt-0 tw:md:ml-4 tw:flex tw:items-center tw:gap-3 tw:justify-end">
              <div className="tw:text-right">
                <div className="tw:font-semibold">
                  <Amount value={product.totalAmount} decimalPlaces={2} />
                </div>
              </div>

              <AppButton
                onClick={() => handleRemoveProduct(product, index)}
                color="danger"
                fill="outline"
                className="tw:text-red-500"
              >
                <Trash2 size={16} />
                {t("remove")}
              </AppButton>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="tw:text-center tw:py-8 tw:text-gray-500">
            {t("noProductsSelected")}
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default PoPreview;
