import React from "react";
import { Barcode, Box, Loader2, Trash2 } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import ImgRender from "~/components/core/img/ImgRender";
import DateFormat from "~/components/core/date/DateFormat";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import MatchStatusBadge from "~/shared/inventory/subscribe-scan/components/MatchStatusBadge";
import ScanItemActions from "~/shared/inventory/components/scan-item-actions/ScanItemActions";
import {
  dealImageProps,
  type ReviewItem,
} from "../helper";

interface DesktopViewProps {
  items: ReviewItem[];
  loading?: boolean;
  loadedCount: number;
  showLoadMore?: boolean;
  loadingMore?: boolean;
  loadMore: () => void;
  totalCount?: number;
  onCreateProduct: (item: ReviewItem) => void;
  onSkSuggestions: (item: ReviewItem) => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
  onRemove: (item: ReviewItem) => void;
  removingKey?: string | null;
}

const headers = [
  { key: "product", label: "Item Name", width: "26%" },
  { key: "barcode", label: "Barcode", width: "13%" },
  { key: "mrp", label: "MRP", width: "8%" },
  { key: "date", label: "Date", width: "12%" },
  { key: "status", label: "Status", width: "15%" },
  { key: "actions", label: "", width: "26%" },
];

const DesktopView: React.FC<DesktopViewProps> = ({
  items,
  loading = false,
  loadedCount,
  showLoadMore = false,
  loadingMore = false,
  loadMore,
  totalCount = 0,
  onCreateProduct,
  onSkSuggestions,
  onImagePreview,
  onRemove,
  removingKey = null,
}) => {
  return (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-white">
      <AppTable fixedLayout>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {loading && items.length === 0 ? (
            <TableSkeletonLoader cols={headers.length} rows={10} />
          ) : items.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length}>
                <NoData />
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            items.map((item, index) => {
              const deal = item.deal;
              const removing = removingKey === (item.id || item.barcode);
              return (
                <AppTable.Row key={`${item.id || item.barcode}-${index}`}>
                  {/* Item Name & Image */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:gap-2.5">
                      <div className="tw:flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
                        {deal?.image ? (
                          <button
                            type="button"
                            onClick={() =>
                              onImagePreview?.(
                                deal?.images || (deal?.image ? [deal.image] : []),
                                deal?.image,
                                item.matchStatus === "FoundInAi",
                              )
                            }
                            className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
                          >
                            <ImgRender
                              {...dealImageProps(deal.image)}
                              alt={deal.title}
                              className="tw:max-h-12 tw:max-w-12 tw:object-contain"
                              useProxy={item.matchStatus === "FoundInAi"}
                            />
                          </button>
                        ) : (
                          <Box size={20} className="tw:text-gray-300" />
                        )}
                      </div>
                      <div className="tw:min-w-0">
                        <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-2 tw:leading-snug">
                          {deal?.title || (
                            <span className="tw:text-gray-400 tw:italic">
                              No match found
                            </span>
                          )}
                        </div>
                        {deal && (deal.dealId || deal.brandName) && (
                          <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-0.5 tw:flex-wrap">
                            {deal.dealId && (
                              <span className="tw:text-[10px] tw:font-mono tw:text-gray-500">
                                {deal.dealId}
                              </span>
                            )}
                            {deal.dealId && deal.brandName && (
                              <span className="tw:text-gray-300">·</span>
                            )}
                            {deal.brandName && (
                              <span className="tw:text-[10px] tw:font-medium tw:text-gray-600">
                                {deal.brandName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </AppTable.Cell>

                  {/* Barcode */}
                  <AppTable.Cell>
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-mono tw:font-medium tw:text-gray-800 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:px-1.5 tw:py-0.5">
                      <Barcode className="tw:w-3 tw:h-3 tw:text-gray-400" />
                      {item.barcode}
                    </span>
                  </AppTable.Cell>

                  {/* MRP */}
                  <AppTable.Cell>
                    {deal && deal.mrp > 0 ? (
                      <Amount
                        value={deal.mrp}
                        className="tw:text-sm tw:font-semibold tw:text-gray-900"
                      />
                    ) : (
                      <span className="tw:text-xs tw:text-gray-300">—</span>
                    )}
                  </AppTable.Cell>

                  {/* Date */}
                  <AppTable.Cell>
                    {item.createdAt ? (
                      <div className="tw:flex tw:flex-col">
                        <span className="tw:text-xs tw:font-medium tw:text-gray-900">
                          <DateFormat value={item.createdAt} formatStr="dd MMM yyyy" />
                        </span>
                        <span className="tw:text-[10px] tw:text-gray-500">
                          <DateFormat value={item.createdAt} formatStr="hh:mm a" />
                        </span>
                      </div>
                    ) : (
                      <span className="tw:text-xs tw:text-gray-300">—</span>
                    )}
                  </AppTable.Cell>

                  {/* Status Badge */}
                  <AppTable.Cell>
                    {item.status === "Requested" ? (
                      <div className="tw:flex tw:flex-col">
                        <span className="tw:text-xs tw:font-semibold tw:text-orange-600">
                          Sent for approval
                        </span>
                        <span className="tw:text-[10px] tw:text-gray-500">
                          SK catalog team is reviewing
                        </span>
                      </div>
                    ) : (
                      <MatchStatusBadge badge={item.badge} />
                    )}
                  </AppTable.Cell>

                  {/* Action Buttons */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:justify-end tw:gap-2">
                      {item.status === "Requested" ? null : (
                        <ScanItemActions
                          item={item}
                          onCreateProduct={onCreateProduct}
                          onSkSuggestions={onSkSuggestions}
                        />
                      )}
                      {item.status === "Requested" ? null : (
                        <button
                          type="button"
                          aria-label="Remove item"
                          disabled={removing}
                          onClick={() => onRemove(item)}
                          className="tw:inline-flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:shrink-0 tw:rounded-full tw:bg-red-50 tw:border tw:border-red-100 tw:text-red-600 tw:transition-colors active:tw:bg-red-100 hover:tw:bg-red-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-red-300 disabled:tw:opacity-50 disabled:tw:cursor-not-allowed tw:cursor-pointer"
                        >
                          {removing ? (
                            <Loader2 className="tw:w-3.5 tw:h-3.5 tw:animate-spin" />
                          ) : (
                            <Trash2 className="tw:w-3.5 tw:h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          )}
          {showLoadMore && !loading && items.length > 0 ? (
            <AppTable.Row>
              <AppTable.Cell colSpan={headers.length} className="tw:text-center tw:py-4">
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
    </div>
  );
};

export default DesktopView;
