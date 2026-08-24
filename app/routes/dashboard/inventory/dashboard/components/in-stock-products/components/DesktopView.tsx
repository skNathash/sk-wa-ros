import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import { getHeaders, type InStockRow } from "../helper";

type Props = {
  data: InStockRow[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  callback: (args: { action: string; data?: any }) => void;
};

const containerStyle = {
  maxHeight: "calc(100vh - 300px)",
};

const DesktopView = ({
  data,
  loading,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
  showLoadMore,
  callback,
}: Props) => {
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  const headers = getHeaders();

  return (
    <AppTable
      container
      responsive
      containerStyle={containerStyle}
      stickyHeader
      fixedLayout
      minWidth="1200px"
    >
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : (
          data.map((p, idx) => (
            <AppTable.Row
              key={p._key}
              className={idx % 2 === 0 ? "tw:bg-white" : "tw:bg-slate-50/60"}
            >
              <AppTable.Cell>
                <div className="tw:text-center">{idx + 1}</div>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  asLink
                  href={`/dashboard/inventory/products/view/${p.dealId}`}
                >
                  <div className="tw:line-clamp-2">{p.dealName}</div>
                </AppLink>
                {p.dealRefId && (
                  <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                    {p.dealRefId}
                  </div>
                )}
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className="tw:font-semibold tw:text-emerald-700">
                  <DisplayQty qty={p._stockQty} isLooseQty={p._isLooseQty} />
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span className="tw:font-semibold tw:text-emerald-700">
                  <Amount value={p._stockValue} />
                </span>
              </AppTable.Cell>
              <AppTable.Cell className="tw:text-center">
                <span
                  className={`tw:inline-flex tw:rounded-full tw:px-2 tw:py-1 tw:text-[11px] tw:font-semibold ${p._movementClassName}`}
                >
                  {p._movementLabel}
                </span>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  onClick={() =>
                    callback({
                      action: "menu",
                      data: { id: p.menuRefId, name: p.menuName },
                    })
                  }
                >
                  <span className="tw:text-xs tw:line-clamp-2">
                    {p.menuName}
                  </span>
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  onClick={() =>
                    callback({
                      action: "category",
                      data: { id: p.categoryRefId, name: p.categoryName },
                    })
                  }
                >
                  <span className="tw:text-xs tw:line-clamp-2">
                    {p.categoryName}
                  </span>
                </AppLink>
              </AppTable.Cell>
              <AppTable.Cell>
                <AppLink
                  onClick={() =>
                    callback({
                      action: "brand",
                      data: { id: p.brandRefId, name: p.brandName },
                    })
                  }
                >
                  <span className="tw:text-xs tw:line-clamp-2">
                    {p.brandName}
                  </span>
                </AppLink>
              </AppTable.Cell>
            </AppTable.Row>
          ))
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
