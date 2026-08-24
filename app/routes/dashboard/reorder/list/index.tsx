import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { AppInput } from "~/components/core/form/AppInput";
import clsx from "clsx";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import useAppToast from "~/hooks/useAppToast";
import useDebounce from "~/hooks/useDebounce";
import type {
  BreadcrumbItem,
  PaginationState,
  TabItem,
} from "~/types/CommonTypes";
import { getData, getCount, getMetrics, prepareParams } from "./helper";
import MetricsStrip from "./components/MetricsStrip";
import ReorderCard from "./components/ReorderCard";

const sortOptions: TabItem[] = [
  { key: "urgency", name: "Sort: Urgency" },
  { key: "fast-movers", name: "Fast movers" },
  { key: "oos-first", name: "OOS first" },
  { key: "sk", name: "SK" },
  { key: "peer", name: "Seller" },
];

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  { label: "Reorder" },
];

export default function ReorderListPage() {
  const { t } = useTranslation(["menu"]);
  const toast = useAppToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSort = searchParams.get("sort") || "urgency";
  const searchQuery = searchParams.get("search") || "";
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const methods = useForm({
    defaultValues: {
      search: searchParams.get("search") || "",
    },
  });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 20,
    startSlNo: 1,
    endSlNo: 20,
    totalRecords: 0,
  });

  const fetchData = useCallback(
    async (page: number, append: boolean) => {
      if (!append) {
        setLoading(true);
        setItems([]);
      } else {
        setLoadingMore(true);
      }

      try {
        const filter = { search: debouncedSearch };
        const pagination = { ...paginationRef.current, activePage: page };
        const params = prepareParams(filter, pagination, activeSort);

        const [data, count] = await Promise.all([
          getData(params),
          getCount(params),
        ]);

        paginationRef.current.totalRecords = count;
        paginationRef.current.activePage = page;

        setItems((prev) => (append ? [...prev, ...data] : data));

        const loadedSoFar =
          (page - 1) * paginationRef.current.rowsPerPage + data.length;
        setHasMoreData(loadedSoFar < count);
      } catch (error) {
        console.error("Error loading reorder list:", error);
        toast.show({ msg: "Failed to load reorder data", color: "danger" });
      } finally {
        if (!append) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [activeSort, debouncedSearch, toast],
  );

  const loadData = useCallback(() => fetchData(1, false), [fetchData]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    methods.reset({ search });
  }, [searchParams, methods]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    await fetchData(paginationRef.current.activePage + 1, true);
  }, [fetchData, hasMoreData, loadingMore]);

  const handleSortChange = (tab: TabItem) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("sort", tab.key);
        return p;
      },
      { replace: true } as any,
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (value.trim()) {
          p.set("search", value.trim());
        } else {
          p.delete("search");
        }
        return p;
      },
      { replace: true } as any,
    );
  };

  const metrics = getMetrics(items);

  return (
    <>
      <AppHeader
        title={
          <div className="tw:flex tw:flex-col">
            <h2 className="tw:text-base tw:font-semibold">
              Reorder · {paginationRef.current.totalRecords} SKUs
            </h2>
            <p className="tw:text-xs tw:mt-0.5">
              Run out in 4 days avg · save ₹{metrics.saveThisWeek}
            </p>
          </div>
        }
      />

      <div className="page-bg app-page tw:p-4">
        <SectionTabs
          sectionKey="supply"
          activeTab="catalog"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight page-content-gap">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="catalog"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

            <div className="tw:mb-4">
              <MetricsStrip
                stockoutValue={metrics.stockoutValue}
                saveThisWeek={metrics.saveThisWeek}
                slowCash={metrics.slowCash}
              />
            </div>

            <div className="tw:mb-4 tw:-mx-4 tw:px-4 tw:overflow-x-auto hide-scrollbar">
              <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-fit">
                {sortOptions.map((option) => {
                  const isActive = activeSort === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSortChange(option)}
                      className={clsx(
                        "tw:shrink-0 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-medium tw:transition-colors tw:cursor-pointer",
                        isActive
                          ? "tw:border-primary tw:bg-primary tw:text-white"
                          : "tw:border-gray-200 tw:bg-white tw:text-gray-600 hover:tw:text-gray-800 hover:tw:border-gray-300 hover:tw:bg-gray-50",
                      )}
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormProvider {...methods}>
              <div className="tw:mb-4">
                <AppInput
                  name="search"
                  placeholder="Search SKU / product"
                  register={methods.register}
                  leftIcon={<Search size={16} className="tw:text-slate-400" />}
                  onChange={handleSearchChange}
                />
              </div>
            </FormProvider>

            {loading && items.length === 0 ? (
              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="tw:h-20 tw:rounded-2xl tw:bg-white tw:shadow-sm tw:animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                  {items.map((item) => (
                    <ReorderCard key={item.id} item={item} />
                  ))}
                </div>

                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={items.length}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
