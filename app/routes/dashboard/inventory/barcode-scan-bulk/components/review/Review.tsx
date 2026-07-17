import { useMemo, useState } from "react";
import { PackageSearch, ScanLine, ArrowRight, AlertCircle } from "lucide-react";

import useScreenView from "~/hooks/useScreenView";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import BarcodeScanBulkService from "~/services/BarcodeScanBulkService";
import AppButton from "~/components/core/button/AppButton";
import AiExtractedDetailsModal from "~/shared/catalog/modals/AiExtractedDetailsModal";
import SkSuggestionsModal from "~/shared/inventory/subscribe-scan/modals/SkSuggestionsModal";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
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
  onBackToScan: () => void;
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
  onBackToScan,
  onImagePreview,
}: ReviewProps) {
  const appNav = useAppNav();
  const { isMobile } = useScreenView();
  const { show: showToast } = useAppToast();

  // Barcodes whose delete request is in flight — keeps their remove button
  // spinning and guards against a double-tap firing the DELETE twice.
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  // Bulk-subscribe state for the footer action.
  const [subscribing, setSubscribing] = useState(false);

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

  // FoundInSk rows carry a real catalog deal we can subscribe to in one call.
  const subscribableItems = useMemo(
    () =>
      items.filter(
        (i) => i.matchStatus === "FoundInSk" && i.deal && !i.deal.isSubscribed,
      ),
    [items],
  );

  // AI-found / Not-found rows the user can send for creation from the summary.
  // Already-requested rows are excluded — they've been sent to the catalog team,
  // so counting them again would inflate the "added to pending" tally and the
  // cart's newPending deep-link.
  const creatableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          (i.matchStatus === "FoundInAi" || i.matchStatus === "NotFound") &&
          i.status !== "Requested",
      ),
    [items],
  );

  // Head to the subscription cart after a subscribe. `extraParams` lets the
  // caller deep-link a specific tab (e.g. the "Create Pending" list).
  const goToCart = (extraParams?: Record<string, string>) => {
    appNav.to("/dashboard/inventory/subscribe/cart", {
      from: "barcode-scan-bulk",
      newPending: String(creatableItems.length),
      ...extraParams,
    });
  };

  // Tapping Subscribe bulk-subscribes the FoundInSk rows in one call and then
  // redirects to the cart — no intermediate selection step. Not-in-catalog rows
  // aren't created here; they surface in the cart's "Create Pending" tab, the
  // single place creation now happens.
  const handleSubscribe = async () => {
    const allSubscribed =
      items.length > 0 && items.every((i) => i.deal?.isSubscribed);
    if (allSubscribed) {
      showToast({
        msg: "All items in this batch are already subscribed",
        color: "warning",
      });
      return;
    }
    if (!subscribableItems.length && !creatableItems.length) {
      showToast({ msg: "Nothing to subscribe", color: "error" });
      return;
    }
    setSubscribing(true);
    try {
      // Subscribe the FoundInSk rows in one call — only when there are any, so
      // a create-only batch doesn't hit the subscribe endpoint with an empty
      // products list.
      let subscribedCount = 0;
      if (subscribableItems.length) {
        const products = subscribableItems.map((item) => {
          const deal = item.deal!;
          return {
            dealId: deal.id,
            dealRefId: deal.dealId,
            name: deal.title,
            quantity: item.qty || 0,
            mrp: deal.mrp,
            price: deal.price || deal.mrp,
            images: deal.images || [],
            barcodes: deal.barcode ? [deal.barcode] : [item.barcode],
          };
        });
        const res = await InventorySubscribeService.bulkSubscription(products);
        if (res.statusCode < 200 || res.statusCode >= 300) {
          showToast({
            msg: res.data?.message || "Failed to subscribe products",
            color: "error",
          });
          return;
        }
        subscribedCount = products.length;
      }

      // Mark the batch completed now that its matched items have been
      // subscribed. Best-effort — a failure here shouldn't block the redirect
      // since the products are already subscribed.
      if (batchId) {
        InventorySubscribeService.submitAiBulkBarcodeScanBatch(batchId).catch(
          () => {},
        );
      }

      // Confirm the subscribe before the redirect so landing on the cart never
      // feels like a silent teleport. Use specific messages depending on whether
      // we subscribed catalog items, sent items to pending creation, or both.
      if (subscribedCount) {
        if (creatableItems.length > 0) {
          showToast({
            msg: `${subscribedCount} product${
              subscribedCount > 1 ? "s" : ""
            } subscribed & ${creatableItems.length} product${
              creatableItems.length > 1 ? "s" : ""
            } added to pending — taking you to your subscription cart`,
            color: "success",
          });
        } else {
          showToast({
            msg: `${subscribedCount} product${
              subscribedCount > 1 ? "s" : ""
            } subscribed — taking you to your subscription cart`,
            color: "success",
          });
        }
      } else if (creatableItems.length > 0) {
        showToast({
          msg: `${creatableItems.length} new product${
            creatableItems.length > 1 ? "s" : ""
          } found. Tap Create New to add ${
            creatableItems.length > 1 ? "them" : "it"
          } to your store.`,
          color: "success",
        });
      }

      // Go straight to the subscription cart. When nothing was subscribed (only
      // creatable items), deep-link the "Create Pending" tab so the user lands
      // on the list they need to act on; otherwise show the subscribed items.
      goToCart(subscribedCount ? undefined : { activeTab: "pending" });
    } catch (e: any) {
      showToast({
        msg: e?.response?.data?.message || "Failed to subscribe products",
        color: "error",
      });
    } finally {
      setSubscribing(false);
    }
  };

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

  const viewProps = {
    items,
    removing,
    onSkSuggestions: handleSkSuggestions,
    onCreateProduct: handleCreateProduct,
    onRemove: handleRemove,
  };

  // StoreKing AI is still resolving some barcodes while their matchStatus is Pending.
  const aiPending = items.some((i) => i.matchStatus === "Pending");
  // Progress for the fetching banner — how many barcodes are already resolved.
  const resolvedCount = items.filter((i) => i.matchStatus !== "Pending").length;

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
            <ReviewSummary items={items} />
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
      ) : isMobile ? (
        <MobileView {...viewProps} onImagePreview={onImagePreview} />
      ) : (
        <DesktopView {...viewProps} onImagePreview={onImagePreview} />
      )}

      <div className="tw:sticky tw:bottom-0 tw:z-10 tw:mt-4 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:flex-wrap tw:bg-white tw:py-3 tw:border-t tw:border-gray-200">
        <AppButton color="light" fill="outline" onClick={onBackToScan}>
          <ScanLine className="tw:w-4 tw:h-4 tw:mr-1" />
          Back to scan
        </AppButton>
        <AppButton
          onClick={handleSubscribe}
          disabled={
            subscribing ||
            (subscribableItems.length === 0 && creatableItems.length === 0)
          }
          isLoading={subscribing}
        >
          {/* When nothing maps to the SK catalog the action only routes the user
              to the cart to create the AI-found rows — so the label sets that
              expectation instead of promising a subscribe that won't happen. */}
          {subscribableItems.length > 0 ? "Subscribe" : "Create products"}
          <ArrowRight className="tw:w-4 tw:h-4 tw:ml-1" />
        </AppButton>
      </div>

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
