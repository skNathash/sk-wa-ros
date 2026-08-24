import React, { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ProductService from "~/services/ProductService";
import useAppNav from "~/hooks/useAppNav";
import Categories from "./Categories";
import MenuProducts from "./MenuProducts";

interface MenuDataProps {
  menuId: string;
  menuName: string;
  callback?: (data: { action: string; data?: any }) => void;
}

const MenuData: React.FC<MenuDataProps> = ({ menuId, menuName, callback }) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const appNav = useAppNav();

  const handleSeeAllClick = () => {
    appNav.to("/products/sk/list", {
      menuId,
      menuName,
      title: menuName,
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const resp = await ProductService.getSubCategories(menuId);
        if (isMounted) {
          setCategories(resp.data || []);
        }
      } catch (e) {
        console.error("Error fetching menu data", e);
        if (isMounted) {
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (menuId) {
      fetchData();
    } else {
      setCategories([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [menuId]);

  return (
    <div id={`menu-section-${menuId}`}>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
          {menuName}
        </h2>
        {!loading && categories.length >= 3 && (
          <span
            className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
            onClick={handleSeeAllClick}
          >
            See all <span aria-hidden>→</span>
          </span>
        )}
      </div>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:h-40">
          <AppSpinner />
        </div>
      ) : categories.length >= 3 ? (
        <Categories
          menuId={menuId}
          menuName={menuName}
          categories={categories}
        />
      ) : null}
      <MenuProducts menuId={menuId} menuName={menuName} callback={callback} />
    </div>
  );
};

export default MenuData;
