import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import BrowseContainer from "~/shared/catalog/components/browse/container/BrowseContainer";
import Item from "~/shared/catalog/components/browse/item/Item";
import NoData from "~/components/core/no-data/NoData";
import type { PaginationState } from "~/types/CommonTypes";
import helper from "./helper";
import { useTranslation } from "react-i18next";

type BrandSourceType = "subscribe" | "inventory";

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const BrowseBrands: React.FC<{
  type?: BrandSourceType;
  callback?: (params: { action: string; data?: any }) => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  dependsOn?: string[];
  menuId?: string;
  categoryId?: string;
  selectedId?: string | number;
}> = ({
  type = "inventory",
  callback,
  title,
  subtitle,
  dependsOn,
  menuId,
  categoryId,
  selectedId,
}) => {
  const { t } = useTranslation(["common"]);

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [alpha, setAlpha] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  // selection is driven by selectedId prop (controlled)

  // Refs
  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const filterRef = useRef<Record<string, any>>({});

  const depSatisfied = useMemo(() => {
    if (!dependsOn || dependsOn.length === 0) {
      return true;
    }

    return dependsOn.every((d) => {
      const key = d?.trim?.();

      if (!key) return false;

      if (key === "menu") {
        return Boolean(menuId);
      }

      if (key === "category") {
        return Boolean(categoryId);
      }

      return false;
    });
  }, [dependsOn, menuId, categoryId]);

  // wrappers for helper
  const getData = useCallback(
    async (params: Record<string, any>) => {
      return helper.getData(type, params);
    },
    [type]
  );

  const getCount = useCallback(
    async (params: Record<string, any>) => {
      return helper.getCount(type, params);
    },
    [type]
  );

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setItems([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    try {
      const params = helper.prepareParams(
        type,
        filterRef.current,
        paginationRef.current
      );

      const count = await getCount(params);
      paginationRef.current.totalRecords = count;

      const result = await getData(params);
      const data = (result && result.data) || [];
      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      setItems([]);
      setHasMoreData(false);
    } finally {
      setLoading(false);
    }
  }, [getCount, getData, type]);

  // Load more handler
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = helper.prepareParams(
        type,
        filterRef.current,
        paginationRef.current
      );
      const result = await getData(params);
      const data = (result && result.data) || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } catch (e) {
      // noop
    } finally {
      setLoadingMore(false);
    }
  }, [getData, hasMoreData, loadingMore, type]);

  useEffect(() => {
    if (menuId) {
      filterRef.current = { ...filterRef.current, menuId };
    } else {
      if ((filterRef.current as any).menuId) {
        delete (filterRef.current as any).menuId;
      }
    }

    if (categoryId) {
      filterRef.current = {
        ...filterRef.current,
        category: { _id: categoryId },
      };
    } else {
      if ((filterRef.current as any).category) {
        delete (filterRef.current as any).category;
      }
    }

    setSearch("");
    setAlpha("");
    if (filterRef.current) {
      delete (filterRef.current as any).search;
      delete (filterRef.current as any).alpha;
    }

    if (!dependsOn || dependsOn.length === 0) {
      applyFilter();
      return;
    }

    if (depSatisfied) {
      applyFilter();
    }
  }, [applyFilter, depSatisfied, dependsOn, menuId, categoryId]);

  const debounceSearch = useCallback(
    debounce((val: string) => {
      applyFilter();
    }, 500),
    [applyFilter]
  );

  // BrowseContainer callbacks (search, alpha)
  const handleBrowseCallback = useCallback(
    (p: { action: string; data?: any }) => {
      if (p.action === "search") {
        setSearch(p.data || "");
        filterRef.current = { ...filterRef.current, search: p.data };
        setAlpha("");
        if (filterRef.current) delete filterRef.current.alpha;

        debounceSearch(p.data || "");
        return;
      }

      if (p.action === "alpha") {
        setAlpha(p.data || "");
        filterRef.current = { ...filterRef.current, alpha: p.data };

        setSearch("");
        if (filterRef.current) delete filterRef.current.search;

        applyFilter();
        return;
      }
    },
    [applyFilter]
  );

  const onItemCallback = (payload: { action: string; data?: any }) => {
    if (payload.action === "view") {
      // inform parent; selection is controlled by parent via `selectedId`
      callback && callback(payload);
    }
  };

  if (dependsOn?.length && !depSatisfied) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-200px)] tw:bg-white tw:rounded-md tw:border tw:border-gray-200">
        <div className="tw:text-gray-500 tw:text-sm tw:text-center">
          Please select a {dependsOn?.join(" or ")} to view brands.
        </div>
      </div>
    );
  }

  return (
    <BrowseContainer
      callback={handleBrowseCallback}
      search={search}
      alpha={alpha}
      title={title}
      subtitle={`${paginationRef.current.totalRecords} ${t("brands")}`}
      isLoading={loading}
    >
      {items.map((it) => (
        <Item
          key={it._id}
          id={it._id}
          name={it._displayName || it.name}
          image={it._displayImg}
          totalDeals={it.totalDeals}
          selected={selectedId != null && String(selectedId) === String(it._id)}
          callback={onItemCallback}
        />
      ))}

      {!loading && items.length === 0 && <NoData />}

      {hasMoreData && !loading && (
        <div className="tw:flex tw:justify-center tw:mt-2">
          <LoadMoreButton
            loadMore={loadMore}
            loading={loadingMore}
            totalCount={paginationRef.current.totalRecords}
            loadedCount={items.length}
          />
        </div>
      )}
    </BrowseContainer>
  );
};

export default BrowseBrands;
