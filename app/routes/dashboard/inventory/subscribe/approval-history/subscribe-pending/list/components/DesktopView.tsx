import React from "react";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import DateFormat from "~/components/core/date/DateFormat";
import { Eye, Plus, Mail, Percent } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import DealLinked from "../../../components/DealLinked";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";

interface DesktopViewProps {
  data: Record<string, any>[];
  callback: (a: { action: string; data: Record<string, any> }) => void;
  loading?: boolean;
  sortKey: string;
  sortValue: SortValue;
  onSort: (data: SortProps) => void;
  showLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount: number;
}

const DesktopView: React.FC<DesktopViewProps> = ({
  data,
  callback,
  loading = false,
  sortKey,
  sortValue,
  onSort,
  showLoadMore,
  loadingMore,
  loadMore,
  totalCount,
}) => {
  const { t } = useTranslation(["common"]);

  const headers: TableHeaderItem[] = [
    { label: t("date"), key: "createdAt", width: "12%", enableSort: true },
    { label: t("product"), key: "productName", width: "20%", enableSort: true },
    { label: t("status"), key: "status", width: "13%", enableSort: true },
    { label: t("adminNotes"), key: "remarks", width: "12%" },
    { label: t("reviewedOn"), key: "updatedAt", width: "13%" },
    { label: t("action"), key: "action", width: "20%" },
  ];

  const containerStyle = {
    maxHeight: "calc(100vh - 200px)",
  };

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable
      container
      responsive
      fixedLayout
      minWidth="1000px"
      size="sm"
      containerStyle={containerStyle}
      stickyHeader
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
          <TableSkeletonLoader cols={headers.length} />
        ) : data.length === 0 ? (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <NoData />
            </AppTable.Cell>
          </AppTable.Row>
        ) : (
          data.map((item) => {
            return (
              <AppTable.Row
                key={item._id}
                className="tw:hover:bg-gray-50 tw:cursor-pointer"
                onClick={() => callback({ action: "view", data: item })}
              >
                {/* Date Column */}
                <AppTable.Cell>
                  <DateFormat value={item.createdAt} formatStr="dd MMM yyy" />
                  <div className="tw:text-xs tw:text-slate-500">
                    <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                  </div>
                </AppTable.Cell>

                {/* Product Column */}
                <AppTable.Cell>
                  <div className="tw:mb-1">
                    {item.dealName || item.productName}
                  </div>
                  <div className="tw:flex tw:gap-2 tw:flex-wrap">
                    <AppBadge variant="light" className="tw:text-slate-600">
                      {item.brand?.name || "-"}
                    </AppBadge>
                    <AppBadge variant="light" className="tw:text-slate-600">
                      {item.category?.name || "-"}
                    </AppBadge>
                    {item?.isConsumerOffer && <ConsumerOfferBadge />}
                  </div>
                </AppTable.Cell>

                {/* Status Column */}
                <AppTable.Cell>
                  <div className="tw:mb-1">
                    <AppBadge variant={item.statusColor} className="tw:text-xs">
                      {item.statusLabel || t("pending")}
                    </AppBadge>
                  </div>

                  <DealLinked
                    isLinkedExisting={item.isLinkedExisting}
                    isLinkedNew={item.isLinkedNew}
                  />
                </AppTable.Cell>

                {/* Admin Notes Column */}
                <AppTable.Cell>
                  <div>{item.remarks || "-"}</div>
                </AppTable.Cell>

                {/* Reviewed On Column */}
                <AppTable.Cell>
                  {item.updatedByName && item.updatedAt ? (
                    <div className="tw:text-sm tw:text-slate-700">
                      <DateFormat
                        value={item.updatedAt}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </AppTable.Cell>

                {/* Action Column */}
                <AppTable.Cell>
                  <div className="tw:flex tw:gap-2">
                    {(item.status === "Synced" ||
                      item.statusLabel === "Synced") && (
                      <AppButton
                        color="success"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({ action: "subscribe", data: item });
                        }}
                      >
                        <Mail size={14} />
                        {t("subscribe")}
                      </AppButton>
                    )}
                    <AppButton
                      color="dark"
                      fill="outline"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback({ action: "view", data: item });
                      }}
                    >
                      <Eye size={14} />
                      {t("view")}
                    </AppButton>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
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
