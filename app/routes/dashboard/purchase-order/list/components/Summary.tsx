import type { SwiperOptions } from "swiper/types";
import { useTranslation } from "react-i18next";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import useScreenView from "~/hooks/useScreenView";
import Amount from "~/components/core/amount/Amount";

interface SummaryProps {
  summary: any[];
  callback?: (value: string) => void;
  selected?: string;
}

const Summary = ({ summary, callback, selected }: SummaryProps) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const renderSummary = (item: any) => {
    return (
      <AppStatsCard
        label={t(item.label)}
        icon={item.icon}
        color={item.color}
        template={2}
      >
        <div className="tw:text-xl tw:font-bold">
          {item.loading ? (
            "..."
          ) : item.key === "totalPoValue" ? (
            <Amount value={item.value} />
          ) : (
            item.value
          )}
        </div>
      </AppStatsCard>
    );
  };

  return (
    <div className="tw:mb-4">
      {isMobile ? (
        <>
          {summary.map((item, index) => (
            <div key={index} className="tw:mb-4">
              {renderSummary(item)}
            </div>
          ))}
        </>
      ) : (
        <AppSwiper config={swiperConfig}>
          {summary.map((item, index) => (
            <AppSwiper.Slide key={index}>{renderSummary(item)}</AppSwiper.Slide>
          ))}
        </AppSwiper>
      )}
    </div>
  );
};

const swiperConfig: SwiperOptions = {
  slidesPerView: 4.5,
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  slidesOffsetAfter: 1,
  slidesOffsetBefore: 1,
};

export default Summary;
