import AppCard from "~/components/core/card/AppCard";
import Items from "./Items";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PaginationState, SortValue } from "~/types/CommonTypes";
import { getData, getCount, prepareParams } from "./helper";

export type ProductItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  img?: any;
};

// Type for API response
type SellerDeal = {
  _id: string;
  name: string;
  category?: { _id: string; name: string; id?: string };
  brand?: { _id: string; name: string; id?: string };
  img?: any;
  [key: string]: any;
};

const defaultFilter = {
  search: "",
  dateRange: null,
  status: "",
  withoutStock: false,
};

interface ProductsProps {
  sellerId: string;
}

const Products = ({ sellerId }: ProductsProps) => {
  const [data, setData] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterRef = useRef<any>({ ...defaultFilter });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: SortValue | undefined }>(
    undefined
  );

  useEffect(() => {
    if (sellerId) {
      applyFilter();
    }
  }, [sellerId]);

  // Apply filter and reset pagination
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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      const productsData = await getData(params);
      // Transform API data to match ProductItem type
      const transformedData: ProductItem[] = productsData.map(
        (item: SellerDeal) => ({
          id: item._id,
          name: item.name,
          category: item.category?.name || "Unknown",
          brand: item.brand?.name || "Unknown",
          img: item.images, // Use images array from the formatted response
        })
      );
      setData(transformedData);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const productsData = await getData(params);
      // Transform API data to match ProductItem type
      const transformedData: ProductItem[] = productsData.map(
        (item: SellerDeal) => ({
          id: item._id,
          name: item.name,
          category: item.category?.name || "Unknown",
          brand: item.brand?.name || "Unknown",
          img: item.images, // Use images array from the formatted response
        })
      );
      setData((prev) => [...prev, ...transformedData]);
      setHasMoreData(productsData.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  return (
    <AppCard
      title="Products"
      subtitle="Products from this seller."
      noContentPadding
    >
      <Items data={data} loading={loading} />
    </AppCard>
  );
};

export default Products;
