import clsx from "clsx";
import { Info, InfoIcon } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";
import {
  AppTable,
  TableHeader,
  TableSkeletonLoader,
} from "~/components/core/table";
import { Input } from "~/components/ui/input";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import RecentPurchasePopover from "~/shared/vendor/popovers/recent-purchase/RecentPurchasePopover";

const headers: TableHeaderItem[] = [
  {
    label: "Product",
    key: "product",
    width: "25%",
    langKey: "product",
  },
  {
    label: "Store Stock",
    key: "_stock",
    width: "10%",
    langKey: "storeStock",
  },
  {
    label: "Sales",
    key: "sales",
    width: "8%",
    langKey: "sales",
  },
  {
    label: "MRP",
    key: "mrp",
    width: "8%",
    langKey: "mrp",
  },
  {
    label: "Purchase Price",
    key: "purchasePrice",
    width: "10%",
    langKey: "purchasePrice",
  },
  {
    label: "Discount (%)",
    key: "discount",
    width: "10%",
    langKey: "discount",
  },
  {
    label: "Quantity",
    key: "quantity",
    width: "10%",
    langKey: "quantity",
  },
  {
    label: "Total",
    key: "total",
    width: "10%",
    langKey: "total",
  },
];

const containerStyle = {
  maxHeight: "calc(100vh - 350px)",
};

const SelectProductsTable = ({
  data,
  loading,
  callback,
  showLoadMore,
  loadMore,
  loadingMore,
  totalCount,
  loadedCount,
}: {
  data: any[];
  loading: boolean;
  callback: ({ action, data }: { action: string; data: any }) => void;
  showLoadMore: boolean;
  loadMore: () => void;
  loadingMore: boolean;
  totalCount: number;
  loadedCount: number;
}) => {
  const { t } = useTranslation(["common"]);
  const handlePurchasePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        purchasePrice: e.target.value,
        key: "purchasePrice",
      },
    });
  };

  const handleDiscountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        discount: e.target.value,
        key: "discount",
      },
    });
  };

  const handleQuantityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        quantity: e.target.value,
        key: "quantity",
      },
    });
  };

  const handleMrpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    callback({
      action: "update",
      data: {
        index,
        mrp: e.target.value,
        key: "mrp",
      },
    });
  };

  return (
    <>
      <AppTable
        size="sm"
        fixedLayout
        containerStyle={containerStyle}
        container
        stickyHeader
        minWidth="1000px"
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : null}

          {!loading && data.length === 0 && (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <div className="tw:text-center tw:py-8 tw:text-gray-500">
                  {t("noProductsFound")}
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          )}

          {data.map((item, index) => (
            <AppTable.Row
              key={item.dealId}
              className={clsx({
                "tw:bg-green-50": item.quantity > 0,
              })}
            >
              <AppTable.Cell>
                <div className="tw:mb-2">{item.name}</div>

                <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                  ID: {item.dealId}
                </div>

                <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                  {item.applicableCategory?.categoryName}
                  <span className="tw:text-xs tw:text-gray-500">/</span>
                  {item.applicableBrand?.brandName}
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <div>{item.stock || 0}</div>
              </AppTable.Cell>
              <AppTable.Cell>{item.sales || 0}</AppTable.Cell>
              <AppTable.Cell>
                {/* <Amount value={item.dealMrp} decimalPlaces={2} /> */}
                <Input
                  type="number"
                  value={item.mrp}
                  onChange={(e) => handleMrpChange(e, index)}
                  className="tw:bg-white"
                  placeholder={t("mrp")}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Input
                    type="number"
                    value={item.purchasePrice}
                    onChange={(e) => handlePurchasePriceChange(e, index)}
                    className="tw:bg-white tw:p-2 no-spinner"
                    placeholder={t("purchasePrice")}
                  />
                  <AppPopover
                    triggerContent={
                      <InfoIcon className="tw:text-blue-400 tw:w-6 tw:h-6" />
                    }
                  >
                    <RecentPurchasePopover productId={item._id} limit={3} />
                  </AppPopover>
                </div>
              </AppTable.Cell>
              <AppTable.Cell>
                <Input
                  type="number"
                  value={item.discount}
                  onChange={(e) => handleDiscountChange(e, index)}
                  className="tw:bg-white no-spinner tw:p-2"
                  placeholder={t("discount") + "(%)"}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(e, index)}
                  className="tw:bg-white no-spinner tw:p-2"
                  placeholder={t("quantity")}
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <Amount value={item.total} />
              </AppTable.Cell>
            </AppTable.Row>
          ))}
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
    </>
  );
};

export default SelectProductsTable;
