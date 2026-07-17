import { Hash, Package } from "lucide-react";
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
import type { TableHeaderItem } from "~/types/CommonTypes";

interface UserDesktopViewProps {
  loading?: boolean;
  data: any[];
  callback: (data: any) => void;
  tab?: string;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
}

const buildHeaders = (tab?: string): TableHeaderItem[] => {
  const base: TableHeaderItem[] = [
    { label: "User", langKey: "user", key: "user", width: "45%" },
    {
      label: "Orders",
      langKey: "orders",
      key: "count",
      width: "15%",
      isRightAligned: true,
    },
    {
      label: "Total Amount",
      langKey: "totalAmount",
      key: "totalAmount",
      width: "25%",
      isRightAligned: true,
    },
  ];
  if (tab !== "handedover") {
    base.push({
      label: "Action",
      langKey: "action",
      key: "action",
      width: "15%",
      isRightAligned: true,
    });
  }
  return base;
};

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const UserDesktopView: React.FC<UserDesktopViewProps> = ({
  loading,
  data,
  callback,
  tab,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
}) => {
  const { t } = useTranslation("common");
  const headers = buildHeaders(tab);

  if (!loading && !data?.length) {
    return <NoData />;
  }

  return (
    <AppTable
      size="sm"
      stickyHeader
      fixedLayout
      container
      minWidth="800px"
      containerStyle={containerStyle}
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={20} />
        ) : data && data.length > 0 ? (
          data.map((row, idx) => {
            const userId = row.shipmentUserId || row.shipmentUserInfo?.id;
            const userName = row.shipmentUserInfo?.name || row.userName || "-";
            const refId = row.refId || row.shipmentUserInfo?.refId;
            const orderCount = row.count || row.totalCount || 0;
            return (
              <AppTable.Row key={userId || idx}>
                <AppTable.Cell>
                  <span className="tw:flex tw:items-center tw:gap-2.5">
                    <span className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-full tw:bg-slate-100 tw:text-slate-700 tw:text-xs tw:font-semibold tw:shrink-0">
                      {row.initial}
                    </span>
                    <span className="tw:flex tw:flex-col tw:min-w-0">
                      <span className="tw:font-medium tw:text-slate-900 tw:truncate">
                        {userId ? (
                          <AppLink
                            href={`/dashboard/employee/view/${userId}`}
                            asLink
                            showLinkColor
                          >
                            {userName}
                          </AppLink>
                        ) : (
                          userName
                        )}
                      </span>
                      {refId && (
                        <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[11px] tw:text-slate-500 tw:font-mono">
                          <Hash size={10} className="tw:text-slate-400" />
                          {refId}
                        </span>
                      )}
                    </span>
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right">
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-slate-700 tw:tabular-nums">
                    <Package size={12} className="tw:text-slate-400" />
                    <span className="tw:font-medium">{orderCount}</span>
                  </span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-right">
                  <Amount
                    value={row.totalAmount}
                    decimalPlaces={2}
                    className="tw:text-slate-900 tw:font-semibold tw:tabular-nums"
                  />
                </AppTable.Cell>
                {tab !== "handedover" && (
                  <AppTable.Cell className="tw:text-right">
                    <AppButton
                      type="button"
                      size="small"
                      onClick={() =>
                        callback({
                          action: "handover",
                          data: { ...row, userId },
                        })
                      }
                    >
                      {t("handover")}
                    </AppButton>
                  </AppTable.Cell>
                )}
              </AppTable.Row>
            );
          })
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

export default UserDesktopView;
