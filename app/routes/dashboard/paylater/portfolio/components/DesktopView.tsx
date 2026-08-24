import clsx from "clsx";
import { Eye, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { AppTable, TableHeader, TableSkeletonLoader } from "~/components/core/table";
import type { TableHeaderItem } from "~/types/CommonTypes";
import {
  getInitial,
  getTint,
  TYPE_META,
  type PortfolioRow,
  type PortfolioType,
} from "../helper";

type Props = {
  data: PortfolioRow[];
  loading: boolean;
  type: PortfolioType;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback?: (payload: { action: string; data: PortfolioRow }) => void;
};

const buildHeaders = (type: PortfolioType): TableHeaderItem[] => [
  { label: "Customer", key: "name", width: "26%", langKey: "customer" },
  { label: "Type", key: "userType", width: "8%", langKey: "type" },
  { label: "Usage", key: "usagePercent", width: "20%", langKey: "usage" },
  {
    label: TYPE_META[type].amountLabel,
    key: "amount",
    width: "14%",
    isRightAligned: true,
  },
  { label: "Limit", key: "limit", width: "12%", langKey: "creditLimit", isRightAligned: true },
  { label: "Due", key: "dueDate", width: "12%", langKey: "due", isRightAligned: true },
  { label: "Actions", key: "actions", width: "8%", langKey: "actions", isRightAligned: true },
];

const DesktopView = ({
  data,
  loading,
  type,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  const { t } = useTranslation();
  const headers = buildHeaders(type);

  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="100px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : (
          data.map((row) => (
            <AppTable.Row key={row._id}>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div
                    className={clsx(
                      "tw:shrink-0 tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-xs tw:font-semibold",
                      getTint(row.name),
                    )}
                  >
                    {getInitial(row.name)}
                  </div>
                  <div className="tw:min-w-0">
                    <AppLink
                      asLink
                      href={row.userRedirectionLink}
                      className="tw:font-semibold tw:truncate"
                      showLinkColor
                    >
                      {row.name}
                    </AppLink>
                    {row.mobile && (
                      <AppLink
                        asLink
                        href={`tel:${row.mobile}`}
                        className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500"
                      >
                        <Phone size={12} />
                        {row.mobile}
                      </AppLink>
                    )}
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <AppBadge
                  variant={row.userCategory === "B2C" ? "primary" : "secondary"}
                >
                  {row.userCategory}
                </AppBadge>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  <Amount value={row.used} decimalPlaces={0} /> /{" "}
                  <Amount value={row.limit} decimalPlaces={0} /> ·{" "}
                  {row.usagePercent}%
                </div>
                <div className="tw:h-1.5 tw:overflow-hidden tw:rounded-full tw:bg-slate-100">
                  <div
                    className={clsx(
                      "tw:h-full tw:rounded-full",
                      row.isOverdue ? "tw:bg-rose-500" : "tw:bg-violet-600",
                    )}
                    style={{ width: `${Math.min(row.usagePercent, 100)}%` }}
                  />
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right">
                <Amount
                  value={row.amount}
                  decimalPlaces={2}
                  className={clsx(
                    "tw:font-semibold",
                    TYPE_META[type].amountClassName,
                  )}
                />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right">
                <Amount value={row.limit} decimalPlaces={0} />
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right">
                {row.dueDate ? (
                  <DateFormat
                    value={row.dueDate}
                    formatStr="dd MMM yyyy"
                    className="tw:block"
                  />
                ) : (
                  "-"
                )}
                {row.dueLabel && (
                  <span
                    className={clsx(
                      "tw:text-xs",
                      row.isOverdue ? "tw:text-rose-500" : "tw:text-gray-500",
                    )}
                  >
                    {row.dueLabel}
                  </span>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-right">
                <AppButton
                  size="small"
                  color="light"
                  fill="outline"
                  onClick={() => callback?.({ action: "view", data: row })}
                >
                  <Eye size={14} />
                  {t("view")}
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          ))
        )}

        {hasMoreData && !loading && data.length > 0 && (
          <AppTable.Row>
            <AppTable.Cell colSpan={headers.length}>
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
                noMargin
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
