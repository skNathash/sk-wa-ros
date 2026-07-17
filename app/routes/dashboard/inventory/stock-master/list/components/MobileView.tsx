import React from "react";
import { useTranslation } from "react-i18next";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import Divider from "~/components/core/divider/Divider";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import clsx from "clsx";
import { CircleArrowDown, CircleArrowUp } from "lucide-react";
import KeyValue from "~/components/core/key-value/KeyValue";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface MobileViewProps {
  data: any[];
  loading?: boolean;
  onView?: (item: any) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, loading, onView }) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return <div className="tw:text-center tw:py-4">{t("loading")}</div>;
  }
  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:text-gray-400">
        {t("noDataAvailable")}
      </div>
    );
  }
  return (
    <div>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4 tw:mt-3">
        {data.map((item, idx) => (
          <AppCard key={item._id || idx} noPadding className="tw:mb-0 tw:cursor-pointer" onClick={() => onView?.(item)}>
            <div className="tw:px-4 tw:pt-4">
              <div className="tw:flex tw:flex-col">
                <div className="tw:font-semibold tw:text-sm">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${item.dealId}`}
                    className="tw:font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.name ?? "--"}
                  </AppLink>
                </div>
                <div className="tw:mt-1 tw:grid tw:grid-cols-2 tw:gap-2 tw:text-xs tw:text-gray-500">
                  <div>
                    Ledger ID:
                    <span className="tw:font-medium tw:text-gray-700 tw:ms-1">
                      {item.stockLedgerId ?? "--"}
                    </span>
                  </div>
                  <div>
                    Deal ID:
                    <span className="tw:font-medium tw:text-gray-700 tw:ms-1">
                      {item.dealRefId ?? "--"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tw:flex tw:justify-between tw:items-start tw:gap-2 tw:p-4">
              <div className="tw:flex-1">
                <div className="tw:text-xs tw:text-gray-500">
                  Reference ID
                </div>
                <div className="tw:font-medium tw:text-sm tw:mt-0.5">
                  {item._tranRedirect?.path &&
                  item._tranRedirect.path !== "#" ? (
                    <AppLink
                      asLink
                      href={item._tranRedirect.path}
                      showLinkColor
                      onClick={(e) => e.stopPropagation()}
                    >
                      <code>{item.refNo || "--"}</code>
                    </AppLink>
                  ) : (
                    <code>{item.refNo || "--"}</code>
                  )}
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  <DateFormat value={item.createdAt} />
                </div>
              </div>

              <div className="tw:flex-none">
                <AppBadge
                  variant={item.referenceTypeColor || "light"}
                  className="tw:uppercase tw:text-xs"
                >
                  <span className="tw:text-xs">
                    {item.referenceType || "--"}
                  </span>
                </AppBadge>
              </div>
            </div>

            <Divider className="tw:my-1!" />

            <div className="tw:p-4">
              <div className="tw:grid tw:grid-cols-3 tw:gap-4">
                <KeyValue label={t("openingQty") || "Opening Qty"} size="sm">
                  <span className="tw:font-medium">
                    <DisplayQty
                      qty={Number(item.effectiveOldQty) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </span>
                </KeyValue>

                <KeyValue label={t("changeQty") || "Change Qty"} size="sm">
                  <span
                    className={clsx(
                      "tw:font-medium",
                      item.direction === "IN"
                        ? "tw:text-green-500"
                        : "tw:text-red-500"
                    )}
                  >
                    {item.direction === "IN" ? "+" : "-"}
                    <DisplayQty
                      qty={Number(item.quantity) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </span>
                </KeyValue>

                <KeyValue label={t("closingQty") || "Closing Qty"} size="sm">
                  <span className="tw:font-medium">
                    <DisplayQty
                      qty={Number(item.effectiveNewQty) || 0}
                      isLooseQty={false}
                      uom={item.selectedStockUom}
                    />
                  </span>
                </KeyValue>
              </div>

              <div className="tw:grid tw:grid-cols-3 tw:gap-4 tw:mt-3">
                <KeyValue label={t("mrp") || "MRP"} size="sm">
                  <Amount value={item.mrp} decimalPlaces={2} />
                </KeyValue>

                <KeyValue
                  label={t("purchasePrice") || "Purchase Price"}
                  size="sm"
                >
                  <Amount value={item.purchasePrice} decimalPlaces={2} />
                </KeyValue>

                <KeyValue label={t("updatedBy") || "Updated By"} size="sm">
                  <span className="tw:font-medium">
                    {item.createdBy?.name || "--"}
                  </span>
                  {item.createdAt && (
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                    </div>
                  )}
                </KeyValue>
              </div>

              {item.location?.name && (
                <div className="tw:mt-3">
                  <KeyValue label={t("location") || "Location"} size="sm">
                    <AppBadge
                      variant={
                        item.location.name === "Sellable"
                          ? "success"
                          : "danger"
                      }
                      className="tw:text-xs"
                    >
                      {item.location.name}
                    </AppBadge>
                  </KeyValue>
                </div>
              )}
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
};

export default MobileView;
