import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router";
import { Plus, Info } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import type { CustomerItem, CustomerType } from "./helper";
import { getData, getCount, prepareParams } from "./helper";
import Filter from "./components/Filter";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";

type Props = {
  type?: CustomerType;
  onSelect: (customer: CustomerItem) => void;
};

const Customers = ({ type = "b2b", onSelect }: Props) => {
  const { isMobile } = useScreenView();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mobileFromParams = searchParams.get("mobile") || "";

  const methods = useForm({
    defaultValues: {
      search: mobileFromParams,
      alpha: "",
    },
  });

  const [data, setData] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [viewType, setViewType] = useState<ViewToggleType>("list");

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 15,
    startSlNo: 1,
    endSlNo: 15,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params, type);
      setData(result || []);
      const total = await getCount(params, type);
      paginationRef.current.totalRecords = total;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params, type);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, type]);

  // Auto-trigger search if mobile param is present
  useEffect(() => {
    if (mobileFromParams) {
      filterRef.current = { ...filterRef.current, search: mobileFromParams };
      // Clean up the mobile param from URL
      searchParams.delete("mobile");
      setSearchParams(searchParams, { replace: true });
    }
    applyFilter();
  }, [applyFilter]);

  const onFilterChange = useCallback(
    (data: { formData: any }) => {
      filterRef.current = {
        ...filterRef.current,
        ...data.formData,
      };
      applyFilter();
    },
    [applyFilter],
  );

  return (
    <>
      <FormProvider {...methods}>
        <Filter callback={onFilterChange} />
      </FormProvider>

      <div className="tw:flex tw:items-start tw:gap-2 tw:bg-blue-50 tw:border tw:border-blue-200 tw:text-blue-800 tw:text-xs tw:rounded-md tw:px-3 tw:py-2 tw:mb-3">
        <Info size={14} className="tw:shrink-0 tw:mt-0.5" />
        <span>
          Only customers without an assigned PayLater are shown here. Results
          are sorted by name.
        </span>
      </div>

      <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <AppButton
            color="primary"
            size="small"
            onClick={() => {
              const managePath =
                type === "b2c"
                  ? "/dashboard/network/management/b2c-customers/manage"
                  : "/dashboard/network/management/b2b-retailers/manage";
              navigate(
                `${managePath}?sourcePage=paylater-assign&customerType=${type}`,
              );
            }}
          >
            <Plus size={16} />
            Create
          </AppButton>
          <ViewToggle viewType={viewType} callback={setViewType} />
        </div>
      </div>

      {isMobile || viewType === "card" ? (
        <MobileView data={data} loading={loading} onSelect={onSelect} />
      ) : (
        <AppCard noPadding>
          <DesktopView data={data} loading={loading} onSelect={onSelect} />
        </AppCard>
      )}

      {hasMoreData && !loading && (
        <div className="tw:text-center tw:mt-4">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={data.length}
          />
        </div>
      )}
    </>
  );
};

export default Customers;
