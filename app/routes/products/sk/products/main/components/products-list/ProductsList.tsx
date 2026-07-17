import React, { useCallback, useEffect, useRef, useState } from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import { Skeleton } from "~/components/ui/skeleton";
import useTheme from "~/hooks/useTheme";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

interface ProductsListProps {
  callback?: (data: { action: string; data?: any }) => void;
  title?: string;
  search?: string;
  menuId?: string;
}

const ProductCardSkeleton = () => (
  <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:space-y-4">
    <Skeleton className="tw:h-32 tw:w-full" />
    <Skeleton className="tw:h-4 tw:w-3/4" />
    <Skeleton className="tw:h-4 tw:w-1/2" />
    <Skeleton className="tw:h-4 tw:w-1/4" />
    <Skeleton className="tw:h-8 tw:w-full" />
  </div>
);

const ProductsList: React.FC<ProductsListProps> = ({
  callback,
  title = "All Products",
  search = "",
  menuId,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // theme-2 uses wider cards (fewer columns) to match the buy-from-network
  // browse pages; other themes keep the denser 5-column grid.
  const gridCols =
    useTheme() === "theme-2" ? "tw:md:grid-cols-4" : "tw:md:grid-cols-5";

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setProducts([]);
    try {
      const params = prepareParams(
        { menuId, search },
        paginationRef.current.activePage,
        paginationRef.current.rowsPerPage,
      );
      const [data, count] = await Promise.all([getData(params), getCount(params)]);
      paginationRef.current.totalRecords = count;
      setProducts(data);
      setHasMoreData(data.length > 0 && data.length < count);
    } finally {
      setLoading(false);
    }
  }, [menuId, search]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        { menuId, search },
        paginationRef.current.activePage,
        paginationRef.current.rowsPerPage,
      );
      const data = await getData(params);
      setProducts((prev) => {
        const next = [...prev, ...data];
        setHasMoreData(
          data.length > 0 && next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, menuId, search]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  if (loading && products.length === 0) {
    return (
      <div className="tw:mb-4">
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
          <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">{title}</h2>
        </div>
        <div className={`tw:grid tw:grid-cols-2 ${gridCols} tw:gap-3`}>
          {Array.from({ length: 10 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="tw:mb-4">
        <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
          <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">{title}</h2>
        </div>
        <NoData />
      </div>
    );
  }

  return (
    <div className="tw:mb-4">
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
        <h2 className="tw:text-lg tw:font-bold tw:text-slate-900">{title}</h2>
      </div>
      <div className={`tw:grid tw:grid-cols-2 ${gridCols} tw:gap-3`}>
        {products.map((product: any) => (
          <ProductCard
            key={product.id || product._id}
            data={product}
            callback={callback}
            type={1}
            cartType="normal"
            useBusyLoader={true}
          />
        ))}
      </div>
      {hasMoreData && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={products.length}
          />
        </div>
      )}
    </div>
  );
};

export default ProductsList;
