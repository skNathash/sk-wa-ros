import PriceEvents from "~/shared/inventory/components/price-events/PriceEvents";
import ChannelPrice from "./components/channel-price/ChannelPrice";
import { CHANNEL_PRICE_CARDS } from "./components/channel-price/helper";
import InAndAround from "./components/in-and-around/InAndAround";
import PriceTrend from "./components/price-trend/PriceTrend";
import RetailerGroups from "./components/retailer-groups/RetailerGroups";

const ProductTrend = () => {
  return (
    <div className="tw:flex tw:flex-col tw:gap-3">
      <PriceTrend />
      <InAndAround />
      <PriceEvents />
      {/* The channels sit side by side so they read against each other; they
          stack on narrow screens, and stretch so the cards end level. */}
      <div className="tw:grid tw:grid-cols-1 tw:items-stretch tw:gap-3 tw:sm:grid-cols-2">
        {CHANNEL_PRICE_CARDS.map(({ key, ...preset }) => (
          <ChannelPrice key={key} {...preset} />
        ))}
      </div>
      <RetailerGroups />
    </div>
  );
};

export default ProductTrend;
