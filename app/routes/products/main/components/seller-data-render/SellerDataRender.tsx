import { useCallback, useEffect, useRef, useState } from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ProductSlide from "~/components/feature/products/product-slide/ProductSlide";
import { getData, getMenus } from "./helper";
import ImgRender from "~/components/core/img/ImgRender";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import { useTranslation } from "react-i18next";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";

const SellerDataRender = () => {
  const { t } = useTranslation();

  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any[]>([]);

  const [loadingMore, setLoadingMore] = useState(false);

  const [cartAction, setCartAction] = useState<{ action: string; deal: any }>({
    action: "",
    deal: {},
  });

  const loadedCountRef = useRef<number>(0);

  useEffect(() => {
    const fetchMenus = async () => {
      const response = await getMenus();

      const menuData = response.data;

      const firstFourMenus = menuData.slice(0, 4);
      const data = await getData(
        firstFourMenus.map((m) => ({ _id: m._id, name: m.name })),
      );

      loadedCountRef.current = 4;

      setData(data);
      setMenus(menuData);
      setLoading(false);
    };
    fetchMenus();
  }, []);

  const loadMore = useCallback(async () => {
    const response = await getMenus();
    const menuData = response.data;

    const nextMenus = menuData.slice(
      loadedCountRef.current,
      loadedCountRef.current + 4,
    );

    if (nextMenus.length > 0) {
      setLoadingMore(true);
      loadedCountRef.current += nextMenus.length;
      const newData = await getData(
        nextMenus.map((m) => ({ _id: m._id, name: m.name })),
      );
      setData((prev) => [...prev, ...newData]);
      setLoadingMore(false);
    }
  }, []);

  const productCb = (e: any) => {
    const action = e.action;
    const deal = e.data?.data?.deal;

    if (action === "group-deal") {
      setCartAction({
        action: "group-deal",
        deal: deal,
      });
      return;
    }
  };

  const appNav = useAppNav();

  // Navigate to products list for the given menu (see all)
  const handleSeeAll = useCallback(
    (menu: any) => {
      if (!menu) return;
      appNav.to("/products/sk", { menuId: menu._id, menuName: menu.name });
    },
    [appNav],
  );

  // Navigate to products list for a specific category (include menu context)
  const handleCategoryClick = useCallback(
    (menu: any, category: any) => {
      if (!category) return;
      const params: any = {
        categoryIds: category._id,
        categoryNames: category.name,
      };

      if (menu) {
        params.menuId = menu._id;
        params.menuName = menu.name;
      }

      appNav.to("/products/sk", params);
    },
    [appNav],
  );

  return (
    <>
      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
          <AppSpinner />
        </div>
      ) : null}

      {data.map((d) => (
        <div key={d.menu._id}>
          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:text-2xl tw:font-bold tw:mb-2">
              {d.menu.name || "---"}
            </div>
          </div>
          <div className="tw:mb-4">
            <div className="tw:grid tw:grid-cols-4 tw:md:grid-cols-12 tw:gap-2">
              {d.categories.map((c: any) => (
                <div
                  key={c._id}
                  className="tw:text-center"
                  // avoid inline functions by using data props and onClick handler on parent
                >
                  <div
                    className="tw:w-full tw:h-24 tw:overflow-hidden tw:bg-gradient-to-b tw:from-blue-200 tw:to-blue-100 tw:rounded-md tw:pt-2 tw:px-1 tw:cursor-pointer"
                    onClick={() => handleCategoryClick(d.menu, c)}
                  >
                    <ImgRender
                      assetId={c._displayImg}
                      alt={c.name}
                      className="tw:w-full tw:h-full tw:object-cover"
                      size="500x500"
                    />
                  </div>
                  <div
                    className="tw:text-xs tw:font-semibold tw:line-clamp-2 tw:mt-2 tw:cursor-pointer"
                    onClick={() => handleCategoryClick(d.menu, c)}
                  >
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="tw:mb-4">
            <div className="tw:flex tw:justify-between tw:items-center tw:mb-2">
              <div className="tw:text-sm tw:text-slate-500 tw:flex-1">
                {t("showingProductsInMenu", { menu: d.menu.name })}
              </div>
              {d.products && d.products.length >= 10 && (
                <div>
                  <AppButton
                    size="small"
                    fill="clear"
                    onClick={() => handleSeeAll(d.menu)}
                  >
                    {t("seeAll")}
                  </AppButton>
                </div>
              )}
            </div>
            <ProductSlide
              data={d.products}
              callback={productCb}
              cartType="buyer"
            />
          </div>
        </div>
      ))}

      {!loading && data.length > 0 ? (
        <LoadMoreButton
          loadMore={loadMore}
          loading={loadingMore}
          totalCount={menus.length}
          loadedCount={loadedCountRef.current}
        />
      ) : null}

      <AddToCartActionHandler
        deal={cartAction.deal}
        action={cartAction.action}
        callback={(a) => {
          // Reset cart action state
          setCartAction({ action: "", deal: {} });
        }}
      />
    </>
  );
};

export default SellerDataRender;
