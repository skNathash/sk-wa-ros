import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

import { useSidebar } from "~/components/ui/sidebar";
import useAppNav from "~/hooks/useAppNav";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import AiExtractedDetailsModal from "~/shared/catalog/modals/AiExtractedDetailsModal";
import BarcodeScanTabs from "~/shared/inventory/subscribe-scan/components/BarcodeScanTabs";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";

import CartStatusBar from "~/shared/inventory/subscribe-scan/components/CartStatusBar";
import EmptyState from "./components/EmptyState";
import ScanInput, { type ScanInputHandle } from "./components/ScanInput";
import ScanResults from "./components/ScanResults";
import StepTracker from "./components/StepTracker";
import type { MatchedDealData } from "./components/matched-deal/MatchedDeal";
import {
  formatAiSuggestions,
  withRelevance,
  type AiSuggestedProduct,
  type ScanPhase,
} from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/main" },
  },
  { label: "Barcode Scan" },
];

const isCanceled = (e: any) =>
  e?.name === "CanceledError" ||
  e?.name === "AbortError" ||
  e?.code === "ERR_CANCELED";

const BarcodeScan = () => {
  const [barcode, setBarcode] = useState("");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [lookedUpBarcode, setLookedUpBarcode] = useState<string | null>(null);
  const [matchedDeals, setMatchedDeals] = useState<MatchedDealData[]>([]);
  const [skSuggested, setSkSuggested] = useState<any[]>([]);
  const [aiSuggested, setAiSuggested] = useState<AiSuggestedProduct[]>([]);
  // "Create item" confirms the AI-extracted details in the AiExtractedDetailsModal,
  // which owns the create request itself (api mode).
  const [aiModal, setAiModal] = useState<{
    show: boolean;
    product: any;
    context: { barcode?: string };
  }>({ show: false, product: null, context: {} });
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string; useProxy?: boolean }>;
    initialImageId?: string;
  }>({ show: false, images: [] });

  const { show: showToast } = useAppToast();
  const { setOpen } = useSidebar();
  const appNav = useAppNav();
  const scanRef = useRef<ScanInputHandle>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);

  // Give the scan workspace full width on landing — the sidebar can still be
  // reopened any time via the panel icon in the AppHeader. Run once on mount:
  // setOpen's identity changes whenever the sidebar opens, so depending on it
  // would re-fire this and immediately slam the sidebar shut again.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (code: string) => {
      lookupAbortRef.current?.abort();
      const controller = new AbortController();
      lookupAbortRef.current = controller;

      setLookedUpBarcode(code);
      setMatchedDeals([]);
      setSkSuggested([]);
      setAiSuggested([]);
      setPhase("skSearching");

      try {
        // Phase 1: look for an exact match in the StoreKing catalog.
        const skRes: any = await InventorySubscribeService.aiSearchByBarcodes(
          { searchKeyword: code },
          { searchInSk: true },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;

        const matched = skRes?.data?.data?.matchedSkDeals || [];
        if (matched.length) {
          setMatchedDeals(
            InventorySubscribeService.formatDealResponse(matched),
          );
          setPhase("matched");
          return;
        }

        // Phase 2: nothing in the catalog — ask StoreKing AI.
        setPhase("aiSearching");
        const aiRes: any = await InventorySubscribeService.aiSearchByBarcodes(
          { searchKeyword: code },
          { searchInAi: true },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;

        const data = aiRes?.data?.data || {};
        const sk = withRelevance(
          InventorySubscribeService.formatDealResponse(
            data.skSuggestedDeals || [],
          ),
        );
        const ai = formatAiSuggestions(data.aiSuggestedDeals || []);
        setSkSuggested(sk);
        setAiSuggested(ai);
        setPhase(sk.length || ai.length ? "suggestions" : "notFound");
      } catch (e: any) {
        if (isCanceled(e) || controller.signal.aborted) return;
        showToast({
          msg: e?.response?.data?.message || "Failed to look up barcode",
          color: "error",
        });
        setPhase("idle");
        setLookedUpBarcode(null);
      }
    },
    [showToast],
  );

  const handleAdded = useCallback(() => {
    setBarcode("");
    scanRef.current?.focus();
  }, []);

  const handleScanNext = useCallback(() => {
    lookupAbortRef.current?.abort();
    setBarcode("");
    setPhase("idle");
    setLookedUpBarcode(null);
    setMatchedDeals([]);
    setSkSuggested([]);
    setAiSuggested([]);
    scanRef.current?.focus();
  }, []);

  const handleCreateFromAi = useCallback(
    (product: AiSuggestedProduct) => {
      setAiModal({
        show: true,
        // The modal reads the raw nested AI shape (applicableBrand, csaAttr,
        // highlights, …), so hand it the untouched extraction.
        product: product.raw,
        context: { barcode: lookedUpBarcode || undefined },
      });
    },
    [lookedUpBarcode],
  );

  const handleCreateManual = useCallback(() => {
    if (!lookedUpBarcode) return;
    // Send the seller to the full Add Product page, carrying the scanned
    // barcode (to prefill) and the page to return to after a successful create.
    appNav.to("/dashboard/inventory/subscribe/add-product", {
      barcode: lookedUpBarcode,
      from: encodeURIComponent("/dashboard/inventory/barcode-scan"),
      fromLabel: encodeURIComponent("Barcode Scan"),
    });
  }, [lookedUpBarcode, appNav]);

  const handleAiModalCallback = (params: { action: string; data?: any }) => {
    if (params.action === "success") {
      // The create request was sent — close and reset for the next scan.
      setAiModal({ show: false, product: null, context: {} });
      showToast({ msg: "Product sent for approval", color: "success" });
      handleScanNext();
      return;
    }
    if (params.action === "close") {
      setAiModal({ show: false, product: null, context: {} });
      scanRef.current?.focus();
    }
  };

  const handleImagePreview = useCallback((images: string[], initialImageId?: string, useProxy?: boolean) => {
    setImgPreviewModal({
      show: true,
      images: images.map((img) => ({ id: img, useProxy })),
      initialImageId,
    });
  }, []);

  return (
    <>
      <AppHeader title="Barcode Scan" />
      <div className="app-page tw:p-3 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          <PageDescription description="barcodeScan" />

          <BarcodeScanTabs activeTab="single" className="tw:mt-2" />

          {/* Stacked on mobile; sticky scan sidebar + results on desktop */}
          <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-3 tw:md:grid tw:md:grid-cols-[22rem_minmax(0,1fr)] tw:md:items-start">
            <aside className="tw:flex tw:flex-col tw:gap-3 tw:md:sticky tw:md:top-3">
              <StepTracker
                phase={phase}
                className="tw:rounded-xl tw:bg-white tw:border tw:border-gray-200 tw:px-4 tw:py-2.5"
              />

              <section className="tw:rounded-xl tw:border tw:border-blue-200 tw:bg-linear-to-br tw:from-blue-50 tw:to-white tw:p-3">
                <h2 className="tw:flex tw:items-baseline tw:flex-wrap tw:gap-x-1.5 tw:gap-y-0 tw:text-sm tw:font-bold tw:text-gray-900 tw:mb-2">
                  <Camera className="tw:w-4 tw:h-4 tw:text-blue-600 tw:self-center" />
                  Search a product
                  <span className="tw:text-xs tw:font-normal tw:text-gray-500">
                    by name, model or barcode
                  </span>
                </h2>
                <ScanInput
                  ref={scanRef}
                  value={barcode}
                  onChange={setBarcode}
                  onSubmit={handleSubmit}
                  isLoading={phase === "skSearching" || phase === "aiSearching"}
                />
              </section>

              <CartStatusBar />

              {/* Hidden until a real "how it works" video is ready — the link
                  currently points at youtube.com with no actual walkthrough. */}
              {/* <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="tw:flex tw:items-center tw:gap-2 tw:rounded-xl tw:border tw:border-indigo-100 tw:bg-linear-to-r tw:from-indigo-50 tw:to-white tw:px-3 tw:py-2 tw:hover:bg-indigo-50 tw:transition-colors"
              >
                <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-indigo-600 tw:text-white tw:shrink-0">
                  <PlayCircle className="tw:w-4 tw:h-4" />
                </div>
                <div className="tw:flex tw:flex-col tw:min-w-0 tw:flex-1">
                  <span className="tw:text-xs tw:font-semibold tw:text-gray-900">
                    New here? Watch how it works
                  </span>
                  <span className="tw:text-[11px] tw:text-gray-600 tw:truncate">
                    1-minute video on barcode scanning
                  </span>
                </div>
              </a> */}
            </aside>

            <main className="tw:min-w-0">
              {phase === "idle" ? (
                <EmptyState />
              ) : (
                <ScanResults
                  phase={phase}
                  lookedUpBarcode={lookedUpBarcode}
                  matchedDeals={matchedDeals}
                  skSuggested={skSuggested}
                  aiSuggested={aiSuggested}
                  onAdded={handleAdded}
                  onScanNext={handleScanNext}
                  onCreateFromAi={handleCreateFromAi}
                  onCreateManual={handleCreateManual}
                  onImagePreview={handleImagePreview}
                />
              )}
            </main>
          </div>

          <div className="tw:h-24" />
        </div>
      </div>

      <AiExtractedDetailsModal
        show={aiModal.show}
        product={aiModal.product}
        mode="api"
        apiType="single"
        apiContext={aiModal.context}
        callback={handleAiModalCallback}
      />

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={() => setImgPreviewModal({ show: false, images: [] })}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </>
  );
};

export default BarcodeScan;
