import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import { Skeleton } from "~/components/ui/skeleton";
import type { PaginationState } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";
import SellerListModal from "../../../modals/seller-list/SellerListModal";
import ProductCard from "../../../components/ProductCard";
import { CART_ITEM_ADDED, DEFAULT_BROWSE_DISTANCE } from "~/constants";
import useTheme from "~/hooks/useTheme";

interface ProductsListProps {
  callback?: (data: { action: string; data: any }) => void;
  distance?: number | string;
  title?: string;
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
  distance = DEFAULT_BROWSE_DISTANCE,
  title = "Products",
}) => {
  const [searchParams] = useSearchParams();
  // theme-2 shows a denser 4-up grid on desktop; the default theme keeps 5-up.
  const gridCols =
    useTheme() === "theme-2" ? "tw:md:grid-cols-4" : "tw:md:grid-cols-5";
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");

  const [sellersModal, setSellersModal] = useState<{
    dealId: string;
    show: boolean;
  }>({
    dealId: "",
    show: false,
  });

  const [detailModal, setDetailModal] = useState<{
    dealId: string;
    show: boolean;
    data?: any;
  }>({
    dealId: "",
    show: false,
    data: undefined,
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const handleBuyNow = useCallback((data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }

    if (data.action === "details" && data.data) {
      setDetailModal({ dealId: data.data, show: true });
    }
  }, []);

  const handleModalCallback = useCallback(
    (data: { action: string; data?: any }) => {
      // If a seller was tapped inside the modal, forward to parent callback if provided
      if (data.action === "seller" && data.data) {
        const seller = data.data;
        const dealId = seller?.deal?._id || seller?.deal?.id;
        if (dealId) {
          // ensure modal stays open for this deal
          setSellersModal({ dealId, show: true });
        }
        // forward seller selection to parent list caller
        callback?.({ action: "seller", data: seller });
      }

      if (data.action === CART_ITEM_ADDED) {
        const dealId = data.data?.dealId;
        if (dealId) {
          setProducts((prev) =>
            prev.map((p) => {
              const id = p._id || p.id;
              if (!id) return p;
              if (id === dealId) {
                return {
                  ...p,
                  inCart: true,
                };
              }
              return p;
            }),
          );
          callback?.({
            action: CART_ITEM_ADDED,
            data: { dealId },
          });
        }
      }

      if (data.action === "close") {
        setSellersModal({ dealId: "", show: false });
      }
    },
    [callback],
  );

  const handleDetailModalCallback = useCallback(
    (payload: { show?: boolean; data?: any }) => {
      setDetailModal((prev) => ({ ...prev, show: !!payload.show }));
      if (payload.show === false) {
        setDetailModal({ dealId: "", show: false, data: undefined });
      }
    },
    [],
  );

  const applyFilter = async () => {
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
        search,
        paginationRef.current.activePage,
        paginationRef.current.rowsPerPage,
      );
      const formattedProducts = await getData(params, distance);
      setProducts(formattedProducts);
      setHasMoreData(
        formattedProducts.length >= paginationRef.current.rowsPerPage,
      );
      const total = await getCount(params, distance);
      paginationRef.current.totalRecords = total;
    } catch (error) {
      console.error("Error applying filter:", error);
    } finally {
      setLoading(false);
    }
  };

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
      const params = prepareParams(
        search,
        paginationRef.current.activePage,
        paginationRef.current.rowsPerPage,
      );
      const formattedProducts = await getData(params, distance);
      setProducts((prev) => [...prev, ...formattedProducts]);
      setHasMoreData(
        formattedProducts.length >= paginationRef.current.rowsPerPage,
      );
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, search, distance]);

  useEffect(() => {
    applyFilter();
  }, [search, distance]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  if (loading && products.length === 0) {
    return (
      <div className="tw:mb-4">
        <div className="tw:mb-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={handleSearchChange}
            className="tw:w-full tw:px-3 tw:py-2 tw:border tw:border-gray-300 tw:rounded-md"
          />
        </div>
        <div className={`tw:grid tw:grid-cols-2 ${gridCols} tw:gap-4`}>
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
        <div className="tw:mb-3">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={handleSearchChange}
            className="tw:w-full tw:px-3 tw:py-2 tw:border tw:border-gray-300 tw:rounded-md"
          />
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
            callback={handleBuyNow}
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
      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
      />
      {/* <ProductDetailModal
        show={detailModal.show}
        dealId={detailModal.dealId}
        callback={handleDetailModalCallback}
      /> */}
    </div>
  );
};

export default ProductsList;
