import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import ProductService from "~/services/ProductService";
import ProductSlide from "~/components/feature/products/product-slide/ProductSlide";
import { Skeleton } from "~/components/ui/skeleton";
import SellerCatalogService from "~/services/SellerCatalogService";
import AuthService from "~/services/AuthService";

type Props = {
  categoryId: string;
  categoryName: string;
  onProductClick?: (dealId: string) => void;
};

const slideOptions: SwiperOptions = {
  spaceBetween: 10,
  slidesOffsetAfter: 12,
  slidesOffsetBefore: 12,
  mousewheel: {
    forceToAxis: true,
  },
  breakpoints: {
    300: {
      slidesPerView: 2.5,
    },
  },
};

const getSellerProducts = async (categoryId: string) => {
  const response = await SellerCatalogService.getProducts({
    page: 1,
    count: 20,
    filter: { "applicableCategory.categoryId": categoryId },
    parent: true,
  });
  return {
    data: SellerCatalogService.formatProductResponse(
      response.data?.data || [],
    ).map((x: any) => ({ ...x, _ignoreGroupDeals: true })),
  };
};

const getData = async (categoryId: string) => {
  const isBuyerLogin = AuthService.isBuyerUser();
  if (isBuyerLogin) {
    return await getSellerProducts(categoryId);
  }

  const p: any = {
    filter: {},
  };

  if (categoryId) {
    p.filter.category = [categoryId];
  }

  const r = await ProductService.getProducts(p);

  return {
    data: Array.isArray(r.data) ? r.data.filter((x: any) => x.maxQty > 0) : [],
  };
};

const TopInCategory = ({ categoryId, categoryName, onProductClick }: Props) => {
  const [data, setData] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(true);

  const [cartAction, setCartAction] = useState<{ action: string; deal: any }>({
    action: "",
    deal: {},
  });

  const init = useCallback(async () => {
    setLoading(true);
    setData([]);
    const r = await getData(categoryId);
    setData(r.data);
    setLoading(false);
  }, [categoryId]);

  useEffect(() => {
    init();
  }, [init]);

  const productCb = (e: any) => {
    if (e.action === "click" && e?.data?.deal?._id && onProductClick) {
      onProductClick(e.data.deal._id);
      return;
    }

    if (e.data.isActionHandler) {
      setCartAction({ action: e.action, deal: e.data.deal });
    }
  };

  const cartActionCb = () => {
    const t = setTimeout(() => {
      clearTimeout(t);
      setCartAction({ action: "", deal: {} });
    }, 500);
  };

  return (
    <>
      {loading ? <Skeleton /> : null}

      {data.length ? (
        <div className="tw:py-4 tw:mb-4 tw:bg-white tw:rounded-lg">
          <div className="tw:text-base tw:font-semibold tw:mb-2 tw:line-clamp-1 tw:px-4">
            Products Under {categoryName}
          </div>
          <ProductSlide
            swiperOptions={slideOptions}
            callback={productCb}
            data={data}
            noDetailModal={!!onProductClick}
            useBusyLoader={true}
          />
        </div>
      ) : null}

      {/* <AddToCartActionHandler
        action={cartAction.action}
        deal={cartAction.deal}
        callback={cartActionCb}
      /> */}
    </>
  );
};

export default TopInCategory;
