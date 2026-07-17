import { useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "lodash";
import { Controller, useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useScreenView from "~/hooks/useScreenView";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";

const PayablesReceivables = ({
  type,
}: {
  type: "payables" | "receivables";
}) => {
  const { isMobile } = useScreenView();
  const [viewType, setViewType] = useState<"list" | "card">(
    isMobile ? "card" : "list",
  );

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 50,
    startSlNo: 1,
    endSlNo: 50,
    totalRecords: 0,
  });
  const filterRef = useRef<any>({});

  const partyTypeOptions = [
    { value: "all", label: "All Parties" },
    { value: "customer", label: "Customer" },
    { value: "vendor", label: "Vendor" },
    { value: "franchise", label: "Retailer" },
  ];

  // Form for search
  const { register, getValues, control } = useForm({
    defaultValues: {
      search: "",
      partyType: "all",
    },
  });

  // Apply filter (initial load or filter change)
  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
    };

    try {
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData(result || []);
      const totalRecords = await getCount(params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      setData([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues],
  );

  const handleSearchChange = useCallback(() => {
    debouncedSearch();
  }, [debouncedSearch]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current, {
        key: "date",
        value: "desc",
      });
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
      // handle error
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  // Initial load
  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      type,
      search: getValues("search"),
    };
    applyFilter();
  }, [type, getValues, applyFilter]);

  const viewProps = {
    type,
    data,
    loading,
    loadingMore,
    hasMoreData,
    loadMore,
    pagination: paginationRef.current,
  };

  return (
    <>
      <div className="tw:flex tw:items-center tw:gap-2">
        <AppInput
          name="search"
          placeholder="Search by name..."
          register={register}
          onChange={handleSearchChange}
          className="tw:w-full"
          leftIcon={<Search className="tw:text-gray-500" size={16} />}
        />
        <Controller
          name="partyType"
          control={control}
          render={({ field }) => (
            <AppSelect
              options={partyTypeOptions}
              placeholder="Party Type"
              value={field.value}
              onChange={(value: string) => {
                field.onChange(value);
                filterRef.current = {
                  ...filterRef.current,
                  "partyDetails.type": value || undefined,
                };
                applyFilter();
              }}
              className="tw:w-48"
            />
          )}
        />
      </div>

      <div className="tw:flex tw:items-center tw:justify-between">
        <div>
          <PaginationSummary
            paginationConfig={paginationRef.current}
            loadingTotalRecords={loading}
            loadedCount={data.length}
            fwSize="sm"
          />
        </div>
        <ViewToggle
          viewType={viewType}
          callback={setViewType}
          hideInMobile={false}
          showOnlyIcon
        />
      </div>

      <div>
        {viewType === "card" ? (
          <MobileView {...viewProps} />
        ) : (
          <AppCard noPadding>
            <DesktopView {...viewProps} />
          </AppCard>
        )}
      </div>
    </>
  );
};

export default PayablesReceivables;
