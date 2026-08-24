import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Box,
  CheckCircle2,
  Pencil,
  Sparkles,
  Store,
} from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import ImgRender from "~/components/core/img/ImgRender";
import { dealImageProps, type ReviewItem } from "../helper";

interface Props {
  show: boolean;
  /** FoundInSk rows that will be subscribed in one call. */
  subscribableItems: ReviewItem[];
  /** FoundInAi / NotFound rows the user can send for creation. */
  creatableItems: ReviewItem[];
  /** True while StoreKing AI is still resolving some barcodes. */
  aiPending: boolean;
  /** How many barcodes are still being matched (only set when aiPending). */
  pendingCount: number;
  /** Disables the actions while the subscribe/create requests run. */
  loading: boolean;
  /** Barcodes the user has filled in details for — creatable even with no AI match. */
  detailsAdded: Set<string>;
  /** Open AddProductModal to review/edit a single item before creating it. */
  onEdit: (item: ReviewItem) => void;
  /** Subscribe the FoundInSk items and create the selected barcodes. */
  onConfirm: (selectedBarcodes: string[]) => void;
  onClose: () => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}

/**
 * Summary shown when the user taps Subscribe. It states plainly how many
 * products are subscribed immediately (FoundInSk) and lets the user pick which
 * of the not-in-catalog items to send for creation in the same step. Rows that
 * carry AI-extracted details can be bulk-created with those defaults; rows with
 * no match must be opened via Edit so the user can fill in the details first.
 */
const SubscribeSummaryModal: React.FC<Props> = ({
  show,
  subscribableItems,
  creatableItems,
  aiPending,
  pendingCount,
  loading,
  detailsAdded,
  onEdit,
  onConfirm,
  onClose,
  onImagePreview,
}) => {
  // Rows ready to create — they either carry AI-extracted defaults or the user
  // has filled in details for them — vs. rows that still need details added.
  const { withAi, needsDetails } = useMemo(() => {
    const withAi: ReviewItem[] = [];
    const needsDetails: ReviewItem[] = [];
    for (const item of creatableItems) {
      if (item.deal?.title || detailsAdded.has(item.barcode)) withAi.push(item);
      else needsDetails.push(item);
    }
    return { withAi, needsDetails };
  }, [creatableItems, detailsAdded]);

  // Selected barcodes to create — only AI-backed rows are selectable; they
  // start fully selected so "create everything" is the one-tap default.
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (show) setSelected(new Set(withAi.map((i) => i.barcode)));
    // Re-seed whenever the set of AI-creatable barcodes changes (e.g. a row was
    // edited+created and dropped out of the list).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, withAi.map((i) => i.barcode).join("|")]);

  const toggle = (barcode: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(barcode)) next.delete(barcode);
      else next.add(barcode);
      return next;
    });

  const allSelected = withAi.length > 0 && selected.size === withAi.length;
  const toggleAll = () =>
    setSelected(
      allSelected ? new Set() : new Set(withAi.map((i) => i.barcode)),
    );

  const subscribeCount = subscribableItems.length;
  const selectedCount = selected.size;

  const confirmLabel =
    subscribeCount > 0 && selectedCount > 0
      ? `Subscribe ${subscribeCount} · Create ${selectedCount}`
      : subscribeCount > 0
        ? `Subscribe ${subscribeCount}`
        : `Create ${selectedCount}`;

  return (
    <AppModal show={show} callback={onClose} isAutoHeight>
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-bold">Review before subscribing</div>
        <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
          Here's what happens when you continue.
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[65vh]">
        {/* Will be subscribed on continue */}
        {subscribeCount > 0 && (
          <div className="tw:flex tw:items-start tw:gap-2.5 tw:rounded-xl tw:border tw:border-emerald-100 tw:bg-emerald-50 tw:px-3.5 tw:py-3">
            <Store className="tw:w-5 tw:h-5 tw:shrink-0 tw:text-emerald-500 tw:mt-0.5" />
            <div className="tw:min-w-0">
              <div className="tw:text-sm tw:font-semibold tw:text-emerald-800">
                {subscribeCount} {subscribeCount === 1 ? "product" : "products"}{" "}
                will be added to your subscription cart
              </div>
              <div className="tw:text-xs tw:text-emerald-700 tw:mt-0.5">
                Found in the StoreKing catalog — subscribed when you continue.
              </div>
            </div>
          </div>
        )}

        {aiPending && (
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-2 tw:text-xs tw:text-violet-700">
            <span className="tw:w-3.5 tw:h-3.5 tw:shrink-0 tw:rounded-full tw:border-2 tw:border-violet-500 tw:border-t-transparent tw:animate-spin" />
            {pendingCount} still matching — they won't be included if you
            continue now.
          </div>
        )}

        {/* Not in catalog — pick which to create */}
        {creatableItems.length > 0 && (
          <div className="tw:mt-4">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                {creatableItems.length}{" "}
                {creatableItems.length === 1 ? "item isn't" : "items aren't"} in
                your catalog yet
              </div>
              {withAi.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="tw:text-[11px] tw:font-medium tw:text-blue-600 tw:px-1.5 tw:py-0.5 tw:rounded hover:tw:bg-blue-50 tw:cursor-pointer"
                >
                  {allSelected ? "Clear all" : "Select all"}
                </button>
              )}
            </div>

            <ul className="tw:flex tw:flex-col tw:gap-2">
              {withAi.map((item) => {
                const checked = selected.has(item.barcode);
                const edited = detailsAdded.has(item.barcode);
                return (
                  <li
                    key={item.barcode}
                    className={`tw:flex tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:p-2.5 tw:transition-colors ${
                      checked
                        ? "tw:border-blue-200 tw:bg-blue-50/40"
                        : "tw:border-gray-200 tw:bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(item.barcode)}
                      className="tw:w-4 tw:h-4 tw:shrink-0 tw:accent-blue-600 tw:cursor-pointer"
                    />
                    {item.deal?.image ? (
                      <button
                        type="button"
                        onClick={() =>
                          onImagePreview?.(
                            item.deal?.images || (item.deal?.image ? [item.deal.image] : []),
                            item.deal?.image,
                            item.matchStatus === "FoundInAi",
                          )
                        }
                        className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
                      >
                        <ImgRender
                          {...dealImageProps(item.deal.image)}
                          alt={item.deal.title}
                          className="tw:max-h-11 tw:max-w-11 tw:object-contain"
                          useProxy={item.matchStatus === "FoundInAi"}
                        />
                      </button>
                    ) : (
                      <div className="tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
                        <Box size={18} className="tw:text-gray-300" />
                      </div>
                    )}
                    <div className="tw:flex-1 tw:min-w-0">
                      <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:line-clamp-1">
                        {item.deal?.title || "Product details added"}
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1.5 tw:mt-0.5">
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-mono tw:text-gray-500">
                          <Barcode className="tw:w-3 tw:h-3" />
                          {item.barcode}
                        </span>
                        {item.deal && item.deal.mrp > 0 && (
                          <>
                            <span className="tw:text-gray-300">·</span>
                            <Amount
                              value={item.deal.mrp}
                              className="tw:text-[10px] tw:font-semibold tw:text-gray-600"
                            />
                          </>
                        )}
                        {edited ? (
                          <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:font-medium tw:text-emerald-600">
                            <CheckCircle2 className="tw:w-3 tw:h-3" />
                            Details added
                          </span>
                        ) : (
                          <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:font-medium tw:text-blue-600">
                            <Sparkles className="tw:w-3 tw:h-3" />
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                    <AppButton
                      fill="clear"
                      color="light"
                      size="small"
                      className="tw:shrink-0 tw:text-gray-500"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="tw:w-3.5 tw:h-3.5 tw:mr-1" />
                      Edit
                    </AppButton>
                  </li>
                );
              })}

              {needsDetails.map((item) => (
                <li
                  key={item.barcode}
                  className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:border-dashed tw:border-gray-200 tw:bg-white tw:p-2.5"
                >
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:rounded-lg tw:bg-gray-50 tw:border tw:border-gray-100 tw:shrink-0">
                    <Box size={18} className="tw:text-gray-300" />
                  </div>
                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:text-sm tw:font-medium tw:text-gray-400 tw:italic">
                      No match — create item
                    </div>
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:mt-0.5 tw:text-[10px] tw:font-mono tw:text-gray-500">
                      <Barcode className="tw:w-3 tw:h-3" />
                      {item.barcode}
                    </span>
                  </div>
                  <AppButton
                    fill="outline"
                    size="small"
                    className="tw:shrink-0"
                    onClick={() => onEdit(item)}
                  >
                    Create Item
                  </AppButton>
                </li>
              ))}
            </ul>

            <div className="tw:flex tw:items-start tw:gap-1.5 tw:mt-2 tw:text-[11px] tw:text-gray-500">
              <CheckCircle2 className="tw:w-3.5 tw:h-3.5 tw:shrink-0 tw:mt-0.5 tw:text-gray-400" />
              Created products go to the StoreKing catalog team for
              verification.
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:w-full">
          <AppButton
            color="light"
            fill="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </AppButton>
          <AppButton
            onClick={() => onConfirm(Array.from(selected))}
            disabled={loading || (subscribeCount === 0 && selectedCount === 0)}
            isLoading={loading}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SubscribeSummaryModal;
