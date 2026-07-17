import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState, SortProps } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";
import AppCard from "~/components/core/card/AppCard";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import { debounce } from "lodash";

type Props = {
  vendorId: string;
  selectedCategoryId?: string;
  selectedCategoryName?: string;
  selectedBrandId?: string;
  selectedBrandName?: string;
};

const Products = ({
  vendorId,
  selectedCategoryId,
  selectedBrandId,
  selectedBrandName,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, getValues } = useForm();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Refs
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });
  const filterRef = useRef<Record<string, any>>({});
  const sortRef = useRef<SortProps>({
    key: "name",
    value: "asc",
  });

  const applyFilter = useCallback(async () => {
    // only require brandId to load products
    if (!filterRef.current || !filterRef.current.brandId) {
      setData([]);
      paginationRef.current.totalRecords = 0;
      setHasMoreData(false);
      setLoading(false);
      return;
    }

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
        sortRef.current.value
          ? (sortRef.current as { key: string; value: "asc" | "desc" })
          : null
      );
      const result = await getData(filterRef.current.vendorId, params);
      setData(result || []);
      const totalRecords = await getCount(filterRef.current.vendorId, params);
      paginationRef.current.totalRecords = totalRecords;
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
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
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current.value
          ? (sortRef.current as { key: string; value: "asc" | "desc" })
          : null
      );
      const result = await getData(filterRef.current.vendorId, params);
      setData((prev) => [...prev, ...result]);
      setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData]);

  useEffect(() => {
    filterRef.current = {
      ...filterRef.current,
      vendorId,
      categoryId: selectedCategoryId,
      brandId: selectedBrandId,
    };
    applyFilter();
  }, [vendorId, selectedCategoryId, selectedBrandId]);

  const handleSearch = useCallback(
    debounce(() => {
      filterRef.current = {
        ...filterRef.current,
        search: getValues("search"),
      };
      applyFilter();
    }, 500),
    []
  );

  return (
    <AppCard
      title={
        selectedBrandName
          ? `${selectedBrandName} Products (${paginationRef.current.totalRecords})`
          : `Products (${paginationRef.current.totalRecords})`
      }
      noContentPadding={true}
    >
      <div className="tw:px-4">
        <AppInput
          name="search"
          placeholder="Search"
          register={register}
          className="tw:w-full tw:mb-4"
          onChange={handleSearch}
        />
      </div>

      <AppScrollArea className="tw:h-96 tw:px-4">
        {loading ? (
          <div>Loading...</div>
        ) : !selectedBrandId ? (
          <div>Please select a brand</div>
        ) : data && data.length ? (
          data.map((item: any) => (
            <div
              key={item?.id}
              className="tw:border tw:border-gray-200 tw:rounded-md tw:p-3 tw:box-border tw:mb-3"
            >
              <div className="tw:text-sm tw:font-medium">{item.name}</div>

              <div className="tw:flex tw:gap-4 tw:mt-2 tw:text-gray-600 tw:text-sm tw:items-center">
                <div className="tw:flex tw:gap-2">
                  <span className="tw:font-bold">{item.totalBrands || 0}</span>
                  <span className="tw:opacity-90">Brands</span>
                </div>

                <div className="tw:flex tw:gap-2">
                  <span className="tw:font-bold">
                    {item.totalProducts || 0}
                  </span>
                  <span className="tw:opacity-90">Products</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div>No products found</div>
        )}
      </AppScrollArea>
      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-6">
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={loadMore}
            isLoading={loadingMore}
            disabled={loadingMore}
          >
            {loadingMore
              ? t("loading")
              : `${t("loadMore")}  ${data.length}/${
                  paginationRef.current.totalRecords
                }`}
          </AppButton>
        </div>
      )}
    </AppCard>
  );
};

export default Products;
