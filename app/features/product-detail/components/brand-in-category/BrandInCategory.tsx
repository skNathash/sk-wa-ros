import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import ImgRender from "~/components/core/img/ImgRender";
import AppSwiper from "~/components/core/swiper";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import ProductService from "~/services/ProductService";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { BuyCartType } from "~/types/CommonTypes";

type Props = {
  categoryId: string;
  callback?: (a: { action: string }) => void;
  cartType?: BuyCartType;
  retailerId?: string;
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
      slidesPerView: 3.2,
    },
    412: {
      slidesPerView: 5,
    },
    640: {
      slidesPerView: 6,
    },
  },
};

const getSellerBrands = async (categoryId: string, retailerId?: string) => {
  const params: Record<string, any> = {
    page: 1,
    count: 20,
    filter: { "applicableCategory.categoryId": categoryId },
    parent: true,
  };

  if (retailerId) {
    params.sellerId = retailerId;
  }

  const response = await SellerCatalogService.getBrands(params);

  return {
    data: SellerCatalogService.formatBrandResponse(response.data?.data || []),
  };
};

const getData = async (
  categoryId: string,
  cartType?: BuyCartType,
  retailerId?: string,
) => {
  const isBuyerLogin = AuthService.isBuyerUser();

  if (isBuyerLogin || cartType === "buy-from-other-retailer") {
    return await getSellerBrands(categoryId, retailerId);
  }

  const p: any = {
    filter: {
      category: [categoryId],
    },
    showColumns: ["brandArray"],
  };

  const r = await ProductService.getDealRefinement(p);

  let ids = [];

  let d = [];

  if (
    r.data?.brandArray &&
    Array.isArray(r.data.brandArray) &&
    r.data.brandArray.length
  ) {
    ids = r.data.brandArray.map((x: any) => x._id);
    const b = await ProductService.getBrands(
      {
        page: 1,
        count: 20,
        filter: { _id: { $in: ids } },
      },
      { useOldApi: true },
    );
    if (Array.isArray(b.data) && b.data.length > 0) {
      d = b.data;
    }
  }

  return { data: d };
};

function BrandInCategory({
  categoryId,
  callback,
  cartType,
  retailerId,
}: Props) {
  const appNav = useAppNav();

  const [data, setData] = useState<Array<any>>([]);

  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    setLoading(true);
    setData([]);
    const r = await getData(categoryId, cartType, retailerId);
    setData(r.data);
    setLoading(false);
  }, [categoryId, cartType, retailerId]);

  useEffect(() => {
    init();
  }, [init]);

  const viewBrand = (d: any) => {
    if (callback) {
      callback({ action: "close" });
    }

    if (cartType === "buy-from-other-retailer") {
      appNav.to("/products/buy-from-other-retailer/retailer/" + retailerId, {
        brandId: d._id,
        brandName: d.name,
      });
    } else {
      appNav.to("/products/sk", {
        brandIds: d._id,
        brandNames: d.name,
      });
    }
  };

  if (!data.length) {
    return;
  }

  return (
    <>
      {data.length > 0 ? (
        <div className="tw:py-4 tw:mb-4 tw:bg-white tw:rounded-lg">
          <div className="tw:text tw:font-semibold tw:mb-2 tw:line-clamp-1 tw:px-3">
            Brands Under This Category
          </div>
          <AppSwiper config={slideOptions}>
            {data.map((x) => (
              <AppSwiper.Slide key={x._id}>
                <button
                  onClick={() => viewBrand(x)}
                  className="tw:inline-block tw:w-full"
                >
                  <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:overflow-hidden tw:mb-1 tw:p-1">
                    <ImgRender assetId={x?.image?.[0]} className="tw:h-16" />
                  </div>
                  <div className="tw:text-xs tw:font-medium tw:text-center tw:line-clamp-1">
                    {x.name}
                  </div>
                </button>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>
      ) : null}
    </>
  );
}

export default BrandInCategory;
