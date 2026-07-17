import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
// Import specific icons from lucide-react instead of dynamic icon resolution
import {
  AlertTriangle as AlertTriangleIcon,
  Box as BoxIcon,
  IndianRupee as IndianRupeeIcon,
  MinusCircle as MinusCircleIcon,
  Package as PackageIcon,
  ShoppingBag as ShoppingBagIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import { defaultSummary } from "../helpers";

interface SummaryProps {
  summary?: {
    totalDeals?: number;
    totalOrderedQty?: number;
    totalReceivedQty?: number;
    totalDamagedQty?: number;
    totalShortageQty?: number;
    totalCost?: number;
    averageFulfillment?: number;
    totalBoxes?: number;
  };
}

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

function renderSummaryCard(
  item: {
    label: string;
    icon?: string;
    iconColor?: string;
    key: string;
  },
  t: (key: string) => string,
  summaryData?: {
    totalDeals?: number;
    totalOrderedQty?: number;
    totalReceivedQty?: number;
    totalDamagedQty?: number;
    totalShortageQty?: number;
    totalCost?: number;
    averageFulfillment?: number;
    totalBoxes?: number;
  }
) {
  // Determine if value should be red
  const isRedValue = item.key === "damaged" || item.key === "shortage";

  // Get value from summary data
  let value = 0;
  if (summaryData) {
    switch (item.key) {
      case "orders":
        value = summaryData.totalDeals || 0;
        break;
      case "totalValue":
        value = summaryData.totalCost || 0;
        break;
      case "products":
        value = summaryData.totalReceivedQty || 0;
        break;
      case "damaged":
        value = summaryData.totalDamagedQty || 0;
        break;
      case "shortage":
        value = summaryData.totalShortageQty || 0;
        break;
      case "boxes":
        value = summaryData.totalBoxes || 0;
        break;
      default:
        value = 0;
    }
  }

  const Icon = (() => {
    switch (item.icon) {
      case "package":
        return PackageIcon;
      case "indian-rupee":
        return IndianRupeeIcon;
      case "shopping-bag":
        return ShoppingBagIcon;
      case "alert-triangle":
        return AlertTriangleIcon;
      case "minus-circle":
        return MinusCircleIcon;
      case "box":
        return BoxIcon;
      default:
        return null;
    }
  })();

  // Use AppStatsCard to render consistent stats card UI across app
  return (
    <AppStatsCard
      key={item.key}
      label={t(item.label)}
      icon={Icon ? <Icon size={20} color={item.iconColor} /> : undefined}
      template={2}
      className="tw:min-w-32"
    >
      <div>
        <span
          className={`tw:text-2xl tw:font-bold${
            isRedValue ? " tw:text-red-600" : ""
          }`}
        >
          {item.key === "totalValue"
            ? `₹${value.toLocaleString()}`
            : value.toLocaleString()}
        </span>
      </div>
    </AppStatsCard>
  );
}

const Summary = ({ summary }: SummaryProps) => {
  const { t } = useTranslation(["common"]);

  // Swiper for desktop
  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-5 tw:gap-4 tw:mb-4">
      {defaultSummary.map((item, index) => (
        <div key={index}>{renderSummaryCard(item, t, summary)}</div>
      ))}
    </div>
  );
};

export default Summary;
