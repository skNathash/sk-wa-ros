import { debounce } from "lodash";
import { Barcode, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import { AppInput } from "~/components/core/form";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import AppHeader from "~/components/core/header/AppHeader";
import AppLink from "~/components/core/link/AppLink";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { Skeleton } from "~/components/ui/skeleton";
import CommonService from "~/services/CommonService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import NavChips from "~/shared/inventory/components/nav-chips/NavChips";
import CatalogSidePane from "~/shared/inventory/components/catalog-side-pane/CatalogSidePane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import { getCount, getData, prepareParams } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Inventory",
    langKey: "inventory",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Menus", langKey: "menus" },
];

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

const Menus = () => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue } = useForm({
    defaultValues: { search: "", alpha: "" },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const alpha = searchParams.get("alpha") || "";

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
      const res = await getData(params);
      const data = res?.data || [];

      const count = await getCount(params);
      paginationRef.current.totalRecords = count;

      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    const alphaParam = searchParams.get("alpha") || "";
    setValue("search", search);
    setValue("alpha", search ? "" : alphaParam);

    paginationRef.current = { ...defaultPagination };
    applyFilter();
  }, [searchParams]);

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

  const handleFilterChange = (params: Record<string, any> = {}) => {
    const formData = { ...getValues(), ...params };
    const p: Record<string, any> = {};

    if (formData.alpha) p.alpha = formData.alpha;
    if (formData.search) p.search = formData.search?.trim();

    setSearchParams({ ...p }, { replace: true });
  };

  const handleSearch = debounce(() => {
    setValue("alpha", "");
    handleFilterChange();
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
          handleFilterChange({ search: term });
        }
      }
    },
    [setValue],
  );

  const handleAlphaChange = (a: string) => {
    setValue("search", "");
    handleFilterChange({ alpha: a });
  };

  return (
    <>
      <AppHeader
        title={t("menus")}
        showCart={true}
        sectionKey="catalog"
        mobileLead="menu"
        showRecordPayment={false}
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        {/* <SectionTabs
          sectionKey="catalog"
          activeTab="my-catalog"
          noShadow
          sticky
          
        /> */}

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — catalog section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="my-catalog"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid (the side pane only exists
                  in theme-2 desktop, where the CSS lifts it out of the grid
                  into the fixed list pane; see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <AppBreadcrumbs
                  data={breadcrumbs}
                  className="tw:!mb-2 theme-2-mobile-hide"
                />

                <div className="catalog-search-sticky tw:mb-5 tw:space-y-3">
                  <div className="tw:md:hidden">
                    <NavChips />
                  </div>
                  <AppInput
                    name="search"
                    placeholder={t("search")}
                    register={register}
                    className="tw:w-full"
                    onChange={handleSearch}
                    leftIcon={
                      <Barcode className="tw:text-gray-500" size={16} />
                    }
                    rightIcon={<VoiceMic callback={handleVoiceCallback} />}
                  />
                  <Alpha
                    selected={alpha}
                    callback={handleAlphaChange}
                    className="tw:w-full"
                  />
                </div>

                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loading}
                  loadedCount={items.length}
                  fwSize="sm"
                  className="tw:mb-4"
                />

                {loading ? (
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    {Array.from({
                      length: paginationRef.current.rowsPerPage,
                    }).map((_, idx) => (
                      <Skeleton
                        key={`s-${idx}`}
                        className="tw:h-16 tw:w-full"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="tw:flex tw:flex-col tw:gap-2">
                      {items.map((it, idx) => (
                        <AppLink
                          key={`${it._id}-${idx}`}
                          href={`/dashboard/inventory/products/list?menuId=${
                            it._id
                          }&menuName=${encodeURIComponent(it.name || "")}`}
                          asLink={true}
                          className="tw:block"
                        >
                          <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:p-3 tw:shadow-sm tw:transition-colors tw:hover:bg-slate-50">
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
                                  {it.dealsCount} {t("skus")}
                                </span>
                                {it.brandsCount ? (
                                  <>
                                    <span className="tw:text-slate-300">•</span>
                                    <span className="tw:truncate">
                                      {it.brandsCount} {t("brands")}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                            <div className="tw:shrink-0 tw:text-right">
                              <div className="tw:text-sm tw:font-semibold tw:text-slate-900">
                                ₹
                                {CommonService.commaSeparated(
                                  it.totalInventoryValue || 0,
                                )}
                              </div>
                              <div className="tw:text-[11px] tw:text-slate-400">
                                {t("inventoryValue", {
                                  defaultValue: "Inventory value",
                                })}
                              </div>
                            </div>
                            <ChevronRight
                              size={18}
                              className="tw:shrink-0 tw:text-slate-400"
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
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed catalog
                  list pane beside the icon rail. */}
              <AppPaneSide className="app-pane-only">
                <CatalogSidePane
                  scopeLabel={t("menus")}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Menus;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Menus"),
    },
  ];
}
