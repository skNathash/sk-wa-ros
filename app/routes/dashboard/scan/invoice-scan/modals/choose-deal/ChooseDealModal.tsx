import {
  Barcode,
  Info,
  Loader2,
  PackageSearch,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import Alpha from "~/components/core/alpha/Alpha";
import AppButton from "~/components/core/button/AppButton";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppModal from "~/components/core/modal/AppModal";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Input } from "~/components/ui/input";
import type { PaginationState } from "~/types/CommonTypes";
import type { SimilarDeal } from "../../types";
import { getCount, getData, prepareParams } from "./helper";

interface ChooseDealModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  hsn?: string;
}

type FormValues = {
  hsn: string;
  search: string;
  alpha: string;
};

const ROWS_PER_PAGE = 10;

const ChooseDealModal = ({ show, callback, hsn }: ChooseDealModalProps) => {
  const [data, setData] = useState<SimilarDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);

  const { register, watch, getValues, setValue, reset } = useForm<FormValues>({
    defaultValues: { hsn: "", search: "", alpha: "" },
  });

  const alpha = watch("alpha");

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: ROWS_PER_PAGE,
    startSlNo: 1,
    endSlNo: ROWS_PER_PAGE,
    totalRecords: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  const resetPagination = () => {
    paginationRef.current = {
      activePage: 1,
      rowsPerPage: ROWS_PER_PAGE,
      startSlNo: 1,
      endSlNo: ROWS_PER_PAGE,
      totalRecords: 0,
    };
  };

  const applyFilter = useCallback(async () => {
    const formData = getValues();
    if (
      !formData.search?.trim() &&
      !formData.hsn?.trim() &&
      !formData.alpha
    ) {
      setData([]);
      setHasMoreData(false);
      resetPagination();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setData([]);
    resetPagination();

    try {
      const params = prepareParams(formData, paginationRef.current);
      const [result, count] = await Promise.all([
        getData(params, controller.signal),
        getCount(params, controller.signal),
      ]);

      if (controller.signal.aborted) return;

      paginationRef.current.totalRecords = count;
      setData(result);
      setHasMoreData(result.length >= ROWS_PER_PAGE);
    } catch {
      if (controller.signal.aborted) return;
      setData([]);
      setHasMoreData(false);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [getValues]);

  const debouncedSearch = useDebouncedCallback(
    () => {
      applyFilter();
    },
    500,
    { maxWait: 1000 },
  );

  const loadMore = useCallback(async () => {
    const formData = getValues();
    if (
      loadingMore ||
      !hasMoreData ||
      (!formData.search?.trim() && !formData.hsn?.trim() && !formData.alpha)
    )
      return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingMore(true);
    try {
      paginationRef.current.activePage += 1;
      const params = prepareParams(formData, paginationRef.current);
      const result = await getData(params, controller.signal);

      if (controller.signal.aborted) return;

      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= ROWS_PER_PAGE);
    } catch {
      if (controller.signal.aborted) return;
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, getValues]);

  // When modal opens, set HSN and fetch
  useEffect(() => {
    if (show && hsn?.trim()) {
      setValue("hsn", hsn);
      applyFilter();
    }
    if (!show) {
      reset({ hsn: "", search: "", alpha: "" });
      setData([]);
      setHasMoreData(false);
      setLoading(false);
      setLoadingMore(false);
      resetPagination();
      abortRef.current?.abort();
    }
  }, [show, hsn, applyFilter, setValue, reset]);

  const handleClose = () => callback({ action: "close" });
  const handleSelect = (deal: SimilarDeal) =>
    callback({ action: "select", data: deal });
  const handleCreate = () => callback({ action: "create" });

  return (
    <AppModal
      show={show}
      callback={handleClose}
      className="tw:max-w-lg tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>Choose Item</AppModal.Title>
      <AppModal.Content className="tw:h-[90vh]">
        <div className="tw:space-y-3">
          {/* HSN context banner */}
          {hsn?.trim() && (
            <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-blue-50/70 tw:px-2.5 tw:py-1.5 tw:text-xs tw:text-blue-900">
              <Info size={13} className="tw:shrink-0 tw:text-blue-600" />
              <span className="tw:text-blue-700">Items matching HSN</span>
              <span className="tw:font-mono tw:font-semibold tw:text-blue-900 tw:tracking-tight">
                {hsn}
              </span>
            </div>
          )}

          {/* Search input */}
          <div className="tw:relative">
            <Search
              size={14}
              className="tw:absolute tw:left-2.5 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400"
            />
            <Input
              {...register("search")}
              onChange={(e) => {
                setValue("search", e.target.value);
                debouncedSearch();
              }}
              placeholder="Search by HSN, name, or barcode..."
              className="tw:pl-8 tw:h-8 tw:text-xs"
            />
          </div>

          {/* Alpha filter */}
          <Alpha
            selected={alpha || ""}
            callback={(value) => {
              setValue("alpha", value);
              applyFilter();
            }}
          />

          {/* Loading state */}
          {loading && (
            <div className="tw:flex tw:items-center tw:justify-center tw:py-4 tw:gap-2 tw:text-sm tw:text-gray-500">
              <Loader2 size={16} className="tw:animate-spin" />
              Searching...
            </div>
          )}

          {/* Deal list */}
          {!loading && (
            <>
              {data.length > 0 && (
                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={false}
                  loadedCount={data.length}
                  fwSize="sm"
                />
              )}

              <div className="tw:space-y-1.5">
                {data.map((deal) => {
                  const tags: string[] = [];
                  if (deal.applicableCategory?.categoryName)
                    tags.push(deal.applicableCategory.categoryName);
                  if (deal.applicableBrand?.brandName)
                    tags.push(deal.applicableBrand.brandName);

                  return (
                    <button
                      key={deal._id || deal.dealId}
                      type="button"
                      onClick={() => handleSelect(deal)}
                      className="tw:group tw:w-full tw:text-left tw:px-3 tw:py-2 tw:rounded-md tw:border tw:border-gray-200 tw:bg-white tw:hover:border-blue-400 tw:hover:bg-blue-50/40 tw:transition-colors"
                    >
                      <div className="tw:flex tw:items-start tw:gap-2">
                        <div className="tw:min-w-0 tw:flex-1">
                          <div className="tw:text-[13px] tw:font-semibold tw:text-gray-900 tw:truncate tw:leading-tight">
                            {deal.dealName}
                          </div>
                          {deal.dealId && (
                            <div className="tw:mt-0.5 tw:text-[11px] tw:font-mono tw:text-gray-400 tw:leading-tight tw:truncate">
                              SK PID: {deal.dealId}
                            </div>
                          )}
                        </div>
                        {deal.hsn && (
                          <span className="tw:shrink-0 tw:rounded tw:bg-blue-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-mono tw:font-semibold tw:text-blue-700 tw:group-hover:bg-blue-100">
                            HSN {deal.hsn}
                          </span>
                        )}
                      </div>

                      {tags.length > 0 && (
                        <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:gap-1">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className="tw:inline-flex tw:items-center tw:rounded tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-gray-600"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {deal.barcode && (
                        <div className="tw:mt-1.5 tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:text-gray-500 tw:leading-tight">
                          <Barcode
                            size={12}
                            className="tw:shrink-0 tw:text-gray-400"
                          />
                          <span className="tw:font-mono tw:text-gray-700 tw:break-all">
                            {deal.barcode}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
                {data.length === 0 && (
                  <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-8 tw:gap-3">
                    <div className="tw:w-12 tw:h-12 tw:rounded-full tw:bg-gray-100 tw:flex tw:items-center tw:justify-center">
                      <PackageSearch size={22} className="tw:text-gray-400" />
                    </div>
                    <div className="tw:text-center">
                      <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                        No items found
                      </div>
                      <div className="tw:text-xs tw:text-gray-400 tw:mt-0.5">
                        Try a different search or create a new item
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {hasMoreData && (
                <div className="tw:text-center tw:mt-2">
                  <LoadMoreButton
                    loadMore={loadMore}
                    loading={loadingMore}
                    totalCount={paginationRef.current.totalRecords}
                    loadedCount={data.length}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-between tw:gap-3">
          <AppButton size="small" color="primary" onClick={handleCreate}>
            <Plus size={14} />
            Create Item
          </AppButton>
          <AppButton
            size="small"
            fill="outline"
            color="secondary"
            onClick={handleClose}
          >
            Cancel
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ChooseDealModal;
