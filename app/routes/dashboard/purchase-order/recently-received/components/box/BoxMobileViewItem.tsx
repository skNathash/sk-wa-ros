import { Box } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppLink from "~/components/core/link/AppLink";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface Props {
  row: Record<string, any>;
  callback?: (args: { action: string; data?: any }) => void;
}

const BoxMobileViewItem: React.FC<Props> = ({ row, callback }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard noPadding className="tw:mb-0">
      <div className="tw:px-4 tw:pt-4">
        <div className="tw:flex tw:items-start tw:gap-3">
          <div className="tw:w-10 tw:h-10 tw:bg-blue-50 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:text-blue-600 tw:shrink-0">
            <Box size={20} />
          </div>
          <div className="tw:flex-1">
            <div
              className="tw:mb-2 tw:cursor-pointer"
              onClick={() => callback?.({ action: "view", data: row })}
            >
              <div className="tw:text-xs tw:text-gray-500 tw:mb-0.5">
                {t("boxNo")}
              </div>
              <div className="tw:text-base tw:font-medium tw:text-blue-600">
                {row.refNo}
              </div>
            </div>
          </div>
        </div>
        <div className="tw:flex tw:items-center tw:gap-3 tw:text-xs tw:flex-wrap">
          <div className="tw:flex tw:items-center tw:gap-1">
            <span className="tw:text-gray-600">{t("poId")}:</span>
            <AppLink
              href={
                row.isSellerOrder
                  ? `/dashboard/orders/view/${row.orderData?.id}`
                  : `/dashboard/purchase-order/view/${row.orderData?.id}`
              }
              className="tw:font-semibold tw:text-gray-900"
              asLink
            >
              {row.orderData?.refId}
            </AppLink>
          </div>
          <div className="tw:flex tw:items-center tw:gap-1">
            <span className="tw:text-gray-600">{t("invoiceNo")}:</span>
            <span className="tw:font-semibold tw:text-gray-900">
              {row.invoiceData?.refId}
            </span>
          </div>
        </div>
      </div>

      <Divider className="tw:my-3" />

      <div className="tw:mb-4 tw:px-4">
        <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
          {t("purchasedFrom")}
        </div>
        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
          {row.isSellerOrder ? (
            <div className="tw:font-medium">{row.from.name}</div>
          ) : (
            <AppLink
              href={`/dashboard/vendor/view/${row.from.id}`}
              className="tw:font-medium"
              showLinkColor
              asLink
            >
              {row.from.name}
            </AppLink>
          )}
          <div className="tw:text-xs tw:text-gray-900">
            ID: <span className="tw:font-medium">{row.from.refId}</span>
          </div>
          {row._vendorType && (
            <VendorTypeBadge
              type={row._vendorType}
              color={row._vendorTypeColor}
              description={row._vendorTypeInfo}
              className="tw:text-[10px]"
            />
          )}
        </div>

        <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mt-2">
          <div>
            <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
              {t("receivedQty")}
            </div>
            <div className="tw:text-base tw:font-bold tw:text-green-600">
              {row.totalReceivedQty ?? row.receivedQty ?? 0}
            </div>
          </div>

          <div>
            <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
              {t("receivedDate")}
            </div>
            <div className="tw:flex tw:items-baseline tw:gap-1">
              <DateFormat
                value={row.receivedOn}
                formatStr="dd MMM yyyy"
                className="tw:font-medium tw:text-gray-900"
              />
              <DateFormat
                value={row.receivedOn}
                formatStr="hh:mm a"
                className="tw:text-gray-500 tw:text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default BoxMobileViewItem;
