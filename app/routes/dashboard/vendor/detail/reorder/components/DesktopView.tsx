import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import PoAddToCart from "~/shared/purchase-order/components/po-add-to-cart/PoAddToCart";
import PoRemoveCart from "~/shared/purchase-order/components/po-remove-cart/PoRemoveCart";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
} from "~/types/CommonTypes";
import type { VendorReorderItem } from "../helper";

type Props = {
  vendorId: string;
  data: VendorReorderItem[];
  loading: boolean;
  loadedCount: number;
  totalCount: number;
  loadingMore: boolean;
  loadMore: () => void;
  showLoadMore: boolean;
  sortKey: string;
  sortValue: SortValue;
  sortCb: (data: SortProps) => void;
  onCartChange: (dealId: string, inCart: boolean) => void;
};

const getHeaders = (): TableHeaderItem[] => [
  { label: "Product", key: "name", width: "24%", enableSort: true },
  { label: "Brand", key: "brandName", width: "12%" },
  {
    label: "Last Purchase",
    key: "lastPurchaseDate",
    width: "14%",
    enableSort: true,
  },
  {
    label: "Total Qty",
    key: "totalQuantityPurchased",
    width: "10%",
    isCentered: true,
  },
  { label: "Orders", key: "orderCount", width: "8%", isCentered: true },
  { label: "Price", key: "purchasePrice", width: "10%", isCentered: true },
  {
    label: "Suggested",
    key: "suggestedQuantity",
    width: "10%",
    isCentered: true,
  },
  { label: "Add", key: "actions", width: "12%", isCentered: true },
];

const DesktopView = ({
  vendorId,
  data,
  loading,
  loadedCount,
  totalCount,
  loadingMore,
  loadMore,
  showLoadMore,
  sortKey,
  sortValue,
  sortCb,
  onCartChange,
}: Props) => {
  const headers = getHeaders();

  if (!loading && !data.length) {
    return <NoData />;
  }

  return (
    <AppTable
      responsive
      fixedLayout
      minWidth="900px"
      container
      stickyHeader
      condensed
    >
      <AppTable.Header>
        <TableHeader
          headers={headers}
          sortKey={sortKey}
          sortValue={sortValue}
          onSort={sortCb}
        />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={8} />
        ) : null}

        {!loading &&
          data.map((item) => {
            const dealId = item.dealId || item.dealRefId;
            return (
              <AppTable.Row key={item.id}>
                <AppTable.Cell>
                  <div className="tw:font-semibold">{item.name}</div>
                  <div className="tw:text-muted-foreground">
                    {item.dealRefId}
                  </div>
                </AppTable.Cell>
                <AppTable.Cell>{item.brandName || "-"}</AppTable.Cell>
                <AppTable.Cell>
                  {item.lastPurchaseDate ? (
                    <div>
                      <DateFormat
                        value={item.lastPurchaseDate}
                        formatStr="dd MMM yyyy"
                      />
                      {item.lastPurchaseQty ? (
                        <div className="tw:text-muted-foreground">
                          {item.lastPurchaseQty} {item.uom}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    "-"
                  )}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {item.totalQuantityPurchased} {item.uom}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {item.orderCount}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  <Amount value={item.price} decimalPlaces={2} />
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {item.suggestedQty}
                </AppTable.Cell>
                <AppTable.Cell className="tw:text-center">
                  {item.inCart ? (
                    <PoRemoveCart
                      vendorId={vendorId}
                      dealId={dealId}
                      onSuccess={() => onCartChange(dealId, false)}
                    />
                  ) : (
                    <PoAddToCart
                      vendorId={vendorId}
                      dealId={dealId}
                      type="purchased"
                      initialQty={item.suggestedQty}
                      onSuccess={() => onCartChange(dealId, true)}
                    />
                  )}
                </AppTable.Cell>
              </AppTable.Row>
            );
          })}

        {showLoadMore && !loading && data.length > 0 ? (
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
        ) : null}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
