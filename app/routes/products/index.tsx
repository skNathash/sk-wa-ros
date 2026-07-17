import { produce } from "immer";
import { debounce } from "lodash";
import { Search, SlidersHorizontal } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form/AppInput";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ProductCard from "~/components/feature/products/product-card/ProductCard";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import useAppNav from "~/hooks/useAppNav";
import BasketRequestModal from "~/modals/feature/product/basket-request/BasketRequestModal";
import ProductFilterModal from "~/modals/feature/product/filter/ProductFilterModal";
import { AuthService } from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import BrowseByBrandsCategory from "~/shared/catalog/components/BrowseByBrandsCategory";
import OtherRecommendedDealModal from "~/shared/catalog/modals/other-deals/OtherRecommendedDealModal";
import type { BreadcrumbItem, Deal } from "~/types/CommonTypes";
import AppliedFilter from "./components/AppliedFilter";
import CategorySlider from "./components/category-slider/CategorySlider";
import { getCount, getData, prepareParams, prepareSoldUnits } from "./helper";
import ImgRender from "~/components/core/img/ImgRender";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    langKey: "products",
    redirect: { path: "/products/main" },
  },
  {
    label: "Main",
  },
];

interface FilterRef {
  category: { id: string; name: string } | null;
  search: string;
  menu: { name: string; _id: string }[];
  categories: { name: string; _id: string }[];
  brands: { name: string; _id: string }[];
  showSkCatalog: boolean;
  showSellerCatalog: boolean;
  selectedSeller: { id: string; name: string } | null;
}

const ProductsIndex: React.FC = () => {
  const appNav = useAppNav();
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const viewType = AuthService.isBuyerUser() ? "buyer" : "normal";

  const { register, getValues } = useForm();

  const [products, setProducts] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // reactive selected category/menu id so child components receive updates
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    searchParams.get("categoryId") || searchParams.get("menuId") || "",
  );

  const [cartActionHandler, setCartActionHandler] = useState<{
    action: string;
    deal: any;
  }>({
    action: "",
    deal: {},
  });

  const [filterModal, setFilterModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [records, setRecords] = useState({
    loading: false,
    total: 0,
  });

  const [basketRequestModal, setBasketRequestModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [productDetailModal, setProductDetailModal] = useState<{
    show: boolean;
    data: any;
  }>({
    show: false,
    data: {},
  });

  const [otherDealModal, setOtherDealModal] = useState<{
    show: boolean;
    dealId: string;
  }>({
    show: false,
    dealId: "",
  });

  const filterRef = useRef<FilterRef>({ ...defaultFilterRef });

  const paginationRef = useRef<any>({
    page: 1,
    count: 10,
  });

  const [showSkCatalog, setShowSkCatalog] = useState(true); // Default to true
  const [showSellerCatalog, setShowSellerCatalog] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [franchiseDetails, setFranchiseDetails] = useState<Record<
    string,
    any
  > | null>(null);

  useEffect(() => {
    filterRef.current = {
      ...defaultFilterRef,
    };

    const fetchFranchiseDetails = async () => {
      const userId = AuthService.getLoggedInUserId();
      if (userId) {
        try {
          const response = await FranchiseService.getFranchise(userId);
          const connectedSellers = FranchiseService.getConnectedSellers();
          if (response.data?.showSFInventory) {
            setFranchiseDetails(response.data);
            // Set the first connected seller as default if available
            if (connectedSellers.length > 0) {
              const firstSeller = connectedSellers[0];
              setSelectedSeller(firstSeller);
              filterRef.current.selectedSeller = firstSeller;
              filterRef.current.showSellerCatalog = true;
              setShowSellerCatalog(true);
              setShowSkCatalog(false);
            }
          } else {
            setFranchiseDetails(null);
          }
        } catch (error) {
          console.error("Error fetching franchise details:", error);
        }
      }

      if (searchParams.get("categoryId")) {
        filterRef.current.category = {
          id: searchParams.get("categoryId") || "",
          name: searchParams.get("categoryName") || "",
        };
        // keep reactive state in sync
        setSelectedCategoryId(searchParams.get("categoryId") || "");
      }

      // For buyer view, also parse menuId/menuName (single) or menuIds/menuNames (multiple)
      if (searchParams.get("menuId")) {
        filterRef.current.menu = [
          {
            _id: searchParams.get("menuId") || "",
            name: searchParams.get("menuName") || "",
          },
        ];
        // when buyer view menuId is present, reflect it in selectedCategoryId so slider highlights
        setSelectedCategoryId(searchParams.get("menuId") || "");
      } else if (searchParams.get("menuNames") && searchParams.get("menuIds")) {
        const menuNames = searchParams.get("menuNames")?.split("|") || [];
        const menuIds = searchParams.get("menuIds")?.split("|") || [];

        filterRef.current.menu = menuNames.map((name, index) => ({
          name,
          _id: menuIds[index],
        }));
      } else if (searchParams.get("menuIds")) {
        // fallback: comma-separated ids without names
        const menuIds = searchParams.get("menuIds")?.split(",") || [];
        filterRef.current.menu = menuIds.map((id) => ({ name: "", _id: id }));
      }

      if (
        searchParams.get("categoryNames") &&
        searchParams.get("categoryIds")
      ) {
        const categoryNames =
          searchParams.get("categoryNames")?.split("|") || [];
        const categoryIds = searchParams.get("categoryIds")?.split("|") || [];

        filterRef.current.categories = categoryNames.map((name, index) => ({
          name,
          _id: categoryIds[index],
        }));
      }

      if (searchParams.get("brandNames") && searchParams.get("brandIds")) {
        const brandNames = searchParams.get("brandNames")?.split("|") || [];
        const brandIds = searchParams.get("brandIds")?.split("|") || [];

        filterRef.current.brands = brandNames.map((name, index) => ({
          name,
          _id: brandIds[index],
        }));
      }

      // Set checkbox states based on query parameters
      const skCatalogParam = searchParams.get("showSkCatalog");
      const sellerCatalogParam = searchParams.get("showSellerCatalog");

      // Default: sk catalog checked unless seller catalog is explicitly selected
      if (sellerCatalogParam === "true") {
        setShowSellerCatalog(true);
        setShowSkCatalog(false);
        filterRef.current.showSellerCatalog = true;
        filterRef.current.showSkCatalog = false;
      } else if (skCatalogParam === "true") {
        setShowSkCatalog(true);
        setShowSellerCatalog(false);
        filterRef.current.showSkCatalog = true;
        filterRef.current.showSellerCatalog = false;
      } else {
        setShowSkCatalog(true);
        setShowSellerCatalog(false);
        filterRef.current.showSkCatalog = true;
        filterRef.current.showSellerCatalog = false;
      }

      applyFilter();
    };

    fetchFranchiseDetails();
  }, [searchParams]);

  const handleSearch = useCallback(
    debounce(async () => {
      filterRef.current.search = getValues("search");
      applyFilter();
    }, 500),
    [],
  );

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      page: 1,
    };

    setIsLoading(true);
    setRecords({
      loading: true,
      total: 0,
    });

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      viewType,
    );
    const response = await getData(params, viewType);

    // Add sold units info and update state with the returned data
    const updatedProducts = await prepareSoldUnits(response.data);

    setProducts(updatedProducts);

    setIsLoading(false);

    const count = await getCount(params, viewType);
    setRecords({
      loading: false,
      total: count,
    });
  };

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
    if (
      action === "add" &&
      id &&
      showOtherDeals &&
      !AuthService.isBuyerUser()
    ) {
      setOtherDealModal({ show: true, dealId: id });
    }
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      page: paginationRef.current.page + 1,
    };

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      viewType,
    );
    const response = await getData(params, viewType);
    if (response.data) {
      // Add sold units info for new products and update state
      const updatedNewProducts = await prepareSoldUnits(response.data);

      setProducts(
        produce((draft) => {
          draft.push(...updatedNewProducts);
        }),
      );
    }
    setIsLoadingMore(false);
  };

  const onCategoryChange = useCallback(
    (category: { id: string; name: string }) => {
      // For buyer view, map category selection to `menu` filter
      if (viewType === "buyer") {
        filterRef.current.menu = [{ _id: category.id, name: category.name }];
        // clear category to avoid ambiguity
        filterRef.current.category = null;
      } else {
        filterRef.current.category = category;
        // clear any menu selection for non-buyer
        filterRef.current.menu = [];
      }

      const queryParams = new URLSearchParams(searchParams);

      // Remove category and brand-related query parameters
      queryParams.delete("categoryIds");
      queryParams.delete("categoryNames");
      queryParams.delete("brandIds");
      queryParams.delete("brandNames");

      // If buyer view, use menuId/menuName instead of categoryId/categoryName
      if (viewType === "buyer") {
        queryParams.set("menuId", category.id);
        queryParams.set("menuName", category.name);
        // remove any categoryId/categoryName to avoid ambiguity
        queryParams.delete("categoryId");
        queryParams.delete("categoryName");
      } else {
        queryParams.set("categoryId", category.id);
        queryParams.set("categoryName", category.name);
        // remove any menuId/menuName to avoid ambiguity
        queryParams.delete("menuId");
        queryParams.delete("menuName");
      }

      // Navigate with updated query parameters and new category/menu
      // keep reactive selected id in sync so CategorySlider updates
      setSelectedCategoryId(category.id);
      setSearchParams(queryParams, { replace: true });
    },
    [appNav, searchParams],
  );

  const openFilterModal = () => {
    setFilterModal({
      show: true,
      data: {
        selectedCategories: filterRef.current.categories,
        selectedBrands: filterRef.current.brands,
      },
    });
  };

  const handleFilterModal = (response: { action: string; data: any }) => {
    const { action, data } = response;

    if (action === "apply" || action === "reset") {
      // Create new URLSearchParams from current search params to preserve existing parameters
      const queryParams = new URLSearchParams(searchParams);

      // Clear existing category and brand parameters
      queryParams.delete("categoryIds");
      queryParams.delete("categoryNames");
      queryParams.delete("brandIds");
      queryParams.delete("brandNames");

      if (data.categories?.length > 0) {
        queryParams.set(
          "categoryIds",
          data.categories.map((c: any) => c._id).join("|"),
        );
        queryParams.set(
          "categoryNames",
          data.categories.map((c: any) => c.name).join("|"),
        );
      }

      if (data.brands?.length > 0) {
        queryParams.set(
          "brandIds",
          data.brands.map((b: any) => b._id).join("|"),
        );
        queryParams.set(
          "brandNames",
          data.brands.map((b: any) => b.name).join("|"),
        );
      }

      if (action === "reset") {
        filterRef.current.categories = [];
        filterRef.current.brands = [];
      }

      setFilterModal({
        show: false,
        data: {},
      });

      // Navigate with all preserved parameters plus new filter parameters
      appNav.to(`/products/sk?${queryParams.toString()}`);
    } else if (action === "close") {
      setFilterModal({
        show: false,
        data: {},
      });
    }
  };

  const handleCheckboxChange = (type: "sk" | "seller") => {
    const queryParams = new URLSearchParams(searchParams);

    if (type === "sk") {
      setShowSkCatalog(true);
      setShowSellerCatalog(false);
      queryParams.set("showSkCatalog", "true");
      queryParams.delete("showSellerCatalog");
    } else {
      setShowSellerCatalog(true);
      setShowSkCatalog(false);
      queryParams.set("showSellerCatalog", "true");
      queryParams.delete("showSkCatalog");
    }

    appNav.to(`/products?${queryParams.toString()}`);
  };

  const resetCategory = () => {
    filterRef.current.category = null; // Reset category
    setSelectedCategoryId("");
    applyFilter(); // Reapply filter
  };

  const onRemoveCategory = (id: string) => {
    const queryParams = new URLSearchParams(searchParams);
    const updatedCategories = filterRef.current.categories.filter(
      (category) => category._id !== id,
    );

    // Rebuild category-related query params without clearing all
    queryParams.set(
      "categoryIds",
      updatedCategories.map((category) => category._id).join("|"),
    );
    queryParams.set(
      "categoryNames",
      updatedCategories.map((category) => category.name).join("|"),
    );

    // Clear the selected category if it matches the removed category
    if (filterRef.current.category?.id === id) {
      filterRef.current.category = null;
      queryParams.delete("categoryId");
      queryParams.delete("categoryName");
    }
    // Also clear reactive selected id so UI (category/menu slider) stops highlighting
    if (selectedCategoryId === id) {
      setSelectedCategoryId("");
    }
    appNav.to(`/products/sk?${queryParams.toString()}`);
  };

  const onRemoveBrand = (id: string) => {
    const queryParams = new URLSearchParams(searchParams);
    const updatedBrands = filterRef.current.brands.filter(
      (brand) => brand._id !== id,
    );

    // Rebuild brand-related query params without clearing all
    queryParams.set(
      "brandIds",
      updatedBrands.map((brand) => brand._id).join("|"),
    );
    queryParams.set(
      "brandNames",
      updatedBrands.map((brand) => brand.name).join("|"),
    );

    appNav.to(`/products/sk?${queryParams.toString()}`);
  };

  const handleCartAction = (e: any) => {
    setCartActionHandler({
      action: "",
      deal: {},
    });
  };

  return (
    <>
      <AppHeader
        title={
          <span className="tw:flex tw:items-center tw:gap-2">
            <ImgRender
              src="logo.svg"
              alt="StoreKing"
              className="tw:h-5 tw:w-5"
            />
            {viewType === "buyer" ? t("buyFromSKSeller") : t("buyFromSK")}
          </span>
        }
        showCart={true}
        showSearch={true}
      />

      <div className="page-bg app-page tw:md:p-4">
        <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:md:mb-4 tw:p-4 tw:md:p-0">
          <div>
            {/* <AppBreadcrumbs data={breadcrumbs} /> */}
            <PageDescription
              description={viewType === "buyer" ? "buyFromSeller" : "buyFromSK"}
            />
          </div>
          {!AuthService.isBuyerUser() && (
            <>
              <BrowseByBrandsCategory
                variant="desktop"
                className="tw:hidden tw:lg:inline-flex"
              />
              <BrowseByBrandsCategory
                variant="mobile"
                className="tw:flex tw:lg:hidden"
              />
            </>
          )}
        </div>
        <div className="tw:sticky tw:top-15  tw:bg-white tw:z-50 tw:p-4 tw:lg:px-0 tw:border-b tw:border-gray-200 tw:mb-4">
          <div className="tw:flex tw:justify-between tw:items-center tw:gap-2">
            <AppInput
              type="text"
              placeholder="Search by name"
              className="form-control tw:w-full"
              name="search"
              register={register}
              onChange={handleSearch}
              size="sm"
              leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-500" />}
            />
            <AppButton
              onClick={openFilterModal}
              color="dark"
              noShadow={true}
              size="small"
            >
              <SlidersHorizontal className="tw:mr-2 tw:w-4 tw:h-4" />
              Filter
            </AppButton>
          </div>
          {/* {franchiseDetails && (
            <div className="tw:flex tw:gap-4 tw:mt-4">
              {franchiseDetails.showSKInventory && (
                <label className="tw:flex tw:items-center tw:mr-4">
                  <input
                    type="checkbox"
                    checked={showSkCatalog}
                    onChange={() => handleCheckboxChange("sk")}
                  />
                  <span className="tw:inline-block tw:ms-2 tw:text-xs">
                    Sk Catalog
                  </span>
                </label>
              )}
              {franchiseDetails.showSFInventory && (
                <label className="tw:flex tw:items-center">
                  <input
                    type="checkbox"
                    checked={showSellerCatalog}
                    onChange={() => handleCheckboxChange("seller")}
                  />
                  <span className="tw:inline-block tw:ms-2 tw:text-xs">
                    Seller Catalog
                  </span>
                </label>
              )}
            </div>
          )} */}
        </div>

        <div className="tw:flex tw:gap-2 tw:lg:gap-4">
          <div className="tw:w-[70px] tw:lg:w-[80px] tw:sticky tw:top-0 tw:h-[calc(100vh-2rem)] tw:overflow-y-auto hide-scrollbar">
            <div className="tw:p-1 tw:bg-white tw:rounded-lg tw:shadow-sm tw:border-r tw:border-gray-200 tw:h-full tw:overflow-hidden">
              <CategorySlider
                callback={onCategoryChange}
                selectedCategory={selectedCategoryId}
                type={viewType}
              />
            </div>
          </div>
          <div className="tw:flex-1">
            <div className="tw:mb-4 tw:text-sm tw:text-gray-500 tw:flex tw:flex-col tw:lg:flex-row tw:items-start tw:lg:items-center tw:gap-2">
              {records.loading ? (
                <div className="tw:flex tw:items-center">
                  <AppSpinner className="tw:mr-2" />
                </div>
              ) : (
                `Showing ${products.length} of ${records.total} products`
              )}

              <div>
                <AppliedFilter
                  menuId={filterRef.current.category?.id || ""}
                  menuName={filterRef.current.category?.name || ""}
                  categories={filterRef.current.categories}
                  brands={filterRef.current.brands}
                  onRemoveCategory={onRemoveCategory}
                  onRemoveBrand={onRemoveBrand}
                />
              </div>
            </div>
            <div className="tw:grid tw:lg:grid-cols-6 tw:gap-2 tw:lg:gap-4 tw:grid-cols-2">
              {isLoading ? (
                <div className="tw:col-span-6">
                  <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                    <AppSpinner className="tw:w-10 tw:h-10" />
                  </div>
                </div>
              ) : !isLoading && products.length === 0 ? (
                <div className="tw:col-span-6">
                  <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                    <div className="tw:text-gray-500">No products found</div>
                  </div>
                </div>
              ) : (
                products.map((product) => (
                  <ProductCard
                    key={product._id}
                    data={product}
                    callback={handleAddToCart}
                    type={1}
                    cartType={viewType === "buyer" ? "buyer" : "normal"}
                    useBusyLoader={true}
                  />
                ))
              )}
            </div>

            {products.length > 0 && products.length < records.total && (
              <div className="tw:flex tw:justify-center tw:mt-4">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={isLoadingMore}
                  totalCount={records.total}
                  loadedCount={products.length}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductFilterModal
        show={filterModal.show}
        callback={handleFilterModal}
        categories={filterRef.current.categories}
        brands={filterRef.current.brands}
        viewType={viewType}
        menu={filterRef.current.menu}
      />

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
        cartType={viewType === "buyer" ? "buyer" : "normal"}
      />

      <OtherRecommendedDealModal
        show={otherDealModal.show}
        dealId={otherDealModal.dealId}
        callback={(e: { action: string; data?: any }) => {
          // close modal on any close action
          if (e.action === "close") {
            setOtherDealModal({ show: false, dealId: "" });
            return;
          }

          // bubble up product actions (for example add-to-cart) to existing handler
          // handleAddToCart(e);
        }}
      />

      <AddToCartActionHandler
        action={cartActionHandler.action}
        deal={cartActionHandler.deal}
        callback={handleCartAction}
      />
    </>
  );
};

const defaultFilterRef: FilterRef = {
  category: null,
  search: "",
  categories: [],
  brands: [],
  showSkCatalog: true,
  showSellerCatalog: false,
  selectedSeller: null,
  menu: [],
};

export default ProductsIndex;
