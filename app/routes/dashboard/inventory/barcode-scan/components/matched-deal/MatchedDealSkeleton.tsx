import AppCard from "~/components/core/card/AppCard";

const MatchedDealSkeleton = () => (
  <AppCard noPadding className="tw:overflow-hidden">
    <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-4 tw:p-4 tw:animate-pulse">
      <div className="tw:bg-gray-200 tw:rounded-lg tw:w-full tw:md:w-40 tw:h-40 tw:shrink-0" />
      <div className="tw:flex tw:flex-col tw:flex-1 tw:gap-3 tw:min-w-0">
        <div className="tw:h-5 tw:bg-gray-200 tw:rounded tw:w-3/4" />
        <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-1/2" />
        <div className="tw:h-3 tw:bg-gray-200 tw:rounded tw:w-2/5" />
        <div className="tw:h-6 tw:bg-gray-200 tw:rounded tw:w-24 tw:mt-1" />
        <div className="tw:h-9 tw:bg-gray-200 tw:rounded tw:w-40 tw:mt-2" />
      </div>
    </div>
  </AppCard>
);

export default MatchedDealSkeleton;
