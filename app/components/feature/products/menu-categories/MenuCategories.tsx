import { useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import { Skeleton } from "~/components/ui/skeleton";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";

type Props = {
  menuId: string;
  menuName: string;
};

const swiperOptions: SwiperOptions = {
  spaceBetween: 15,
  pagination: false,
  navigation: false,
  breakpoints: {
    300: {
      slidesPerView: 3.3,
    },
    600: {
      slidesPerView: 4.1,
    },
    900: {
      slidesPerView: 7.1,
    },
    1200: {
      slidesPerView: 9.1,
    },
  },
};

const getSellerCategories = async (menuId: string) => {
  const response = await SellerCatalogService.getCategories({
    page: 1,
    count: 20,
    filter: { "applicableMenu.menuId": menuId },
    parent: true,
  });

  return {
    data: SellerCatalogService.formatCategoryResponse(
      response.data?.data || [],
    ),
  };
};

const getData = async (menuId: string) => {
  const isBuyerLogin = AuthService.isBuyerUser();
  if (isBuyerLogin) {
    return await getSellerCategories(menuId);
  }
  const r = await ProductService.getSubCategories(menuId);
  return { data: r.data };
};

const MenuCategories = ({ menuId, menuName }: Props) => {
  const appNav = useAppNav();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const response = await getData(menuId);
      setCategories(response.data || []);
      setLoading(false);
    };

    fetchCategories();
  }, [menuId]);

  const viewCategory = (category: any) => {
    appNav.to("/products/sk", {
      // categoryId: menuId,
      // categoryName: menuName,
      categoryIds: category._id,
      categoryNames: category.name,
    });
  };

  return (
    <>
      {loading ? (
        <AppSwiper config={swiperOptions}>
          {[...Array(5)].map((_, index) => (
            <AppSwiper.Slide key={index}>
              <div className="tw:shadow-md tw:border tw:border-gray-200 tw:p-2 tw:bg-white tw:rounded-lg tw:mb-1">
                <div className="tw:h-20">
                  <Skeleton style={{ width: "100%", height: "100%" }} />
                </div>
                <div className="tw:text-center tw:line-clamp-1 tw:text-xs">
                  <Skeleton style={{ width: "80%" }} />
                </div>
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      ) : (
        <AppSwiper config={swiperOptions}>
          {categories.map((category: any) => (
            <AppSwiper.Slide key={category._id}>
              <div
                className="tw:shadow-md tw:border tw:border-gray-300 tw:p-2 tw:bg-white tw:rounded-lg tw:mb-1 tw:cursor-pointer"
                onClick={() => viewCategory(category)}
              >
                <div className="tw:h-20 tw:mb-3 tw:overflow-hidden">
                  <ImgRender
                    assetId={category.displayImg}
                    className="tw:w-full"
                  />
                </div>
                <div className="tw:text-center tw:line-clamp-1 tw:text-xs">
                  {category.name}
                </div>
              </div>
            </AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </>
  );
};

export default MenuCategories;
