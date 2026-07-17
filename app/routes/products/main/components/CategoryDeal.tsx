import { shuffle } from "lodash";
import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import ProductSlide from "~/components/feature/products/product-slide/ProductSlide";
import useAppNav from "~/hooks/useAppNav";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import { Skeleton } from "~/components/ui/skeleton";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";

type Props = {
  categoryId: string;
  callback: (a: { action: string; data?: any }) => void;
  name: string;
  menuName: string;
  menuId: string;
  type?: string;
};

const slideOptions: SwiperOptions = {
  spaceBetween: 10,
  pagination: false,
  navigation: false,
  mousewheel: {
    forceToAxis: true,
  },
  breakpoints: {
    300: {
      slidesPerView: 2.5,
    },
    412: {
      slidesPerView: 3.2,
    },
    768: {
      slidesPerView: 4.5,
    },
    1024: {
      slidesPerView: 5.5,
    },
    1440: {
      slidesPerView: 6.5,
    },
  },
};

const getData = async (params: any, type?: string) => {
  if (type === "buyer") {
    // For buyer view use SellerCatalogService and request parent records
    const resp = await SellerCatalogService.getProducts({
      ...params,
      parent: true,
      filter: {
        ...(params.filter || {}),
        status: "Active",
        availableQuantity: { $gt: 0 },
      },
    });
    const formatted = SellerCatalogService.formatProductResponse(
      resp?.data?.data || [],
    );
    return { data: Array.isArray(formatted) ? shuffle(formatted) : [] };
  }

  const r = await ProductService.getProducts(params);
  const d = Array.isArray(r.data)
    ? r.data
        .filter((product: any) => product.maxQty > 0)
        .map((e) => ({ ...e, showOtherDeals: true }))
    : [];
  return { data: Array.isArray(d) ? shuffle(d) : [] };
};

const getParams = (filter: any, type?: string) => {
  if (type === "buyer") {
    // Buyer expects page + limit, applicableCategory.categoryId and parent:true
    const params: any = {
      page: 1,
      limit: 10,
      parent: true,
      filter: { status: "Active" },
    };
    if (filter?.categoryId) {
      params.filter["applicableCategory.categoryId"] = filter.categoryId;
    }
    return params;
  }

  // normal view: uses page + count and include excludeOutOfStock
  const params: any = {
    page: 1,
    count: 10,
    filter: { category: [filter.categoryId] },
    excludeOutOfStock: true,
  };

  return params;
};

function CategoryDeal({
  categoryId,
  callback,
  name,
  menuName,
  menuId,
  type,
}: Props) {
  const appNav = useAppNav();

  const [data, setData] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(true);

  const [cartAction, setCartAction] = useState<{ action: string; deal: any }>({
    action: "",
    deal: {},
  });

  const init = useCallback(async () => {
    if (!categoryId) {
      setLoading(false);
      setData([]);
      return;
    }
    setLoading(true);
    setData([]);
    const r = await getData(getParams({ categoryId }, type), type);
    setData(r.data);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    init();
  }, [init]);

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

    callback ? callback(e) : null;
    if (e.data?.isActionHandler) {
      setCartAction({ action: e.action, deal: e.data.deal });
    }
  };

  const cartActionCb = () => {
    const t = setTimeout(() => {
      clearTimeout(t);
      setCartAction({ action: "", deal: {} });
    }, 500);
  };

  const seeAll = () => {
    appNav.to("/products/sk", {
      categoryIds: categoryId,
      categoryNames: name,
      menuId: menuId,
      menuName: menuName,
    });
  };

  return (
    <>
      {loading ? (
        <>
          <div className="tw:mb-2 tw:py-4">
            <div className="tw:flex">
              <div className="tw:flex-1">
                <div className="tw:text-lg tw:font-bold tw:mb-4 tw:line-clamp-1">
                  <Skeleton className="tw:w-10 tw:h-4" />
                </div>
              </div>
              <div>
                <button className="tw:text-primary tw:text-xs tw:font-bold tw:me-2">
                  <Skeleton className="tw:w-20 tw:h-4" />
                </button>
              </div>
            </div>
            <AppSwiper config={slideOptions}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                <AppSwiper.Slide key={i}>
                  <div className="tw:h-40">
                    <Skeleton className="tw:w-full tw:h-40" />
                  </div>
                </AppSwiper.Slide>
              ))}
            </AppSwiper>
          </div>
        </>
      ) : null}

      {data.length ? (
        <div className="tw:mb-2 tw:py-4">
          <div className="tw:flex">
            <div className="tw:flex-1">
              <div className="tw:text-lg tw:font-bold tw:mb-4 tw:line-clamp-1">
                {name}
              </div>
            </div>
            <div>
              <button
                className="tw:text-primary tw:text-xs tw:font-bold tw:me-2"
                onClick={seeAll}
              >
                See All
              </button>
            </div>
          </div>
          <ProductSlide data={data} callback={productCb} />
        </div>
      ) : null}

      <AddToCartActionHandler
        action={cartAction.action}
        deal={cartAction.deal}
        callback={cartActionCb}
      />
    </>
  );
}

export default CategoryDeal;
