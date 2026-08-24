import BannerSlide from "~/shared/banners/banner-slide/BannerSlide";
// import ExclusivePrices from "./components/exclusive-prices/ExclusivePrices";
import Paylater from "./components/paylater/Paylater";
import RecentOrders from "./components/recent-orders/RecentOrders";
import Summary from "./components/summary/Summary";
import TopSkusBought from "./components/top-skus-bought/TopSkusBought";

type OverviewProps = {
  retailer: any;
  // The page hides the tabs entirely when it is deep-linked to a product, so
  // the intro banners are opt-in from the page.
  showIntro?: boolean;
};

const Overview = ({ retailer, showIntro = true }: OverviewProps) => {
  return (
    <>
      {showIntro && (
        <div className="tw:mb-4">
          <BannerSlide placeholder="HOME_TOP_BANNER" retailerId={retailer._id} />
        </div>
      )}

      <Summary id={retailer._id} className="tw:mb-4" />
      <Paylater
        retailerId={retailer._id}
        retailerName={retailer.name}
        className="tw:mb-4"
      />
      {/* <ExclusivePrices retailerId={retailer._id} className="tw:mb-4" /> */}
      <TopSkusBought retailerId={retailer._id} className="tw:mb-4" />
      <RecentOrders retailerId={retailer._id} className="tw:mb-4" />
    </>
  );
};

export default Overview;
