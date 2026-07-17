import { Eye, Package, Download, Calendar, User } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import type { VariantColor } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

interface ReceiveOrderData {
  orderId: string;
  orderRefNo: string;
  orderedDate: string | Date;
  sender: {
    id: string;
    refId: string;
    name: string;
  };
  packages: Array<{
    _id: string;
    packageRefNo: string;
    status: string;
    totalQty: number;
    invoice?: {
      id: string;
      invoicedDate: string;
      invoiceAmount: number;
    };
    items: Array<{
      dealId: string;
      dealName: string;
      dealRefId: string;
      qty: number;
      mrp: number;
      brand: {
        id: string;
        brandId: string;
        name: string;
      };
      category: {
        id: string;
        categoryId: string;
        name: string;
      };
    }>;
  }>;
  [key: string]: any;
}

interface MobileViewProps {
  data: ReceiveOrderData[];
  callback: (a: { action: string; data: ReceiveOrderData }) => void;
  loading?: boolean;
}

const MobileView: React.FC<MobileViewProps> = ({
  data,
  callback,
  loading = false,
}) => {
  const { t } = useTranslation(["common"]);
  if (loading) {
    return (
      <div className="tw:space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="tw:bg-white tw:rounded-lg tw:p-4 tw:shadow-sm tw:border tw:animate-pulse"
          >
            <div className="tw:space-y-3">
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:w-3/4"></div>
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2"></div>
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <NoData />;
  }

  return (
    <div className="tw:space-y-4">
      {data.map((item, idx) => (
        <div
          key={item.orderId || idx}
          className="tw:bg-white tw:rounded-lg tw:p-4 tw:shadow-sm tw:border tw:hover:shadow-md tw:transition-shadow"
        >
          {/* Header */}
          <div className="tw:flex tw:justify-between tw:items-start tw:mb-3">
            <div className="tw:flex-1">
              <AppLink
                href={`/dashboard/orders/primary/receive/process/${item.orderId}`}
                className="tw:font-semibold tw:text-blue-600 tw:text-base"
                asLink
              >
                {item.orderRefNo}
              </AppLink>
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                {t("id")}: {item.orderId}
              </div>
            </div>
            <AppBadge
              variant={
                item.packages?.every((pkg) => pkg.status === "Invoiced")
                  ? "success"
                  : "warning"
              }
              className="tw:ml-2"
            >
              {item.packages?.every((pkg) => pkg.status === "Invoiced")
                ? t("completed")
                : t("pending")}
            </AppBadge>
          </div>

          {/* Sender Info */}
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
            <User className="tw:w-4 tw:h-4 tw:text-gray-500" />
            <div className="tw:flex tw:flex-col">
              <span className="tw:font-medium tw:text-gray-900 tw:text-sm">
                {item.sender?.name || t("nA")}
              </span>
              <span className="tw:text-xs tw:text-gray-500">
                {item.sender?.refId || t("nA")}
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-4">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Calendar className="tw:w-4 tw:h-4 tw:text-gray-500" />
              <div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("orderDate")}
                </div>
                <div className="tw:text-sm tw:font-medium">
                  <DateFormat value={item.orderedDate} />
                </div>
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <Package className="tw:w-4 tw:h-4 tw:text-gray-500" />
              <div>
                <div className="tw:text-xs tw:text-gray-500">
                  {t("packages")}
                </div>
                <div className="tw:text-sm tw:font-medium">
                  {item.packages?.length || 0} {t("packages").toLowerCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Value */}
          <div className="tw:mb-4">
            <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
              {t("totalValue")}
            </div>
            <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
              <Amount
                value={
                  item.packages?.reduce(
                    (total, pkg) => total + (pkg.invoice?.invoiceAmount || 0),
                    0
                  ) || 0
                }
              />
            </div>
          </div>

          {/* Actions */}
          <div className="tw:flex tw:gap-2">
            <AppButton
              size="small"
              color="success"
              className="tw:w-full"
              onClick={() => callback({ action: "receive", data: item })}
            >
              <Package className="tw:w-4 tw:h-4 tw:mr-1" />
              {t("receiveOrder")}
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
