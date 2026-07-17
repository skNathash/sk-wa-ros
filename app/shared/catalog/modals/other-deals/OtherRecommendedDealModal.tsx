import { useCallback, useEffect, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import ProductSlide from "~/components/feature/products/product-slide/ProductSlide";
import ProductService from "~/services/ProductService";

type Props = {
  show: boolean;
  dealId: string;
  callback: (a: { action: string; data?: any }) => void;
};

const slideOptions: SwiperOptions = {
  spaceBetween: 10,
  slidesOffsetAfter: 12,
  mousewheel: {
    forceToAxis: true,
  },
  breakpoints: {
    300: {
      slidesPerView: 2.3,
    },
  },
};

const OtherRecommendedDealModal = ({ show, dealId, callback }: Props) => {
  const [loading, setLoading] = useState(false);
  const [recommended, setRecommended] = useState<Array<any>>([]);
  const [deal, setDeal] = useState<any>(null);

  const handleClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const init = useCallback(async () => {
    if (!show || !dealId) {
      setRecommended([]);
      return;
    }

    setLoading(true);
    setRecommended([]);

    try {
      // fetch the deal details first
      const resp = await ProductService.getProducts(
        { filter: { _id: dealId } },
        { includeRawResp: true }
      );

      const mainDeal =
        Array.isArray(resp.data) && resp.data.length > 0 ? resp.data[0] : null;

      setDeal(mainDeal);

      if (!mainDeal) {
        setRecommended([]);
        setLoading(false);
        return;
      }

      const categoryId = mainDeal?.category?._id || "";
      const brandId = mainDeal?.brand?._id || "";

      if (!categoryId && !brandId) {
        setRecommended([]);
        setLoading(false);
        return;
      }

      // fetch recommended deals by category/brand
      const filter: Record<string, any> = {};
      if (categoryId) filter.category = categoryId;
      if (brandId) filter.brand = brandId;
      // exclude the current deal
      // filter._id = { $ne: dealId };

      const dealsResp = await ProductService.getProducts({
        page: 1,
        count: 50,
        filter,
      });

      const deals = Array.isArray(dealsResp.data) ? dealsResp.data : [];
      const availableNotInCart = deals.filter(
        (d: any) => !d?.isOutOfStock && !(d?.inCart?.status === true)
      );
      const availableInCart = deals.filter(
        (d: any) => !d?.isOutOfStock && d?.inCart?.status === true
      );
      const outOfStock = deals.filter((d: any) => !!d?.isOutOfStock);

      setRecommended([
        ...availableNotInCart,
        ...availableInCart,
        ...outOfStock,
      ]);
    } catch (err) {
      // swallow and show no data
      setRecommended([]);
    } finally {
      setLoading(false);
    }
  }, [dealId, show]);

  useEffect(() => {
    if (show) {
      init();
    } else {
      // reset when closed
      setRecommended([]);
      setLoading(false);
    }
  }, [show, init]);

  const productCb = (e: any) => {};

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[90vh]">
      <AppModal.Title
        onClose={(ev: any) => {
          ev.stopPropagation();
          handleClose();
        }}
      >
        <div>
          <div className="tw:text-lg tw:font-semibold">Related Deals</div>
          <div className="tw:text-sm tw:text-gray-500 tw:mt-1">
            You may also like these related deals.
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:md:max-h-[90vh] modal-bg">
        {loading ? (
          <div className="tw:py-8 tw:flex tw:justify-center">
            <AppSpinner />
          </div>
        ) : null}

        {!loading && recommended && recommended.length > 0 ? (
          <div className="tw:mt-4">
            {/* Main deal info */}
            {deal ? (
              <AppCard>
                <div className="tw:flex tw:items-center tw:gap-4">
                  <div className="tw:w-20 tw:h-20 tw:flex-shrink-0 tw:rounded tw:overflow-hidden tw:bg-gray-100">
                    {deal.images && deal.images.length ? (
                      <ImgRender
                        assetId={deal?.images?.[0] || ""}
                        alt={deal.name}
                        className="tw:w-full tw:h-full tw:object-cover"
                      />
                    ) : (
                      <div className="tw:w-full tw:h-full tw:bg-gray-200">
                        &nbsp;
                      </div>
                    )}
                  </div>

                  <div className="tw:flex-1">
                    <div className="tw:font-semibold tw:text-sm tw:line-clamp-2">
                      {deal.name}
                    </div>
                    <div className="tw:mt-2 tw:flex tw:items-center tw:gap-3">
                      <div className="tw:text-base tw:font-bold tw:text-green-600">
                        <Amount
                          value={Number(deal.displayPrice)}
                          decimalPlaces={2}
                        />
                      </div>
                      {deal.mrp && deal.mrp > (deal.displayPrice || 0) ? (
                        <div className="tw:text-xs tw:text-gray-400 tw:line-through">
                          MRP:
                          <Amount
                            value={Number(deal.mrp)}
                            showSymbol={true}
                            decimalPlaces={2}
                          />
                        </div>
                      ) : null}

                      {deal?.inCart?.status === true ? (
                        <div className="tw:ml-2">
                          <span className="tw:px-2 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium tw:bg-yellow-100 tw:text-yellow-800">
                            In Cart
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </AppCard>
            ) : null}

            <div className="tw:mt-4">
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
                <div className="tw:text-sm tw:font-semibold">
                  You Might Also Like
                </div>
                {/* <div className="tw:flex tw:items-center tw:gap-3">
                  {recommended && recommended.length > 10 ? (
                    <button
                      type="button"
                      className="tw:text-xs tw:font-medium tw:text-gray-500"
                      onClick={() => {
                        // prepare data with category and brand name/id
                        const data: any = {
                          category: {
                            id: deal?.category?._id || "",
                            name: deal?.category?.name || "",
                          },
                          brand: {
                            id: deal?.brand?._id || "",
                            name: deal?.brand?.name || "",
                          },
                        };

                        callback({ action: "see_all", data });
                      }}
                    >
                      See all
                    </button>
                  ) : null}
                </div> */}
              </div>

              <ProductSlide
                data={recommended}
                callback={productCb}
                swiperOptions={slideOptions}
              />
            </div>
          </div>
        ) : null}

        {!loading && (!recommended || recommended.length === 0) ? (
          <div className="tw:p-4">
            <NoData />
          </div>
        ) : null}
      </AppModal.Content>
    </AppModal>
  );
};

export default OtherRecommendedDealModal;
