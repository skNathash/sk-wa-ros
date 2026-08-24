import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import useAppNav from "~/hooks/useAppNav";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { useSidebar } from "~/components/ui/sidebar";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import BasketRequestModal from "~/modals/feature/product/basket-request/BasketRequestModal";
import { AuthService } from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import OtherRecommendedDealModal from "~/shared/catalog/modals/other-deals/OtherRecommendedDealModal";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SkProductsTab from "../../components/SkProductsTab";
import Footer from "../components/Footer";
import MenuList from "../components/menu-list/MenuList";
import Menus from "../components/Menus";
import Brands from "../components/Brands";
import ProductsBanner from "../components/ProductsBanner";
import SearchWithVoice from "../components/SearchWithVoice";
import TopBrandsCategory from "../components/top-brands-category/TopBrandsCategory";
import MenuData from "./components/menu-data/MenuData";
import ProductsList from "./components/products-list/ProductsList";

type Menu = {
  _id: string;
  name: string;
  _displayName: string;
  displayImg: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    langKey: "products",
    redirect: { path: "/products/sk" },
  },
  {
    label: "Browse SK",
  },
];

const SkProductsMainPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const { setOpen, open } = useSidebar();

  // ref to hold the full menus data so we always slice from the source
  const allMenusRef = useRef<Menu[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [displayedMenus, setDisplayedMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");

  const [cartActionHandler, setCartActionHandler] = useState<{
    action: string;
    deal: any;
  }>({
    action: "",
    deal: {},
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

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    setLoading(true);

    const fetchMenus = async () => {
      try {
        const { data } = await ProductService.getMenus();
        const formattedMenus: Menu[] = (Array.isArray(data) ? data : []).map(
          (m: any) => ({
            _id: m._id,
            name: m.name,
            _displayName: m._displayName || m.name,
            displayImg: m.displayImg || m._displayImg || "",
          }),
        );

        allMenusRef.current = formattedMenus;
        setAllMenus(formattedMenus);
        setMenus(formattedMenus.slice(0, 14));
        setDisplayedMenus(formattedMenus.slice(0, 3));
      } catch (error) {
        console.error("Error fetching menus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    // Simulate async for loading state
    await new Promise((resolve) => setTimeout(resolve, 500));
    const nextMenus = allMenusRef.current.slice(
      displayedMenus.length,
      displayedMenus.length + 3,
    );
    setDisplayedMenus((prev) => [...prev, ...nextMenus]);
    setLoadingMore(false);
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

  const handleCartAction = () => {
    setCartActionHandler({
      action: "",
      deal: {},
    });
  };

  const isSearching = Boolean(search.trim());

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
            {t("buyFromSK")}
          </span>
        }
        showCart={true}
        showRecordPayment={false}
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
            <SkProductsTab
              activeTab="products"
              className="tw:mb-3 hide-in-theme-2"
            />
            <div className="tw:flex tw:gap-4">
              {/* Left column — menus (desktop only) */}
              <aside className="tw:hidden tw:lg:block tw:w-56 tw:shrink-0 tw:sticky tw:top-20 tw:self-start tw:max-h-[calc(100vh-11rem)]">
                <MenuList menus={allMenus} loading={loading} />
              </aside>

              {/* Center column — search and main content */}
              <div className="tw:flex-1 tw:min-w-0">
                <div className="search-sticky tw:mb-4 tw:sticky tw:top-29 tw:lg:top-15 tw:z-10 tw:pt-1 tw:pb-2 tw:bg-[var(--page-bg,white)]">
                  <SearchWithVoice
                    value={search}
                    onSearch={setSearch}
                    readOnly
                    onInputClick={() => appNav.to("/products/sk/list")}
                    onVoiceSearch={(term) =>
                      appNav.to("/products/sk/list", {
                        search: term,
                        title: term,
                      })
                    }
                  />
                </div>
                {isSearching ? (
                  <ProductsList
                    search={search}
                    title="Search Results"
                    callback={handleAddToCart}
                  />
                ) : (
                  <>
                    <ProductsBanner />
                    <div className="tw:lg:hidden">
                      <Menus menus={allMenus} loading={loading} />
                      <Brands />
                    </div>
                    {/* Render MenuData for each displayed menu */}
                    {displayedMenus.map((m) => (
                      <div key={m._id} className="tw:mt-4 tw:pb-2">
                        <MenuData
                          menuId={m._id}
                          menuName={m._displayName || m.name}
                          callback={handleAddToCart}
                        />
                      </div>
                    ))}
                    {displayedMenus.length < menus.length && !loading && (
                      <div className="tw:flex tw:justify-center tw:mt-4">
                        <LoadMoreButton
                          loadMore={loadMore}
                          loading={loadingMore}
                          totalCount={menus.length}
                          loadedCount={displayedMenus.length}
                        />
                      </div>
                    )}
                    {displayedMenus.length >= menus.length && !loading && (
                      <ProductsList
                        title="All Products"
                        callback={handleAddToCart}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Right column — top brands & categories (desktop only) */}
              <aside
                className={clsx(
                  "tw:hidden tw:lg:block tw:w-64 tw:shrink-0 tw:sticky tw:top-20 tw:self-start tw:max-h-[calc(100vh-11rem)]",
                  {
                    "tw:lg:hidden": open,
                  },
                )}
              >
                <div className="tw:h-full tw:overflow-y-auto tw:pr-1">
                  <TopBrandsCategory />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
      <Footer />

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
    </>
  );
};

export default SkProductsMainPage;
