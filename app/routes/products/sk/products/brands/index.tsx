import { debounce } from "lodash";
import { SearchIcon } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Alpha from "~/components/core/alpha/Alpha";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import { AppInput } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import { useSidebar } from "~/components/ui/sidebar";
import useScreenView from "~/hooks/useScreenView";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem, PaginationState } from "~/types/CommonTypes";
import SkProductsTab from "../../components/SkProductsTab";
import Products from "../components/products/Products";
import BrandGrid from "./components/BrandGrid";
import BrandList, { type BrandItem } from "./components/BrandList";
import CategoryList, { type CategoryItem } from "./components/categories/CategoryList";
import { getCount, getData, prepareParams } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  { label: "Products", langKey: "products", redirect: { path: "/products/sk" } },
  { label: "Browse SK Brands", langKey: "browseSKBrands" },
];

const BrandsPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const { setOpen } = useSidebar();

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  const { register, getValues, setValue } = useForm({
    defaultValues: {
      search: "",
      alpha: "",
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();

  const alpha = searchParams.get("alpha") || "";

  const [items, setItems] = React.useState<BrandItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMoreData, setHasMoreData] = React.useState(true);

  const [selectedBrand, setSelectedBrand] = React.useState<BrandItem | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryItem | null>(null);

  const handleSelectBrand = (brand: BrandItem) => {
    setSelectedBrand(brand);
    setSelectedCategory(null);
  };

  const paginationRef = React.useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = React.useCallback(async () => {
    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    setLoading(true);
    setItems([]);
    try {
      const params = prepareParams(getValues(), paginationRef.current);
      const data = (await getData(params)) || [];

      const count = await getCount(params);
      paginationRef.current.totalRecords = count;

      setItems(data);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);

      // auto-select the first brand so the category/product columns populate
      setSelectedBrand(data[0] || null);
      setSelectedCategory(null);
    } finally {
      setLoading(false);
    }
  }, [getValues]);

  React.useEffect(() => {
    const search = searchParams.get("search") || "";
    const a = searchParams.get("alpha") || "";

    setValue("search", search);
    setValue("alpha", search ? "" : a);

    paginationRef.current = { ...paginationRef.current, activePage: 1 };
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(getValues(), paginationRef.current);
      const data = (await getData(params)) || [];
      setItems((prev) => [...prev, ...data]);
      setHasMoreData(data.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, getValues]);

  const handleFilterChange = (params: Record<string, any> = {}) => {
    const formData = { ...getValues(), ...params };

    let p: Record<string, any> = {};

    if (formData.alpha) {
      p.alpha = formData.alpha;
    }

    if (formData.search) {
      p.search = formData.search?.trim();
    }

    setSearchParams(
      {
        ...p,
      },
      { replace: true },
    );
  };

  const handleSearch = debounce(() => {
    setValue("alpha", "");
    handleFilterChange();
  }, 500);

  const handleAlphaChange = (a: string) => {
    setValue("search", "");
    handleFilterChange({ alpha: a });
  };

  return (
    <>
      <AppHeader
        title={
          <span className="tw:flex tw:items-center tw:gap-2">
            <ImgRender src="logo.svg" alt="StoreKing" className="tw:h-5 tw:w-5" />
            {t("browseSKBrands")}
          </span>
        }
        showCart={true}
      />
      <div className="page-bg app-page tw:p-4">
        <SectionTabs
          sectionKey="supply"
          activeTab="buy-from-sk"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="supply"
                activeTab="buy-from-sk"
                title={t("manageSupply", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            <div className="tw:mb-4 tw:relative tw:z-10">
              <SkProductsTab activeTab="brands" className="tw:mb-4" />

              <div className="browse-grid--brand tw:grid tw:grid-cols-1 tw:md:grid-cols-[20rem_22rem_1fr] tw:md:grid-rows-1 tw:gap-3 tw:h-[calc(100vh-12rem)]">
              <div className="tw:flex tw:flex-col tw:gap-2 tw:min-h-0 tw:h-full">
                <AppInput
                  name="search"
                  placeholder="Search"
                  register={register}
                  className="tw:w-full"
                  onChange={handleSearch}
                  leftIcon={<SearchIcon className="tw:text-gray-500" />}
                />
                <Alpha
                  selected={alpha}
                  callback={handleAlphaChange}
                  className="tw:w-full"
                />
                <PaginationSummary
                  paginationConfig={paginationRef.current}
                  loadingTotalRecords={loading}
                  loadedCount={items.length}
                  fwSize="sm"
                />
                <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto">
                  {isMobile ? (
                    <BrandGrid
                      items={items}
                      loading={loading}
                      loadingMore={loadingMore}
                      hasMoreData={hasMoreData}
                      totalRecords={paginationRef.current.totalRecords}
                      rowsPerPage={paginationRef.current.rowsPerPage}
                      loadMore={loadMore}
                    />
                  ) : (
                    <BrandList
                      items={items}
                      loading={loading}
                      loadingMore={loadingMore}
                      hasMoreData={hasMoreData}
                      totalRecords={paginationRef.current.totalRecords}
                      selectedId={selectedBrand?._id}
                      onSelect={handleSelectBrand}
                      loadMore={loadMore}
                    />
                  )}
                </div>
              </div>

              {!isMobile && (
                <>
                  <CategoryList
                    brandId={selectedBrand?._id}
                    brandName={selectedBrand?._displayName || selectedBrand?.name}
                    selectedId={selectedCategory?._id}
                    onSelect={setSelectedCategory}
                  />

                  <Products
                    brandId={selectedBrand?._id}
                    brandName={selectedBrand?.name}
                    categoryId={selectedCategory?._id}
                    categoryName={selectedCategory?.name}
                    placeholder="Select a brand to view its products"
                  />
                </>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrandsPage;
