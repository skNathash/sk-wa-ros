import { useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppHeader from "~/components/core/header/AppHeader";
import FulfillmentTab from "../components/FulfillmentTab";

const swiperConfig: SwiperOptions = {
  slidesPerView: 4,
  spaceBetween: 10,
  breakpoints: {
    320: { slidesPerView: 1.5 },
    768: { slidesPerView: 4 },
  },
};

const VendorReturnFulfillmentList = () => {
  const [activeTab, setActiveTab] = useState("vendor-return");

  return (
    <>
      <AppHeader title="Fulfillment List" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            View and manage vendor return fulfillment requests and orders.
          </div>

          <FulfillmentTab activeTab={activeTab} />

          {/* AppSwiper remains below the tab content */}
          {/* <AppSwiper config={swiperConfig}>
            <AppSwiper.Slide>
              <NewOrders />
            </AppSwiper.Slide>
            <AppSwiper.Slide>
              <NewOrders />
            </AppSwiper.Slide>
            <AppSwiper.Slide>
              <NewOrders />
            </AppSwiper.Slide>
            <AppSwiper.Slide>
              <NewOrders />
            </AppSwiper.Slide>
          </AppSwiper> */}
        </div>
      </div>
    </>
  );
};

export default VendorReturnFulfillmentList;
