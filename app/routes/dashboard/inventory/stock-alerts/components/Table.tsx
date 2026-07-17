import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import { TableSkeletonLoader } from "~/components/core/table";
import AppLink from "~/components/core/link/AppLink";
import AppButton from "~/components/core/button/AppButton";
import { MapPin } from "lucide-react";
import KeyValue from "~/components/core/key-value/KeyValue";

interface ProductTableProps {
  data: Array<{
    name: string;
    _id: string;
    _qty: number;
    daysLeft: number;
    alerts: string;
    urgency: string;
    lastDelivery: string;
    action?: React.ReactNode;
    urgencyColor?: string;
    categoryName: string;
  }>;
  onSort?: (data: { key: string; value: "asc" | "desc" }) => void;
  sortKey?: string;
  sortValue?: "asc" | "desc";
  loading?: boolean;
  callback: (a: { action: string; data: any }) => void;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sNo", width: "5%" },
  {
    label: "Item",
    key: "product",
    enableSort: true,
    width: "25%",
    isSticky: true,
  },
  {
    label: "Current Stock",
    key: "currentStock",
    enableSort: true,
    width: "10%",
  },
  {
    label: "Days Left",
    key: "daysLeft",
    enableSort: true,
    width: "8%",
  },
  {
    label: "Alerts",
    key: "alerts",
    enableSort: true,
    width: "30%",
  },
  {
    label: "Urgency",
    key: "urgency",
    enableSort: true,
    width: "10%",
  },
  {
    label: "Last Delivery",
    key: "lastDelivery",
    enableSort: true,
    width: "10%",
  },
];

const containerStyle = {
  height: "calc(100vh - 200px)",
};

const ProductTable: React.FC<ProductTableProps> = ({
  data,
  onSort,
  sortKey,
  sortValue,
  loading,
  callback,
}) => {
  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout
      container
      minWidth="1200px"
      containerStyle={containerStyle}
      stickyHeader
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortKey={sortKey}
          sortValue={sortValue}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No data found
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell className="tw:sticky tw:left-0 tw:z-10 tw:bg-white">
                <AppLink
                  onClick={() => callback({ action: "view", data: row })}
                >
                  {row.name}
                </AppLink>
                <div className="tw:flex tw:flex-col tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-2">
                  <span>ID: {row._id}</span>
                  <span>Category: {row.categoryName}</span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:font-medium">{row._qty}</span>
                <div className="tw:text-xs tw:text-gray-500 tw:mt-2">Min 2</div>
              </AppTable.Cell>
              <AppTable.Cell>
                <span
                  className={`tw:font-medium ${
                    row.daysLeft <= 7
                      ? "tw:text-red-600"
                      : row.daysLeft <= 14
                      ? "tw:text-orange-600"
                      : "tw:text-green-600"
                  }`}
                >
                  {row.daysLeft} days
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:mb-2">
                  <AppBadge variant="danger">
                    <span className="tw:text-wrap">
                      Stock below minimum threshold. Estimated 10 days remaining
                    </span>
                  </AppBadge>
                </div>

                <div>
                  <AppBadge variant="warning">
                    No sales in the last 30 days
                  </AppBadge>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw:rounded-full tw:bg-red-500 tw:text-white tw:w-3 tw:h-3 tw:flex tw:items-center tw:justify-center tw:text-xs"></span>
                  <span>{row.urgency || 0}</span>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <span className="tw:text-sm tw:text-gray-600">
                  {row.lastDelivery}
                </span>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default ProductTable;
