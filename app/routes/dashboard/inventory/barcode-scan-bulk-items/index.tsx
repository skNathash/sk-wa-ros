import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import useScreenView from "~/hooks/useScreenView";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AiExtractedDetailsModal from "~/shared/catalog/modals/AiExtractedDetailsModal";
import BarcodeScanBulkService from "~/services/BarcodeScanBulkService";
import SkSuggestionsModal from "~/shared/inventory/subscribe-scan/modals/SkSuggestionsModal";
import BarcodeScanTabs from "~/shared/inventory/subscribe-scan/components/BarcodeScanTabs";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import SubscribeSidePane from "~/shared/inventory/components/subscribe-side-pane/SubscribeSidePane";

import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import {
  getData,
  getCount,
  prepareParams,
  type ReviewItem,
  type StatusFilter,
} from "./helper";

/** Serialize a date to a timezone-stable `yyyy-mm-dd` URL param. */
const toDateParam = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/main" },
  },
  {
    label: "Barcode Scan",
    redirect: { path: "/dashboard/inventory/barcode-scan-bulk" },
  },
  { label: "Scan History" },
];

const BarcodeScanBulkItems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const status = (searchParams.get("status") as StatusFilter) || "all";
  const fromParam = searchParams.get("from") || "";
  const toParam = searchParams.get("to") || "";

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  const { isMobile } = useScreenView();
  const { show: showToast } = useAppToast();
  const appNav = useAppNav();

  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const loadData = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        paginationRef.current.activePage = 1;
      }

      try {
        const filters = {
          search,
          status,
          fromDate: fromParam ? new Date(fromParam) : undefined,
          toDate: toParam ? new Date(toParam) : undefined,
        };
        const params = prepareParams(filters, paginationRef.current);

        const newItems = await getData(params);

        if (isLoadMore) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
          const count = await getCount(params);
          setTotalRecords(count);
          paginationRef.current.totalRecords = count;
        }

        // Update pagination slice numbers
        const { activePage, rowsPerPage } = paginationRef.current;
        paginationRef.current.startSlNo = (activePage - 1) * rowsPerPage + 1;
        paginationRef.current.endSlNo = Math.min(
          activePage * rowsPerPage,
          isLoadMore ? items.length + newItems.length : newItems.length,
        );
      } catch (err) {
        console.error("Error loading bulk barcode scan items:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, status, fromParam, toParam, items.length],
  );

  // Load data when query parameters change
  useEffect(() => {
    loadData();
  }, [search, status, fromParam, toParam]);

  const loadMore = () => {
    paginationRef.current.activePage += 1;
    loadData(true);
  };

  // Sync search into the URL; the data-load effect reacts to the change.
  const handleFilterChange = useCallback(
    ({
      formData,
    }: {
      formData: { search: string; status: StatusFilter; dateRange: Date[] };
    }) => {
      const value = formData.search?.trim() || "";
      const nextStatus = formData.status || "all";
      const [from, to] = formData.dateRange || [];
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) {
            next.set("search", value);
          } else {
            next.delete("search");
          }
          if (nextStatus && nextStatus !== "all") {
            next.set("status", nextStatus);
          } else {
            next.delete("status");
          }
          if (from) {
            next.set("from", toDateParam(from));
          } else {
            next.delete("from");
          }
          if (to) {
            next.set("to", toDateParam(to));
          } else {
            next.delete("to");
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Modals state. The "Create New" flow confirms the AI-extracted details in
  // the AiExtractedDetailsModal, which owns the create request itself (api mode).
  const [aiModal, setAiModal] = useState<{
    show: boolean;
    product: any;
    context: { barcode?: string; scanItemId?: string };
    itemId?: string;
  }>({ show: false, product: null, context: {} });

  const [skModal, setSkModal] = useState<{
    show: boolean;
    item: ReviewItem | null;
  }>({ show: false, item: null });

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: Array<{ id: string; useProxy?: boolean }>;
    initialImageId?: string;
  }>({ show: false, images: [] });

  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    show: boolean;
    item: ReviewItem | null;
  }>({ show: false, item: null });

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

  const handleCreateProduct = (item: ReviewItem) => {
    // "Add Details" rows (no AI match) have no extracted details to prefill, so
    // send the seller to the full Add Product page — mirroring the barcode-scan
    // manual flow — carrying the scanned barcode (to prefill) and the page to
    // return to after a successful create.
    if (item.matchStatus !== "FoundInAi") {
      appNav.to("/dashboard/inventory/subscribe/add-product", {
        barcode: item.barcode,
        from: encodeURIComponent(
          "/dashboard/inventory/barcode-scan-bulk-items",
        ),
        fromLabel: encodeURIComponent("Barcode Scan"),
      });
      return;
    }
    // "Create New" rows came from an AI match — open the modal with its
    // pre-filled details so the seller only confirms.
    setAiModal({
      show: true,
      product: BarcodeScanBulkService.dealToAiProduct(item.deal),
      context: { barcode: item.barcode, scanItemId: item.id },
      itemId: item.id,
    });
  };

  const handleAiModalCallback = (r: { action: string; data?: any }) => {
    if (r?.action === "success") {
      // Optimistically flip the originating row to "Requested" so the
      // "Create New" action is replaced by "Sent for approval" right away.
      const itemId = aiModal.itemId;
      if (itemId) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId ? { ...i, status: "Requested" } : i,
          ),
        );
      }
      showToast({ msg: "Product sent for approval", color: "success" });
    }
    setAiModal({ show: false, product: null, context: {} });
  };

  const handleSkSuggestions = (item: ReviewItem) => {
    setSkModal({ show: true, item });
  };

  const handleSkModalCallback = (r: any) => {
    if (r?.action === "subscribed") {
      loadData();
    }
    setSkModal({ show: false, item: null });
  };

  // Remove a scanned item from its bulk-scan batch, then drop the row locally.
  const handleRemoveItem = useCallback(
    async (item: ReviewItem) => {
      setRemoveConfirm({ show: false, item: null });
      const key = item.id || item.barcode;
      setRemovingKey(key);
      try {
        const res: any =
          await InventorySubscribeService.deleteAiBulkBarcodeScanItemById(
            item.id || "",
          );
        if (res?.statusCode !== 200) {
          showToast({
            msg: res?.message || "Failed to remove item",
            color: "error",
          });
          return;
        }
        setItems((prev) => prev.filter((i) => (i.id || i.barcode) !== key));
        setTotalRecords((prev) => Math.max(0, prev - 1));
        paginationRef.current.totalRecords = Math.max(
          0,
          paginationRef.current.totalRecords - 1,
        );
        showToast({ msg: "Item removed", color: "success" });
      } catch (e: any) {
        showToast({
          msg: e?.response?.data?.message || "Failed to remove item",
          color: "error",
        });
      } finally {
        setRemovingKey(null);
      }
    },
    [showToast],
  );

  const viewProps = {
    items,
    loading,
    loadedCount: items.length,
    showLoadMore: items.length < totalRecords,
    loadingMore,
    loadMore,
    totalCount: totalRecords,
    onCreateProduct: handleCreateProduct,
    onSkSuggestions: handleSkSuggestions,
    onImagePreview: handleImagePreview,
    onRemove: (item: ReviewItem) => setRemoveConfirm({ show: true, item }),
    removingKey,
  };

  return (
    <>
      <AppHeader title="Barcode Scan History" />
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
                <PageDescription description="barcodeScanHistory" />
                <BarcodeScanTabs
                  activeTab="items"
                  className="tw:mt-2 tw:mb-4"
                />

                {/* Search container */}
                <div className="tw:mt-4 tw:mb-4">
                  <Filter
                    callback={handleFilterChange}
                    defaultValue={search}
                    defaultStatus={status}
                    defaultDateRange={
                      fromParam && toParam
                        ? [new Date(fromParam), new Date(toParam)]
                        : []
                    }
                  />

                  <PaginationSummary
                    paginationConfig={paginationRef.current}
                    loadingTotalRecords={loading}
                    loadedCount={items.length}
                    fwSize="sm"
                    className="tw:mt-4"
                  />
                </div>

                {/* Responsive Views */}
                {isMobile ? (
                  <MobileView {...viewProps} />
                ) : (
                  <DesktopView {...viewProps} />
                )}
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where it becomes the fixed catalog list pane. */}
              <AppPaneSide className="app-pane-only">
                <SubscribeSidePane scopeLabel="Scan History" />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AiExtractedDetailsModal
        show={aiModal.show}
        product={aiModal.product}
        mode="api"
        apiType="bulk"
        apiContext={aiModal.context}
        callback={handleAiModalCallback}
      />

      <SkSuggestionsModal
        show={skModal.show}
        barcode={skModal.item?.barcode || ""}
        items={skModal.item?.skSuggestions || []}
        callback={handleSkModalCallback}
        onSubscribed={() => {
          loadData();
        }}
        showViewCart
        continueLabel="Continue"
        onImagePreview={handleImagePreview}
      />

      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={() => setImgPreviewModal({ show: false, images: [] })}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />

      <AppAlertDialog
        show={removeConfirm.show}
        title="Remove this item?"
        description={`${
          removeConfirm.item?.deal?.title || "This item"
        } (Barcode: ${
          removeConfirm.item?.barcode || "—"
        }) will be removed from the history.`}
        okText="Remove"
        cancelText="Cancel"
        onConfirm={() =>
          removeConfirm.item && handleRemoveItem(removeConfirm.item)
        }
        onCancel={() => setRemoveConfirm({ show: false, item: null })}
      />
    </>
  );
};

export default BarcodeScanBulkItems;
