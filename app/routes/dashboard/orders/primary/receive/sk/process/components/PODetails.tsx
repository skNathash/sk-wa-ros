import React from "react";
import { Calendar, Package, IndianRupee, Hash } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";

interface PODetailsProps {
  poDetails: any;
  packages: any[];
  products: any[];
}

const PODetails: React.FC<PODetailsProps> = ({
  poDetails,
  packages,
  products,
}) => {
  if (!poDetails) return null;

  const totalItems = products.length;
  const totalValue = poDetails._totalValue || poDetails.totalValue || 0;
  const nextPackages = packages.filter((pkg) => !pkg.received).length;
  const nextItems = products.filter((item) => !item.received).length;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4 tw:mb-6">
      {/* PO ID Card */}
      <AppCard title="Purchase Order" icon={<Hash className="tw:w-5 tw:h-5" />}>
        <div className="tw:space-y-3 tw:p-2 tw:text-sm">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">PO ID</div>
            <div className="tw:font-medium tw:text-blue-600">
              {poDetails.orderId}
            </div>
          </div>
          {poDetails.skOrderId && (
            <div className="tw:flex tw:justify-between tw:items-center">
              <div className="tw:text-gray-500">SK Order ID</div>
              <div className="tw:font-medium tw:text-green-600">
                {poDetails.skOrderId}
              </div>
            </div>
          )}
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Status</div>
            <AppBadge variant={poDetails._statusColor as any}>
              {poDetails._statusLabel || poDetails.status}
            </AppBadge>
          </div>
        </div>
      </AppCard>

      {/* Order Date & Value Card */}
      <AppCard
        title="Order Information"
        icon={<Calendar className="tw:w-5 tw:h-5" />}
      >
        <div className="tw:space-y-3 tw:p-2 tw:text-sm">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Order Date</div>
            <div className="tw:font-medium">
              <DateFormat value={poDetails.createdAt} />
            </div>
          </div>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Total Items</div>
            <div className="tw:font-medium">{totalItems}</div>
          </div>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Total Value</div>
            <div className="tw:font-medium">
              <Amount value={totalValue} decimalPlaces={2} />
            </div>
          </div>
        </div>
      </AppCard>

      {/* Next Items & Packages Card */}
      <AppCard
        title="Pending Items"
        icon={<Package className="tw:w-5 tw:h-5" />}
      >
        <div className="tw:space-y-3 tw:p-2 tw:text-sm">
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Next Packages</div>
            <div className="tw:font-medium tw:text-orange-600">
              {nextPackages}
            </div>
          </div>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Next Items</div>
            <div className="tw:font-medium tw:text-orange-600">{nextItems}</div>
          </div>
          <div className="tw:flex tw:justify-between tw:items-center">
            <div className="tw:text-gray-500">Total Packages</div>
            <div className="tw:font-medium">{packages.length}</div>
          </div>
        </div>
      </AppCard>
    </div>
  );
};

export default PODetails;
