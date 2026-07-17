import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";

type Props = {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  sortCb: (data: SortProps) => void;
  loading: boolean;
  // load more related props (required)
  loadedCount: number;
  totalCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  showLoadMore: boolean;
};

const getHeaders = (t: any): TableHeaderItem[] => [
  { label: t("id"), key: "orderId", width: "12%", enableSort: true },
  { label: t("createdOn"), key: "createdAt", width: "16%", enableSort: true },
  {
    label: t("expectedDelivery"),
    key: "expectedDeliveryDate",
    width: "14%",
    enableSort: true,
  },
  { label: t("items"), key: "_totalItems", width: "10%" },
  { label: t("totalValue"), key: "totalValue", width: "12%", isCentered: true },
  { label: t("status"), key: "status", width: "10%", isCentered: true },
  { label: t("actions"), key: "actions", width: "10%", isCentered: true },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView = ({
  data,
  callback,
  sortKey,
  sortValue,
  sortCb,
  loading,
  // load more related props
  loadedCount,
  totalCount,
  loadingMore,
  loadMore,
  showLoadMore,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const headers = getHeaders(t);
  const view = (data: any, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.stopPropagation();
    }
    callback({ action: "view", data: data });
  };

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      condensed={true}
      fixedLayout={true}
      container
      minWidth="900px"
      containerStyle={containerStyle}
      stickyHeader={true}
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
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : null}
        {!loading && data.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="tw:text-center tw:py-8">
              {t("noPurchaseOrdersFound")}
            </td>
          </tr>
        ) : (
          data.map((row, idx) => {
            return (
              <AppTable.Row
                key={row._id || idx}
                className="tw:cursor-pointer"
                onClick={() => view(row)}
              >
                <AppTable.Cell>
                  <AppLink onClick={() => {}}>{row.orderId}</AppLink>
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
                    {row.items?.length} {t("products")}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {row._totalQuantity} {t("totalUnits")}
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center tw:font-medium">
                  <Amount value={row._totalValue || 0} decimalPlaces={2} />
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <AppBadge variant={row._statusColor as any}>
                    {row._statusLabel}
                  </AppBadge>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-center">
                  <div className="tw:flex tw:items-center tw:justify-center">
                    <AppButton
                      size="small"
                      color="light"
                      fill="outline"
                      onClick={(e) => view(row, e)}
                    >
                      <Eye className="tw:mr-1" />
                      {t("view")}
                    </AppButton>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
        {/** Load more row for desktop table */}
        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell
              colSpan={headers.length}
              className="tw:text-center tw:py-4"
            >
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
