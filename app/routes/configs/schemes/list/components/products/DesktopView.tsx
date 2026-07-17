import clsx from "clsx";
import { PencilLine, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import DisplayProfit from "~/shared/others/components/DisplayProfit";
import type {
  SortProps,
  SortValue,
  TableHeaderItem,
  VariantColor,
} from "~/types/CommonTypes";

type DesktopViewProps = {
  loading?: boolean;
  data?: any[];
  callback?: (args: { action: string; data?: any }) => void;
  sortKey?: string;
  onSort?: (sort: SortProps) => void;
  sortValue?: SortValue;
  showLoadMore?: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  totalCount?: number;
  loadedCount?: number;
  highlightDealId?: string;
};

const headers: TableHeaderItem[] = [
  { label: "Image", key: "image", width: "5%" },
  { label: "Name / Deal ID", key: "name", width: "20%" },
  { label: "B2B Price", key: "pricing", isCentered: true, width: "10%" },
  {
    label: "Purchase Price",
    key: "purchasePrice",
    isCentered: true,
    width: "10%",
  },
  { label: "Scheme Price", key: "offerPrice", isCentered: true, width: "10%" },
  { label: "Validity", key: "validity", isCentered: true, width: "15%" },
  { label: "Actions", key: "actions", isCentered: true, width: "10%" },
];

const containerStyle = {
  maxHeight: "calc(100vh - 200px)",
};

const DesktopView = ({
  loading = false,
  data = [],
  callback,
  sortKey = "",
  onSort = () => {},
  sortValue = "asc",
  showLoadMore = false,
  loadingMore = false,
  loadMore = () => {},
  totalCount = 0,
  loadedCount = 0,
  highlightDealId = "",
}: DesktopViewProps) => {
  const { t } = useTranslation(["common"]);
  if (!loading && data.length === 0) {
    return <NoData />;
  }

  return (
    <>
      <AppTable
        container
        responsive
        stickyHeader
        containerStyle={containerStyle}
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading && <TableSkeletonLoader cols={headers.length} />}

          {data.map((item) => (
            <AppTable.Row
              key={item.id}
              className={clsx(
                "tw:align-middle tw:text-sm tw:text-gray-800 tw:hover:bg-gray-50 tw:transition",
                highlightDealId === item._id && "highlight-animate",
              )}
            >
              <AppTable.Cell className="tw:py-2">
                <div className="tw:w-10 tw:h-10 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center tw:shrink-0">
                  <ImgRender
                    assetId={item.images?.[0]}
                    className="tw:object-contain tw:w-8 tw:h-8"
                    alt={item.name}
                    size="150"
                  />
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-2">
                <AppLink
                  href={`/dashboard/inventory/products/view/${item._id}`}
                  asLink
                >
                  <div className="tw:font-semibold tw:text-sm tw:text-gray-900">
                    {item.name}
                  </div>
                </AppLink>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
                    <span className="tw:font-mono tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded tw:text-gray-700">
                      {item.id ?? "-"}
                    </span>
                  </div>

                  {/* stock */}
                  <div className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
                    Stock: {item.maxQty ?? 0}
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:py-2">
                <div className="tw:font-semibold tw:text-gray-900">
                  <Amount
                    value={item.b2bPrice ?? item.basePrice ?? item.price ?? 0}
                  />
                </div>
                <div className="tw:text-xs tw:text-gray-600">
                  MRP: <Amount value={item.mrp ?? 0} />
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:py-2">
                <div className="tw:font-semibold tw:text-gray-900">
                  <Amount value={item.purchasePrice ?? 0} />
                </div>

                {item.b2bScheme?.status !== "Completed" && (
                  <div className="tw:text-xs tw:text-gray-600">
                    Profit:{" "}
                    <DisplayProfit
                      price={item.purchasePrice ?? 0}
                      offerPrice={item.b2bScheme?.offerPrice ?? 0}
                    />
                  </div>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:py-2 tw:font-semibold">
                <div className="tw:mb-2 tw:text-green-700">
                  {item.b2bScheme?.offerPrice != null ? (
                    <Amount value={item.b2bScheme.offerPrice} />
                  ) : (
                    <span className="tw:text-gray-500">-</span>
                  )}
                </div>

                {item.b2bScheme?.offerDiscount > 0 ? (
                  <AppBadge variant="danger">
                    Discount: {item.b2bScheme.offerDiscount}%
                  </AppBadge>
                ) : (
                  <span className="tw:text-gray-500">-</span>
                )}

                <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                  {item.b2bScheme?.isTaxInclusive
                    ? t("afterTax")
                    : t("beforeTax")}
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-2">
                {item.b2bScheme?.offerStartDate &&
                item.b2bScheme?.offerEndDate ? (
                  <div className="tw:flex tw:flex-col tw:gap-1.5 tw:items-center tw:w-full">
                    <div className="tw:flex tw:items-center tw:gap-2 tw:justify-center tw:text-xs tw:w-full tw:text-gray-700">
                      <DateFormat
                        value={item.b2bScheme.offerStartDate}
                        formatStr="dd MMM yyyy"
                      />
                      <span className="tw:text-gray-500 tw:text-xs">-</span>
                      <DateFormat
                        value={item.b2bScheme.offerEndDate}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                    <div className="tw:text-xs tw:text-gray-600">
                      <AppBadge variant={item.b2bScheme?.statusColor}>
                        {item.b2bScheme?.status}
                      </AppBadge>
                    </div>
                  </div>
                ) : (
                  <span className="tw:text-gray-500">-</span>
                )}
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:py-2">
                <Rbac roles={["CONFIGS.PRICE-SCHEME-UPDATE"]}>
                  {item.b2bScheme?.status &&
                  item.b2bScheme.status
                    .toString()
                    .toLowerCase()
                    .includes("complete") ? (
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={() => callback?.({ action: "edit", data: item })}
                    >
                      <RefreshCw size={14} />
                      Renew
                    </AppButton>
                  ) : (
                    <AppButton
                      size="small"
                      color="primary"
                      fill="outline"
                      onClick={() => callback?.({ action: "edit", data: item })}
                    >
                      <PencilLine size={14} />
                      Edit
                    </AppButton>
                  )}
                </Rbac>
              </AppTable.Cell>
            </AppTable.Row>
          ))}
        </AppTable.Body>

        {showLoadMore && !loading && data.length > 0 && (
          <AppTable.Row noHover>
            <AppTable.Cell colSpan={headers.length} className="tw:text-center">
              <LoadMoreButton
                loading={loadingMore}
                loadMore={loadMore}
                totalCount={totalCount}
                loadedCount={loadedCount}
              />
            </AppTable.Cell>
          </AppTable.Row>
        )}
      </AppTable>
    </>
  );
};

export default DesktopView;
