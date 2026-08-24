import React, { useEffect, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import SellerCatalogService from "~/services/SellerCatalogService";
import Categories from "./Categories";
import MenuProducts from "./MenuProducts";
import useAppNav from "~/hooks/useAppNav";
import { DEFAULT_BROWSE_DISTANCE } from "~/constants";

interface MenuDataProps {
  menuId: string;
  menuName: string;
  distance?: number | string;
}

const MenuData: React.FC<MenuDataProps> = ({
  menuId,
  menuName,
  distance = DEFAULT_BROWSE_DISTANCE,
}) => {
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const appNav = useAppNav();

  const handleSeeAllClick = () => {
    const params: any = {
      menuId,
      menuName,
      distance,
    };
    appNav.to("/products/buy-from-other-retailer/products/list", params);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catsResp = await SellerCatalogService.getNetworkParentCategories(
          {
            filter: {
              "applicableMenu.menuId": menuId,
            },
          },
          distance,
        );

        setParentCategories(
          SellerCatalogService.formatParentCategoryResponse(
            catsResp.data?.data || [],
          ),
        );
      } catch (e) {
        console.error("Error fetching menu data", e);
      } finally {
        setLoading(false);
      }
    };

    if (menuId && distance) {
      fetchData();
    } else {
      setParentCategories([]);
      setLoading(false);
    }
  }, [menuId, distance]);

  return (
    <div id={`menu-section-${menuId}`}>
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <h2 className="app-label tw:text-[0.8125rem]! tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-primary/70">
          {menuName}
        </h2>
        {!loading && parentCategories.length >= 3 && (
          <button
            type="button"
            className="tw:inline-flex tw:items-center tw:gap-0.5 tw:cursor-pointer tw:text-[13px] tw:font-semibold tw:text-primary"
            onClick={handleSeeAllClick}
          >
            See all <span aria-hidden>→</span>
          </button>
        )}
      </div>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:h-40">
          <AppSpinner />
        </div>
      ) : parentCategories.length >= 3 ? (
        <Categories
          menuId={menuId}
          menuName={menuName}
          categories={parentCategories}
          distance={distance}
        />
      ) : null}
      <MenuProducts menuId={menuId} menuName={menuName} distance={distance} />
    </div>
  );
};

export default MenuData;
