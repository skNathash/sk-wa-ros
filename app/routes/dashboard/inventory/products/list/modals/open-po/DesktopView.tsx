import React from "react";
import { useTranslation } from "react-i18next";
import { Building2, Calendar } from "lucide-react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import { TableSkeletonLoader } from "~/components/core/table";

import AppLink from "~/components/core/link/AppLink";

interface PurchaseOrder {
  vendorInfo: {
    vendorId: string;
    vendorName: string;
  };
  poId: string;
  orderId: string;
  poDate: string;
  status: string;
  quantity: number;
  pendingQuantity: number;
  unitPrice: number;
  totalValue: number;
  expectedDeliveryDate: string;
  createdAt: string;
  lastUpdated: string;
  _id: string;
}

interface DesktopViewProps {
  loading?: boolean;
  data: PurchaseOrder[];
}

const DesktopView: React.FC<DesktopViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);

  const headers = [
    { label: t("poId"), key: "poId", enableSort: false, width: "25%" },
    { label: t("vendor"), key: "vendor", enableSort: false, width: "25%" },
    {
      label: t("orderDate"),
      key: "orderDate",
      enableSort: false,
      width: "20%",
    },
    { label: t("quantity"), key: "quantity", enableSort: false, width: "15%" },
  ];

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "placed":
        return "warning";
      case "pending":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <AppTable size="sm" stickyHeader fixedLayout condensed>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              {/* PO ID */}
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/dashboard/purchase-order/view/${row.poId}`}
                >
                  {row.orderId}
                </AppLink>
              </AppTable.Cell>
              {/* Vendor */}
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Building2 className="tw:w-4 tw:h-4 tw:text-gray-500" />
                  <AppLink
                    asLink
                    href={`/dashboard/vendor/view/${row.vendorInfo.vendorId}`}
                    className="tw:text-sm tw:hover:text-blue-600"
                  >
                    {row.vendorInfo.vendorName || "N/A"}
                  </AppLink>
                </div>
              </AppTable.Cell>
              {/* Order Date */}
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Calendar className="tw:w-4 tw:h-4 tw:text-gray-500" />
                  <DateFormat
                    value={row.poDate}
                    formatStr="MMM dd, yyyy"
                    className="tw:text-sm"
                  />
                </div>
              </AppTable.Cell>
              {/* Quantity */}
              <AppTable.Cell>
                <span className="tw:font-medium">{row.quantity}</span>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("noPurchaseOrdersFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
