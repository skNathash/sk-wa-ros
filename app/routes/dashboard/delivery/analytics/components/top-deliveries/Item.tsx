import React from "react";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

interface DeliveryData {
  _id: string;
  name: string;
  completedDeliveries: number;
  totalDeliveries: number;
  successRate: number;
  averageDeliveryTime: string;
  lastDelivery: string | Date;
  status: string;
  rating: number;
  [key: string]: any;
}

interface ItemProps {
  loading?: boolean;
  data: DeliveryData[];
  callback?: (payload: { action: string; data: any }) => void;
}

const headers = [
  { label: "Name", key: "name", enableSort: false, width: "70%" },
  {
    label: "Completed Deliveries",
    key: "completedDeliveries",
    enableSort: false,
    width: "30%",
  },
];

const Item: React.FC<ItemProps> = ({ loading, data, callback }) => {
  return (
    <AppTable size="sm" stickyHeader fixedLayout>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <div className="tw-font-medium">{row.name}</div>
                <div className="tw-text-xs tw:text-slate-400 tw:mt-0.5">
                  ID: {row._id}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw-font-medium tw-text-green-600">
                  {row.completedDeliveries}
                </div>
                <div className="tw-text-xs tw:text-slate-400 tw:mt-0.5">
                  of {row.totalDeliveries} total
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No delivery data found
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default Item;
