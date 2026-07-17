import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import { TableSkeletonLoader } from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import { useTranslation } from "react-i18next";

interface SaleData {
  _id: string;
  customerInfo: {
    name: string;
    [key: string]: any;
  };
  _payableAmount: number;
  payment: string;
  createdAt: string | Date;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
}

const headers = [
  {
    label: "Order ID",
    langKey: "orderId",
    key: "orderRefNo",
    enableSort: false,
    width: "10%",
  },
  {
    label: "Customer",
    langKey: "customer",
    key: "customerInfo.name",
    enableSort: false,
    width: "10%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "_payableAmount",
    enableSort: false,
    isCentered: true,
    width: "10%",
  },
  {
    label: "Payment",
    langKey: "payment",
    key: "payment",
    enableSort: false,
    width: "8%",
  },
  {
    label: "Date",
    langKey: "date",
    key: "createdAt",
    enableSort: false,
    width: "10%",
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({ loading, data }) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="600px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <AppLink href={`/dashboard/orders/view/${row.orderId}`} asLink>
                  {row.orderRefNo}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._typeColor || "default"}>
                  {row.orderType}
                </AppBadge>

                <div>
                  {row.customerInfo?.isGuestCustomer ? (
                    <AppBadge variant="default">{t("walkinCustomer")}</AppBadge>
                  ) : (
                    <AppLink
                      asLink
                      href={`/dashboard/network/view/b2c/${row.customerInfo?.customerId}`}
                    >
                      {row.customerInfo?.name}
                    </AppLink>
                  )}
                </div>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <Amount value={row.orderAmount} decimalPlaces={2} />
              </AppTable.Cell>
              <AppTable.Cell>{row.paymentMethod}</AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={row.orderedDate} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  <DateFormat value={row.orderedDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={5} className="tw:text-center">
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
