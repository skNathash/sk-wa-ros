import { PenLine, TrendingDown, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import Rbac from "~/components/core/rbac/Rbac";
import CommonService from "~/services/CommonService";
import UomPriceService from "~/services/UomPriceService";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";

const rbacRoles = {
  editPrice: ["CONFIGS.PRICING"],
};

const PriceBlock = ({
  basic,
  isB2cFixed,
  isB2bFixed,
  handlePriceEdit,
  handlePriceSlabEdit,
}: {
  basic: any;
  isB2cFixed: boolean;
  isB2bFixed: boolean;
  handlePriceEdit: (action: "customer" | "network") => void;
  handlePriceSlabEdit: () => void;
}) => {
  const { t } = useTranslation(["common"]);

  const baseUom = UomPriceService.getBaseUom(basic?.selectedStockUom);

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2 tw:mb-2">
        <div className="tw:bg-purple-50 tw:text-purple-800 tw:p-4 tw:rounded-md tw:text-sm">
          <div className="tw:font-medium tw:flex tw:items-center tw:gap-1">
            {t("b2cPrice")}
            <Rbac roles={rbacRoles.editPrice}>
              <PenLine
                className="tw:w-4 tw:h-4 tw:cursor-pointer tw:text-gray-500 hover:tw:text-purple-600"
                onClick={() => handlePriceEdit("customer")}
              />
            </Rbac>
          </div>
          <div className="tw:flex tw:items-baseline tw:gap-1">
            <DisplayPrice
              price={basic.b2cPrice || 0}
              uom={basic.selectedStockUom}
              className="tw:text-purple-900 tw:font-semibold tw:text-xl"
              uomClassName="tw:text-xs tw:text-purple-600"
            />
          </div>
          {baseUom && (
            <div className="tw:text-[11px] tw:text-purple-600">
              <Amount value={basic.b2cPrice || 0} decimalPlaces={3} /> /{" "}
              {baseUom}
            </div>
          )}
          {isB2cFixed ? (
            <div className="tw:text-xs tw:flex tw:items-center tw:justify-between tw:gap-2">
              <span className="tw:text-xs tw:text-purple-600">
                {t("margin")}
              </span>
              <AppBadge className="tw:ml-2" variant="warning">
                Fixed
              </AppBadge>
            </div>
          ) : (
            <div
              className={`tw:text-xs tw:flex tw:items-center tw:gap-1 ${
                (basic.b2cDiscount || 0) < 0
                  ? "tw:text-red-600"
                  : "tw:text-purple-600"
              }`}
            >
              {t("margin")}:{" "}
              {CommonService.roundedByDecimalPlace(basic.b2cDiscount, 2)}%
              {(basic.b2cDiscount || 0) < 0 ? (
                <TrendingDown className="tw:w-3 tw:h-3" />
              ) : (
                <TrendingUp className="tw:w-3 tw:h-3" />
              )}
            </div>
          )}
        </div>

        <div className="tw:bg-blue-50 tw:text-blue-800 tw:p-4 tw:rounded-md tw:text-sm">
          <div className="tw:font-medium tw:flex tw:items-center tw:gap-1">
            {t("b2bPrice")}
            <Rbac roles={rbacRoles.editPrice}>
              <PenLine
                className="tw:w-4 tw:h-4 tw:cursor-pointer tw:text-gray-500 hover:tw:text-blue-600"
                onClick={() => handlePriceEdit("network")}
              />
            </Rbac>
          </div>
          <div className="tw:flex tw:items-baseline tw:gap-1">
            <DisplayPrice
              price={basic.b2bPrice || 0}
              uom={basic.selectedStockUom}
              className="tw:text-blue-900 tw:font-semibold tw:text-xl"
              uomClassName="tw:text-xs tw:text-blue-600"
            />
          </div>
          {baseUom && (
            <div className="tw:text-[11px] tw:text-blue-600">
              <Amount value={basic.b2bPrice || 0} decimalPlaces={3} /> /{" "}
              {baseUom}
            </div>
          )}
          {isB2bFixed ? (
            <div className="tw:text-xs tw:flex tw:items-center tw:justify-between tw:gap-2">
              <span className="tw:text-xs tw:text-blue-600">{t("margin")}</span>
              <AppBadge className="tw:ml-2" variant="warning">
                Fixed
              </AppBadge>
            </div>
          ) : (
            <div
              className={`tw:text-xs tw:flex tw:items-center tw:gap-1 ${
                (basic.b2bDiscount || 0) < 0
                  ? "tw-text-red-600"
                  : "tw:text-blue-600"
              }`}
            >
              {t("margin")}:{" "}
              {CommonService.roundedByDecimalPlace(basic.b2bDiscount, 2)}%
              {(basic.b2bDiscount || 0) < 0 ? (
                <TrendingDown className="tw:w-3 tw:h-3" />
              ) : (
                <TrendingUp className="tw:w-3 tw:h-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PriceBlock;
