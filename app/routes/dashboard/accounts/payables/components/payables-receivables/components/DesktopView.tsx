import clsx from "clsx";
import { MessageCircle } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { PaginationState, TableHeaderItem } from "~/types/CommonTypes";
import { getPartyTypeBadgeClass } from "../helper";

type Props = {
  type: "payables" | "receivables";
  data: any[];
  loading: boolean;
  loadingMore: boolean;
  hasMoreData: boolean;
  loadMore: () => void;
  pagination: PaginationState;
  onPay: (item: any) => void;
  onNotify: (item: any) => void;
};

const headers: TableHeaderItem[] = [
  { label: "#", key: "sno", width: "5%" },
  { label: "Name", key: "name", width: "27%" },
  { label: "Party", key: "party", width: "16%" },
  { label: "Since", key: "date", width: "17%" },
  { label: "Amount", key: "amount", width: "17%" },
  { label: "Actions", key: "actions", width: "18%" },
];

const DesktopView = ({
  type,
  data,
  loading,
  loadingMore,
  hasMoreData,
  loadMore,
  pagination,
  onPay,
  onNotify,
}: Props) => {
  const isPayables = type === "payables";
  const actionLabel = isPayables ? "Pay" : "Collect";
  const notifyLabel = isPayables ? "Notify" : "Remind";

  return (
    <>
      <AppTable size="sm" condensed>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={5} />
          ) : data.length === 0 ? (
            <AppTable.Row noHover>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            data.map((item: any, index: number) => (
              <AppTable.Row key={item._id}>
                <AppTable.Cell>{index + 1}</AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col">
                    {item.redirectionUrl && item.redirectionUrl !== "#" ? (
                      <AppLink
                        asLink
                        href={item.redirectionUrl}
                        className="tw:text-sm tw:font-semibold tw:text-gray-900 hover:tw:text-primary tw:transition-colors"
                      >
                        {item.name}
                      </AppLink>
                    ) : (
                      <span className="tw:text-sm tw:font-semibold tw:text-gray-900">
                        {item.name}
                      </span>
                    )}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <span
                    className={clsx(
                      "tw:inline-block tw:rounded-full tw:border tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide",
                      getPartyTypeBadgeClass(item.type),
                    )}
                  >
                    {item.partyLabel}
                  </span>
                </AppTable.Cell>
                <AppTable.Cell>
                  {item.ageDate && (
                    <div className="tw:flex tw:flex-col">
                      <DateFormat value={item.ageDate} formatStr="dd MMM yyyy" />
                      {item.ageLabel && (
                        <span className="tw:text-[11px] tw:text-gray-400">
                          {item.ageLabel}
                        </span>
                      )}
                    </div>
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
                      {isPayables ? "You'll pay" : "You'll get"}
                    </span>
                    <Amount
                      value={item.outstandingAmount}
                      decimalPlaces={2}
                      className={clsx(
                        "tw:text-sm tw:font-bold",
                        isPayables ? "amount-out" : "amount-in",
                      )}
                    />
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <button
                      type="button"
                      onClick={() => onNotify(item)}
                      aria-label="Send WhatsApp reminder"
                      className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-[#25d366]/10 tw:text-[#0f7a37] tw:px-3 tw:py-1 tw:text-xs tw:font-semibold hover:tw:bg-[#25d366]/20 tw:transition-colors tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-[#25d366]/50 tw:focus-visible:ring-offset-1"
                    >
                      <MessageCircle size={14} />
                      {notifyLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => onPay(item)}
                      className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-primary tw:text-white tw:px-4 tw:py-1 tw:text-xs tw:font-semibold tw:shadow-sm hover:tw:opacity-90 tw:transition-opacity tw:focus-visible:outline-none tw:focus-visible:ring-2 tw:focus-visible:ring-primary/50 tw:focus-visible:ring-offset-1"
                    >
                      {actionLabel}
                    </button>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            ))
          )}
        </AppTable.Body>
      </AppTable>

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loadedCount={data.length}
            loading={loadingMore}
            totalCount={pagination.totalRecords}
          />
        </div>
      )}
    </>
  );
};

export default DesktopView;
