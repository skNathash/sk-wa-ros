import React from "react";
import { useTranslation } from "react-i18next";
import { fetchTrending, TRENDING_SEE_ALL } from "../helper";
import DiscoverRail from "./DiscoverRail";

const TrendingRail: React.FC = () => {
  const { t } = useTranslation(["inventorySubscribe"]);
  return (
    <DiscoverRail
      title={t("discover.trending.title", {
        defaultValue: "Trending near you",
      })}
      subtitle={t("discover.trending.subtitle", {
        defaultValue: "Top-selling products in the SK Library",
      })}
      seeAllTo={TRENDING_SEE_ALL}
      fetcher={fetchTrending}
    />
  );
};

export default TrendingRail;
