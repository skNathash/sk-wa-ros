import { Sparkles } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import { getAvatarColor } from "./helper.view";

interface DesktopViewProps {
  loading?: boolean;
  data: any[];
  callback?: (args: { action: string; data: any }) => void;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: { key: string; value: SortValue }) => void;
  showLoadMore: boolean;
  loadedCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const headers: TableHeaderItem[] = [
  { label: "S.No", key: "sno", width: "5%", langKey: "sNo" },
  {
    label: "Customer",
    key: "name",
    width: "26%",
    enableSort: true,
    langKey: "customer",
  },
  {
    label: "Bills",
    key: "bills",
    width: "10%",
    enableSort: true,
    langKey: "bills",
  },
  {
    label: "Avg Bill",
    key: "avgBillValue",
    width: "14%",
    enableSort: true,
    langKey: "avgBill",
  },
  {
    label: "Reliability",
    key: "fulfillmentRate",
    width: "12%",
    enableSort: true,
    langKey: "reliability",
  },
  {
    label: "Suggested Limit",
    key: "suggestedLimit",
    width: "16%",
    enableSort: true,
    langKey: "suggestedLimit",
  },
  { label: "Action", key: "action", width: "12%", langKey: "action" },
];

const containerStyle = { maxHeight: "calc(100vh - 200px)" };

const DesktopView: React.FC<DesktopViewProps> = ({
  loading,
  data,
  callback,
  sortKey,
  sortValue,
  onSort,
  showLoadMore = false,
  loadedCount,
  loadingMore = false,
  loadMore,
  totalCount = 0,
}) => {
  const { t } = useTranslation(["common"]);

  if (!loading && (!data || data.length === 0)) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      containerStyle={containerStyle}
      minWidth="900px"
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
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : (
          data.map((row, idx) => (
            <AppTable.Row key={row.id || idx}>
              <AppTable.Cell>{idx + 1}</AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-3">
                  <div
                    className={`tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-lg tw:text-white tw:text-sm tw:font-semibold tw:shrink-0 ${getAvatarColor(
                      row.name,
                    )}`}
                  >
                    {row.initials || "?"}
                  </div>
                  <div className="tw:min-w-0">
                    <AppLink
                      asLink
                      href={`/dashboard/network/view/b2c/${row.id}`}
                      className="tw:font-semibold"
                    >
                      {row.name || "-"}
                    </AppLink>
                    {row.location && (
                      <div className="tw:text-xs tw:text-gray-500 tw:truncate">
                        {row.location}
                      </div>
                    )}
                  </div>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                {row.bills} {t("bills")}
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={row.avgBillValue || 0} />
              </AppTable.Cell>
              <AppTable.Cell>{row.fulfillmentRate}%</AppTable.Cell>
              <AppTable.Cell>
                <Amount
                  value={row.suggestedLimit || 0}
                  className="tw:text-purple-600 tw:font-semibold"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <AppButton
                  size="small"
                  color="primary"
                  onClick={() =>
                    callback && callback({ action: "unlock", data: row })
                  }
                >
                  <Sparkles size={16} />
                  {t("readyToUnlock")}
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}
        {showLoadMore && !loading && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <LoadMoreButton
                loadMore={loadMore}
                loading={!!loadingMore}
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
