import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import SchemeDetailsPopover from "./SchemeDetailsPopover";

interface MobileViewProps {
  data: any[];
}

const MobileView: React.FC<MobileViewProps> = ({ data }) => {
  const { t } = useTranslation(["common"]);

  const getTypeBadge = (applicableFor: string) => {
    if (applicableFor === "Network") {
      return <AppBadge variant="primary">{t("b2b")}</AppBadge>;
    } else if (applicableFor === "Customer") {
      return <AppBadge variant="success">{t("b2c")}</AppBadge>;
    }
    return <AppBadge variant="light">{applicableFor || "--"}</AppBadge>;
  };

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:text-gray-400">
        {t("noDataAvailable")}
      </div>
    );
  }

  return (
    <div className="mobile-view-list tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
      {data.map((item, idx) => (
        <div
          key={item._id || idx}
          className={`tw:border tw:rounded-lg tw:p-4 tw:shadow-sm ${
            item.isPositive
              ? "tw:bg-green-50 tw:border-green-200"
              : "tw:bg-red-50 tw:border-red-200"
          }`}
        >
          {item.dealName && (
            <div className="tw:flex tw:flex-col tw:mb-2">
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${item.dealId}/pricing`}
                className="tw:text-blue-600 hover:tw:text-blue-800 tw:text-sm tw:font-medium"
              >
                {item.dealName}
              </AppLink>
              <span className="tw:text-xs tw:text-gray-500 tw:mt-1">
                {t("id")}: {item.dealRefId}
              </span>
            </div>
          )}

          <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
            <DateFormat value={item.createdAt} />
          </div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:text-green-500">
              {item.isPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown className="tw:text-red-500" size={16} />
              )}
            </div>
            <div className="tw:text-sm tw:font-medium tw:text-gray-700">
              {item.createdByName || t("unknownUser")}
            </div>
            {item.applicableFor && (
              <div className="tw:ml-auto">
                {getTypeBadge(item.applicableFor)}
              </div>
            )}
          </div>
          {/* {item.dealId && (
              <span className="tw:inline-block tw:bg-blue-100 tw:text-blue-700 tw:text-xs tw:px-2 tw:py-0.5 tw:rounded tw:font-semibold tw:mb-3">
                {item.dealId}
              </span>
            )} */}
          {item.reason && (
            <div className="tw:text-xs tw:text-gray-600 tw:mb-2 tw:italic">
              "{item.reason}"
            </div>
          )}
          <Divider className="tw:!my-2" />
          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-gray-500">
                {t("previousPrice")}
              </span>
              <div className="tw:flex tw:flex-col tw:items-end">
                <DisplayPrice
                  price={item.prevPrice}
                  uom={item.oldData?.selectedStockUom}
                  className="tw:text-sm tw:line-through tw:text-gray-400"
                />
                {(() => {
                  const oldMrp = item.oldData?.mrp !== undefined ? Number(item.oldData.mrp) : 0;
                  if (oldMrp > 0) {
                    return (
                      <span className="tw:text-[10px] tw:text-gray-400 tw:mt-0.5">
                        <span className="tw:uppercase">{t("mrp")}:</span>{" "}
                        <DisplayPrice
                          price={oldMrp}
                          uom={item.oldData?.selectedStockUom}
                          hideUom
                        />
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-gray-500">
                {t("newPrice")}
              </span>
              <div className="tw:flex tw:flex-col tw:items-end">
                <DisplayPrice
                  price={item.newPrice}
                  uom={item.newData?.selectedStockUom}
                  className="tw:text-lg tw:font-bold tw:text-gray-900"
                />
                {(() => {
                  const newMrp = item.newData?.mrp !== undefined ? Number(item.newData.mrp) : 0;
                  if (newMrp > 0) {
                    return (
                      <span className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                        <span className="tw:uppercase">{t("mrp")}:</span>{" "}
                        <DisplayPrice
                          price={newMrp}
                          uom={item.newData?.selectedStockUom}
                          hideUom
                        />
                      </span>
                    );
                  }
                  return null;
                })()}
                {item.newData?.isFixedPrice && (
                  <span className="tw:mt-1">
                    <AppBadge variant="warning">Fixed</AppBadge>
                  </span>
                )}
              </div>
            </div>
          </div>
          <Divider className="tw:!my-2" />
          <div className="tw:flex tw:justify-between tw:items-center">
            <span className="tw:text-xs tw:text-gray-500">{t("change")}</span>
            <div className="tw:flex tw:flex-col tw:items-end">
              <div
                className={`tw:font-bold ${
                  item.isPositive ? "tw:text-green-600" : "tw:text-red-600"
                }`}
              >
                {item.isPositive ? "+" : ""}
                <Amount value={item.change} />
              </div>
              <span
                className={`tw:text-xs tw:font-semibold ${
                  item.isPositive ? "tw:text-green-500" : "tw:text-red-500"
                }`}
              >
                {item.isPositive ? "+" : ""}
                {item.percent.toFixed(1)}%
              </span>
            </div>
          </div>
          <SchemeDetailsPopover oldData={item.oldData} newData={item.newData} />
        </div>
      ))}
    </div>
  );
};

export default MobileView;
