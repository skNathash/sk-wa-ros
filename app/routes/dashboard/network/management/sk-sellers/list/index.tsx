import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import useScreenView from "~/hooks/useScreenView";
import PageAccessService from "~/services/PageAccessService";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import type { ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import { getCount, getData, prepareParams } from "./helper";
import CommonService from "~/services/CommonService";
import Filter from "./components/Filter";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["NETWORK.VIEW-USERS"]);
}

const defaultFilter = {
  distanceKm: "30",
  search: "",
  brands: [],
  alpha: "",
};

const SkSellersList = () => {
  const { t } = useTranslation(["common"]);

  const { isMobile } = useScreenView();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [view, setView] = useState<ViewToggleType>("list");

  const methods = useForm({
    defaultValues: {
      ...defaultFilter,
    },
    mode: "onChange",
  });

  const filterRef = useRef<Record<string, any>>({
    ...defaultFilter,
  });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    endSlNo: 10,
    rowsPerPage: 10,
    startSlNo: 1,
    totalRecords: 0,
  });
  const sortRef = useRef<{ key: string; value: "asc" | "desc" }>({
    key: "name",
    value: "asc",
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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current,
      );
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

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const result = await getData(params);
      setData((prev) => [...prev, ...(result || [])]);
      setHasMoreData(
        (result || []).length >= paginationRef.current.rowsPerPage,
      );
    } catch (e) {
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    applyFilter();
  }, []);

  const handleSort = useCallback(({ key, value }: SortProps) => {
    sortRef.current = { key, value: value || "asc" };
    applyFilter();
  }, []);

  const onFilterChange = useCallback(
    (filters: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...filters.formData,
      };
      applyFilter();
    },
    [applyFilter],
  );

  return (
    <>
      <AppCard
        title={t("storeKingSellers")}
        icon="building-2"
        iconClassName="tw:text-orange-500"
        subtitle={t("joinStoreKingSellersNetwork")}
      >
        <FormProvider {...methods}>
          <Filter onFilterChange={onFilterChange} />
        </FormProvider>

        <div className="tw:flex tw:items-end tw:justify-between tw:mb-4">
          <div>
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loading}
              fwSize="sm"
              loadedCount={data.length}
              className="tw:mb-0"
            />
          </div>
          <ViewToggle viewType={view} callback={setView} />
        </div>

        {isMobile || view === "card" ? (
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
            <MobileView data={data} loading={loading} />
          </div>
        ) : (
          <DesktopView
            data={data}
            loading={loading}
            sortKey={sortRef.current.key}
            sortValue={sortRef.current.value}
            onSort={handleSort}
          />
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
      </AppCard>
    </>
  );
};

export default SkSellersList;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("SK Sellers"),
    },
  ];
}
