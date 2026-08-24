import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDebouncedCallback } from "use-debounce";
import Alpha from "~/components/core/alpha/Alpha";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import { useSidebar } from "~/components/ui/sidebar";
import useScreenView from "~/hooks/useScreenView";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import SkProductsTab from "../../components/SkProductsTab";
import Products from "../components/products/Products";
import BrowseSearchField from "~/shared/catalog/components/browse/BrowseSearchField";
import CategoryGrid from "./components/CategoryGrid";
import CategoryListPanel, {
  type CategoryItem,
} from "./components/CategoryListPanel";
import MenuColumn, { type MenuItem } from "./components/MenuColumn";
import { getCategories, getMenus } from "./helper";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Products",
    langKey: "products",
    redirect: { path: "/products/sk" },
  },
  { label: "Browse SK Categories", langKey: "browseSKCategories" },
];

const matchesAlpha = (name: string, alpha: string) => {
  if (!alpha) return true;
  const first = (name || "").trim().charAt(0).toUpperCase();
  if (alpha === "#") return !/[A-Z]/.test(first);
  return first === alpha.toUpperCase();
};

const CategoriesPage = () => {
  const { t } = useTranslation(["common", "menu"]);
  const { isMobile } = useScreenView();
  const { setOpen } = useSidebar();

  // Collapse the side menu when this page opens; the user can reopen it via the toggle.
  useEffect(() => {
    setOpen(false);
  }, []);

  const { register, getValues, setValue } = useForm({
    defaultValues: { search: "" },
  });

  const [alpha, setAlpha] = React.useState("");
  const [search, setSearch] = React.useState("");

  const [menus, setMenus] = React.useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = React.useState(false);
  const [selectedMenu, setSelectedMenu] = React.useState<MenuItem | null>(null);

  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [categoryLoading, setCategoryLoading] = React.useState(false);
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryItem | null>(null);

  // Fetch menus once and auto-select the first one
  React.useEffect(() => {
    let active = true;
    setMenuLoading(true);
    getMenus()
      .then((data) => {
        if (!active) return;
        setMenus(data);
        setSelectedMenu(data[0] || null);
      })
      .finally(() => {
        if (active) setMenuLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch categories whenever the selected menu changes
  React.useEffect(() => {
    let active = true;
    const menuId = selectedMenu?._id;
    if (!menuId) {
      setCategories([]);
      setSelectedCategory(null);
      return;
    }
    setCategoryLoading(true);
    setCategories([]);
    setSelectedCategory(null);
    setSearch("");
    setAlpha("");
    setValue("search", "");
    getCategories(menuId)
      .then((data) => {
        if (!active) return;
        setCategories(data);
        setSelectedCategory(data[0] || null);
      })
      .finally(() => {
        if (active) setCategoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMenu, setValue]);

  const handleSelectMenu = (menu: MenuItem) => {
    setSelectedMenu(menu);
  };

  const handleSearch = useDebouncedCallback(() => {
    setAlpha("");
    setSearch(getValues().search?.trim() || "");
  }, 400);

  const handleAlphaChange = (a: string) => {
    setSearch("");
    setValue("search", "");
    setAlpha(a);
  };

  const filteredCategories = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((c) => {
      const name = c._displayName || c.name || "";
      if (term && !name.toLowerCase().includes(term)) return false;
      if (!matchesAlpha(name, alpha)) return false;
      return true;
    });
  }, [categories, search, alpha]);

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
            {t("browseSKCategories")}
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
              <SkProductsTab
                activeTab="categories"
                className="tw:mb-4 hide-in-theme-2"
              />

              <div className="browse-grid--category tw:grid tw:grid-cols-1 tw:md:grid-cols-[16rem_22rem_1fr] tw:md:grid-rows-1 tw:gap-3 tw:h-[calc(100vh-12rem)]">
              {/* Col 1 — menus (desktop only) */}
              {!isMobile && (
                <MenuColumn
                  items={menus}
                  loading={menuLoading}
                  selectedId={selectedMenu?._id}
                  onSelect={handleSelectMenu}
                />
              )}

              {/* Col 2 — categories (always visible) */}
              <div className="tw:flex tw:flex-col tw:gap-2 tw:min-h-0 tw:h-full">
                <BrowseSearchField
                  register={register}
                  onChange={() => handleSearch()}
                />
                <Alpha
                  selected={alpha}
                  callback={handleAlphaChange}
                  className="tw:w-full"
                />
                <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto">
                  {isMobile ? (
                    <CategoryGrid
                      items={filteredCategories}
                      loading={categoryLoading}
                    />
                  ) : (
                    <CategoryListPanel
                      items={filteredCategories}
                      loading={categoryLoading}
                      selectedId={selectedCategory?._id}
                      onSelect={setSelectedCategory}
                    />
                  )}
                </div>
              </div>

              {/* Col 3 — products (desktop only) */}
              {!isMobile && (
                <Products
                  menuId={selectedMenu?._id}
                  menuName={selectedMenu?.name}
                  categoryId={selectedCategory?._id}
                  categoryName={selectedCategory?.name}
                  placeholder="Select a category to view its products"
                />
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoriesPage;
