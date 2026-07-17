import React from "react";
import Divider from "~/components/core/divider/Divider";
import AppButton from "~/components/core/button/AppButton";
import {
  Eye,
  SlidersHorizontal,
  Phone,
  Star,
  Bike,
  Car,
  Truck,
} from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppBadge from "~/components/core/badge/AppBadge";

interface MobileViewProps {
  data: any[];
  loading: boolean;
  callback?: (payload: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, loading, callback }) => {
  if (loading) return <div>Loading...</div>;
  if (!data.length) return <div>No personnel found.</div>;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "success";
      case "Inactive":
        return "default";
      case "Suspended":
        return "warning";
      default:
        return "default";
    }
  };

  const getVehicleIcon = (vehicle: string) => {
    switch (vehicle.toLowerCase()) {
      case "bike":
        return <Bike size={16} className="tw:text-gray-600" />;
      case "car":
        return <Car size={16} className="tw:text-gray-600" />;
      case "scooter":
        return <Bike size={16} className="tw:text-gray-600" />;
      default:
        return <Truck size={16} className="tw:text-gray-600" />;
    }
  };

  return (
    <div>
      {data.map((row) => (
        <div
          key={row._id}
          className="tw:border tw:border-gray-200 tw:rounded tw:mb-4 tw:p-4 tw:bg-white"
        >
          {/* Row: Name & Email (left), Status (right) */}
          <div className="tw:flex tw:justify-between tw:items-start tw:mb-2">
            <div>
              <div className="tw:text-base tw:font-semibold">{row.name}</div>
              {row.email && (
                <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                  {row.email}
                </div>
              )}
            </div>
            <div>
              <AppBadge variant={getStatusVariant(row.status)}>
                {row.status}
              </AppBadge>
            </div>
          </div>

          <Divider />

          {/* Contact and Vehicle info */}
          <div className="tw:my-2 tw:space-y-2">
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Contact</span>
              <span className="tw:font-medium tw:flex tw:items-center tw:gap-1">
                <Phone size={14} className="tw:text-gray-400" />
                {row.contact}
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Vehicle</span>
              <span className="tw:font-medium tw:flex tw:items-center tw:gap-1">
                {getVehicleIcon(row.vehicle)}
                {row.vehicle}
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Vehicle Number</span>
              <span className="tw:text-xs tw:text-slate-400">
                {row.vehicleNumber}
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Balance</span>
              <span className="tw:font-medium tw:text-slate-500">
                <Amount value={row.balance} decimalPlaces={2} />
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Rating</span>
              <span className="tw:font-medium tw:flex tw:items-center tw:gap-1">
                <Star
                  size={14}
                  className="tw:text-yellow-500 tw:fill-current"
                />
                {row.rating}
                <span className="tw:text-xs tw:text-slate-400 tw:ml-1">
                  ({row.totalDeliveries} deliveries)
                </span>
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center tw:text-sm">
              <span className="tw:text-gray-500">Join Date</span>
              <span className="tw:text-xs tw:text-slate-400">
                <DateFormat value={row.joinDate} formatStr="dd MMM yyyy" />
              </span>
            </div>
          </div>

          <Divider />

          {/* Action Buttons */}
          <div className="tw:mt-2 tw:grid tw:grid-cols-2 tw:gap-2">
            <AppButton
              size="small"
              color="light"
              fill="outline"
              className="tw:w-full"
              onClick={() =>
                callback && callback({ action: "view", data: row })
              }
            >
              <Eye size={16} />
              View
            </AppButton>
            <AppButton
              size="small"
              color="dark"
              className="tw:w-full"
              onClick={() =>
                callback && callback({ action: "manage", data: row })
              }
            >
              <SlidersHorizontal size={16} />
              Manage
            </AppButton>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
