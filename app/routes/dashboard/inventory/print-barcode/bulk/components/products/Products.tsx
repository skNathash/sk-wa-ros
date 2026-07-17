import { Check, Package, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import { AppInput, AppSelect } from "~/components/core/form";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import type { PaginationState } from "~/types/CommonTypes";
import {
  PRINT_BARCODE_MAX_BULK_ITEMS,
  PRINT_BARCODE_MAX_COPIES,
} from "~/constants";
import {
  getCount,
  getData,
  prepareParams,
  type BulkProductItem,
  type ProductsFilter,
} from "./helper";

const PAGE_SIZE = 50;

export type ProductsAction = "select" | "deselect" | "barcode" | "quantity";

/**
 * Clamp a raw copies input into the printable range [1, max].
 * Returns `null` when the field is cleared so the input can sit empty.
 */
const clampCopies = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return Math.min(Math.max(Math.floor(value), 1), PRINT_BARCODE_MAX_COPIES);
};

export type ProductsCallbackPayload = {
  action: ProductsAction;
  data: BulkProductItem;
};

interface ProductsProps {
  /** Brand id to scope the listing to (mutually used with categoryId). */
  brandId?: string;
  /** Category id to scope the listing to (mutually used with brandId). */
  categoryId?: string;
  /** Products currently selected by the parent — source of truth for checked state. */
  selectedData: BulkProductItem[];
  /** Notifies the parent when a product is selected or deselected. */
  callback: (payload: ProductsCallbackPayload) => void;
}

type SearchForm = { search: string };

const Products = ({
  brandId,
  categoryId,
  selectedData,
  callback,
}: ProductsProps) => {
  const toast = useAppToast();

  const [data, setData] = useState<BulkProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);

  // Search term lives in a ref so typing doesn't re-render the list mid-fetch.
  const searchRef = useRef("");
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: PAGE_SIZE,
    startSlNo: 1,
    endSlNo: PAGE_SIZE,
    totalRecords: 0,
  });

  const { register } = useForm<SearchForm>({ defaultValues: { search: "" } });

  const selectedIds = useMemo(
    () => new Set(selectedData.map((item) => item.id)),
    [selectedData],
  );
  // Chosen barcode per selected product — drives the dropdown's controlled value.
  const chosenById = useMemo(
    () => new Map(selectedData.map((item) => [item.id, item.selectedBarcode])),
    [selectedData],
  );
  // Copies count per selected product — drives the qty input's controlled value.
  const quantityById = useMemo(
    () => new Map(selectedData.map((item) => [item.id, item.quantity])),
    [selectedData],
  );
  const selectedCount = selectedData.length;
  const capReached = selectedCount >= PRINT_BARCODE_MAX_BULK_ITEMS;

  const buildFilter = useCallback(
    (): ProductsFilter => ({
      search: searchRef.current,
      brandId,
      categoryId,
    }),
    [brandId, categoryId],
  );

  // Apply the current filter and reset pagination back to the first page.
  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setData([]);
    try {
      const params = prepareParams(buildFilter(), paginationRef.current);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const products = await getData(params);
      setData(products);
      setHasMoreData(products.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [buildFilter]);

  // Fetch and append the next page.
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(buildFilter(), paginationRef.current);
      const products = await getData(params);
      setData((prev) => [...prev, ...products]);
      setHasMoreData(products.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, buildFilter]);

  // Re-fetch whenever the brand/category scope changes.
  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const handleSearch = useDebouncedCallback((value: string) => {
    searchRef.current = value;
    applyFilter();
  }, 450);

  const handleToggle = (product: BulkProductItem) => {
    if (selectedIds.has(product.id)) {
      callback({ action: "deselect", data: product });
      return;
    }
    if (capReached) {
      toast.show({
        msg: `You can select at most ${PRINT_BARCODE_MAX_BULK_ITEMS} products at a time.`,
        color: "warning",
      });
      return;
    }
    callback({ action: "select", data: product });
  };

  // Picking a barcode also selects the product (auto-select on choice).
  const handleBarcodeChange = (product: BulkProductItem, barcode: string) => {
    if (!selectedIds.has(product.id) && capReached) {
      toast.show({
        msg: `You can select at most ${PRINT_BARCODE_MAX_BULK_ITEMS} products at a time.`,
        color: "warning",
      });
      return;
    }
    callback({
      action: "barcode",
      data: { ...product, selectedBarcode: barcode },
    });
  };

  // Changing the copies count also selects the product (auto-select on edit).
  const handleQuantityChange = (product: BulkProductItem, raw: string) => {
    if (!selectedIds.has(product.id) && capReached) {
      toast.show({
        msg: `You can select at most ${PRINT_BARCODE_MAX_BULK_ITEMS} products at a time.`,
        color: "warning",
      });
      return;
    }
    callback({
      action: "quantity",
      data: { ...product, quantity: clampCopies(raw) },
    });
  };

  return (
    <AppCard noPadding className="tw:border-slate-200 tw:bg-white">
      {/* Toolbar */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:border-b tw:border-slate-100 tw:p-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:font-semibold tw:text-slate-900">Products</span>
        </div>
        <AppInput
          name="search"
          register={register}
          placeholder="Search products"
          size="sm"
          className="tw:w-full tw:md:w-56"
          leftIcon={<Search size={14} className="tw:text-gray-400" />}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-14">
          <AppSpinner size="lg" />
          <div className="tw:mt-2 tw:text-sm tw:text-gray-500">
            Loading products…
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="tw:px-6 tw:py-14 tw:text-center">
          <div className="tw:mb-3 tw:inline-flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-full tw:bg-gray-100">
            <Package size={22} className="tw:text-gray-400" />
          </div>
          <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
            No products found
          </div>
          <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
            {searchRef.current
              ? `Nothing matches “${searchRef.current}”.`
              : "Try a different search."}
          </div>
        </div>
      ) : (
        <>
          <div className="tw:space-y-2 tw:p-3">
            {data.map((product) => {
              const selected = selectedIds.has(product.id);
              const blockSelect = capReached && !selected;
              const hasBarcode = product.barcodes.length > 0;
              const chosenBarcode =
                chosenById.get(product.id) || product.barcodes[0] || "";
              const copies = quantityById.get(product.id);
              return (
                <div
                  key={product.id}
                  className={`tw:flex tw:flex-col tw:gap-3 tw:rounded-xl tw:border tw:px-3.5 tw:py-3 tw:transition tw:sm:flex-row tw:sm:items-center ${
                    selected
                      ? "tw:border-primary/40 tw:bg-primary/5"
                      : "tw:border-slate-200 tw:bg-white"
                  } ${blockSelect ? "tw:opacity-60" : ""}`}
                >
                  <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-start tw:gap-3 tw:sm:items-center">
                    <button
                      type="button"
                      disabled={blockSelect || !hasBarcode}
                      onClick={() => handleToggle(product)}
                      aria-label={
                        selected ? "Deselect product" : "Select product"
                      }
                      className={`tw:inline-flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:border tw:transition ${
                        selected
                          ? "tw:border-primary tw:bg-primary tw:text-white"
                          : "tw:border-slate-300 tw:bg-white tw:text-transparent"
                      } ${
                        blockSelect || !hasBarcode
                          ? "tw:cursor-not-allowed"
                          : "tw:cursor-pointer"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <div className="tw:min-w-0 tw:flex-1">
                      <AppLink
                        asLink
                        href={`/dashboard/inventory/products/view/${product.id}`}
                        title={product.name}
                        className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-blue-600"
                      >
                        {product.name || "—"}
                      </AppLink>
                      <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-0.5 tw:text-[11px] tw:text-slate-500">
                        {product.refId && (
                          <span className="tw:font-mono">{product.refId}</span>
                        )}
                        <span className="tw:inline-flex tw:items-center tw:gap-1">
                          MRP
                          <span className="tw:font-medium tw:text-slate-700">
                            <Amount
                              value={product.mrp}
                              decimalPlaces={2}
                              showSymbol
                            />
                          </span>
                        </span>
                        <span>{product.stock} in stock</span>
                      </div>
                    </div>
                  </div>

                  {/* Per-product barcode picker + copies */}
                  {!hasBarcode ? (
                    <span className="tw:inline-flex tw:shrink-0 tw:items-center tw:self-start tw:rounded-md tw:bg-slate-100 tw:px-2 tw:py-1 tw:text-[11px] tw:font-medium tw:text-slate-400 tw:sm:self-auto">
                      No barcode
                    </span>
                  ) : (
                    <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-2 tw:pl-9 tw:sm:pl-0">
                      <div className="tw:flex-1 tw:sm:w-40 tw:sm:flex-none">
                        <AppSelect
                          size="sm"
                          value={chosenBarcode}
                          inputClassName="tw:w-full! tw:min-w-0 tw:bg-white"
                          options={product.barcodes.map((bc) => ({
                            value: bc,
                            label: bc,
                          }))}
                          onChange={(bc: string) =>
                            handleBarcodeChange(product, bc)
                          }
                        />
                      </div>
                      <label className="tw:flex tw:items-center tw:gap-1.5">
                        <span className="tw:text-[11px] tw:font-medium tw:text-slate-500">
                          Prints
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={PRINT_BARCODE_MAX_COPIES}
                          step={1}
                          value={copies ?? ""}
                          title="Number of prints"
                          aria-label="Number of prints"
                          onChange={(e) =>
                            handleQuantityChange(product, e.target.value)
                          }
                          className="tw:w-16 tw:rounded-md tw:border tw:border-slate-300 tw:bg-white tw:px-2 tw:py-1.5 tw:text-center tw:text-sm tw:text-slate-900 tw:focus:border-primary tw:focus:outline-none"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {hasMoreData && (
            <div className="tw:flex tw:justify-center tw:pb-4">
              <button
                type="button"
                disabled={loadingMore}
                onClick={loadMore}
                className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-slate-700 tw:transition tw:hover:border-primary/40 tw:hover:text-primary tw:disabled:opacity-60"
              >
                {loadingMore && <AppSpinner size="sm" />}
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </AppCard>
  );
};

export default Products;
