import React from "react";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import CatalogSignalStats from "~/shared/catalog/components/catalog-signal-stats/CatalogSignalStats";
import Brands from "./components/brands/Brands";
import Categories from "./components/categories/Categories";
import NewlyLaunchedRail from "./components/newly-launched/NewlyLaunchedRail";
import SellingAroundYouRail from "./components/selling-around-you/SellingAroundYouRail";
import SearchLauncher from "./components/SearchLauncher";
import SeeAllCatalog from "./components/SeeAllCatalog";
import TrendingRail from "./components/TrendingRail";

export async function clientLoader() {
  return PageAccessService.canAccessPage([], { allowNoSubscribe: true });
}

const SubscribeDiscover: React.FC = () => {
  return (
    // Bottom room on mobile so the floating cart bar clears the last section.
    <div className="tw:pb-16 tw:md:pt-1 tw:md:pb-0">
      <SearchLauncher />
      <CatalogSignalStats className="tw:mb-5 tw:md:mb-4" />
      <NewlyLaunchedRail />
      <SellingAroundYouRail />
      <TrendingRail />

      {/* Browse entry points — side by side on desktop, stacked on mobile. */}
      <div className="tw:mb-5 tw:grid tw:grid-cols-1 tw:gap-5 tw:md:mb-7 tw:md:grid-cols-2 tw:md:gap-8">
        <Categories />
        <Brands />
      </div>

      <SeeAllCatalog className="tw:mb-5 tw:md:mb-7" />
    </div>
  );
};

export default SubscribeDiscover;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Discover"),
    },
  ];
}
