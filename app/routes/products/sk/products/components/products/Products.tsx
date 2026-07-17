import { SearchIcon, TagIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { AppInput } from "~/components/core/form";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import { Skeleton } from "~/components/ui/skeleton";
import useTheme from "~/hooks/useTheme";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import BasketRequestModal from "~/modals/feature/product/basket-request/BasketRequestModal";
import { AuthService } from "~/services/AuthService";
import OtherRecommendedDealModal from "~/shared/catalog/modals/other-deals/OtherRecommendedDealModal";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

type Props = {
  menuId?: string;
  menuName?: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  placeholder?: string;
};

const Products = ({
  menuId,
  menuName,
  brandId,
  brandName,
  categoryId,
  categoryName,
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

  const [cartActionHandler, setCartActionHandler] = React.useState<{
    action: string;
    deal: any;
  }>({
    action: "",
    deal: {},
  });

  const [basketRequestModal, setBasketRequestModal] = React.useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [productDetailModal, setProductDetailModal] = React.useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [otherDealModal, setOtherDealModal] = React.useState<{
    show: boolean;
    dealId: string;
  }>({
    show: false,
    dealId: "",
  });

  const paginationRef = React.useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  // Tracks the in-flight request so a newer selection (category/brand/search)
  // cancels the previous one. This guarantees the column always shows data for
  // the last clicked item, even if an earlier request resolves later.
  const abortRef = React.useRef<AbortController | null>(null);

  const buildParams = React.useCallback(
    (page: number) =>
      prepareParams(
        { menuId, brandId, categoryId, search: getValues().search },
        page,
        paginationRef.current.rowsPerPage,
      ),
    [menuId, brandId, categoryId, getValues],
  );

  const applyFilter = React.useCallback(async () => {
    // Cancel any request still in flight for a previous selection.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    setItems([]);
    try {
      const params = buildParams(1);
      const [data, count] = await Promise.all([
        getData(params, signal),
        getCount(params, signal),
      ]);
      // A newer selection superseded this one — drop the stale result.
      if (signal.aborted) return;
      paginationRef.current.totalRecords = count;
      setItems(data);
      setHasMoreData(data.length > 0 && data.length < count);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [buildParams]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;

    // Reuse the abort ref so switching selection mid-load discards this page.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const data = await getData(
        buildParams(paginationRef.current.activePage),
        signal,
      );
      if (signal.aborted) return;
      setItems((prev) => {
        const next = [...prev, ...data];
        setHasMoreData(
          data.length > 0 && next.length < paginationRef.current.totalRecords,
        );
        return next;
      });
    } finally {
      if (!signal.aborted) setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, buildParams]);

  React.useEffect(() => {
    if (!hasSelection) {
      abortRef.current?.abort();
      setItems([]);
      return;
    }
    setValue("search", "");
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, brandId, categoryId]);

  // Abort any in-flight request when the component unmounts.
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const handleSearch = useDebouncedCallback(() => {
    applyFilter();
  }, 500);

  const handleAddToCart = (response: { action: string; data?: any }) => {
    const { action, data } = response;

    if (action === "group-deal") {
      setCartActionHandler({
        action: "group-deal",
        deal: data.data.deal,
      });
      return;
    }

    if (action === "click") {
      setProductDetailModal({
        show: true,
        data: data.deal,
      });
    }

    if (action === "add-to-basket") {
      setBasketRequestModal({
        show: true,
        data: data,
      });
    }

    const id = data?.data?.data?.id;
    const showOtherDeals = data?.data?.data?.showOtherDeals;
    if (action === "add" && id && showOtherDeals && !AuthService.isBuyerUser()) {
      setOtherDealModal({ show: true, dealId: id });
    }
  };

  const handleCartAction = () => {
    setCartActionHandler({
      action: "",
      deal: {},
    });
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
              className="tw:inline-flex tw:items-center tw:gap-1.5 tw:max-w-full tw:rounded-full tw:bg-primary/8 tw:border tw:border-primary/15 tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:text-primary"
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
                  key={`${it.id || it._id}-${idx}`}
                  data={it}
                  callback={handleAddToCart}
                  type={1}
                  cartType="normal"
                  useBusyLoader={true}
                />
              ))}
            </div>

            {hasMoreData && items.length && !loading ? (
              <div className="tw:flex tw:justify-center tw:mt-4">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              </div>
            ) : null}
          </>
        )}
      </AppScrollArea>

      <BasketRequestModal
        show={basketRequestModal.show}
        callback={() => {
          setBasketRequestModal({
            show: false,
            data: {},
          });
        }}
        dealId={basketRequestModal.data.id as string}
      />

      <ProductDetailModal
        show={productDetailModal.show}
        callback={() => {
          setProductDetailModal({
            show: false,
            data: {},
          });
        }}
        dealId={productDetailModal.data._id as string}
        cartType="normal"
      />

      <OtherRecommendedDealModal
        show={otherDealModal.show}
        dealId={otherDealModal.dealId}
        callback={(e: { action: string; data?: any }) => {
          if (e.action === "close") {
            setOtherDealModal({ show: false, dealId: "" });
          }
        }}
      />

      <AddToCartActionHandler
        action={cartActionHandler.action}
        deal={cartActionHandler.deal}
        callback={handleCartAction}
      />
    </div>
  );
};

export default Products;
