import { Eye, Package, Download } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type {
  TableHeaderItem,
  SortValue,
  VariantColor,
} from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

interface ReceiveOrderData {
  orderId: string;
  orderRefNo: string;
  orderedDate: string | Date;
  sender: {
    id: string;
    refId: string;
    name: string;
  };
  packages: Array<{
    _id: string;
    packageRefNo: string;
    status: string;
    totalQty: number;
    invoice?: {
      id: string;
      invoicedDate: string;
      invoiceAmount: number;
    };
    items: Array<{
      dealId: string;
      dealName: string;
      dealRefId: string;
      qty: number;
      mrp: number;
      brand: {
        id: string;
        brandId: string;
        name: string;
      };
      category: {
        id: string;
        categoryId: string;
        name: string;
      };
    }>;
  }>;
  [key: string]: any;
}

interface DesktopViewProps {
  data: ReceiveOrderData[];
  callback: (a: { action: string; data: ReceiveOrderData }) => void;
  loading?: boolean;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
}

const getHeaders = (t: any): TableHeaderItem[] => {
  return [
    { label: t("orderId"), key: "orderRefNo", width: "15%", enableSort: true },
    { label: t("sender"), key: "sender.name", width: "15%", enableSort: true },
    {
      label: t("orderDate"),
      key: "orderedDate",
      width: "15%",
      enableSort: true,
    },
    { label: t("packages"), key: "packages", width: "12%", enableSort: true },
    {
      label: t("totalValue"),
      key: "totalValue",
      width: "12%",
      enableSort: true,
    },
    { label: t("status"), key: "status", width: "13%", enableSort: true },
    { label: t("action"), key: "action", width: "15%" },
  ];
};

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  callback,
  loading = false,
  sortKey,
  sortValue,
  onSort,
}) => {
  const { t } = useTranslation(["common"]);
  const headers = getHeaders(t);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      condensed
      container
      containerStyle={containerStyle}
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
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item, idx) => (
            <AppTable.Row
              key={item.orderId || idx}
              className="tw:hover:bg-gray-50"
            >
              {/* Order ID Column */}
              <AppTable.Cell>
                <AppLink href={`/dashboard/orders/view/${item.orderId}`} asLink>
                  {item.orderRefNo}
                </AppLink>
              </AppTable.Cell>

              {/* Sender Column */}
              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-1">
                  <span className="tw:font-medium tw:text-gray-900">
                    {item.sender?.name || t("nA")}
                  </span>
                  <span className="tw:text-xs tw:text-gray-500">
                    {item.sender?.refId || t("nA")}
                  </span>
                </div>
              </AppTable.Cell>

              {/* Order Date Column */}
              <AppTable.Cell>
                <DateFormat value={item.orderedDate} />
              </AppTable.Cell>

              {/* Packages Column */}
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw-gap-2">
                  <Package className="tw-w-4 tw-h-4 tw-text-gray-500" />
                  <span className="tw:font-medium">
                    {item.packages?.length || 0} {t("packages").toLowerCase()}
                  </span>
                </div>
              </AppTable.Cell>

              {/* Total Value Column */}
              <AppTable.Cell>
                <Amount
                  value={
                    item.packages?.reduce(
                      (total, pkg) => total + (pkg.invoice?.invoiceAmount || 0),
                      0
                    ) || 0
                  }
                  className="tw:font-semibold tw:text-gray-900"
                />
              </AppTable.Cell>

              {/* Status Column */}
              <AppTable.Cell>
                <AppBadge
                  variant={
                    item.packages?.every((pkg) => pkg.status === "Invoiced")
                      ? "success"
                      : "warning"
                  }
                  className="tw:w-fit"
                >
                  {item.packages?.every((pkg) => pkg.status === "Invoiced")
                    ? t("completed")
                    : t("pending")}
                </AppBadge>
              </AppTable.Cell>

              {/* Action Column */}
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw-gap-2">
                  <AppButton
                    size="small"
                    color="success"
                    onClick={() => callback({ action: "receive", data: item })}
                  >
                    <Package className="tw-w-4 tw-h-4" />
                    {t("receiveOrder")}
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
