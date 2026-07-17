import { useMemo, useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import ProductCard from "../product-card/ProductCard";
import ProductDetailModal from "~/features/product-detail/ProductDetailModal";
import OtherRecommendedDealModal from "~/shared/catalog/modals/other-deals/OtherRecommendedDealModal";
import AuthService from "~/services/AuthService";

type Props = {
  data: Array<any>;
  callback?: (a: any) => void;
  type?: number;
  slideType?: number;
  cardBgStyle?: any;
  imgBgStyle?: any;
  swiperOptions?: SwiperOptions | null;
  noDetailModal?: boolean;
  cartType?: "normal" | "buyer" | "buy-from-other-retailer";
  retailerId?: string;
  useBusyLoader?: boolean;
};

const slideOptions: SwiperOptions = {
  slidesPerView: 2.2,
  pagination: false,
  navigation: false,
  mousewheel: {
    forceToAxis: true,
  },
  breakpoints: {
    320: {
      slidesPerView: 2.4,
      spaceBetween: 10,
    },
    480: {
      slidesPerView: 2.8,
      spaceBetween: 15,
    },
    640: {
      slidesPerView: 6.3,
      spaceBetween: 15,
    },
  },
};

const ProductSlide = ({
  data = [],
  callback,
  type = 2,
  cardBgStyle = {},
  imgBgStyle = {},
  swiperOptions = {},
  noDetailModal = false,
  cartType,
  retailerId,
  useBusyLoader = false,
}: Props) => {
  const swOptions = useMemo(() => {
    return { ...slideOptions, ...swiperOptions };
  }, [swiperOptions]);

  const [prdModal, setPrdModal] = useState({ show: false, dealId: "" });
  const [otherModal, setOtherModal] = useState({ show: false, dealId: "" });

  const cb = (e: any) => {
    if (e.action == "login") {
      setPrdModal({ show: false, dealId: "" });
    }

    if (e.action == "click" && !noDetailModal) {
      setPrdModal({ show: true, dealId: e.data?.deal?._id });
      return;
    }

    if (e.action === "add") {
      const id = e.data?.data?.data?.id;
      const showOtherDeals = e.data?.data?.data?.showOtherDeals;
      if (id && showOtherDeals && !AuthService.isBuyerUser()) {
        setOtherModal({ show: true, dealId: id });
        return;
      }
    }

    if (callback) {
      callback(e);
    }
  };

  const prdModalCb = () => {
    setPrdModal({ show: false, dealId: "" });
  };

  const otherModalCb = (a: any) => {
    // Close or forward actions to parent callback
    setOtherModal({ show: false, dealId: "" });
    if (callback) {
      callback(a);
    }
  };

  if (data.length == 0) {
    return null;
  }

  return (
    <>
      <AppSwiper config={swOptions}>
        {data.map((x) => (
          <AppSwiper.Slide key={x._id}>
            <div>
              <ProductCard
                bgStyle={cardBgStyle}
                imgBgStyle={imgBgStyle}
                data={x}
                type={type}
                callback={cb}
                cartType={cartType}
                useBusyLoader={useBusyLoader}
              />
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
      {!noDetailModal ? (
        <ProductDetailModal
          show={prdModal.show}
          dealId={prdModal.dealId}
          callback={prdModalCb}
          cartType={cartType}
          retailerId={retailerId}
        />
      ) : null}

      <OtherRecommendedDealModal
        show={otherModal.show}
        dealId={otherModal.dealId}
        callback={otherModalCb}
      />
    </>
  );
};

export default ProductSlide;
