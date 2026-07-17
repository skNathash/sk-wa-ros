import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { TableSkeletonLoader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import Amount from "~/components/core/amount/Amount";
import NoData from "~/components/core/no-data/NoData";
import AppButton from "~/components/core/button/AppButton";
import { ArrowRight } from "lucide-react";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";

interface RetailerRow {
  _id?: string;
  franchiseId?: string;
  franchiseName?: string;
  name?: string;
  mobile?: string;
  state?: string;
  district?: string;
  town?: string;
  pincode?: string | number;
  salesValue?: number;
  address?: {
    city?: string;
    district?: string;
    state?: string;
  };
  totalSalesValue?: number;
  totalOrders?: number;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data?: RetailerRow[];
  callback?: (payload: { action: string; data?: any }) => void;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", enableSort: false, width: "8%" },
  { label: "Name", key: "name", enableSort: false, width: "32%" },
  { label: "Type", key: "type", enableSort: false, width: "15%" },
  { label: "Sales", key: "sales", enableSort: false, width: "15%" },
  { label: "Orders", key: "orders", enableSort: false, width: "15%" },
  {
    label: "Action",
    key: "action",
    enableSort: false,
    width: "15%",
    isCentered: true,
  },
];

const containerStyle = {
  maxHeight: "270px",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data = [],
  callback,
}) => {
  // Show NoData above the table when there's no data and not loading
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      containerStyle={containerStyle}
      container
      condensed
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={12} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row
              key={row._id || idx}
              className="tw:hover:bg-blue-50 tw:transition-colors tw:duration-150"
            >
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <div
                  className="tw:font-semibold tw:text-gray-900 tw:text-sm tw:cursor-pointer hover:tw:text-primary tw:transition-colors"
                  onClick={() =>
                    callback && callback({ action: "accessStore", data: row })
                  }
                >
                  {row.franchiseName || "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {[
                    row.address?.city,
                    row.address?.district,
                    row.address?.state,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.networkType ? (
                  <UserBadgeType type={row.networkType || "-"} />
                ) : (
                  "-"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:font-bold tw:text-green-700 tw:text-sm">
                  <Amount
                    value={row.totalSalesValue ?? 0}
                    decimalPlaces={0}
                    className="tw:text-green-700 tw:font-bold"
                  />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:text-gray-700 tw:text-sm tw:font-medium">
                  {row.totalOrders ?? 0}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:justify-center">
                  <AppButton
                    size="small"
                    fill="clear"
                    onClick={() =>
                      callback?.({ action: "accessStore", data: row })
                    }
                    className="tw:text-primary hover:tw:bg-primary/10 tw:px-2 tw:py-1 tw:rounded tw:transition-colors tw:flex tw:items-center tw:gap-1"
                  >
                    <span className="tw:text-xs tw:font-medium">View</span>
                    <ArrowRight className="tw:w-3.5 tw:h-3.5" />
                  </AppButton>
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
