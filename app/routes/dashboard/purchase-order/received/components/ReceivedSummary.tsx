import { useTranslation } from "react-i18next";
import type { SwiperOptions } from "swiper/types";
import AppStatsCard from "~/components/core/stats-card/AppStatsCard";
import AppSwiper from "~/components/core/swiper/AppSwiper";
import useScreenView from "~/hooks/useScreenView";
import type { ReceivedSummary as Summary } from "../helper";

type Props = {
  summary: Summary;
};

/**
 * Four numbers close the loop on a receipt: what was ordered, what physically
 * arrived, what went into stock and what came in damaged.
 */
const ReceivedSummary = ({ summary }: Props) => {
  const { t } = useTranslation();
  const { isMobile } = useScreenView();

  const cards = [
    {
      key: "ordered",
      label: t("ordered"),
      value: summary.ordered,
      sub: t("units", { defaultValue: "units" }),
      icon: "package",
      color: "primary" as const,
    },
    {
      key: "received",
      label: t("received"),
      value: summary.received,
      sub: t("unitsArrived", { defaultValue: "units arrived" }),
      icon: "package-check",
      color: "info" as const,
    },
    {
      key: "inwarded",
      label: t("inwarded", { defaultValue: "Inwarded" }),
      value: summary.inwarded,
      sub: t("toStock", { defaultValue: "to stock" }),
      icon: "circle-check",
      color: "success" as const,
    },
    {
      key: "damaged",
      label: t("damaged"),
      value: summary.damaged,
      sub: t("damagedUnits", { defaultValue: "damaged units" }),
      icon: "triangle-alert",
      color: "danger" as const,
    },
  ];

  const renderCard = (card: (typeof cards)[number]) => (
    <AppStatsCard
      label={card.label}
      icon={card.icon}
      color={card.color}
      template={2}
    >
      <div className="tw:text-xl tw:font-bold">{card.value}</div>
      <div className="tw:text-[11px] tw:text-gray-500 tw:truncate">
        {card.sub}
      </div>
    </AppStatsCard>
  );

  return (
    <div className="tw:mb-4">
      <AppSwiper config={isMobile ? mobileSwiperConfig : desktopSwiperConfig}>
        {cards.map((card) => (
          <AppSwiper.Slide key={card.key}>{renderCard(card)}</AppSwiper.Slide>
        ))}
      </AppSwiper>
    </div>
  );
};

const baseSwiperConfig: SwiperOptions = {
  spaceBetween: 12,
  pagination: false,
  navigation: false,
  slidesOffsetAfter: 1,
  slidesOffsetBefore: 1,
};

// Desktop shows the four cards in one row; mobile peeks the next card so the
// strip reads as swipeable.
const desktopSwiperConfig: SwiperOptions = {
  ...baseSwiperConfig,
  slidesPerView: 4,
};

const mobileSwiperConfig: SwiperOptions = {
  ...baseSwiperConfig,
  slidesPerView: 1.5,
};

export default ReceivedSummary;
