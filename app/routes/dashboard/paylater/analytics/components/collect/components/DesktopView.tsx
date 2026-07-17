import { Bell, Phone } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { AppTable, TableHeader } from "~/components/core/table";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";

type Props = {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback?: (payload: { action: string; data: any }) => void;
};

const headers: TableHeaderItem[] = [
  { label: "User", key: "user", width: "15%", langKey: "user" },
  { label: "Type", key: "type", width: "5%", langKey: "type" },
  { label: "Due Date", key: "dueDate", width: "8%", langKey: "dueDate" },
  { label: "Status", key: "status", width: "15%", langKey: "status" },
  { label: "Due Amount", key: "dueAmount", width: "15%", langKey: "dueAmount" },
  {
    label: "Credit Limit",
    key: "creditLimit",
    width: "15%",
    langKey: "creditLimit",
  },
  { label: "Action", key: "action", width: "10%", langKey: "action" },
];

const DesktopView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
        <AppSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {data.map((item, idx) => (
          <AppTable.Row key={item.id}>
            <AppTable.Cell>
              <div className="tw:flex tw:items-center tw:gap-1">
                <AppLink asLink href={item.userRedirectionLink}>
                  {item.userInfo?.name || "-"}
                </AppLink>
              </div>
              {item.userInfo?.mobile && (
                <AppLink
                  asLink
                  href={`tel:${item.userInfo.mobile}`}
                  className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mt-1"
                >
                  <Phone size={12} />
                  {item.userInfo.mobile}
                </AppLink>
              )}
            </AppTable.Cell>
            <AppTable.Cell>
              <AppBadge
                variant={item.userCategory === "B2C" ? "primary" : "secondary"}
              >
                {item.userCategory || "-"}
              </AppBadge>
            </AppTable.Cell>
            <AppTable.Cell>
              <DateFormat
                value={item.validityEndDate}
                formatStr="dd MMM yyyy"
                className="tw:mb-1 tw:inline-block"
              />
            </AppTable.Cell>
            <AppTable.Cell>
              {item.isOverdue ? (
                <AppBadge variant="danger">Overdue</AppBadge>
              ) : item.isDueToday ? (
                <AppBadge variant="warning">Due Today</AppBadge>
              ) : null}
            </AppTable.Cell>
            <AppTable.Cell>
              <Amount
                value={item.totalPayableAmount}
                decimalPlaces={2}
                className="tw:text-red-500 tw:font-semibold"
              />
            </AppTable.Cell>
            <AppTable.Cell>
              <Amount
                value={item.creditLimit}
                decimalPlaces={2}
                className="tw:text-green-500 tw:font-semibold"
              />
            </AppTable.Cell>
            <AppTable.Cell>
              <AppButton
                size="small"
                color="light"
                fill="outline"
                onClick={() =>
                  callback && callback({ action: "send-reminder", data: item })
                }
              >
                <Bell size={16} />
                {t("sendReminder")}
              </AppButton>
            </AppTable.Cell>
          </AppTable.Row>
        ))}

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
