import { CheckCircle, Eye } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableHeader } from "~/components/core/table";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  tab: string;
  sortKey: string;
  sortValue: "asc" | "desc";
  sortCb: (data: { key: string; value: "asc" | "desc" }) => void;
};

const headers = [
  { label: "ID", key: "_id", width: "12%", enableSort: true },
  { label: "Vendor", key: "vendor", width: "25%", enableSort: true },
  { label: "Created On", key: "createdAt", width: "16%", enableSort: true },
  {
    label: "Expected Delivery",
    key: "expectedDeliveryDate",
    width: "14%",
    enableSort: true,
  },
  { label: "Items", key: "_totalItems", width: "10%" },
  { label: "Total Value", key: "totalValue", width: "12%", isCentered: true },
  { label: "Status", key: "status", width: "20%", isCentered: true },
  { label: "Actions", key: "actions", width: "20%", isCentered: true },
];

const DesktopView = ({
  data,
  callback,
  tab,
  sortKey,
  sortValue,
  sortCb,
}: Props) => {
  return (
    <AppTable
      size="sm"
      condensed
      fixedLayout={true}
      container
      minWidth="1200px"
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          sortValue={sortValue}
          onSort={sortCb}
        />
      </AppTable.Header>
      <AppTable.Body>
        {data.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="tw:text-center tw:py-8">
              No purchase orders found.
            </td>
          </tr>
        ) : (
          data.map((row, idx) => {
            return (
              <AppTable.Row
                key={row._id || idx}
                className="tw:cursor-pointer"
                onClick={() => callback({ action: "view", data: row })}
              >
                <AppTable.Cell>
                  <AppLink onClick={() => {}}>{row._id}</AppLink>
                </AppTable.Cell>
                <AppTable.Cell className="tw:font-medium">
                  <AppLink
                    onClick={(e) => {
                      e.stopPropagation();
                      callback({ action: "viewVendor", data: row });
                    }}
                  >
                    {row.vendorDetails?.name || "N/A"}
                  </AppLink>
                </AppTable.Cell>
                <AppTable.Cell>
                  <DateFormat
                    value={row.createdAt}
                    formatStr="dd MMM yyyy hh:mm a"
                  />
                </AppTable.Cell>
                <AppTable.Cell>
                  <DateFormat
                    value={row.expectedDeliveryDate}
                    formatStr="dd MMM yyyy"
                  />
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:font-medium">
                    {row._totalItems} products
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {row._totalQuantity} total units
                  </div>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center tw:font-medium">
                  <Amount value={row.totalValue || 0} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <AppBadge
                    variant={row._statusColor as any}
                    size="sm"
                    bold={false}
                  >
                    {row._statusLabel}
                  </AppBadge>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <div className="tw:flex tw:items-center tw:justify-center">
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback({ action: "view", data: row });
                      }}
                    >
                      <Eye className="tw:mr-1" />
                      View
                    </AppButton>
                    {tab !== "overview" && row.status === "Approved" && (
                      <AppButton
                        size="small"
                        color="success"
                        noShadow={true}
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({ action: "receive", data: row });
                        }}
                        className="tw:ml-1"
                      >
                        <CheckCircle className="tw:mr-1" />
                        Receive
                      </AppButton>
                    )}
                    {tab !== "overview" && row.status === "Draft" && (
                      <AppButton
                        size="small"
                        color="success"
                        fill="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({ action: "edit", data: row });
                        }}
                        className="tw:ml-2"
                      >
                        Edit PO
                      </AppButton>
                    )}
                  </div>
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
