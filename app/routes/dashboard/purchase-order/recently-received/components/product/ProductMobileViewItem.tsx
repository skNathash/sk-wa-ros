import { Building2, Eye } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
// AppBadge removed because fulfillment display was removed
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";

interface ProductMobileViewItemProps {
  row: Record<string, any>;
  callback?: (args: { action: string; data?: any }) => void;
}

const ProductMobileViewItem: React.FC<ProductMobileViewItemProps> = ({
  row,
  callback,
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppCard noPadding className="tw:mb-0">
      <div className="tw:flex tw:gap-2 tw:items-start tw:px-4 tw:py-4">
        <div className="tw:h-12 tw:w-12 tw:overflow-hidden">
          <ImgRender
            src={row.images?.[0]}
            alt={row.name}
            className="tw:h-full tw:w-full tw:object-cover tw:mt-1"
          />
        </div>
        <div className="tw:flex-1">
          <div className="tw:h-14 tw:flex tw:items-center">
            <AppLink
              asLink
              href={`/dashboard/inventory/products/view/${row.dealId}/purchase-history`}
              className="tw:font-medium tw:text-base tw:mb-2 tw:line-clamp-2"
              showLinkColor={true}
            >
              {row.name}
            </AppLink>
          </div>
          <div className="tw:text-sm tw:md:text-xs tw:text-gray-500 tw:mt-0.5 tw:flex tw:flex-col tw:gap-1 tw:flex-wrap">
            <span>
              {t("id")} : {row.dealRefId}
            </span>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:flex tw:items-center tw:gap-1">
                {t("purchasedFrom")} :
                <AppLink href={`/dashboard/vendor/view/${row.from?.id}`} asLink>
                  {row.from?.name}
                </AppLink>
              </span>
              {row._vendorType && (
                <VendorTypeBadge
                  type={row._vendorType}
                  color={row._vendorTypeColor}
                  description={row._vendorTypeInfo}
                  className="tw:text-[10px]"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="tw:grid tw:grid-cols-3 tw:gap-2 tw:px-4 tw:py-2 tw:border-t tw:border-gray-200">
        <KeyValue label={t("receivedQty")} size="sm">
          <span className="tw:text-green-600 tw:font-bold">
            {row.totalReceivedQty ?? row.receivedQty ?? 0}
          </span>
        </KeyValue>
        <KeyValue label={t("receivedValue")} size="sm">
          <Amount value={row.totalReceivedValue ?? 0} />
        </KeyValue>
        <KeyValue label={t("receivedDate")} size="sm">
          <div className="tw:flex tw:flex-col">
            <DateFormat value={row.receivedDate} formatStr="dd MMM yyyy" />
            <DateFormat
              value={row.receivedDate}
              formatStr="hh:mm a"
              className="tw:text-gray-500 tw:text-xs tw:mb-1"
            />
          </div>
        </KeyValue>
      </div>
    </AppCard>
  );
};

export default ProductMobileViewItem;
