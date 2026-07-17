import React from "react";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import DateFormat from "~/components/core/date/DateFormat";
import Amount from "~/components/core/amount/Amount";
import { TableSkeletonLoader } from "~/components/core/table";
import AppBadge from "~/components/core/badge/AppBadge";
import clsx from "clsx";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

interface SaleData {
  _id: string;
  customerInfo: {
    name: string;
    [key: string]: any;
  };
  _payableAmount: number;
  payment: string;
  createdAt: string | Date;
  closingBalance?: number;
  [key: string]: any;
}

interface DesktopViewProps {
  loading?: boolean;
  data: SaleData[];
  loadmore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  totalCount: number;
}

const headers = [
  {
    label: "Date",
    key: "createdAt",
    enableSort: false,
    width: "10%",
    langKey: "date",
  },
  {
    label: "Type",
    key: "type",
    enableSort: false,
    width: "10%",
    langKey: "type",
  },
  {
    label: "Description",
    key: "remarks",
    enableSort: false,
    width: "20%",
    langKey: "description",
  },
  {
    label: "Reference",
    key: "entityId",
    enableSort: false,
    width: "15%",
    langKey: "reference",
  },
  {
    label: "Opening Balance",
    key: "openingBalance",
    enableSort: false,
    width: "15%",
    langKey: "openingBalance",
  },
  {
    label: "Credit",
    key: "credit",
    enableSort: false,
    width: "12%",
    langKey: "credit",
  },
  {
    label: "Debit",
    key: "debit",
    enableSort: false,
    width: "12%",
    langKey: "debit",
  },
  {
    label: "Closing Balance",
    key: "closingBalance",
    enableSort: false,
    width: "15%",
    langKey: "closingBalance",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadmore,
  hasMore,
  loadingMore,
  totalCount,
}) => {
  const { t } = useTranslation(["common"]);
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      containerStyle={containerStyle}
      container
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
                <DateFormat value={row.createdAt} formatStr="dd MMM yyyy" />
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  <DateFormat value={row.createdAt} formatStr="hh:mm a" />
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{row.type}</AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:text-xs tw:text-slate-500 tw:mt-1">
                  {row.comments}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>{row.entityId}</AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row._openingBalance ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-700 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                {row.payoutType === "Credit" ? (
                  <Amount
                    value={row.amount}
                    decimalPlaces={2}
                    className="tw:text-green-500"
                  />
                ) : (
                  "--"
                )}
              </AppTable.Cell>
              <AppTable.Cell>
                {row.payoutType === "Debit" ? (
                  <Amount
                    value={row.amount}
                    decimalPlaces={2}
                    className="tw:text-red-500"
                  />
                ) : (
                  "--"
                )}
              </AppTable.Cell>

              <AppTable.Cell>
                <Amount
                  value={row._closingBalance ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-slate-700 tw:font-medium"
                />
              </AppTable.Cell>
            </AppTable.Row>
          ))
        ) : (
          <AppTable.Row>
            <AppTable.Cell colSpan={7} className="tw:text-center">
              {t("noDataFound")}
            </AppTable.Cell>
          </AppTable.Row>
        )}
        {hasMore && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <LoadMoreButton
                loadMore={loadmore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={data.length}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
