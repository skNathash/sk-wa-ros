import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
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

interface PersonnelData {
  _id: string;
  name: string;
  contact: string;
  email: string;
  status: string;
  vehicle: string;
  vehicleNumber: string;
  balance: number;
  joinDate: string | Date;
  totalDeliveries: number;
  rating: number;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: PersonnelData[];
  callback?: (payload: { action: string; data: any }) => void;
}

const headers = [
  { label: "Name", key: "name", enableSort: false, width: "20%" },
  { label: "Contact", key: "contact", enableSort: false, width: "15%" },
  { label: "Status", key: "status", enableSort: false, width: "12%" },
  { label: "Vehicle", key: "vehicle", enableSort: false, width: "15%" },
  { label: "Balance", key: "balance", enableSort: false, width: "12%" },
  { label: "Rating", key: "rating", enableSort: false, width: "10%" },
  { label: "Actions", key: "actions", enableSort: false, width: "16%" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
}) => {
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
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      condensed
      container
      minWidth="1200px"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <div>{row.name}</div>
                {row.email && (
                  <div className="tw:text-xs tw:text-slate-400 tw:mt-0.5">
                    {row.email}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Phone size={14} className="tw:text-gray-400" />
                  <span>{row.contact}</span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={getStatusVariant(row.status)}>
                  {row.status}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  {getVehicleIcon(row.vehicle)}
                  <div>
                    <div className="tw-font-medium">{row.vehicle}</div>
                    <div className="tw-text-xs tw:text-slate-400">
                      {row.vehicleNumber}
                    </div>
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.balance}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-500 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-1">
                  <Star
                    size={14}
                    className="tw:text-yellow-500 tw:fill-current"
                  />
                  <span className="tw-font-medium">{row.rating}</span>
                  <span className="tw-text-xs tw:text-slate-400">
                    ({row.totalDeliveries} deliveries)
                  </span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:gap-2">
                  <AppButton
                    size="small"
                    color="light"
                    fill="outline"
                    onClick={() =>
                      callback && callback({ action: "view", data: row })
                    }
                  >
                    <Eye size={14} />
                    View
                  </AppButton>
                  <AppButton
                    size="small"
                    color="dark"
                    onClick={() =>
                      callback && callback({ action: "manage", data: row })
                    }
                  >
                    <SlidersHorizontal size={14} />
                    Manage
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <div className="tw-text-center tw-py-8 tw-text-gray-500">
                No personnel found.
              </div>
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
