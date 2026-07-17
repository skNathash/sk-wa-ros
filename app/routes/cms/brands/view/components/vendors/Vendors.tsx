import { Network, Phone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";

type Props = {
  brandId: string;
  brandName: string;
};

const Vendors = ({ brandId, brandName }: Props) => {
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
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage
      );
    } catch (e) {
      // swallow - keep previous data
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <AppCard
      title={`Vendor Network (${paginationRef.current.totalRecords})`}
      icon={<Network />}
      subtitle={`Vendors who can supply ${brandName} products`}
    >
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && data.length === 0 ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-12">
          <div className="tw:text-gray-500 tw:text-sm">No vendors found</div>
        </div>
      ) : null}

      <AppScrollArea className="tw:max-h-96">
        <div className="tw:max-h-96">
          <div className="tw:flex tw:flex-col tw:flex-wrap tw:gap-2">
            {data.map((item) => (
              <div
                key={item._id}
                className="tw:text-sm tw:border-b tw:border-gray-200 tw:last:border-b-0 tw:py-2"
              >
                <AppLink
                  href={`/dashboard/vendor/view/${item._id}`}
                  asLink={true}
                  className="tw:mb-2 tw:block tw:font-medium"
                >
                  {item.name}
                </AppLink>
                <div className="tw:flex tw:gap-1 tw:items-center tw:text-slate-500 tw:text-xs">
                  <Phone size={12} /> {item?.mobile}
                </div>
              </div>
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

export default Vendors;
