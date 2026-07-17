import React from "react";
import { Barcode, Box, Trash2 } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppTable from "~/components/core/table/AppTable";
import TableHeader from "~/components/core/table/TableHeader";
import ImgRender from "~/components/core/img/ImgRender";
import MatchingBadge from "./MatchingBadge";
import MatchStatusBadge from "~/shared/inventory/subscribe-scan/components/MatchStatusBadge";
import ScanItemActions from "~/shared/inventory/components/scan-item-actions/ScanItemActions";
import {
  dealImageProps,
  type ReviewItem,
} from "../../helper";

interface ReviewViewProps {
  items: ReviewItem[];
  /** Barcodes whose remove request is in flight. */
  removing?: Set<string>;
  onSkSuggestions: (item: ReviewItem) => void;
  onCreateProduct: (item: ReviewItem) => void;
  onRemove: (barcode: string) => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}

const headers = [
  { key: "product", label: "Item Name", width: "40%" },
  { key: "barcode", label: "Barcode" },
  { key: "mrp", label: "MRP" },
  { key: "qty", label: "Qty" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

/** Shimmer placeholder row shown while a scanned barcode is still being matched. */
const PendingRow: React.FC<{
  barcode: string;
  removing?: boolean;
  onRemove: (barcode: string) => void;
}> = ({ barcode, removing, onRemove }) => (
  <AppTable.Row>
    <AppTable.Cell>
      <div className="tw:flex tw:items-center tw:gap-2.5">
        <div className="tw:w-12 tw:h-12 tw:rounded-lg skeleton-loader tw:shrink-0" />
        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:h-3.5 tw:w-3/5 tw:rounded skeleton-loader tw:mb-2" />
          <div className="tw:h-3 tw:w-2/5 tw:rounded skeleton-loader" />
        </div>
      </div>
    </AppTable.Cell>
    <AppTable.Cell>
      <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-mono tw:font-medium tw:text-gray-800 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:px-1.5 tw:py-0.5">
        <Barcode className="tw:w-3 tw:h-3 tw:text-gray-400" />
        {barcode}
      </span>
    </AppTable.Cell>
    <AppTable.Cell>
      <div className="tw:h-4 tw:w-12 tw:rounded skeleton-loader" />
    </AppTable.Cell>
    <AppTable.Cell>
      <div className="tw:h-4 tw:w-8 tw:rounded skeleton-loader" />
    </AppTable.Cell>
    <AppTable.Cell>
      <MatchingBadge />
    </AppTable.Cell>
    <AppTable.Cell>
      <div className="tw:flex tw:justify-end">
        <AppButton
          fill="clear"
          color="danger"
          size="small"
          title="Remove"
          className="tw:text-gray-400 tw:hover:text-red-600 tw:hover:bg-red-50"
          isLoading={removing}
          onClick={() => onRemove(barcode)}
        >
          <Trash2 className="tw:w-3.5 tw:h-3.5" />
        </AppButton>
      </div>
    </AppTable.Cell>
  </AppTable.Row>
);

const DesktopView: React.FC<ReviewViewProps> = ({
  items,
  removing,
  onSkSuggestions,
  onCreateProduct,
  onRemove,
  onImagePreview,
}) => {
  return (
    <div className="tw:rounded-xl tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-white">
      <AppTable>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {items.map((item) => {
            if (item.matchStatus === "Pending") {
              return (
                <PendingRow
                  key={item.barcode}
                  barcode={item.barcode}
                  removing={removing?.has(item.barcode)}
                  onRemove={onRemove}
                />
              );
            }
            const deal = item.deal;
            return (
              <AppTable.Row key={item.barcode}>
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
                <AppTable.Cell>
                  <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-mono tw:font-medium tw:text-gray-800 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded tw:px-1.5 tw:py-0.5">
                    <Barcode className="tw:w-3 tw:h-3 tw:text-gray-400" />
                    {item.barcode}
                  </span>
                </AppTable.Cell>
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
                <AppTable.Cell>
                  {item.qty > 0 ? (
                    <span className="tw:inline-flex tw:items-center tw:text-[11px] tw:font-medium tw:text-gray-600 tw:bg-gray-100 tw:rounded tw:px-1.5 tw:py-0.5">
                      {item.qty}
                    </span>
                  ) : (
                    <span className="tw:text-xs tw:text-gray-300">—</span>
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  {item.status === "Requested" ? (
                    <div className="tw:flex tw:flex-col">
                      <span className="tw:text-xs tw:font-semibold tw:text-orange-600">
                        Already requested
                      </span>
                      <span className="tw:text-[10px] tw:text-gray-500">
                        Awaiting SK catalog approval
                      </span>
                    </div>
                  ) : item.deal?.isSubscribed ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-semibold tw:rounded-full tw:px-2 tw:py-0.5 tw:text-gray-600 tw:bg-gray-100">
                      <span className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-gray-400" />
                      Already Subscribed
                    </span>
                  ) : (
                    <MatchStatusBadge badge={item.badge} />
                  )}
                </AppTable.Cell>
                <AppTable.Cell>
                  <div className="tw:flex tw:items-center tw:gap-2 tw:justify-end tw:flex-wrap">
                    {item.status !== "Requested" && (
                      <ScanItemActions
                        item={item}
                        onCreateProduct={onCreateProduct}
                        onSkSuggestions={onSkSuggestions}
                      />
                    )}
                    <AppButton
                      fill="clear"
                      color="danger"
                      size="small"
                      title="Remove"
                      className="tw:text-gray-400 tw:hover:text-red-600 tw:hover:bg-red-50"
                      isLoading={removing?.has(item.barcode)}
                      onClick={() => onRemove(item.barcode)}
                    >
                      <Trash2 className="tw:w-3.5 tw:h-3.5" />
                    </AppButton>
                  </div>
                </AppTable.Cell>
              </AppTable.Row>
            );
          })}
        </AppTable.Body>
      </AppTable>
    </div>
  );
};

export default DesktopView;
