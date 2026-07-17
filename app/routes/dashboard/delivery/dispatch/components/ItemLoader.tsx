import React from "react";
import { Skeleton } from "~/components/ui/skeleton";
import AppCard from "~/components/core/card/AppCard";
import Divider from "~/components/core/divider/Divider";

const ItemLoader: React.FC = () => {
  return (
    <AppCard noPadding className="tw:mb-0">
      <div className="tw:p-4">
        <div className="tw:flex tw:gap-2 tw:mb-1 tw:items-center">
          <Skeleton className="tw:h-5 tw:w-24" />
          <Skeleton className="tw:h-5 tw:w-12 tw:rounded-full" />
        </div>
        <div className="tw:flex tw:gap-2 tw:items-center">
          <Skeleton className="tw:h-4 tw:w-4 tw:rounded" />
          <Skeleton className="tw:h-4 tw:w-20" />
        </div>
      </div>
      <Divider className="tw:my-0!" />
      <div className="tw:p-4">
        <div className="tw:flex tw:gap-2 tw:items-start">
          <div className="tw:flex-1">
            <Skeleton className="tw:h-4 tw:w-16 tw:mb-1" />
            <Skeleton className="tw:h-4 tw:w-24" />
          </div>
          <Skeleton className="tw:h-8 tw:w-32 tw:rounded" />
        </div>
      </div>
    </AppCard>
  );
};

export default ItemLoader;
