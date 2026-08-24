import { debounce } from "lodash";
import { Barcode } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import { AppInput } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import VoiceMic from "~/components/core/voice-search/VoiceMic";
import { Skeleton } from "~/components/ui/skeleton";
import CommonService from "~/services/CommonService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import MenuChips from "~/shared/inventory/components/menu-chip/MenuChips";
import type { MenuItem } from "~/shared/inventory/components/menu-chip/types";
import NavChips from "~/shared/inventory/components/nav-chips/NavChips";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import CatalogSidePane from "~/shared/inventory/components/catalog-side-pane/CatalogSidePane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type {
  BreadcrumbItem,
  PaginationState,
  SellerDeal,
} from "~/types/CommonTypes";
import InventoryTab from "../components/tab/InventoryTab";
import CategoryBlock from "./components/CategoryBlock";
import { getCount, getData, prepareParams } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Inventory",
    langKey: "inventory",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Browse", langKey: "browseByCategory" },
];

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const InventoryBrowseCategory: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const { register, getValues, setValue } = useForm({
    defaultValues: { search: "", alpha: "" },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const alpha = searchParams.get("alpha") || "";
  const selectedMenuId = searchParams.get("menuId") || "";

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const [addStockModal, setAddStockModal] = useState<{
    show: boolean;
    data: SellerDeal | null;
  }>({ show: false, data: null });

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = useCallback(async () => {
    paginationRef.current = { ...defaultPagination };
    setLoading(true);
    setItems([]);
    try {
      const params = prepareParams(
        { ...getValues(), menuId: selectedMenuId },
        paginationRef.current,
      );
      const res = await getData(params);
      const data = res?.data || [];

      const count = await getCount(params);
      paginationRef.current.totalRecords = count;

      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
    }
  }, [getValues, selectedMenuId]);

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
      const params = prepareParams(
        { ...getValues(), menuId: selectedMenuId },
        paginationRef.current,
      );
      const res = await getData(params);
      const data = res?.data || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, getValues, selectedMenuId]);

  const handleFilterChange = (params: Record<string, any> = {}) => {
    const formData = { ...getValues(), ...params };
    const p: Record<string, any> = {};

    if (formData.alpha) p.alpha = formData.alpha;
    if (formData.search) p.search = formData.search?.trim();
    // Preserve the active menu filter across search/alpha changes.
    if (selectedMenuId) p.menuId = selectedMenuId;

    setSearchParams({ ...p }, { replace: true });
  };

  const handleMenuSelect = (menu: MenuItem | null) => {
    const p: Record<string, any> = {};
    const search = getValues("search")?.trim();
    const alphaVal = getValues("alpha");
    if (search) p.search = search;
    else if (alphaVal) p.alpha = alphaVal;
    if (menu?._id) p.menuId = menu._id;

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

  const handleDealAction = useCallback(
    ({ action, data }: { action: string; data: SellerDeal }) => {
      if (action === "add") {
        setAddStockModal({ show: true, data });
      }
    },
    [],
  );

  return (
    <>
      <AppHeader
        title={t("browseByCategory")}
        showCart={true}
        sectionKey="catalog"
        mobileLead="menu"
        showRecordPayment={false}
      />
      <div className="page-bg app-page tw:p-4">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        {/* <SectionTabs sectionKey="catalog" activeTab="my-catalog" noShadow sticky /> */}

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
              {/* Main column — spans the full grid (the side pane only exists in
                  theme-2 desktop, where the CSS lifts it into the list pane). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <AppBreadcrumbs
                  data={breadcrumbs}
                  className="tw:!mb-2 theme-2-mobile-hide"
                />

                <InventoryTab
                  activeTab="browse-category"
                  className="hide-in-theme-2"
                />

                <div className="catalog-search-sticky catalog-search-flush tw:mb-5 tw:space-y-3">
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

                {/* Menu filter strip. */}
                <MenuChips
                  source="inventory"
                  entity="category"
                  selectedMenuId={selectedMenuId}
                  onSelect={handleMenuSelect}
                  className="tw:mb-3"
                />

                {/* List header — title, count, and A-Z label. */}
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
                  <div className="tw:text-xs tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
                    {t("categories", { defaultValue: "Categories" })}
                    {loading ? (
                      <span className="tw:text-gray-400">{" · "}...</span>
                    ) : paginationRef.current.totalRecords ? (
                      <span className="tw:text-gray-400">
                        {" · "}
                        {paginationRef.current.totalRecords}
                      </span>
                    ) : null}
                  </div>
                  <span className="tw:text-xs tw:font-medium tw:text-gray-400">
                    A–Z
                  </span>
                </div>

                {loading ? (
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    {Array.from({
                      length: paginationRef.current.rowsPerPage,
                    }).map((_, idx) => (
                      <Skeleton
                        key={`s-${idx}`}
                        className="tw:h-16 tw:w-full tw:rounded-xl"
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="tw:flex tw:flex-col tw:gap-2">
                      {items.map((it, idx) => (
                        <CategoryBlock
                          key={`${it._id}-${idx}`}
                          category={it}
                          defaultExpanded={idx === 0}
                          onDealAction={handleDealAction}
                        />
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
                  active (lg+), re-homed by CSS as the fixed catalog list pane. */}
              <AppPaneSide className="app-pane-only">
                <CatalogSidePane
                  scopeLabel={t("categories")}
                  showInventoryValue={false}
                />
              </AppPaneSide>
            </div>
          </div>
        </div>
      </div>

      <InventoryAddStockModal
        show={addStockModal.show}
        productId={addStockModal.data?._id}
        productName={addStockModal.data?.name}
        dealRefId={addStockModal.data?.id}
        mrp={addStockModal.data?.mrp}
        barcodes={addStockModal.data?.barcodes}
        callback={() => setAddStockModal({ show: false, data: null })}
      />
    </>
  );
};

export default InventoryBrowseCategory;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Inventory Browse"),
    },
  ];
}
