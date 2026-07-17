import { Network } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  brandId: string;
};

const Categories = ({ brandId }: Props) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const filterRef = useRef<Record<string, any>>({});
  const sortRef = useRef<SortProps>({
    key: "_id.categoryName",
    value: "asc",
  });

  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      brandId,
    };
    applyFilter();
  }, [brandId]);

  const applyFilter = async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      sortRef.current
    );
    const result = await getData(params);
    setData(result || []);

    const totalRecords = await getCount(params);
    paginationRef.current.totalRecords = totalRecords;

    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    // advance page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const result = await getData(params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result?.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // swallow - keep previous data
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppCard
      title={`Associated Categories (${paginationRef.current.totalRecords})`}
      icon={<Network />}
    >
      <AppScrollArea className="tw:max-h-96">
        <div className="tw:max-h-96">
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {data.map((item) => (
              <AppBadge key={item._id} variant="light">
                <AppLink
                  href={`/cms/categories/view/${item._raw?.id || ""}`}
                  asLink={true}
                >
                  {item.name}
                </AppLink>
              </AppBadge>
            ))}
          </div>
        </div>
      </AppScrollArea>
      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-4">
          <AppButton
            onClick={loadMore}
            disabled={loadingMore}
            size="small"
            color="light"
            fill="outline"
          >
            Load More ({data.length}/{paginationRef.current.totalRecords})
          </AppButton>
        </div>
      )}
    </AppCard>
  );
};

export default Categories;
