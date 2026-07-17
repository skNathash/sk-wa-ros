import { useCallback, useEffect, useRef, useState } from "react";
import { PackagePlus } from "lucide-react";
import { useLocation, useSearchParams } from "react-router";

import useAppNav from "~/hooks/useAppNav";
import AppButton from "~/components/core/button/AppButton";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import useScreenView from "~/hooks/useScreenView";
import useAppToast from "~/hooks/useAppToast";
import AiExtractedDetailsModal from "~/shared/catalog/modals/AiExtractedDetailsModal";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import BarcodeScanBulkService from "~/services/BarcodeScanBulkService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import type { PaginationState } from "~/types/CommonTypes";
import SkSuggestionsModal from "~/shared/inventory/subscribe-scan/modals/SkSuggestionsModal";
import MiscService from "~/services/MiscService";

import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import Filter from "./components/Filter";
import {
  getData,
  getCount,
  prepareParams,
  buildCreatePayload,
  getItemKey,
  isSelectable,
  type ReviewItem,
} from "./helper";

interface CreatePendingProps {}

const defaultFilter = {
  search: "",
};

/**
 * "Create pending" list — products StoreKing AI found while bulk scanning but
 * that aren't in the SK catalog yet (matchStatus `FoundInAi`). Each row can be
 * created individually, or all loaded rows can be sent for creation in one bulk
 * request.
 */
const CreatePending: React.FC<CreatePendingProps> = () => {
  const { isMobile } = useScreenView();
  const { show: showToast } = useAppToast();
  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    show: boolean;
    item: ReviewItem | null;
  }>({ show: false, item: null });

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setItems([]);
    setSelectedIds(new Set());
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const data = await getData(params);
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (err) {
      console.error("Error loading pending create items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  // Load more data for load more button
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const data = await getData(params);
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Rows eligible for bulk create (not already requested / AI-creatable).
  const selectableItems = items.filter(isSelectable);
  const selectedCount = selectedIds.size;
  const allSelected =
    selectableItems.length > 0 && selectedCount === selectableItems.length;

  const toggleSelect = useCallback((item: ReviewItem) => {
    const key = getItemKey(item);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size > 0) {
        return new Set();
      }
      return new Set(items.filter(isSelectable).map(getItemKey));
    });
  }, [items]);

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter],
  );

  // Modals. The "Create New" flow confirms the AI-extracted details in the
  // AiExtractedDetailsModal, which owns the create request itself (api mode).
  const [aiModal, setAiModal] = useState<{
    show: boolean;
    product: any;
    context: { barcode?: string; scanItemId?: string };
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
    // "Not found" rows ("Add Details") have no AI-extracted details to prefill,
    // so send the seller to the full Add Product page — mirroring the barcode
    // bulk-scan manual flow — carrying the scanned barcode and a breadcrumb
    // trail back to this pending list. `from` keeps the current query (incl.
    // the pending tab) so they land back here after creating.
    if (item.matchStatus !== "FoundInAi") {
      const params = new URLSearchParams(searchParams);
      params.set("activeTab", "pending");
      appNav.to("/dashboard/inventory/subscribe/add-product", {
        barcode: item.barcode,
        from: encodeURIComponent(`${location.pathname}?${params.toString()}`),
        fromLabel: encodeURIComponent("Create Pending"),
      });
      return;
    }
    // AI-found rows ("Create New") already have details — confirm them in-place.
    setAiModal({
      show: true,
      product: BarcodeScanBulkService.dealToAiProduct(item.deal),
      context: { barcode: item.barcode, scanItemId: item.id },
    });
  };

  const handleAiModalCallback = (r: { action: string; data?: any }) => {
    if (r?.action === "success") {
      // Product created — refresh the list and notify the cart page so its
      // tab counts update.
      showToast({ msg: "Product sent for approval", color: "success" });
      applyFilter();
      MiscService.createEvent("create-pending-updated", null);
    }
    setAiModal({ show: false, product: null, context: {} });
  };

  const handleSkSuggestions = (item: ReviewItem) => {
    setSkModal({ show: true, item });
  };

  const handleSkModalCallback = (r: any) => {
    if (r?.action === "subscribed") {
      applyFilter();
      MiscService.createEvent("create-pending-updated", null);
    }
    setSkModal({ show: false, item: null });
  };

  // Remove a scanned item from its bulk-scan batch, then drop the row locally.
  const handleRemoveItem = useCallback(
    async (item: ReviewItem) => {
      setRemoveConfirm({ show: false, item: null });
      const key = getItemKey(item);
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
        setItems((prev) => prev.filter((i) => getItemKey(i) !== key));
        setSelectedIds((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        paginationRef.current.totalRecords = Math.max(
          0,
          paginationRef.current.totalRecords - 1,
        );
        showToast({ msg: "Item removed", color: "success" });
        MiscService.createEvent("create-pending-updated", null);
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

  const handleBulkCreate = async () => {
    setShowBulkConfirm(false);
    const selectedItems = items.filter((item) =>
      selectedIds.has(getItemKey(item)),
    );
    if (!selectedItems.length) {
      showToast({ msg: "Select at least one item to create", color: "error" });
      return;
    }
    setBulkCreating(true);
    try {
      const res = await InventorySubscribeService.bulkImportStoreProducts(
        selectedItems.map(buildCreatePayload),
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        showToast({
          msg: `${selectedItems.length} product(s) sent for approval`,
          color: "success",
        });
        applyFilter();
        MiscService.createEvent("create-pending-updated", null);
      } else {
        showToast({
          msg: res.data?.message || "Failed to create products",
          color: "error",
        });
      }
    } catch (e: any) {
      showToast({
        msg: e?.response?.data?.message || "Failed to create products",
        color: "error",
      });
    } finally {
      setBulkCreating(false);
    }
  };

  const viewProps = {
    items,
    loading,
    loadedCount: items.length,
    showLoadMore: hasMoreData,
    loadingMore,
    loadMore,
    totalCount: paginationRef.current.totalRecords,
    onCreateProduct: handleCreateProduct,
    onSkSuggestions: handleSkSuggestions,
    onImagePreview: handleImagePreview,
    onRemove: (item: ReviewItem) => setRemoveConfirm({ show: true, item }),
    removingKey,
    selectedIds,
    onToggleSelect: toggleSelect,
    allSelected,
    onToggleSelectAll: toggleSelectAll,
  };

  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-0.5 tw:mb-2">
        <h2 className="tw:text-xs tw:font-semibold tw:text-gray-900">
          Pending to create
        </h2>
        <p className="tw:text-[11px] tw:text-gray-500">
          Tap{" "}
          <span className="tw:font-semibold tw:text-blue-700">Create New</span>{" "}
          to add an AI-found product to your store,{" "}
          <span className="tw:font-semibold tw:text-blue-700">Add Details</span>{" "}
          to fill in a not-found product, or{" "}
          <span className="tw:font-medium tw:text-gray-700">Similar items</span>{" "}
          to link an existing one.
        </p>
      </div>

      <Filter callback={handleFilterChange} className="tw:mb-3" />

      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:sm:items-center tw:justify-between tw:gap-2 tw:mb-3">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={items.length}
            fwSize="sm"
          />
        </div>

        {/* Desktop: inline button. Mobile: rendered in the app-footer below. */}
        {selectableItems.length > 0 ? (
          <div className="tw:hidden tw:sm:block">
            <AppButton
              color="success"
              disabled={loading || bulkCreating || selectedCount === 0}
              isLoading={bulkCreating}
              onClick={() => setShowBulkConfirm(true)}
            >
              <PackagePlus className="tw:w-4 tw:h-4 tw:mr-1" />
              Create all ({selectedCount})
            </AppButton>
          </div>
        ) : null}
      </div>

      {isMobile ? (
        <MobileView {...viewProps} />
      ) : (
        <DesktopView {...viewProps} />
      )}

      {isMobile && selectableItems.length > 0 ? (
        <footer className="app-footer tw:shadow-none! tw:fixed! tw:bottom-0 tw:inset-x-0">
          <div className="app-container">
            <AppButton
              color="success"
              expand="block"
              className="tw:w-full"
              disabled={loading || bulkCreating || selectedCount === 0}
              isLoading={bulkCreating}
              onClick={() => setShowBulkConfirm(true)}
            >
              <PackagePlus className="tw:w-4 tw:h-4 tw:mr-1" />
              Create all ({selectedCount})
            </AppButton>
          </div>
        </footer>
      ) : null}

      <AppAlertDialog
        show={showBulkConfirm}
        title="Create selected products?"
        description={`${selectedCount} product(s) will be sent to the catalog team for verification.`}
        okText="Create all"
        cancelText="Cancel"
        onConfirm={handleBulkCreate}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <AppAlertDialog
        show={removeConfirm.show}
        title="Remove this item?"
        description={`${
          removeConfirm.item?.deal?.title || "This item"
        } (Barcode: ${
          removeConfirm.item?.barcode || "—"
        }) will be removed from the list.`}
        okText="Remove"
        cancelText="Cancel"
        onConfirm={() =>
          removeConfirm.item && handleRemoveItem(removeConfirm.item)
        }
        onCancel={() => setRemoveConfirm({ show: false, item: null })}
      />

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
          applyFilter();
          // Notify the cart page so the "Ready to Submit" tab count refreshes
          // as soon as a suggestion is subscribed (not just on modal close).
          MiscService.createEvent("create-pending-updated", null);
        }}
        onImagePreview={handleImagePreview}
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

export default CreatePending;
