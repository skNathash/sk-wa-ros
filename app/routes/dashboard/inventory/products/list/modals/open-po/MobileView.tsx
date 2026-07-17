import { Building2, Calendar, Package } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

import AppLink from "~/components/core/link/AppLink";

interface PurchaseOrder {
  vendorInfo: {
    vendorId: string;
    vendorName: string;
  };
  poId: string;
  orderId: string;
  poDate: string;
  status: string;
  quantity: number;
  pendingQuantity: number;
  unitPrice: number;
  totalValue: number;
  expectedDeliveryDate: string;
  createdAt: string;
  lastUpdated: string;
  _id: string;
}

interface MobileViewProps {
  loading?: boolean;
  data: PurchaseOrder[];
}

const MobileView: React.FC<MobileViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);

  if (loading) {
    return (
      <div className="tw:space-y-4">
        {[...Array(5)].map((_, index) => (
          <AppCard key={index} className="tw:p-4">
            <div className="tw:animate-pulse">
              <div className="tw:h-4 tw:bg-gray-200 tw:rounded tw:mb-2 tw:w-3/4"></div>
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:mb-1 tw:w-1/2"></div>
              <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/3"></div>
            </div>
          </AppCard>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8">
        <Package className="tw:w-12 tw:h-12 tw:text-gray-400 tw:mx-auto tw:mb-4" />
        <p className="tw:text-gray-500">{t("noPurchaseOrdersFound")}</p>
      </div>
    );
  }

  return (
    <div className="tw:space-y-4">
      {data.map((item, index) => (
        <div
          key={item._id || index}
          className="tw:p-4 tw:border tw:border-gray-200 tw:rounded tw:mb-2"
        >
          <div className="tw:space-y-3">
            {/* PO ID */}
            <div className="tw:flex tw:justify-between tw:items-start">
              <AppLink
                asLink
                href={`/dashboard/purchase-order/view/${item.poId}`}
              >
                {item.orderId}
              </AppLink>
            </div>

            {/* Vendor */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <Building2 className="tw:w-4 tw:h-4 tw:text-gray-500" />
              <AppLink
                asLink
                href={`/dashboard/vendor/view/${item.vendorInfo.vendorId}`}
                className="tw:text-sm tw:text-gray-600 tw:hover:text-blue-600"
              >
                {item.vendorInfo.vendorName || "N/A"}
              </AppLink>
            </div>

            {/* Order Date */}
            <div className="tw:flex tw:items-center tw:gap-2">
              <Calendar className="tw:w-4 tw:h-4 tw:text-gray-500" />
              <DateFormat
                value={item.poDate}
                formatStr="MMM dd, yyyy"
                className="tw:text-sm tw:text-gray-600"
              />
            </div>

            {/* Quantity */}
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-sm tw:text-gray-500">Quantity:</span>
              <span className="tw:font-medium">{item.quantity} units</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
