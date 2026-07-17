import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem, SortValue } from "~/types/CommonTypes";
import { Calendar, Clock, User, Eye, Edit, Trash } from "lucide-react";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";

interface PurchaseBasketItem {
  _id: string;
  product: {
    name: string;
    sku?: string;
    image?: string;
  };
  currentStock: number;
  desiredQty: number;
  unitPrice: number;
  priority: "low" | "medium" | "high" | "urgent";
  reason: string;
  suggestedVendor: {
    name: string;
    id: string;
  };
  estTotal: number;
  targetDate: string;
  dateAdded: string;
  addedBy: {
    name: string;
    id: string;
  };
}

interface DesktopViewProps {
  data: PurchaseBasketItem[];
  onEdit?: (item: PurchaseBasketItem) => void;
  onDelete?: (item: PurchaseBasketItem) => void;
  onView?: (item: PurchaseBasketItem) => void;
  onSort?: (data: { key: string; value: SortValue }) => void;
  sortValue?: SortValue;
  sortKey?: string;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  onEdit,
  onDelete,
  onView,
  onSort,
  sortValue,
  sortKey,
}) => {
  const headers: TableHeaderItem[] = [
    {
      label: "Product",
      key: "product",
      width: "20%",
      enableSort: true,
    },
    {
      label: "Current Stock",
      key: "currentStock",
      width: "120px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Desired Qty",
      key: "desiredQty",
      width: "120px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Unit Price",
      key: "unitPrice",
      width: "120px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Priority",
      key: "priority",
      width: "100px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Reason",
      key: "reason",
      width: "150px",
      enableSort: true,
    },
    {
      label: "Suggested Vendor",
      key: "suggestedVendor",
      width: "150px",
      enableSort: true,
    },
    {
      label: "Est. Total",
      key: "estTotal",
      width: "120px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Target Date",
      key: "targetDate",
      width: "120px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Date Added",
      key: "dateAdded",
      width: "120px",
      enableSort: true,
      isCentered: true,
    },
    {
      label: "Added By",
      key: "addedBy",
      width: "120px",
      enableSort: true,
    },
    {
      label: "Actions",
      width: "100px",
      enableSort: false,
      isCentered: true,
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "tw:text-red-600 tw:bg-red-50 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs";
      case "high":
        return "tw:text-orange-600 tw:bg-orange-50 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs";
      case "medium":
        return "tw:text-yellow-600 tw:bg-yellow-50 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs";
      case "low":
        return "tw:text-green-600 tw:bg-green-50 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs";
      default:
        return "tw:text-gray-600 tw:bg-gray-50 tw:px-2 tw:py-1 tw:rounded-full tw:text-xs";
    }
  };

  return (
    <AppTable
      bordered
      hover
      responsive
      size="sm"
      container
      containerStyle={{ maxHeight: "600px" }}
      minWidth="1800px"
      fixedLayout={true}
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          onSort={onSort}
          sortValue={sortValue}
          sortKey={sortKey}
        />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((item) => (
          <AppTable.Row key={item._id} className="tw:hover:bg-gray-50">
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-3">
                {item.product.image && (
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="tw:w-10 tw:h-10 tw:rounded tw:object-cover"
                  />
                )}
                <div>
                  <div className="tw:font-medium tw:text-gray-900">
                    {item.product.name}
                  </div>
                  {item.product.sku && (
                    <div className="tw:text-sm tw:text-gray-500">
                      SKU: {item.product.sku}
                    </div>
                  )}
                </div>
              </div>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <span className="tw:font-medium">{item.currentStock}</span>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <span className="tw:font-medium tw:text-blue-600">
                {item.desiredQty}
              </span>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <Amount value={item.unitPrice} />
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <span className={getPriorityColor(item.priority)}>
                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
              </span>
            </AppTable.Cell>
            <AppTable.Cell>
              <div className="tw:max-w-[150px] tw:truncate" title={item.reason}>
                {item.reason}
              </div>
            </AppTable.Cell>
            <AppTable.Cell>
              <div
                className="tw:max-w-[150px] tw:truncate"
                title={item.suggestedVendor.name}
              >
                {item.suggestedVendor.name}
              </div>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <span className="tw:font-bold tw:text-green-600">
                <Amount value={item.estTotal} />
              </span>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <div className="tw:flex tw:items-center tw:justify-center tw:gap-1">
                <Calendar className="tw:text-gray-400" size={16} />
                <DateFormat value={item.targetDate} formatStr="dd MMM yyyy" />
              </div>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <div className="tw:flex tw:items-center tw:justify-center tw:gap-1">
                <Clock className="tw:text-gray-400" size={16} />
                <DateFormat value={item.dateAdded} formatStr="dd MMM yyyy" />
              </div>
            </AppTable.Cell>
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-1">
                <User className="tw:text-gray-400" size={16} />
                <span
                  className="tw:text-sm tw:truncate"
                  title={item.addedBy.name}
                >
                  {item.addedBy.name}
                </span>
              </div>
            </AppTable.Cell>
            <AppTable.Cell className="tw:text-center">
              <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
                {onView && (
                  <button
                    onClick={() => onView(item)}
                    className="tw:p-1 tw:text-blue-600 hover:tw:bg-blue-50 tw:rounded"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="tw:p-1 tw:text-green-600 hover:tw:bg-green-50 tw:rounded"
                    title="Edit Item"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item)}
                    className="tw:p-1 tw:text-red-600 hover:tw:bg-red-50 tw:rounded"
                    title="Delete Item"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
            </AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
