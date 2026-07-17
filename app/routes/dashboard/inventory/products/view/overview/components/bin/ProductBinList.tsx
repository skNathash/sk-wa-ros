import { Eye, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

// Accepts a list of bin items as props
const ProductBinList = ({
  data = [],
  dealId,
}: {
  data: any[];
  dealId?: string;
}) => {
  const { t } = useTranslation(["common"]);

  if (!data.length) {
    return (
      <div className="tw:text-center tw:text-gray-400 tw:py-8">
        {t("noBinsFound")}
      </div>
    );
  }
  return (
    <>
      {data.map((item, idx) => (
        <div
          key={item.binId || idx}
          className={`tw:border tw:rounded-lg tw:p-4 tw:bg-white tw:mb-4 ${
            item.location === "Non-Sellable"
              ? "tw:border-red-200"
              : "tw:border-green-200"
          }`}
        >
          <div className="tw:flex tw:justify-between tw:items-center">
            <div
              className={`tw:flex tw:items-center tw:gap-1 ${
                item.location === "Non-Sellable"
                  ? "tw:text-red-900"
                  : "tw:text-green-900"
              }`}
            >
              <MapPin size={16} />
              <div className="tw:inline-block tw:font-mono tw:text-sm tw:font-medium">
                {item.location || "-"} <span className="tw:mx-1">•</span>{" "}
                {item.rackName || "-"} <span className="tw:mx-1">•</span>{" "}
                {item.binCode || item.binName || "-"}
              </div>
            </div>
            <AppLink
              asLink={true}
              href={`/dashboard/inventory/rack-bin/bin/view/${item.binId}${
                dealId ? `?dealId=${dealId}` : ""
              }`}
            >
              <AppButton color="success" size="small">
                <Eye className="tw:w-4 tw:h-4 tw:mr-1" />
                {t("viewBin")}
              </AppButton>
            </AppLink>
          </div>
          <div className="tw:grid tw:grid-cols-3 tw:mt-6 tw:gap-4">
            <div className="tw:flex tw:flex-col tw:items-center">
              <div
                className={`tw:text-sm ${
                  item.location === "Non-Sellable"
                    ? "tw:text-red-700"
                    : "tw:text-green-700"
                }`}
              >
                {t("stock")}
              </div>
              <div
                className={`tw:font-medium tw:text-sm ${
                  item.location === "Non-Sellable"
                    ? "tw:text-red-800"
                    : "tw:text-green-800"
                }`}
              >
                {item.stock != null ? (
                  <DisplayQty
                    qty={Number(item.stock) || 0}
                    isLooseQty={false}
                    uom={item.selectedStockUom}
                  />
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div className="tw:flex tw:flex-col tw:items-center">
              <div
                className={`tw:text-sm ${
                  item.location === "Non-Sellable"
                    ? "tw:text-red-700"
                    : "tw:text-green-700"
                }`}
              >
                {t("binCapacity")}
              </div>
              <div
                className={`tw:font-medium tw:text-sm ${
                  item.location === "Non-Sellable"
                    ? "tw:text-red-800"
                    : "tw:text-green-800"
                }`}
              >
                {item.binCapacity != null ? (
                  <DisplayQty
                    qty={Number(item.binCapacity) || 0}
                    isLooseQty={false}
                    uom={item.selectedStockUom}
                  />
                ) : (
                  "-"
                )}
              </div>
            </div>
            <div className="tw:flex tw:flex-col tw:items-center">
              <div
                className={`tw:text-sm ${
                  item.location === "Non-Sellable"
                    ? "tw:text-red-700"
                    : "tw:text-green-700"
                }`}
              >
                {t("utilization")}
              </div>
              <div
                className={`tw:font-medium tw:text-sm ${
                  item.location === "Non-Sellable"
                    ? "tw:text-red-800"
                    : "tw:text-green-800"
                }`}
              >
                {item.percentageFilled ?? "-"}% {t("filled")}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ProductBinList;
