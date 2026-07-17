import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import type { FastMovingProduct } from "../../../helper";

type Props = {
  data: FastMovingProduct[];
  loading: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
  showLoadMore: boolean;
  callback: (args: { action: string; data?: any }) => void;
};

const headers = [
  { label: "#", key: "rank", width: "5%" },
  { label: "Product", key: "dealName", width: "30%" },
  { label: "Qty Sold", key: "totalQty", isCentered: true, width: "10%" },
  { label: "Sales Value", key: "revenue", isCentered: true, width: "12%" },
  { label: "Menu", key: "menuName", width: "13%" },
  { label: "Category", key: "categoryName", width: "13%" },
  { label: "Brand", key: "brandName", width: "12%" },
];

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

  return (
    <AppTable container responsive containerStyle={containerStyle} stickyHeader>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={10} />
        ) : (
          data.map((p, idx) => {
            const rank = idx + 1;

            return (
              <AppTable.Row
                key={idx}
                className={idx % 2 === 0 ? "tw:bg-white" : "tw:bg-slate-50/60"}
              >
                <AppTable.Cell>
                  <div className="tw:text-center">
                    {rank}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${p.dealId}`}
                  >
                    <div className="tw:line-clamp-2">
                      {p.dealName}
                    </div>
                  </AppLink>
                  {p.dealRefId && (
                    <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                      {p.dealRefId}
                    </div>
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:font-semibold tw:text-emerald-700">{p.totalQty}</span>
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <span className="tw:font-semibold tw:text-emerald-700">
                    <Amount value={p.revenue} />
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
                    <span className="tw:text-xs tw:line-clamp-1">
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
                    <span className="tw:text-xs tw:line-clamp-1">
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
                    <span className="tw:text-xs tw:line-clamp-1">
                      {p.brandName}
                    </span>
                  </AppLink>
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
