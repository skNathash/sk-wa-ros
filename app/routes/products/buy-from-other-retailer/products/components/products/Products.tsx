import { SearchIcon, TagIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Skeleton } from "~/components/ui/skeleton";
import useTheme from "~/hooks/useTheme";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";
import type { PaginationState } from "~/types/CommonTypes";
import ProductCard from "../ProductCard";
import SellerListModal from "~/shared/catalog/modals/seller-list/SellerListModal";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  menuId?: string;
  menuName?: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  distance?: number | string;
  placeholder?: string;
};

const Products = ({
  menuId,
  menuName,
  brandId,
  brandName,
  categoryId,
  categoryName,
  distance = DEFAULT_BROWSE_DISTANCE,
  placeholder = "Select an item to view its products",
}: Props) => {
  const { register, getValues, setValue } = useForm({
    defaultValues: { search: "" },
  });

  const theme = useTheme();
  // theme-2 gives the products column the full remaining width, so keep fewer
  // (wider) columns; other themes pack a denser grid.
  const productGridClass =
    theme === "theme-2"
      ? "tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-3"
      : "tw:grid tw:grid-cols-2 tw:md:grid-cols-5 tw:gap-3";

  const hasSelection = Boolean(menuId || brandId || categoryId);

  const activeFilters = [
    { label: "Menu", value: menuName },
    { label: "Brand", value: brandName },
    { label: "Category", value: categoryName },
  ].filter((f) => f.value);

  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreData, setHasMoreData] = React.useState(true);

  const [sellersModal, setSellersModal] = React.useState<{
    dealId: string;
    show: boolean;
  }>({
    dealId: "",
    show: false,
  });

  const paginationRef = React.useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const buildParams = React.useCallback(
    (page: number) =>
      prepareParams(
        { menuId, brandId, categoryId, search: getValues().search },
        { ...paginationRef.current, activePage: page },
      ),
    [menuId, brandId, categoryId, getValues],
  );

  const applyFilter = React.useCallback(async () => {
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    setItems([]);
    try {
      const params = buildParams(1);
      const [data, count] = await Promise.all([
        getData(params, distance),
        getCount(params, distance),
      ]);
      paginationRef.current.totalRecords = count;
      setItems(data);
      setHasMoreData(data.length > 0 && data.length < count);
    } finally {
      setLoading(false);
    }
  }, [buildParams, distance]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        buildParams(paginationRef.current.activePage),
        distance,
      );
      setItems((prev) => {
        const next = [...prev, ...data];
        setHasMoreData(
          data.length > 0 && next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, buildParams, distance]);

  React.useEffect(() => {
    if (!hasSelection) {
      setItems([]);
      return;
    }
    setValue("search", "");
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, brandId, categoryId, distance]);

  const handleSearch = useDebouncedCallback(() => {
    applyFilter();
  }, 500);

  const handleBuy = (data: { action: string; data?: any }) => {
    if (data.action === "buy" && data.data) {
      setSellersModal({ dealId: data.data, show: true });
    }
  };

  const handleModalCallback = (data: { action: string; data?: any }) => {
    if (data.action === "close") {
      setSellersModal({ dealId: "", show: false });
    }
  };

  if (!hasSelection) {
    return (
      <div className="tw:flex tw:flex-col tw:h-full tw:items-center tw:justify-center tw:text-sm tw:text-gray-400 tw:text-center tw:px-4">
        {placeholder}
      </div>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:h-full tw:overflow-hidden">
      <div className="tw:mb-3">
        <AppInput
          name="search"
          placeholder="Search product"
          register={register}
          className="tw:w-full"
          onChange={() => handleSearch()}
          leftIcon={<SearchIcon className="tw:text-gray-500" />}
        />
      </div>

      {activeFilters.length ? (
        <div className="tw:mb-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
          {activeFilters.map((f) => (
            <span
              key={f.label}
              title={`${f.label}: ${f.value}`}
              className="tw:inline-flex tw:items-center tw:gap-1.5 tw:max-w-full tw:rounded-full tw:bg-primary/10 tw:border tw:border-primary/20 tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-primary"
            >
              <TagIcon className="tw:w-3 tw:h-3 tw:shrink-0 tw:text-primary/60" />
              <span className="tw:text-primary/60">{f.label}:</span>
              <span className="tw:truncate">{f.value}</span>
            </span>
          ))}
        </div>
      ) : null}

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        loadedCount={items.length}
        fwSize="sm"
        className="tw:mb-4"
      />

      <AppScrollArea className="tw:flex-1 tw:min-h-0">
        {loading ? (
          <div className={productGridClass}>
            {Array.from({ length: paginationRef.current.rowsPerPage }).map(
              (_, idx) => (
                <div
                  key={`s-${idx}`}
                  className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:space-y-3"
                >
                  <Skeleton className="tw:h-28 tw:w-full" />
                  <Skeleton className="tw:h-3 tw:w-3/4" />
                  <Skeleton className="tw:h-3 tw:w-1/2" />
                  <Skeleton className="tw:h-7 tw:w-full" />
                </div>
              ),
            )}
          </div>
        ) : items.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className={productGridClass}>
              {items.map((it, idx) => (
                <ProductCard
                  key={`${it._id}-${idx}`}
                  data={it}
                  callback={handleBuy}
                />
              ))}
            </div>

            {hasMoreData && items.length && !loading ? (
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={items.length}
              />
            ) : null}
          </>
        )}
      </AppScrollArea>

      <SellerListModal
        show={sellersModal.show}
        dealId={sellersModal.dealId}
        callback={handleModalCallback}
        distance={distance}
      />
    </div>
  );
};

export default Products;
