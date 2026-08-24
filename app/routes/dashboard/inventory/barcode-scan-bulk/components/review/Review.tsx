import { useEffect, useMemo, useState } from "react";
import { PackageSearch, AlertCircle } from "lucide-react";

import useScreenView from "~/hooks/useScreenView";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import BarcodeScanBulkService from "~/services/BarcodeScanBulkService";
import useTheme from "~/hooks/useTheme";
import ScanResolveSummary from "~/shared/inventory/subscribe-scan/components/ScanResolveSummary";
import AiExtractedDetailsModal from "~/shared/catalog/modals/AiExtractedDetailsModal";
import SkSuggestionsModal from "~/shared/inventory/subscribe-scan/modals/SkSuggestionsModal";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import ReviewFilterChips, {
  getReviewChips,
  matchesReviewFilter,
  type ReviewFilter,
} from "./ReviewFilterChips";
import { AiFetchingBanner, ReviewSummary } from "./Summary";
import type { ReviewItem } from "../../helper";

interface ReviewProps {
  /** Batch the rows belong to — needed to delete an item server-side. */
  batchId: string;
  /** Review rows owned by the parent — seeded, then enriched by polling. */
  items: ReviewItem[];
  /** True only while the first fetch is in flight with no rows to show yet. */
  loading: boolean;
  error: string | null;
  onRemoveItem: (barcode: string) => void;
  /** Mark a row as requested after its create request is sent. */
  onItemRequested?: (id: string) => void;
  onImagePreview?: (
    images: string[],
    initialImageId?: string,
    useProxy?: boolean,
  ) => void;
}

function ReviewSkeleton() {
  return (
    <div className="tw:flex tw:flex-col tw:gap-3 tw:py-2" aria-busy="true">
      <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:text-gray-500">
        <span className="tw:inline-block tw:w-4 tw:h-4 tw:rounded-full tw:border-2 tw:border-blue-500 tw:border-t-transparent tw:animate-spin" />
        Matching scanned barcodes…
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="tw:flex tw:items-center tw:gap-3 tw:p-3 tw:rounded-lg tw:border tw:border-gray-100 tw:bg-white"
        >
          <div className="tw:w-12 tw:h-12 tw:rounded tw:bg-gray-200 tw:animate-pulse tw:shrink-0" />
          <div className="tw:flex-1 tw:min-w-0 tw:animate-pulse">
            <div className="tw:h-3.5 tw:bg-gray-200 tw:rounded tw:w-3/5 tw:mb-2" />
            <div className="tw:h-3 tw:bg-gray-100 tw:rounded tw:w-2/5" />
          </div>
          <div className="tw:h-7 tw:w-16 tw:rounded tw:bg-gray-200 tw:animate-pulse tw:shrink-0" />
        </div>
      ))}
    </div>
  );
}

export default function Review({
  batchId,
  items,
  loading,
  error,
  onRemoveItem,
  onItemRequested,
  onImagePreview,
}: ReviewProps) {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const isTheme2 = useTheme() === "theme-2";
  const { show: showToast } = useAppToast();

  // Barcodes whose delete request is in flight — keeps their remove button
  // spinning and guards against a double-tap firing the DELETE twice.
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  // Source filter for the list — the page footer owns the subscribe action, so
  // narrowing the view here never changes what gets submitted.
  const [filter, setFilter] = useState<ReviewFilter>("all");

  // Modal state — set when a row's action button asks us to open one. Pure UI,
  // so it stays local; the row data still flows down from the parent.
  const [skModal, setSkModal] = useState<{
    show: boolean;
    item: ReviewItem | null;
  }>({ show: false, item: null });

  // "Create New" confirms the AI-extracted details in the AiExtractedDetailsModal,
  // which owns the create request itself (api mode).
  const [aiModal, setAiModal] = useState<{
    show: boolean;
    product: any;
    context: { barcode?: string; scanItemId?: string };
    itemId?: string;
  }>({ show: false, product: null, context: {} });

  // Delete the item server-side first; only tell the parent to drop the row
  // once the API confirms, so the list never diverges from the batch.
  const handleRemove = async (barcode: string) => {
    if (removing.has(barcode)) return;
    setRemoving((prev) => new Set(prev).add(barcode));
    try {
      const res = await InventorySubscribeService.deleteAiBulkBarcodeScanItem(
        batchId,
        barcode,
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        onRemoveItem(barcode);
      } else {
        showToast({
          msg: res.data?.message || "Failed to remove item",
          color: "error",
        });
      }
    } catch (e: any) {
      showToast({
        msg: e?.response?.data?.message || "Failed to remove item",
        color: "error",
      });
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(barcode);
        return next;
      });
    }
  };

  const handleSkSuggestions = (item: ReviewItem) => {
    setSkModal({ show: true, item });
  };

  // "Create New" (AI-found rows) confirm the AI-extracted details in an inline
  // modal that owns the bulk create request. "Add Details" (not-found rows) have
  // no details to confirm, so they open the full Add Product page prefilled from
  // the row. `bulk=1` tells that page to create via the bulk import API and
  // `scanItemId` links the created product back to this scanned item. `from`
  // carries this scan page (with its batchId, in review mode) so the page sends
  // the seller straight back here once the product request is sent.
  const handleCreateProduct = (item: ReviewItem) => {
    if (item.matchStatus === "FoundInAi") {
      setAiModal({
        show: true,
        product: BarcodeScanBulkService.dealToAiProduct(item.deal),
        context: { barcode: item.barcode, scanItemId: item.id },
        itemId: item.id,
      });
      return;
    }
    const backToScan = `/dashboard/inventory/barcode-scan-bulk?batchId=${batchId}&review=1`;
    appNav.to("/dashboard/inventory/subscribe/add-product", {
      barcode: item.barcode,
      name: item.deal?.title || "",
      mrp: item.deal?.mrp || "",
      images: (item.deal?.images || []).join(","),
      scanItemId: item.id,
      bulk: "1",
      from: backToScan,
      fromLabel: "Barcode Scan",
    });
  };

  const handleAiModalCallback = (r: { action: string; data?: any }) => {
    if (r?.action === "success") {
      // Flag the row as requested so its action becomes "Sent for approval".
      if (aiModal.itemId) onItemRequested?.(aiModal.itemId);
      showToast({ msg: "Product sent for approval", color: "success" });
    }
    setAiModal({ show: false, product: null, context: {} });
  };

  const chips = useMemo(() => getReviewChips(items), [items]);
  const visibleItems = useMemo(
    () => items.filter((i) => matchesReviewFilter(i, filter)),
    [items, filter],
  );

  // A bucket can empty out while it's selected (its last row was removed or
  // created) — fall back to All so the list never reads as empty by accident.
  useEffect(() => {
    if (filter !== "all" && !chips.find((c) => c.key === filter)?.count) {
      setFilter("all");
    }
  }, [chips, filter]);

  const viewProps = {
    items: visibleItems,
    removing,
    onSkSuggestions: handleSkSuggestions,
    onCreateProduct: handleCreateProduct,
    onRemove: handleRemove,
  };

  // StoreKing AI is still resolving some barcodes while their matchStatus is Pending.
  const aiPending = items.some((i) => i.matchStatus === "Pending");
  // Progress for the fetching banner — how many barcodes are already resolved.
  const resolvedCount = items.filter((i) => i.matchStatus !== "Pending").length;

  // Same tallies as the light ReviewSummary, shaped for the shared resolve
  // panel. Both legs have already reported by the time this renders (it waits
  // for aiPending to clear), so neither source row is live.
  const resolveSummary = useMemo(() => {
    const resolved = items.filter((i) => i.matchStatus !== "Pending");
    const sk = resolved.filter((i) => i.matchStatus === "FoundInSk").length;
    const ai = resolved.filter((i) => i.matchStatus === "FoundInAi").length;
    const notFound = resolved.filter(
      (i) => i.matchStatus === "NotFound",
    ).length;
    const total = resolved.length;
    return {
      eyebrow: "Step 3 · Review",
      title: `${total} ${total === 1 ? "barcode" : "barcodes"} resolved`,
      sk: { count: sk },
      ai: { count: ai },
      notFound,
      yours: resolved.filter((i) => i.deal?.isSubscribed).length,
    };
  }, [items]);

  // While the first fetch is in flight we own the whole frame — no footer, so
  // the user can't act on a half-loaded list.
  if (loading && items.length === 0) {
    return <ReviewSkeleton />;
  }

  return (
    <>
      {/* While AI is still resolving, show only the slim progress bar — the
          full tally waits until every barcode is done so its counts always sum
          to the total instead of flashing a misleading partial breakdown. */}
      {aiPending ? (
        <div className="tw:mb-3">
          <AiFetchingBanner resolved={resolvedCount} total={items.length} />
        </div>
      ) : (
        items.length > 0 && (
          <div className="tw:mb-3">
            {isTheme2 ? (
              <ScanResolveSummary {...resolveSummary} />
            ) : (
              <ReviewSummary items={items} />
            )}
          </div>
        )
      )}

      {error && items.length === 0 ? (
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:py-12 tw:px-4">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-red-50 tw:mb-3">
            <AlertCircle className="tw:w-6 tw:h-6 tw:text-red-500" />
          </div>
          <div className="tw:text-sm tw:font-medium tw:text-gray-800">
            Couldn't load review
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:max-w-xs">
            {error}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:py-12 tw:px-4">
          <div className="tw:flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-gray-100 tw:mb-3">
            <PackageSearch className="tw:w-6 tw:h-6 tw:text-gray-400" />
          </div>
          <div className="tw:text-sm tw:font-medium tw:text-gray-800">
            Nothing to review
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:max-w-xs">
            None of the scanned barcodes matched a product. Head back to add or
            rescan items.
          </div>
        </div>
      ) : (
        <>
          {/* Source chips — All Items / SK Library / SK AI / Not found / My
              Items, same set the single-scan results table offers. */}
          <ReviewFilterChips
            chips={chips}
            value={filter}
            onChange={setFilter}
            className="tw:mb-2 tw:px-0!"
          />
          {isMobile ? (
            <MobileView {...viewProps} onImagePreview={onImagePreview} />
          ) : (
            <DesktopView {...viewProps} onImagePreview={onImagePreview} />
          )}
        </>
      )}

      <SkSuggestionsModal
        show={skModal.show}
        barcode={skModal.item?.barcode || ""}
        items={skModal.item?.skSuggestions || []}
        callback={() => setSkModal({ show: false, item: null })}
        showViewCart
        continueLabel="Continue Review"
        onImagePreview={onImagePreview}
      />

      <AiExtractedDetailsModal
        show={aiModal.show}
        product={aiModal.product}
        mode="api"
        apiType="bulk"
        apiContext={aiModal.context}
        callback={handleAiModalCallback}
      />
    </>
  );
}
