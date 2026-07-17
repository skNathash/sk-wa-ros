import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { Building2, Eye } from "lucide-react";
import type { TableHeaderItem } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";

type DesktopViewProps = {
  loading?: boolean;
  data: any[];
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
};

const headers: TableHeaderItem[] = [
  {
    label: "Date",
    key: "paymentDate",
    enableSort: false,
    width: "13%",
    langKey: "date",
  },
  {
    label: "Expense Title",
    key: "notes",
    enableSort: false,
    width: "13%",
    langKey: "expenseTitle",
  },
  {
    label: "Description",
    key: "notes",
    enableSort: false,
    width: "25%",
    langKey: "description",
  },
  {
    label: "Reference",
    key: "sourceReference",
    enableSort: false,
    width: "15%",
    langKey: "reference",
  },
  {
    label: "Amount",
    key: "amount",
    enableSort: false,
    width: "8%",
    langKey: "amount",
  },
  {
    label: "Action",
    key: "actions",
    enableSort: false,
    width: "8%",
    langKey: "actions",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation();

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
          <TableSkeletonLoader cols={headers.length} rows={30} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => (
            <AppTable.Row key={row._id || idx}>
              <AppTable.Cell>
                <DateFormat value={row.paymentDate} />
              </AppTable.Cell>
              <AppTable.Cell>{row.notes || "-"}</AppTable.Cell>
              <AppTable.Cell>{row.description || "-"}</AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  href={row.sourceRedirectionUrl}
                  asLink
                  className="tw:bg-gray-100 tw:text-gray-500 tw:px-2 tw:py-1 tw:rounded-md"
                >
                  <code>{row.sourceReference}</code>
                </AppLink>
              </AppTable.Cell>

              <AppTable.Cell>
                <Amount
                  value={row.amount ?? 0}
                  decimalPlaces={2}
                  className="tw:ml-1 tw:text-red-500 tw:font-medium"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink href={row.sourceRedirectionUrl} asLink>
                  <AppButton size="small" fill="outline" color="light">
                    <Eye size={16} />
                    {t("view")}
                  </AppButton>
                </AppLink>
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
