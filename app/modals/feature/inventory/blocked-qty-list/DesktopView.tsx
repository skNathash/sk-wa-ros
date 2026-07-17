import { Package2 } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";

interface BlockedInfoItem {
  blockedAt: string; // ISO date
  customerInfo?: {
    name?: string;
    isGuestCustomer?: boolean;
    customerId?: string | number;
  } | null;
  orderType?: string;
  orderId?: string | number;
  orderRefId?: string | number;
  quantity?: number;
}

interface DesktopViewProps {
  data: BlockedInfoItem[]; // caller should pass response.data.data[0].blockedInfo
  loading?: boolean;
}

const headers = [
  { label: "Order ID", key: "orderId", width: "18%" },
  { label: "Type", key: "type", width: "14%" },
  { label: "Customer", key: "customer", width: "22%" },
  { label: "Quantity", key: "quantity", width: "10%" },
  { label: "Allocated Time", key: "allocatedTime", width: "16%" },
];

const formatDate = (iso?: string) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

const DesktopView: React.FC<DesktopViewProps> = ({ data, loading }) => {
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
              No blocked items found
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => {
            return (
              <AppTable.Row key={`${item.orderId || item.orderRefId || idx}`}>
                <AppTable.Cell>
                  <AppLink
                    href={`/dashboard/orders/view/${item.orderId}`}
                    asLink
                  >
                    {item.orderRefId}
                  </AppLink>
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppBadge
                    variant={item.orderType === "B2B" ? "success" : "secondary"}
                  >
                    {item.orderType}
                  </AppBadge>
                </AppTable.Cell>

                <AppTable.Cell>
                  {item.customerInfo?.isGuestCustomer ? (
                    "Walkin Customer"
                  ) : (
                    <AppLink
                      asLink
                      href={
                        item.orderType === "B2B"
                          ? `/dashboard/network/view/b2b/${item.customerInfo?.customerId}`
                          : `/dashboard/network/view/b2c/${item.customerInfo?.customerId}`
                      }
                    >
                      {item.customerInfo?.name}
                    </AppLink>
                  )}
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-red-500">
                  <div className="tw:flex tw:flex-1 tw:items-center tw:gap-1">
                    <Package2 size={14} />
                    {item.quantity ?? "-"} units
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <DateFormat value={item.blockedAt} formatStr="dd MMM yyyy" />
                  <div className="tw:text-xs tw:text-gray-500">
                    <DateFormat value={item.blockedAt} formatStr="hh:mm a" />
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
