import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import KeyValue from "~/components/core/key-value/KeyValue";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Props = {
  data: any[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  hasMoreData: boolean;
  callback: (payload: { action: string; data: any }) => void;
};

const MobileView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  hasMoreData,
  callback,
}: Props) => {
  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-6">
        <AppSpinner />
      </div>
    );
  }

  if (!data.length) {
    return <NoData />;
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
      {data.map((row, index) => (
        <AppCard key={row._id || index} noPadding className="tw:mb-0">
          <div className="tw:p-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <KeyValue label="Order ID" size="sm">
                {row.orderDetails?.orderId ? (
                  <button
                    type="button"
                    onClick={() => callback({ action: "view-order", data: row })}
                    className="tw:text-primary tw:font-medium tw:cursor-pointer"
                  >
                    {row.sourceReference || "-"}
                  </button>
                ) : (
                  row.sourceReference || "-"
                )}
              </KeyValue>

              <KeyValue label="Date" size="sm">
                <DateFormat value={row.date ?? ""} formatStr="dd MMM yyyy" />
                <DateFormat
                  value={row.date ?? ""}
                  formatStr="hh:mm aa"
                  className="tw:ml-1 tw:text-slate-500 tw:text-xs"
                />
              </KeyValue>
            </div>
          </div>

          <Divider className="tw:!my-0" />

          <div className="tw:p-4">
            <div className="tw:grid tw:grid-cols-2 tw:gap-4">
              <KeyValue label="Amount" size="sm">
                <Amount
                  value={row.rawAmount ?? 0}
                  decimalPlaces={2}
                  className="tw:font-semibold tw:text-red-600"
                />
              </KeyValue>

              <KeyValue label="Available limit" size="sm">
                <Amount
                  value={row.rawBalance ?? 0}
                  decimalPlaces={2}
                  className="tw:font-semibold tw:text-green-600"
                />
              </KeyValue>
            </div>
          </div>

          {row.description ? (
            <>
              <Divider className="tw:!my-0" />
              <div className="tw:p-4">
                <KeyValue label="Description" size="sm">
                  <div className="tw:text-slate-600">{row.description}</div>
                </KeyValue>
              </div>
            </>
          ) : null}
        </AppCard>
      ))}

      {hasMoreData && data.length > 0 ? (
        <div className="tw:text-center tw:mt-2 tw:md:col-span-2">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={totalCount}
            loadedCount={loadedCount}
          />
        </div>
      ) : null}
    </div>
  );
};

export default MobileView;
