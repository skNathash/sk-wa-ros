import type { SwiperOptions } from "swiper/types";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";

interface SummaryProps {
  summary: any[];
  onStatusClick?: (status: any) => void;
  activeStatus?: string;
}

const Summary = ({ summary, onStatusClick, activeStatus }: SummaryProps) => {
  const getColor = (item: any) => {
    if (item.apiFilter?.filter?.status === "Active") return "success";
    if (item.apiFilter?.filter?.status === "Inactive") return "danger";
    return "primary";
  };

  return (
    <div className="tw:mb-4">
      <AppSwiper config={swiperConfig}>
        {summary.map((item) => (
          <AppSwiper.Slide key={item.label} isAutoWidth={true}>
            <AppStatsCard
              label={item.label}
              icon={item.icon} // Pass icon prop
              color={getColor(item)}
              onClick={onStatusClick ? () => onStatusClick(item) : undefined}
              active={activeStatus === item.apiFilter?.filter?.status}
              template={2}
              className="tw:md:min-w-64"
            >
              <span className="tw:font-bold">
                {item.loading ? "..." : item.value || 0}
              </span>
            </AppStatsCard>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 12,
  pagination: false,
  navigation: false,
};

export default Summary;
