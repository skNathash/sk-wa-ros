import { debounce } from "lodash";
import { ArrowRight, Mic, SearchIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import VoiceSearch from "~/components/core/voice-search/VoiceSearch";
import MenuCategories from "~/components/feature/products/menu-categories/MenuCategories";
import VoiceSearchFab from "~/components/feature/utility/voice-search-fab/VoiceSearchFab";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BreadcrumbItem } from "~/types/CommonTypes";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    langKey: "products",
    redirect: {
      path: "/products/main",
    },
  },
  {
    label: "Search",
    langKey: "search",
  },
];

const Search = () => {
  const { t } = useTranslation();

  const { register, control, getValues, setValue } = useForm();

  const appNav = useAppNav();

  const isBuyerLogin = AuthService.isBuyerUser();

  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);

  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    brand: any[];
    category: any[];
    deal: any[];
  }>({
    brand: [],
    category: [],
    deal: [],
  });

  const [productDetailModal, setProductDetailModal] = useState({
    show: false,
    data: {
      id: "",
    },
  });

  const [keys, setKeys] = useState<string[]>([]);

  const search = useWatch({ control: control, name: "search" });

  useEffect(() => {
    const loadMenus = async () => {
      setLoading(true);
      try {
        let data = null as any;
        if (AuthService.isBuyerUser()) {
          const resp = await SellerCatalogService.getMenus({
            filter: {
              status: "Active",
              availableQuantity: { $gt: 0 },
            },
          });
          data = SellerCatalogService.formatMenuResponse(resp.data?.data || []);
        } else {
          const menuResp = await ProductService.getMenus();
          data = menuResp.data || [];
        }
        setMenus(data || []);
      } finally {
        setLoading(false);
      }
    };

    loadMenus();
  }, []);

  const handleSearch = useCallback(
    debounce(async () => {
      const searchValue = getValues("search")?.trim();
      if (!searchValue) {
        setSearchResults({
          brand: [],
          category: [],
          deal: [],
        });
        setSearching(false);
        setHasSearched(false);
        if (keys.length > 0) setKeys([]);
        return;
      }
      setSearching(true);
      setHasSearched(true);

      if (isBuyerLogin) {
        const response = await SellerCatalogService.getProducts({
          filter: {
            search: searchValue,
          },
          parent: true,
        });
        setSearchResults({
          brand: [],
          category: [],
          deal: SellerCatalogService.formatProductResponse(
            response.data?.data || [],
          ),
        });
      } else {
        const { data } = await ProductService.search(searchValue);
        setSearchResults(data);
      }
      setSearching(false);
    }, 500),
    [getValues],
  );

  // Handle voice search callback: update URL params and input
  const handleVoiceSearchCallback = useCallback(
    ({ action, data }: { action: string; data?: any }) => {
      if ((action === "close" || action === "scan") && data) {
        // Prefer explicit keywords array if present
        if (data.keywords && Array.isArray(data.keywords)) {
          const arr = data.keywords.filter(Boolean);
          if (arr.length > 0) {
            setKeys(arr);
            setValue("search", arr[0]);
          }
        } else if (data.search && typeof data.search === "string") {
          // Fallback to a single search string
          setKeys([data.search]);
          setValue("search", data.search);
        }

        handleSearch();
      }
    },
    [setKeys, setValue, handleSearch],
  );

  const seeAll = (menu: any) => {
    if (AuthService.isBuyerUser()) {
      appNav.to("/products/sk", {
        menuId: menu._id,
        menuName: menu.name,
      });
    } else {
      appNav.to("/products/sk", {
        categoryId: menu._id,
        categoryName: menu.name,
      });
    }
  };

  const onBrandClick = (brand: any) => {
    appNav.to("/products/sk", {
      brandIds: brand._id,
      brandNames: brand.name,
    });
  };

  const onCategoryClick = (category: any) => {
    appNav.to("/products/sk", {
      categoryIds: category._id,
      categoryNames: category.name,
    });
  };

  const onDealClick = (deal: any) => {
    setProductDetailModal({ show: true, data: { id: deal._id } });
  };

  const productModalCallback = () => {
    setProductDetailModal({ show: false, data: { id: "" } });
  };

  // compute total results for search to decide whether to show NoData
  const totalResults =
    (searchResults?.deal?.length || 0) +
    (searchResults?.brand?.length || 0) +
    (searchResults?.category?.length || 0);

  return (
    <>
      <AppHeader title="Search" showCart={true} />
      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} />
          {loading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
              <AppSpinner />
            </div>
          ) : null}

          {!loading ? (
            <>
              <AppInput
                name="search"
                placeholder={t("searchProducts")}
                register={register}
                onChange={handleSearch}
                rightIcon={<SearchIcon className="tw:text-gray-500" />}
                className="tw:bg-white tw:mb-4"
                inputClassName="tw:border-blue-400 tw:border"
              />

              {/* Render collected keys as badges under the input */}
              {keys && keys.length > 0 && (
                <div className="tw:my-2 tw:flex tw:flex-wrap tw:gap-2">
                  {keys.map((k) => (
                    <span
                      key={k}
                      onClick={() => {
                        setValue("search", k);
                        handleSearch();
                      }}
                      className="tw:cursor-pointer"
                    >
                      <AppBadge variant="light">{k}</AppBadge>
                    </span>
                  ))}
                </div>
              )}

              {searching ? (
                <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                  <AppSpinner />
                </div>
              ) : null}

              {/* Show NoData when a search was performed and there are no results */}
              {hasSearched && !searching && totalResults === 0 ? (
                <AppCard>
                  <NoData />
                </AppCard>
              ) : null}

              {!searching && searchResults.deal.length > 0 ? (
                <AppCard title="Deals">
                  {searchResults.deal.map((b) => (
                    <div
                      key={b._id}
                      className="tw:flex tw:gap-2 tw:justify-between tw:border-b tw:border-gray-200 tw:py-2 tw:text-sm tw:cursor-pointer"
                      onClick={() => onDealClick(b)}
                    >
                      {b.name} <ArrowRight className="tw:text-gray-500" />
                    </div>
                  ))}
                </AppCard>
              ) : null}

              {!searching && searchResults.brand.length > 0 ? (
                <AppCard title="Brands">
                  {searchResults.brand.map((b) => (
                    <div
                      key={b._id}
                      className="tw:flex tw:gap-2 tw:justify-between tw:border-b tw:border-gray-200 tw:py-2 tw:text-sm tw:cursor-pointer"
                      onClick={() => onBrandClick(b)}
                    >
                      {b.name} <ArrowRight className="tw:text-gray-500" />
                    </div>
                  ))}
                </AppCard>
              ) : null}

              {!searching && searchResults.category.length > 0 ? (
                <AppCard title="Categories">
                  {searchResults.category.map((c) => (
                    <div
                      key={c._id}
                      className="tw:flex tw:gap-2 tw:justify-between tw:border-b tw:border-gray-200 tw:py-2 tw:text-sm tw:cursor-pointer"
                      onClick={() => onCategoryClick(c)}
                    >
                      {c.name} <ArrowRight className="tw:text-gray-500" />
                    </div>
                  ))}
                </AppCard>
              ) : null}

              {!search && !searching ? (
                <>
                  {menus.map((m) => (
                    <div key={m._id} className="tw:mb-8 tw:first:mt-4">
                      <div className="tw:flex tw:mb-2">
                        <div className="tw:text-base tw:font-medium tw:uppercase tw:text-app-gray-5 tw:flex-1">
                          {m.name}
                        </div>
                        <div>
                          <button
                            className="tw:text-sm tw:text-app-gray-6 tw:me-2"
                            onClick={() => seeAll(m)}
                          >
                            See All
                          </button>
                        </div>
                      </div>
                      <MenuCategories menuId={m._id} menuName={m.name} />
                    </div>
                  ))}
                </>
              ) : null}
            </>
          ) : null}

          <div className="tw:h-10"></div>
        </div>
      </div>

      <ProductDetailModal
        show={productDetailModal.show}
        callback={productModalCallback}
        dealId={productDetailModal.data.id || ""}
        cartType={isBuyerLogin ? "buyer" : "normal"}
      />

      {/* Floating Voice Search FAB */}
      <div className="tw:fixed tw:bottom-4 tw:right-4 tw:z-50">
        <VoiceSearchFab callback={handleVoiceSearchCallback} />
      </div>
    </>
  );
};

export default Search;
