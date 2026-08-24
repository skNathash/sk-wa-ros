import clsx from "clsx";
import { format } from "date-fns";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import NoData from "~/components/core/no-data/NoData";
import AppProgress from "~/components/core/progress/AppProgress";
import { TableSkeletonLoader } from "~/components/core/table";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { avatarToneAt, initialsOf, type LiveWalletRow } from "../helper";

interface DesktopViewProps {
  data: LiveWalletRow[];
  loading: boolean;
}

const headers: TableHeaderItem[] = [
  {
    label: "Customer",
    key: "customer",
    enableSort: false,
    width: "34%",
    langKey: "customer",
  },
  {
    label: "Type",
    key: "userCategory",
    enableSort: false,
    width: "10%",
    langKey: "type",
  },
  {
    label: "Usage",
    key: "usage",
    enableSort: false,
    width: "24%",
    langKey: "usage",
  },
  {
    label: "Balance",
    key: "balance",
    enableSort: false,
    width: "16%",
    langKey: "balance",
    isRightAligned: true,
  },
  {
    label: "Due",
    key: "due",
    enableSort: false,
    width: "16%",
    langKey: "due",
    isRightAligned: true,
  },
];

/**
 * Live wallets, desktop — one table row per wallet: who it belongs to, the
 * wallet type, how much of the limit is drawn, what is owed and when it falls
 * due.
 */
const DesktopView = ({ data, loading }: DesktopViewProps) => {
  if (!loading && !data.length) return <NoData />;

  return (
    <AppTable size="sm" stickyHeader fixedLayout container minWidth="560px">
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={6} />
        ) : (
          data.map((row, index) => {
            // Bar tone follows the due state: overdue → red, due today → amber,
            // else green — same reading as the wallets list.
            const tone: "danger" | "warning" | "success" = row.isOverdue
              ? "danger"
              : row.isDueToday
                ? "warning"
                : "success";

            return (
              <AppTable.Row key={row.id}>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2.5">
                    <div
                      className={clsx(
                        "tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-xs tw:font-bold tw:text-white",
                        avatarToneAt(index),
                      )}
                    >
                      {initialsOf(row.name)}
                    </div>
                    <div className="tw:min-w-0">
                      <AppLink
                        asLink
                        href={row.href}
                        className="tw:block tw:truncate tw:font-semibold"
                        showLinkColor
                      >
                        {row.name}
                      </AppLink>
                      <div className="tw:text-xs tw:text-gray-400">
                        {row.statusLabel}
                      </div>
                    </div>
                  </div>
                </AppTable.Cell>

                <AppTable.Cell>
                  <span className="tw:text-sm tw:text-indigo-500 tw:font-medium">
                    {row.userCategory}
                  </span>
                </AppTable.Cell>

                <AppTable.Cell>
                  <AppProgress
                    value={row.usage}
                    color={tone}
                    className="tw:h-1.5 tw:w-full"
                  />
                  <div className="tw:mt-1 tw:text-xs tw:text-gray-400 tw:whitespace-nowrap">
                    <Amount
                      value={row.used}
                      decimalPlaces={0}
                      className={
                        row.used > 0 ? "tw:font-semibold tw:text-gray-800" : ""
                      }
                    />
                    <span className="tw:mx-0.5">/</span>
                    <Amount value={row.limit} decimalPlaces={0} />
                  </div>
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-right">
                  <Amount
                    value={row.used}
                    decimalPlaces={0}
                    className="tw:font-semibold tw:text-gray-800"
                  />
                </AppTable.Cell>

                <AppTable.Cell className="tw:text-right">
                  {row.isOverdue ? (
                    <span className="tw:text-sm tw:text-red-500 tw:whitespace-nowrap">
                      {row.raw.expiryStatus}
                    </span>
                  ) : row.isDueToday ? (
                    <span className="tw:text-sm tw:text-amber-600 tw:whitespace-nowrap">
                      Due today
                    </span>
                  ) : row.dueDate ? (
                    <span className="tw:text-sm tw:text-gray-500 tw:whitespace-nowrap">
                      Due {format(row.dueDate, "dd MMM")}
                    </span>
                  ) : (
                    <span className="tw:text-sm tw:text-gray-300">--</span>
                  )}
                </AppTable.Cell>
              </AppTable.Row>
            );
          })
        )}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
