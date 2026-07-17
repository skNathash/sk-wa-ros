import Amount from "app/components/core/amount/Amount";
import AppButton from "app/components/core/button/AppButton";
import ImgRender from "app/components/core/img/ImgRender";
import AppTable from "app/components/core/table/AppTable";
import TableHeader from "app/components/core/table/TableHeader";
import { Box, Package, Plus, Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { TableSkeletonLoader } from "~/components/core/table";
import { Checkbox } from "~/components/ui/checkbox";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import type { SortValue, TableHeaderItem } from "~/types/CommonTypes";
import BarcodeInfo from "./BarcodeInfo";

interface Props {
  data: any[];
  callback: (params: { action: string; data?: any }) => void;
  onSort: (params: { key: string; value: SortValue }) => void;
  sortKey?: string;
  sortValue?: SortValue;
  loading: boolean;
  showCheckbox?: boolean;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  loadedCount?: number;
}

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const getHeaders = (showCheckbox: boolean): TableHeaderItem[] => [
  ...(showCheckbox
    ? [
        {
          label: "",
          key: "checkbox",
          width: "4%",
        },
      ]
    : []),
  {
    label: "",
    langKey: "product",
    key: "name",
    width: showCheckbox ? "23%" : "27%",
    enableSort: true,
  },
  {
    label: "",
    langKey: "category",
    key: "applicableCategory.categoryName",
    width: "14%",
    enableSort: true,
  },
  {
    label: "",
    langKey: "brand",
    key: "applicableBrand.brandName",
    width: "12%",
    enableSort: true,
  },
  {
    label: "",
    langKey: "hsn",
    key: "hsn",
    width: "9%",
    enableSort: true,
  },
  {
    label: "",
    langKey: "gst",
    key: "tax",
    width: "6%",
    enableSort: true,
  },
  {
    label: "",
    langKey: "mrp",
    key: "mrp",
    width: "8%",
    enableSort: true,
  },
  {
    label: "",
    langKey: "Barcodes",
    key: "identifiers",
    width: "14%",
  },
  {
    label: "",
    langKey: "action",
    key: "action",
    width: "10%",
  },
];

const DesktopView: React.FC<Props> = ({
  data,
  callback,
  onSort,
  sortKey,
  sortValue,
  loading,
  showCheckbox = false,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  loadedCount = 0,
}) => {
  const { t } = useTranslation(["inventorySubscribe"]);

  const headers = getHeaders(showCheckbox);

  const handleCheckboxChange = (
    checked: boolean,
    index: number,
    productId: string,
  ) => {
    callback({
      action: "toggle-selection",
      data: { index, checked, productId },
    });
  };

  return (
    <AppCard noPadding>
      <AppTable
        fixedLayout
        container
        size="sm"
        stickyHeader
        condensed
        containerStyle={containerStyle}
        minWidth="1000px"
      >
        <AppTable.Header>
          <TableHeader
            headers={headers}
            onSort={(data) =>
              onSort({ key: data.key, value: data.value as "asc" | "desc" })
            }
            sortKey={sortKey}
            sortValue={sortValue}
          />
        </AppTable.Header>
        <AppTable.Body>
          {loading && <TableSkeletonLoader cols={headers.length} rows={10} />}
          {!loading && data.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="tw:text-center">
                <NoData />
              </td>
            </tr>
          )}
          {data.map((item, index) => {
            const selectable = !item.isSubscribed && !item.isInCart;
            const handleRowTap = () => {
              if (!selectable) return;
              handleCheckboxChange(!item.isSelected, index, item._id);
            };
            return (
              <AppTable.Row
                key={item.dealId}
                onClick={selectable ? handleRowTap : undefined}
              >
                {/* Checkbox column - only show if showCheckbox is true and item is not subscribed */}
                {showCheckbox && (
                  <AppTable.Cell className="tw:w-8">
                    {!item.isSubscribed && !item.isInCart && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={item.isSelected || false}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(
                              checked as boolean,
                              index,
                              item._id,
                            )
                          }
                          className="tw:mx-auto tw:border-2 tw:border-gray-400 tw:shadow-sm hover:tw:border-blue-500 focus:tw:border-blue-500 focus:tw:ring-2 focus:tw:ring-blue-200"
                        />
                      </div>
                    )}
                  </AppTable.Cell>
                )}
                {/* Product column: image, name, brand */}
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        callback({
                          action: "show-img-preview",
                          data: { images: item.images },
                        });
                      }}
                      className="tw:cursor-pointer tw:relative"
                    >
                      {item.consumerOffer?.enabled ? (
                        <div className="tw:absolute tw:left-1 tw:top-1 tw:z-10">
                          <ConsumerOfferBadge />
                        </div>
                      ) : null}
                      {item.images && item.images.length > 0 ? (
                        <ImgRender
                          assetId={item.images[0]}
                          alt={item.name}
                          className="tw:w-14 tw:h-14 tw:object-contain tw:rounded-md tw:bg-gray-100 tw:border tw:border-gray-200"
                        />
                      ) : (
                        <div className="tw:w-14 tw:h-14 tw:flex tw:items-center tw:justify-center tw:rounded-md">
                          <Box size={24} className="tw:text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="tw:flex-1">
                      <div
                        className="tw:font-medium tw:mb-1 tw:cursor-pointer tw:hover:text-blue-600"
                        title={item.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({
                            action: "product-tap",
                            data: { _id: item._id },
                          });
                        }}
                      >
                        {item.name}
                      </div>
                      <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                        ID: {item.dealId}
                      </div>
                    </div>
                  </div>
                </AppTable.Cell>
                {/* Category column */}
                <AppTable.Cell>
                  {item.category?.name ? (
                    <span
                      className="tw:hover:underline tw:cursor-pointer tw:inline-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback({
                          action: "category-tap",
                          data: { category: item.category },
                        });
                      }}
                    >
                      {item.category.name}
                    </span>
                  ) : (
                    "--"
                  )}
                </AppTable.Cell>
                {/* Brand column */}
                <AppTable.Cell>
                  {item.brand?.name ? (
                    <span
                      className="tw:hover:underline tw:cursor-pointer tw:inline-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        callback({
                          action: "brand-tap",
                          data: { brand: item.brand },
                        });
                      }}
                    >
                      {item.brand.name}
                    </span>
                  ) : (
                    "--"
                  )}
                </AppTable.Cell>
                {/* HSN column */}
                <AppTable.Cell>
                  <span className="tw:text-xs tw:text-slate-900">
                    {item.hsn || "--"}
                  </span>
                </AppTable.Cell>
                {/* GST column */}
                <AppTable.Cell>
                  <span className="tw:text-xs tw:text-slate-900">
                    {item.gst}%
                  </span>
                </AppTable.Cell>
                {/* Price column: price, mrp (strike through) */}
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <Amount
                      value={Number(item.mrp)}
                      decimalPlaces={2}
                      className="tw:font-medium"
                    />
                  </div>
                </AppTable.Cell>
                {/* Identifiers column: SKU + Barcode */}
                <AppTable.Cell>
                  <div
                    className="tw:flex tw:flex-col tw:gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BarcodeInfo
                      barcodeStr={item.barcodeStr}
                      barcodes={item.barcodes}
                    />
                  </div>
                </AppTable.Cell>
                {/* Action column: Subscribe button */}
                <AppTable.Cell>
                  <>
                    {item.isSubscribed ? (
                      <AppButton
                        size="small"
                        className="tw:w-full"
                        noShadow={true}
                        color="success"
                        disabled={true}
                      >
                        <Package size={12} />
                        {t("search.table.actions.subscribed")}
                      </AppButton>
                    ) : item.isInCart ? (
                      <AppButton
                        size="small"
                        className="tw:w-full"
                        noShadow={true}
                        color="danger"
                        fill="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({
                            action: "remove",
                            data: { ...item, index },
                          });
                        }}
                        isLoading={item.isLoading}
                      >
                        <Trash2 size={12} />
                        {t("search.table.actions.remove")}
                      </AppButton>
                    ) : (
                      <AppButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          callback({
                            action: "subscribe",
                            data: { ...item, index },
                          });
                        }}
                        className="tw:w-full"
                        isLoading={item.isLoading}
                      >
                        {item.groupDeals && item.groupDeals.length > 0 ? (
                          <span className="tw:text-xs">{`${item.groupDeals?.[0]?.values?.length} options`}</span>
                        ) : (
                          <>
                            <Plus size={12} />
                            {t("search.table.actions.subscribe")}
                          </>
                        )}
                      </AppButton>
                    )}
                  </>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })}
          {showLoadMore && !loading && data.length > 0 && loadMore && (
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
    </AppCard>
  );
};

export default DesktopView;
