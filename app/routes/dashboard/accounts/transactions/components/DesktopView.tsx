import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import { TableSkeletonLoader } from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import clsx from "clsx";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import VendorInfo from "./VendorInfo";

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
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const headers: TableHeaderItem[] = [
  {
    label: "Date",
    langKey: "date",
    key: "transactionDate",
    enableSort: false,
    width: "10%",
  },
  {
    label: "Type",
    langKey: "type",
    key: "type",
    enableSort: false,
    width: "12%",
  },
  {
    label: "Description",
    langKey: "description",
    key: "remarks",
    enableSort: false,
    width: "25%",
  },
  {
    label: "Reference",
    langKey: "reference",
    key: "transferID",
    enableSort: false,
    width: "15%",
  },
  {
    label: "Amount",
    langKey: "amount",
    key: "amount",
    enableSort: false,
    width: "10%",
  },
  {
    label: "Status",
    langKey: "status",
    key: "status",
    enableSort: false,
    width: "10%",
  },
  {
    label: "Payment Method",
    langKey: "paymentMethod",
    key: "paymentMethod",
    enableSort: false,
    width: "10%",
  },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  // headers are defined at module scope using `langKey` so TableHeader
  // will translate them using i18n. See TableHeaderItem.langKey

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="1000px"
    >
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
                <DateFormat
                  value={row.transactionDate}
                  formatStr="dd MMM yyyy"
                />
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  <DateFormat value={row.transactionDate} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row.sourceVariantColor || "default"}>
                  {row._sourceTypeLbl || "-"}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.description}
                <VendorInfo vendor={row._vendorInfo} />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={row.sourceRedirectionUrl}
                  className="tw:bg-gray-100 tw:text-gray-500 tw:px-2 tw:py-1 tw:rounded-md"
                >
                  <code>{row.sourceReference}</code>
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell
                className={clsx("tw:font-medium", {
                  "tw:text-red-500": row.payoutType === "Debit",
                  "tw:text-green-500": row.payoutType === "Credit",
                })}
              >
                <Amount
                  value={row.amount}
                  decimalPlaces={2}
                  className="tw:ml-1"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge variant={row._statusColor || "default"}>
                  {row._status}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell className="tw:uppercase">
                {row.paymentMethod || "-"}
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
