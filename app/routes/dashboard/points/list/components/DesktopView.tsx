import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";

interface DesktopViewProps {
  data: any[];
  loading?: boolean;
  callback: (a: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (a: SortProps) => void;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  loading,
  callback,
  sortKey,
  sortValue,
  onSort,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: t("customer"), key: "customer", width: "20%" },
    { label: t("type"), key: "type", width: "15%" },
    { label: t("description"), key: "description", width: "35%" },
    { label: t("coins"), key: "amount", width: "10%", isCentered: true },
    { label: t("date"), key: "createdAt", width: "20%", enableSort: true },
  ];

  return (
    <AppTable container responsive minWidth="900px" stickyHeader>
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
          <TableSkeletonLoader cols={headers.length} rows={8} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item) => (
            <AppTable.Row key={item._id} className="tw:hover:bg-gray-50">
              <AppTable.Cell>
                <AppLink
                  asLink={true}
                  href={`/dashboard/network/view/b2c/${item.customerId}`}
                >
                  {item.customerName || "--"}
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppBadge
                  variant={item._typeColor || "default"}
                  className="tw:uppercase"
                >
                  {item._typeLbl}
                </AppBadge>
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:text-xs tw:text-gray-600 tw:leading-snug">
                  {item.reason}
                </div>
                <div>
                  <AppLink
                    asLink
                    href={item._redirectionUrl}
                    className="tw:text-blue-600 tw:font-medium tw:text-xs"
                  >
                    ID: <code>{item.transactionRefId}</code>
                  </AppLink>
                </div>
              </AppTable.Cell>
              <AppTable.Cell
                className={`tw:text-center ${
                  item.type === "earn" ? "tw:text-green-600" : "tw:text-red-600"
                } tw:font-medium`}
              >
                {item.amount != null
                  ? `${item.type === "earn" ? "+" : "-"}${Math.abs(
                      Number(item.amount)
                    )}`
                  : "--"}
              </AppTable.Cell>
              <AppTable.Cell>
                <DateFormat value={item.createdAt} />
              </AppTable.Cell>
            </AppTable.Row>
          ))
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
