import { debounce } from "lodash";
import { Barcode, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Alpha from "~/components/core/alpha/Alpha";
import { AppInput } from "~/components/core/form";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import { Skeleton } from "~/components/ui/skeleton";
import PageAccessService from "~/services/PageAccessService";
import type { PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { allowNoSubscribe: true });
}

// Left accent bar colors, cycled per row to mirror the shared design.
const ACCENTS = [
  "tw:bg-emerald-500",
  "tw:bg-indigo-500",
  "tw:bg-purple-500",
  "tw:bg-orange-500",
  "tw:bg-sky-500",
  "tw:bg-rose-500",
];

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const Menus: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue, watch } = useForm({
    defaultValues: { search: "", alpha: "" },
  });

  const alpha = watch("alpha");

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = useCallback(async () => {
    paginationRef.current = { ...defaultPagination };
    setLoading(true);
    setItems([]);
    try {
      const params = prepareParams(getValues(), paginationRef.current);

      const count = await getCount(params);
      paginationRef.current.totalRecords = count;

      const res = await getData(params);
      const data = res?.data || [];

      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(getValues(), paginationRef.current);
      const res = await getData(params);
      const data = res?.data || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, getValues]);

  const handleSearch = debounce(() => {
    setValue("alpha", "");
    applyFilter();
  }, 500);

  const handleVoiceCallback = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if ((action === "close" || action === "scan") && data) {
        const term = Array.isArray(data.keywords)
          ? data.keywords.filter(Boolean)[0]
          : data.search;
        if (term && typeof term === "string") {
          setValue("alpha", "");
          setValue("search", term);
          applyFilter();
        }
      }
    },
    [setValue, applyFilter],
  );

  const handleAlphaChange = (a: string) => {
    setValue("search", "");
    setValue("alpha", a);
    applyFilter();
  };

  return (
    <div className="tw:mb-4">
      {/* Search + A–Z filter. Stacked on mobile; side by side from lg, where
          there is room for the letter strip beside a fixed-width search box. */}
      <div className="catalog-search-sticky catalog-search-flush tw:mb-3 tw:space-y-3 tw:lg:flex tw:lg:items-center tw:lg:gap-4 tw:lg:space-y-0">
        <AppInput
          name="search"
          placeholder={t("common:searchByMenuName", "Search by menu name")}
          register={register}
          className="tw:w-full tw:lg:w-72 tw:lg:shrink-0"
          onChange={handleSearch}
          // leftIcon={<Barcode className="tw:text-gray-500" size={16} />}
          rightIcon={<VoiceMic callback={handleVoiceCallback} />}
        />
        <Alpha
          selected={alpha}
          callback={handleAlphaChange}
          className="tw:w-full tw:lg:min-w-0 tw:lg:flex-1"
        />
      </div>

      {/* List header — title, total count, and A–Z label. */}
      <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between">
        <div className="tw:text-xs tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
          {t("menus", { defaultValue: "Menus" })}
          {loading ? (
            <span className="tw:text-gray-400">{" · "}...</span>
          ) : paginationRef.current.totalRecords ? (
            <span className="tw:text-gray-400">
              {" · "}
              {paginationRef.current.totalRecords}
            </span>
          ) : null}
        </div>
        <span className="tw:text-xs tw:font-medium tw:text-gray-400">A–Z</span>
      </div>

      {loading ? (
        <div className="tw:grid tw:grid-cols-1 tw:gap-2 tw:md:grid-cols-2 tw:md:gap-3 tw:xl:grid-cols-3">
          {Array.from({ length: paginationRef.current.rowsPerPage }).map(
            (_, idx) => (
              <Skeleton
                key={`s-${idx}`}
                className="tw:h-16 tw:w-full tw:rounded-xl"
              />
            ),
          )}
        </div>
      ) : (
        <>
          <div className="tw:grid tw:grid-cols-1 tw:gap-2 tw:md:grid-cols-2 tw:md:gap-3 tw:xl:grid-cols-3">
            {items.map((it, idx) => (
              <AppLink
                key={`${it._id}-${idx}`}
                href={`/dashboard/inventory/subscribe/search?menuId=${
                  it._id
                }&menuName=${encodeURIComponent(it._displayName || it.name || "")}`}
                asLink={true}
                className="tw:block tw:h-full"
              >
                <div className="tw:group tw:flex tw:h-full tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:shadow-sm tw:transition-all tw:hover:bg-slate-50 tw:md:p-4 tw:md:hover:-translate-y-0.5 tw:md:hover:border-slate-300 tw:md:hover:shadow-md">
                  <span
                    className={`tw:h-10 tw:w-1.5 tw:shrink-0 tw:rounded-full ${
                      ACCENTS[idx % ACCENTS.length]
                    }`}
                  />
                  <div className="tw:min-w-0 tw:flex-1">
                    <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                      {it._displayName || it.name}
                    </div>
                    <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2 tw:text-xs tw:text-slate-500">
                      <span>
                        {it.totalDeals || 0} {t("skus")}
                      </span>
                      {it.uniqueBrandCount ? (
                        <>
                          <span className="tw:text-slate-300">•</span>
                          <span className="tw:truncate">
                            {it.uniqueBrandCount} {t("brands")}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="tw:shrink-0 tw:text-slate-400 tw:transition-transform tw:group-hover:translate-x-0.5"
                  />
                </div>
              </AppLink>
            ))}
          </div>

          {!loading && items.length === 0 ? <NoData /> : null}

          {hasMoreData && items.length && !loading ? (
            <div className="tw:mt-3 tw:flex tw:justify-center">
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
    </div>
  );
};

export default Menus;
