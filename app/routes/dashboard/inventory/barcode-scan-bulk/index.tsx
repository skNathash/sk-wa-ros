import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useSearchParams } from "react-router";

import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import useScreenView from "~/hooks/useScreenView";
import MiscService from "~/services/MiscService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import Review from "./components/review/Review";
import ScannedBarcodeGrid from "~/shared/inventory/components/scanned-barcode-card/ScannedBarcodeGrid";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import ScanQtyModal from "./modals/ScanQtyModal";
import BarcodeScanComp from "~/components/core/barcode-scan/BarcodeScan";
import { type StepData } from "~/components/core/steps/AppSteps";
import BarcodeScanTabs from "~/shared/inventory/subscribe-scan/components/BarcodeScanTabs";
import { useSidebar } from "~/components/ui/sidebar";
import {
  getData,
  seedReviewItems,
  POLL_INTERVAL_MS,
  type ReviewItem,
} from "./helper";
import {
  ScanLine,
  ArrowRight,
  CornerDownLeft,
  PackageSearch,
  ListChecks,
  Search,
  Keyboard,
} from "lucide-react";
import CartStatusBar from "~/shared/inventory/subscribe-scan/components/CartStatusBar";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SubscribeSidePane from "~/shared/inventory/components/subscribe-side-pane/SubscribeSidePane";

const steps: StepData[] = [
  { key: "scan", title: "Scan barcode", icon: "scan-line" },
  { key: "qty", title: "Set quantity", icon: "hash" },
  { key: "review", title: "Review & submit", icon: "list-checks" },
];

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/main" },
  },
  { label: "Barcode Scan" },
];

type ScannedItem = {
  barcode: string;
  qty: number;
};

const normalizeBarcode = (code: string) =>
  (code || "").replace(/[\s -]/g, "").toUpperCase();

// The barcode field carries the scanned code or the typed product name — items
// are identified by its normalized value.
const itemKey = (i: { barcode: string }) => normalizeBarcode(i.barcode);

const BarcodeScan = () => {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<ScannedItem[]>([]);
  const [barcodeModal, setBarcodeModal] = useState<{
    show: boolean;
    data: { barcode: string; qty?: number };
  }>({ show: false, data: { barcode: "", qty: undefined } });
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string; useProxy?: boolean }>;
    initialImageId?: string;
  }>({ show: false, images: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Bulk-subscribe state for the review footer action.
  const [subscribing, setSubscribing] = useState(false);
  // Review data lives here so it flows one way down into <Review/>: index owns
  // the fetch + poll, the review component just renders.
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState<string | null>(null);
  // Guards against overlapping requests if one poll outlives the interval.
  const reviewInFlight = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ScannedItem[]>([]);
  const { show: showToast } = useAppToast();
  const { isMobile } = useScreenView();
  const { setOpen } = useSidebar();
  const appNav = useAppNav();
  const [searchParams, setSearchParams] = useSearchParams();
  const batchId = searchParams.get("batchId") || "";
  const reviewing = searchParams.get("review") === "1";

  const setReviewing = useCallback(
    (on: boolean) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (on) next.set("review", "1");
          else next.delete("review");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const [showLeaveAlert, setShowLeaveAlert] = useState(false);
  const [showClearAlert, setShowClearAlert] = useState(false);
  const hasCordova = MiscService.hasCordova();

  const isDirty = items.length > 0 || reviewing;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      currentLocation.pathname !== nextLocation.pathname &&
      // Going to the subscribe cart is the intended forward step after a
      // successful subscribe — don't warn about leaving for that.
      !nextLocation.pathname.startsWith(
        "/dashboard/inventory/subscribe/cart",
      ) &&
      // "Add Details" sends the seller to the add-product page to create a
      // scanned item; the batch is already persisted and they return here with
      // the batchId, so this is a deliberate round-trip, not a discard.
      !nextLocation.pathname.startsWith(
        "/dashboard/inventory/subscribe/add-product",
      ),
  );

  useEffect(() => {
    if (blocker.state === "blocked") setShowLeaveAlert(true);
  }, [blocker.state]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const handleLeaveConfirm = () => {
    setShowLeaveAlert(false);
    // Just proceed with the blocked navigation. Don't start a competing
    // navigation here (e.g. setSearchParams) — React Router resets the blocker
    // the moment a new navigation begins, which would swallow proceed() and
    // strand the user on this page. The batchId/review params leave with us
    // anyway once this route unmounts.
    if (blocker.state === "blocked") blocker.proceed();
  };

  const handleLeaveCancel = () => {
    setShowLeaveAlert(false);
    if (blocker.state === "blocked") blocker.reset();
  };

  const scannerDetector = useMemo(
    () => MiscService.createScannerDetector(),
    [],
  );
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Give the scan workspace full width on landing — the sidebar can still be
  // reopened any time via the panel icon in the AppHeader. Run once on mount:
  // setOpen's identity changes whenever the sidebar opens, so depending on it
  // would re-fire this and immediately slam the sidebar shut again.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // On a reload or deep-link the in-memory scans are gone, but the URL still
  // carries the batchId (e.g. after "Back to scan" keeps batchId, drops review).
  // Hydrate the scanned list from the batch so the barcodes still show. Skip if
  // we already have local scans — those are the source of truth mid-session.
  const hydratedBatchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!batchId || itemsRef.current.length) return;
    if (hydratedBatchRef.current === batchId) return;
    hydratedBatchRef.current = batchId;

    let cancelled = false;
    (async () => {
      try {
        const formatted = await getData(batchId);
        if (cancelled || !formatted.length) return;
        const restored = formatted.map((i) => ({
          barcode: i.barcode,
          qty: i.qty,
        }));
        setItems(restored);
        itemsRef.current = restored;
      } catch {
        // Best-effort hydration — the review effect surfaces fetch errors.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [batchId]);

  useEffect(() => {
    return () => {
      if (selectTimeoutRef.current) clearTimeout(selectTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasCordova) return;
    const onBack = (e: Event) => {
      e.preventDefault();
      if (barcodeModal.show) {
        setBarcodeModal({ show: false, data: { barcode: "", qty: undefined } });
        return;
      }
      if (showClearAlert) {
        setShowClearAlert(false);
        return;
      }
      if (reviewing) {
        setReviewing(false);
        return;
      }
      appNav.back();
    };
    document.addEventListener("backbutton", onBack);
    return () => document.removeEventListener("backbutton", onBack);
  }, [hasCordova, barcodeModal.show, showClearAlert, reviewing, appNav]);

  const focusInput = useCallback(() => {
    if (isMobile) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [isMobile]);

  // Add one or more barcodes from a (possibly comma-separated) string. Scans
  // never prompt for a quantity — they land with qty 0 and the user sets
  // quantities afterward in the scanned list. Dedupes and caps at 25.
  const addBarcodesBulk = useCallback(
    (raw: string) => {
      const codes = raw
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (!codes.length) {
        showToast({ msg: "Enter a barcode or product name", color: "error" });
        return;
      }
      const seen = new Set(itemsRef.current.map((i) => itemKey(i)));
      const toAdd: ScannedItem[] = [];
      let skippedDup = false;
      for (const barcode of codes) {
        const key = itemKey({ barcode });
        if (seen.has(key)) {
          skippedDup = true;
          continue;
        }
        seen.add(key);
        toAdd.push({ barcode, qty: 0 });
      }

      const room = Math.max(0, 25 - itemsRef.current.length);
      const accepted = toAdd.slice(0, room);
      const overflow = toAdd.length - accepted.length;

      if (accepted.length) {
        setItems((prev) => {
          const next = [...prev, ...accepted];
          itemsRef.current = next;
          return next;
        });
        // If a batch already exists, append all newly added items in one call.
        if (batchId) {
          InventorySubscribeService.appendToBulkBarcodeScan(
            batchId,
            accepted.map((i) => ({ searchKeyword: i.barcode, qty: i.qty })),
          ).catch(() => {});
        }
      }

      if (overflow > 0) {
        showToast({ msg: "Maximum 25 items allowed", color: "error" });
      } else if (skippedDup && !accepted.length) {
        showToast({ msg: "Already added", color: "error" });
      }

      setBarcode("");
      focusInput();
    },
    [showToast, focusInput, batchId],
  );

  // A scan/type-in adds straight to the list with qty 0 — no quantity prompt in
  // the middle of scanning. The modal is only opened when editing an existing
  // row's quantity.
  const addOrEdit = useCallback(
    (value: string, qty?: number, opts?: { isEdit?: boolean }) => {
      const barcode = (value || "").trim();
      if (!barcode) {
        showToast({ msg: "Enter a barcode or product name", color: "error" });
        return;
      }
      if (!opts?.isEdit) {
        addBarcodesBulk(barcode);
        return;
      }
      setBarcodeModal({ show: true, data: { barcode, qty } });
    },
    [showToast, addBarcodesBulk],
  );

  const triggerCordovaScan = useCallback(() => {
    const cordova = MiscService.getCordova();
    if (!cordova) return;
    cordova.plugins.barcodeScanner.scan(
      (r: any) => {
        if (r && r.text) addOrEdit(r.text);
      },
      () => {},
    );
  }, [addOrEdit]);

  const upsertItem = useCallback((barcode: string, qty: number) => {
    setItems((prev) => {
      const key = itemKey({ barcode });
      const idx = prev.findIndex((i) => itemKey(i) === key);
      let next: ScannedItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], qty };
      } else {
        next = [...prev, { barcode, qty }];
      }
      itemsRef.current = next;
      return next;
    });
  }, []);

  const removeItem = useCallback(
    async (item: ScannedItem) => {
      const key = itemKey(item);
      const dropRow = () =>
        setItems((prev) => {
          const next = prev.filter((i) => itemKey(i) !== key);
          itemsRef.current = next;
          return next;
        });
      // If this scan was already persisted to a batch, drop it server-side first
      // and only remove the row once the API confirms — only meaningful once a
      // batchId exists in the URL. The server keys items by barcode, which also
      // holds the typed product name.
      if (batchId && item.barcode) {
        try {
          const res: any =
            await InventorySubscribeService.deleteAiBulkBarcodeScanItem(
              batchId,
              item.barcode,
            );
          if (res?.statusCode !== 200) {
            showToast({
              msg: res?.message || "Failed to remove item",
              color: "error",
            });
            return;
          }
        } catch (e: any) {
          showToast({
            msg: e?.response?.data?.message || "Failed to remove item",
            color: "error",
          });
          return;
        }
      }
      dropRow();
    },
    [batchId, showToast],
  );

  const clearAll = useCallback(() => {
    setItems([]);
    itemsRef.current = [];
  }, []);

  const handleModalCallback = useCallback(
    (r: { action: string; data?: { barcode: string; qty: number } }) => {
      if (r.action === "close") {
        setBarcodeModal({ show: false, data: { barcode: "", qty: undefined } });
        focusInput();
        return;
      }
      if (r.data) {
        upsertItem(r.data.barcode, r.data.qty);
        // If a batch already exists, append each newly scanned item to it.
        if (batchId) {
          InventorySubscribeService.appendToBulkBarcodeScan(batchId, {
            searchKeyword: r.data.barcode,
            qty: r.data.qty,
          }).catch(() => {});
        }
      }
      setBarcodeModal({ show: false, data: { barcode: "", qty: undefined } });
      setBarcode("");
      focusInput();
      if (r.action === "save-scan" && hasCordova) triggerCordovaScan();
    },
    [upsertItem, focusInput, hasCordova, triggerCordovaScan, batchId],
  );

  const handleSubmit = useCallback(async () => {
    if (!items.length) {
      showToast({ msg: "No items to submit", color: "error" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Reuse the batch in the URL if it exists, otherwise create a new one.
      if (!batchId) {
        const res: any = await InventorySubscribeService.aiBulkBarcodeScan(
          items.map((i) => ({ searchKeyword: i.barcode, qty: i.qty })),
        );
        const newBatchId = res?.data?.data?.batch?._id || "";
        if (!newBatchId) {
          showToast({ msg: "Failed to create batch", color: "error" });
          return;
        }
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("batchId", newBatchId);
            next.set("review", "1");
            return next;
          },
          { replace: true },
        );
      } else {
        setReviewing(true);
      }
    } catch (e: any) {
      showToast({
        msg: e?.response?.data?.message || "Failed to submit",
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [items, showToast, batchId, setSearchParams, setReviewing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
        selectTimeoutRef.current = null;
      }
      const val = inputRef.current?.value ?? barcode;
      addOrEdit(val);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBarcode(val);

    const isFromScanner = scannerDetector.trackKeystroke();
    if (isFromScanner && val.trim()) {
      if (selectTimeoutRef.current) clearTimeout(selectTimeoutRef.current);
      selectTimeoutRef.current = setTimeout(() => {
        selectTimeoutRef.current = null;
        addOrEdit(inputRef.current?.value ?? val);
      }, 100);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).select();
  };

  const handleAddClick = () => addOrEdit(barcode);

  // Same action as Enter; keep focus in the field so the next scan/type lands
  // there instead of on the button.
  const handleFindClick = () => {
    if (selectTimeoutRef.current) {
      clearTimeout(selectTimeoutRef.current);
      selectTimeoutRef.current = null;
    }
    addOrEdit(inputRef.current?.value ?? barcode);
    inputRef.current?.focus();
  };

  const handleEditItem = (item: ScannedItem) =>
    addOrEdit(item.barcode, item.qty, { isEdit: true });

  // Own the review batch fetch + poll here so data flows one way into <Review/>.
  // Seed instantly from the barcodes we already scanned, then the first fetch
  // (and each poll) replaces them with matched results.
  useEffect(() => {
    if (!reviewing || !batchId) return;

    setReviewItems(
      seedReviewItems(
        itemsRef.current.map((i) => ({
          barcode: i.barcode,
          qty: i.qty,
        })),
      ),
    );
    setReviewLoading(true);
    setReviewError(null);

    let cancelled = false;
    const controller = new AbortController();
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const fetchBatch = async () => {
      if (reviewInFlight.current) return;
      reviewInFlight.current = true;
      try {
        const formatted = await getData(batchId, { signal: controller.signal });
        if (cancelled) return;
        // The batch response may not echo back the scanned qty, so re-apply it
        // from what we scanned, keyed by normalized barcode.
        const qtyByBarcode = new Map(
          itemsRef.current.map((i) => [normalizeBarcode(i.barcode), i.qty]),
        );
        const withQty = formatted.map((i) => ({
          ...i,
          qty: i.qty || qtyByBarcode.get(normalizeBarcode(i.barcode)) || 0,
        }));
        // An empty result means the batch hasn't materialized its items yet —
        // keep the seeded "Matching…" rows and keep polling, don't blank out.
        if (withQty.length) setReviewItems(withQty);
        setReviewError(null);
        // Stop only once we have items and none are still Pending — an empty
        // list isn't "resolved", it's "not ready yet".
        if (
          formatted.length &&
          !formatted.some((i) => i.matchStatus === "Pending")
        ) {
          stopPolling();
        }
      } catch (e: any) {
        if (cancelled || controller.signal.aborted) return;
        setReviewError(
          e?.response?.data?.message || "Failed to fetch batch details",
        );
      } finally {
        if (!cancelled) setReviewLoading(false);
        reviewInFlight.current = false;
      }
    };

    fetchBatch();
    intervalId = setInterval(fetchBatch, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      controller.abort();
      stopPolling();
    };
  }, [reviewing, batchId]);

  // The review row was already deleted server-side by <Review/>. Drop it from
  // both the review list and the scanned list so "Back to scan" doesn't resurface
  // it — items are keyed by normalized barcode, so match that way too.
  const handleRemoveReviewItem = useCallback((barcode: string) => {
    const key = normalizeBarcode(barcode);
    setReviewItems((prev) =>
      prev.filter((i) => normalizeBarcode(i.barcode) !== key),
    );
    setItems((prev) => {
      const next = prev.filter((i) => itemKey(i) !== key);
      itemsRef.current = next;
      return next;
    });
  }, []);

  // After a row's create request is sent, flag it Requested so its action
  // becomes "Sent for approval" instead of "Create New".
  const handleReviewItemRequested = useCallback((id: string) => {
    setReviewItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "Requested" } : i)),
    );
  }, []);

  // Once every review row has been created or removed there's nothing left to
  // review — leave review mode so we don't render an empty review block. Guard
  // on the initial fetch so we don't bounce out before any rows have loaded.
  useEffect(() => {
    if (reviewing && !reviewLoading && reviewItems.length === 0) {
      setReviewing(false);
    }
  }, [reviewing, reviewLoading, reviewItems.length, setReviewing]);

  const handleImagePreview = useCallback(
    (images: string[], initialImageId?: string, useProxy?: boolean) => {
      setImgPreviewModal({
        show: true,
        images: images.map((img) => ({ id: img, useProxy })),
        initialImageId,
      });
    },
    [],
  );

  // FoundInSk rows carry a real catalog deal we can subscribe to in one call.
  const subscribableItems = useMemo(
    () =>
      reviewItems.filter(
        (i) => i.matchStatus === "FoundInSk" && i.deal && !i.deal.isSubscribed,
      ),
    [reviewItems],
  );

  // AI-found / Not-found rows the user can send for creation from the cart.
  // Already-requested rows are excluded — they've been sent to the catalog team,
  // so counting them again would inflate the "added to pending" tally and the
  // cart's newPending deep-link.
  const creatableItems = useMemo(
    () =>
      reviewItems.filter(
        (i) =>
          (i.matchStatus === "FoundInAi" || i.matchStatus === "NotFound") &&
          i.status !== "Requested",
      ),
    [reviewItems],
  );

  // Tapping Subscribe bulk-subscribes the FoundInSk rows in one call and then
  // redirects to the cart — no intermediate selection step. Not-in-catalog rows
  // aren't created here; they surface in the cart's "Create Pending" tab, the
  // single place creation now happens.
  const handleSubscribe = async () => {
    const allSubscribed =
      reviewItems.length > 0 && reviewItems.every((i) => i.deal?.isSubscribed);
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
            price: deal.mrp,
            images: deal.images || [],
            // Drop blanks — a name-scanned row has no code on either side, and
            // `[""]` would land an empty barcode on the subscription.
            barcodes: [deal.barcode || item.barcode].filter(Boolean),
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
      appNav.to("/dashboard/inventory/subscribe/cart", {
        from: "barcode-scan-bulk",
        newPending: String(creatableItems.length),
        ...(subscribedCount ? {} : { activeTab: "pending" }),
      });
    } catch (e: any) {
      showToast({
        msg: e?.response?.data?.message || "Failed to subscribe products",
        color: "error",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handleBackToScan = useCallback(async () => {
    // After a reload the in-memory scanned list is gone (only the batchId
    // survives in the URL), so refetch the batch and rebuild the scanned list
    // before dropping back to the scan view — otherwise it shows "No items".
    if (batchId) {
      try {
        const formatted = await getData(batchId);
        if (formatted.length) {
          // The batch may not echo back the scanned qty, so fall back to the
          // qty already shown in the review list, keyed by normalized barcode.
          const qtyByBarcode = new Map(
            reviewItems.map((i) => [normalizeBarcode(i.barcode), i.qty]),
          );
          const restored = formatted.map((i) => ({
            barcode: i.barcode,
            qty: i.qty || qtyByBarcode.get(normalizeBarcode(i.barcode)) || 0,
          }));
          setItems(restored);
          itemsRef.current = restored;
        }
      } catch {
        // Best-effort — keep whatever's already in the scanned list.
      }
    }
    setReviewing(false);
  }, [batchId, reviewItems, setReviewing]);

  const totalQty = useMemo(
    () => items.reduce((s, i) => s + (Number(i.qty) || 0), 0),
    [items],
  );

  const activeStepIndex = Math.max(
    0,
    steps.findIndex(
      (s) => s.key === (reviewing ? "review" : items.length ? "qty" : "scan"),
    ),
  );

  return (
    <>
      <AppHeader title="Barcode Scan" />
      <div className="app-page tw:p-4 page-bg">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        {/* <SectionTabs sectionKey="catalog" activeTab="library" noShadow sticky /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="library"
                title="Manage Catalog"
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid; the side pane only exists in
                  theme-2 desktop, where the CSS lifts it out of the grid. */}
              <AppPaneMain className="tw:lg:col-span-12">
                <AppBreadcrumbs
                  data={breadcrumbs}
                  className="theme-2-mobile-hide"
                />
                <PageDescription description="barcodeScan" />
                <BarcodeScanTabs activeTab="bulk" className="tw:mt-3 tw:mb-3" />
                {/* Bulk pins its own Review footer, so theme-2 mobile keeps the
                    cart out of the footer slot rather than stacking two bars. */}
                <CartStatusBar className="tw:mb-4" theme2Footer={false} />
                <div className="tw:mt-4 tw:mb-2">
                  <div className="tw:flex tw:items-baseline tw:justify-between tw:mb-2">
                    <h2 className="tw:text-sm tw:font-semibold tw:text-gray-900">
                      {steps[activeStepIndex].title}
                    </h2>
                    <span className="tw:text-xs tw:font-medium tw:text-gray-400 tw:tabular-nums">
                      Step {activeStepIndex + 1} of {steps.length}
                    </span>
                  </div>
                  {/* The segmented track is wayfinding for the scan → qty flow. On the
                terminal review step it's fully filled and would clash with the
                match-results bar below, so drop it there and let the header text
                alone carry the "you're at the end" cue. */}
                  {!reviewing && (
                    <div className="tw:flex tw:gap-1.5">
                      {steps.map((s, i) => (
                        <div
                          key={s.key}
                          className={`tw:h-1 tw:flex-1 tw:rounded-full tw:transition-colors ${
                            i <= activeStepIndex
                              ? "scan-progress-fill"
                              : "tw:bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {!reviewing && (
                  <>
                    <section className="tw:mt-2">
                      <div className="tw:flex tw:flex-col tw:gap-2">
                        {hasCordova && (
                          <BarcodeScanComp
                            callback={(r) => {
                              if (r.action === "scan" && r.data)
                                addOrEdit(r.data);
                              else if (r.action === "error")
                                showToast({ msg: r.data, color: "error" });
                            }}
                            className="scan-camera-btn tw:flex tw:items-center tw:justify-center tw:gap-2 tw:w-full tw:font-semibold tw:text-sm tw:rounded-xl tw:py-2.5 tw:shadow-sm tw:transition tw:cursor-pointer"
                          >
                            <ScanLine className="tw:w-4 tw:h-4" />
                            Tap to scan a product
                          </BarcodeScanComp>
                        )}
                        {/* On cordova the camera scan lives in the button above, and
                      this field is type-only — mark it as the "or type it in"
                      alternative so the two paths don't both read as scanning. */}
                        {hasCordova && (
                          <div className="tw:flex tw:items-center tw:gap-3 tw:text-[11px] tw:font-medium tw:text-gray-400">
                            <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
                            or type it in
                            <span className="tw:h-px tw:flex-1 tw:bg-gray-200" />
                          </div>
                        )}
                        <div className="tw:relative tw:flex tw:gap-2">
                          <div className="tw:relative tw:flex-1">
                            {hasCordova ? (
                              <Keyboard className="tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:w-5 tw:h-5 tw:text-gray-400 tw:pointer-events-none" />
                            ) : (
                              <ScanLine className="scan-search-icon tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:w-5 tw:h-5 tw:pointer-events-none" />
                            )}
                            <input
                              ref={inputRef}
                              autoFocus={!isMobile}
                              type="text"
                              value={barcode}
                              onChange={handleChange}
                              onClick={handleInputClick}
                              onKeyDown={handleKeyDown}
                              placeholder={
                                hasCordova
                                  ? "Type a barcode, name or model"
                                  : isMobile
                                    ? // The Add button eats the width on phones,
                                      // so the full prompt gets clipped mid-word.
                                      "Name, model or barcode…"
                                    : "Scan or type a barcode, name or model"
                              }
                              className={`scan-search-input tw:w-full tw:h-11 tw:border tw:rounded-xl tw:pl-11 tw:text-sm tw:font-mono tw:tracking-wide tw:bg-white tw:transition ${
                                isMobile ? "tw:pr-4" : "tw:pr-24"
                              }`}
                            />
                            {!isMobile && (
                              <span className="tw:absolute tw:right-3 tw:top-1/2 tw:-translate-y-1/2 tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:text-gray-500 tw:bg-gray-100 tw:border tw:border-gray-200 tw:rounded tw:px-1.5 tw:py-0.5 tw:pointer-events-none">
                                <CornerDownLeft className="tw:w-3 tw:h-3" />
                                Enter
                              </span>
                            )}
                          </div>
                          {isMobile || hasCordova ? (
                            <AppButton
                              onClick={handleAddClick}
                              fill="outline"
                              className="tw:h-11 tw:px-5"
                            >
                              Add
                            </AppButton>
                          ) : (
                            // Enter is the fast path, but a visible Find button
                            // gives mouse users the same action without having
                            // to guess the keyboard shortcut.
                            <AppButton
                              onClick={handleFindClick}
                              fill="outline"
                              className="tw:h-11 tw:px-5 tw:flex tw:items-center tw:gap-2"
                            >
                              <Search className="tw:w-4 tw:h-4" />
                              Find
                            </AppButton>
                          )}
                        </div>
                        <p className="tw:text-xs tw:text-gray-500">
                          Items are added straight away — set the quantity on
                          each one in the list below.
                          {!isMobile &&
                            " Press Enter to add, or comma-separate to add many at once."}
                        </p>
                      </div>
                    </section>

                    <section className="tw:mt-6">
                      <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <ListChecks className="tw:w-4 tw:h-4 tw:text-gray-600" />
                          <h2 className="tw:text-sm tw:font-semibold tw:text-gray-900">
                            Scanned items
                          </h2>
                        </div>
                        {items.length > 0 && (
                          <div className="tw:flex tw:items-center tw:gap-2">
                            <span className="tw:text-[11px] tw:font-medium tw:text-gray-500 tw:tabular-nums">
                              {items.length}{" "}
                              {items.length === 1 ? "item" : "items"} ·{" "}
                              {totalQty} units
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowClearAlert(true)}
                              className="tw:text-[11px] tw:font-medium tw:text-red-600 tw:px-1.5 tw:py-0.5 tw:rounded tw:transition-colors hover:tw:text-red-700 hover:tw:bg-red-50 active:tw:bg-red-100 focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-red-300 tw:cursor-pointer"
                            >
                              Clear all
                            </button>
                          </div>
                        )}
                      </div>
                      {items.length === 0 ? (
                        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:py-10 tw:px-6 tw:rounded-xl tw:border tw:border-dashed tw:border-gray-200 tw:bg-gray-50/60">
                          <div className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-full tw:bg-white tw:border tw:border-gray-200 tw:shadow-sm tw:mb-3">
                            <PackageSearch className="tw:w-6 tw:h-6 tw:text-gray-400" />
                          </div>
                          <div className="tw:text-sm tw:font-semibold tw:text-gray-700">
                            No items yet
                          </div>
                          <div className="tw:text-xs tw:text-gray-500 tw:mt-1 tw:max-w-xs">
                            Scan or type a barcode above to add your first
                            product — it lands here instantly, quantity optional.
                          </div>
                        </div>
                      ) : (
                        <ScannedBarcodeGrid
                          items={items}
                          onEdit={handleEditItem}
                          onRemove={removeItem}
                        />
                      )}
                    </section>
                  </>
                )}

                {reviewing &&
                  batchId &&
                  (reviewLoading || reviewItems.length > 0) && (
                    <div className="tw:mt-4">
                      <Review
                        batchId={batchId}
                        items={reviewItems}
                        loading={reviewLoading}
                        error={reviewError}
                        onRemoveItem={handleRemoveReviewItem}
                        onItemRequested={handleReviewItemRequested}
                        onImagePreview={handleImagePreview}
                      />
                    </div>
                  )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where it becomes the fixed catalog list pane. */}
              <AppPaneSide className="app-pane-only">
                <SubscribeSidePane scopeLabel="Bulk Scan" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {!reviewing && items.length > 0 && (
        <footer className="app-footer">
          <div className="app-container">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:flex-wrap">
              <div className="tw:text-sm tw:text-gray-600 tw:tabular-nums">
                {items.length} {items.length === 1 ? "item" : "items"} ·{" "}
                {totalQty} units
              </div>
              <AppButton
                onClick={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                size="large"
                className="tw:h-11 tw:px-6"
              >
                Review
              </AppButton>
            </div>
          </div>
        </footer>
      )}

      {/* Review step — the two decisions (go back and add more, or subscribe
          the batch) live in the page footer, not inside the review list. */}
      {reviewing && batchId && reviewItems.length > 0 && (
        <footer className="app-footer">
          <div className="app-container">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:flex-wrap">
              <AppButton
                color="light"
                fill="outline"
                onClick={handleBackToScan}
              >
                <ScanLine className="tw:w-4 tw:h-4 tw:mr-1" />
                Back to scan
              </AppButton>
              <AppButton
                onClick={handleSubscribe}
                disabled={
                  subscribing ||
                  (subscribableItems.length === 0 &&
                    creatableItems.length === 0)
                }
                isLoading={subscribing}
              >
                {/* When nothing maps to the SK catalog the action only routes
                    the user to the cart to create the AI-found rows — so the
                    label sets that expectation instead of promising a
                    subscribe that won't happen. */}
                {subscribableItems.length > 0 ? "Subscribe" : "Create products"}
                <ArrowRight className="tw:w-4 tw:h-4 tw:ml-1" />
              </AppButton>
            </div>
          </div>
        </footer>
      )}

      <AppAlertDialog
        show={showLeaveAlert}
        title="Leave this page?"
        description="You have unsaved scanned items. Leaving will discard them."
        okText="Leave"
        cancelText="Stay"
        onConfirm={handleLeaveConfirm}
        onCancel={handleLeaveCancel}
      />

      <AppAlertDialog
        show={showClearAlert}
        title="Clear all scanned items?"
        description={`${items.length} item(s) will be removed. You can undo right after.`}
        okText="Clear"
        cancelText="Cancel"
        onConfirm={() => {
          setShowClearAlert(false);
          clearAll();
        }}
        onCancel={() => setShowClearAlert(false)}
      />

      <ScanQtyModal
        show={barcodeModal.show}
        barcode={barcodeModal.data.barcode}
        initialQty={barcodeModal.data.qty}
        callback={handleModalCallback}
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
