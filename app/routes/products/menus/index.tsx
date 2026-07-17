import { useEffect, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import { PAGE_TITLE_PREFIX } from "~/constants";
import MenuCategories from "~/components/feature/products/menu-categories/MenuCategories";
import ProductService from "~/services/ProductService";
import useAppNav from "~/hooks/useAppNav";

const Menus = () => {
  const appNav = useAppNav();

  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    // load menus api
    const loadMenus = async () => {
      setLoading(true);
      const { data } = await ProductService.getMenus();
      setMenus(data);
      setLoading(false);
    };

    loadMenus();
  }, []);

  const seeAll = (menu: any) => {
    appNav.to("/products/sk", {
      categoryId: menu._id,
      categoryName: menu.name,
    });
  };

  return (
    <>
      <AppHeader title="Product Details" showCart={true} />
      <div className="page-bg ion-padding">
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

          {!loading && menus.length > 0 ? (
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
        </div>
      </div>
    </>
  );
};

const breadcrumbs = [
  { label: "Products", redirect: { path: "/products/sk" } },
  { label: "Menus" },
];

export function meta() {
  return [
    { title: `${PAGE_TITLE_PREFIX}Menus` },
    {
      name: "description",
      content: "View detailed information about the menus",
    },
  ];
}

export default Menus;
