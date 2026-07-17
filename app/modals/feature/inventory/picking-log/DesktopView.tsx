import { Package, User } from "lucide-react";
import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";

interface PickingLogItem {
  _id: string;
  createdBy: { name: string };
  totalPickedQty: number;
  pickingStartedOn: string; // ISO date
  order?: {
    id: string;
    orderRefNo: string;
    orderedDate: string;
  };
}

interface DesktopViewProps {
  data: PickingLogItem[];
  loading?: boolean;
  selectedStockUom?: string;
}

const headers = [
  { label: "Picked By", key: "pickedBy", width: "25%" },
  { label: "Quantity", key: "quantity", width: "20%" },
  { label: "Picking Started", key: "pickingStarted", width: "25%" },
  { label: "Order Details", key: "orderDetails", width: "30%" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  selectedStockUom,
}) => {
  return (
    <AppTable container>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>

      <AppTable.Body>
        {loading ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              Loading...
            </AppTable.Cell>
          </AppTable.Row>
        ) : !data || data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              No picking logs found
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => {
            return (
              <AppTable.Row key={`${item._id || idx}`}>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <User className="tw:w-4 tw:h-4 tw:text-primary" />
                    <span className="tw:font-medium">
                      {item.createdBy?.name || "-"}
                    </span>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-green-600">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <Package className="tw:w-4 tw:h-4" />
                    <span className="tw:font-medium">
                      <DisplayQty
                        qty={item.totalPickedQty || 0}
                        isLooseQty={false}
                        uom={selectedStockUom}
                      />
                    </span>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col">
                    <DateFormat
                      value={item.pickingStartedOn}
                      formatStr="dd MMM yyyy"
                    />
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat
                        value={item.pickingStartedOn}
                        formatStr="hh:mm a"
                      />
                    </div>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  {item.order ? (
                    <div className="tw:flex tw:flex-col">
                      <div className="tw:font-medium tw:text-sm">
                        <AppLink
                          href={`/dashboard/orders/view/${item.order.id}`}
                          asLink
                        >
                          {item.order.orderRefNo || "-"}
                        </AppLink>
                      </div>
                      <div className="tw:text-xs tw:text-gray-500">
                        Ordered: <DateFormat value={item.order.orderedDate} />
                      </div>
                    </div>
                  ) : (
                    <div className="tw:text-gray-500">-</div>
                  )}
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
