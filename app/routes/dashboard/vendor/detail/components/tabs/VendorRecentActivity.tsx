import React from "react";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";

// Sample data for recent activities
const recentActivities = [
  {
    id: 1,
    name: "Order Placed",
    remarks: "Order #12345 placed successfully.",
    date: "2025-06-24 14:32",
    status: "Completed",
    value: "+₹2,500",
  },
  {
    id: 2,
    name: "Payment Received",
    remarks: "Payment for Order #12345.",
    date: "2025-06-24 15:10",
    status: "Received",
    value: "+₹2,500",
  },
  {
    id: 3,
    name: "Refund Issued",
    remarks: "Refund for Order #12340.",
    date: "2025-06-23 10:05",
    status: "Refunded",
    value: "-₹500",
  },
];

const VendorRecentActivity: React.FC = () => {
  return (
    <AppCard title="Recent Activity">
      <div className="tw:space-y-3">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="tw:flex tw:justify-between tw:items-start tw:bg-gray-50 tw:rounded tw:p-3"
          >
            {/* Left column: name, remarks, date */}
            <div className="tw:flex-1">
              <div className="tw:font-medium tw:text-gray-900">
                {activity.name}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                {activity.remarks}
              </div>
              <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                <DateFormat value={activity.date} />
              </div>
            </div>
            {/* Right column: status, value */}
            <div className="tw:text-right tw:ml-4">
              <div className="tw:font-semibold tw:text-gray-700">
                {activity.status}
              </div>
              <div className="tw:text-sm tw:mt-1 tw:text-green-600 tw:font-bold">
                {activity.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default VendorRecentActivity;
