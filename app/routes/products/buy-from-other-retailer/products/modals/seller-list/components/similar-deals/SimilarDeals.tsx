import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { getData, getCount, prepareParams } from "./helper";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";

type Props = {
  brandId?: string;
  categoryId?: string;
  distance?: number | string;
  excludeDealId?: string;
  callback: (a: { action: string; data?: any }) => void;
};

const SimilarDeals = ({
  brandId,
  categoryId,
  distance = DEFAULT_BROWSE_DISTANCE as any,
  excludeDealId,
  callback,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [deals, setDeals] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef({
    activePage: 1,
    rowsPerPage: 20,
    totalRecords: 0,
  });

  const fetchDeals = useCallback(async () => {
    await applyFilter();
  }, [brandId, categoryId, distance, excludeDealId]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      rowsPerPage: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setDeals([]);
    try {
      const filter: Record<string, any> = {
        categoryId: categoryId,
        brandId: brandId,
        excludeDealId: excludeDealId,
      };

      const params = prepareParams(filter, paginationRef.current as any);
      const total = await getCount(params, distance);
      paginationRef.current.totalRecords = total;
      const products = await getData(params, distance);
      setDeals(products);
      setHasMoreData(products.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error("Error fetching similar deals:", e);
      setDeals([]);
      paginationRef.current.totalRecords = 0;
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [brandId, categoryId, distance, excludeDealId]);

  useEffect(() => {
    if (brandId || categoryId) fetchDeals();
  }, [fetchDeals, brandId, categoryId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const filter: Record<string, any> = {
        categoryId: categoryId,
        brandId: brandId,
        excludeDealId: excludeDealId,
      };
      const params = prepareParams(filter, paginationRef.current as any);
      const products = await getData(params, distance);
      setDeals((prev) => [...prev, ...products]);
      setHasMoreData(products.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      console.error("Error loading more similar deals:", e);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, brandId, categoryId, distance, excludeDealId]);

  const handleClick = (deal: any) => {
    callback({ action: "click", data: { deal } });
  };

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:py-6">
        <AppSpinner />
      </div>
    );
  }

  if (!deals || deals.length === 0) {
    return (
      <div className="tw:text-center tw:text-gray-400 tw:py-6">
        No similar deals found
      </div>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-2 tw:px-1 tw:pt-2">
      {deals.map((d: any) => (
        <button
          key={d._id}
          type="button"
          onClick={() => handleClick(d)}
          className="tw:bg-white tw:rounded tw:shadow tw:p-3 tw:text-left tw:flex tw:items-center tw:gap-3 tw:justify-between hover:tw:shadow-md tw:transition-shadow"
        >
          <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0">
            <div className="tw:w-16 tw:h-16 tw:flex-shrink-0">
              <ImgRender
                assetId={d.images?.[0]}
                alt={d.name}
                className="tw:w-16 tw:h-16 tw:object-cover tw:rounded"
              />
            </div>
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:text-sm tw:font-semibold tw:line-clamp-2">
                {d.name}
              </div>
              <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2 tw:flex-wrap">
                <span className="tw:text-xs tw:text-gray-600">B2B Price</span>
                <span className="tw:text-sm tw:font-semibold tw:text-green-600">
                  <Amount value={d.price} />
                </span>
                {d.mrp != null && d.price != null && d.mrp > d.price && (
                  <span className="tw:text-xs tw:text-gray-500 tw:line-through">
                    <Amount value={d.mrp} />
                  </span>
                )}
                {d.discount > 0 && (
                  <span className="tw:text-xs tw:text-orange-600 tw:font-semibold">
                    {d.discount}% OFF
                  </span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="tw:w-5 tw:h-5 tw:text-gray-400 tw:flex-shrink-0" />
        </button>
      ))}
      <LoadMoreButton
        loadMore={loadMore}
        loading={loadingMore}
        totalCount={paginationRef.current.totalRecords}
        loadedCount={deals.length}
      />
    </div>
  );
};

export default SimilarDeals;
