import React from "react";
import { useSearchParams } from "react-router";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";

interface BrandItemProps {
  data: any;
}

const Item: React.FC<BrandItemProps> = ({ data }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleViewProducts = () => {
    const next = new URLSearchParams(searchParams);
    next.set("search", "");
    next.set("tab", "products");
    next.set("brandId", data._id);
    next.set("brandName", data.name);

    setSearchParams(next);
  };

  return (
    <AppCard className="tw:overflow-hidden" noPadding>
      <div className="tw:flex tw:flex-col">
        <div className="tw:relative">
          <div className="tw:w-full tw:h-28 tw:bg-gray-100 tw:overflow-hidden">
            {data._displayImg ? (
              <ImgRender
                assetId={data._displayImg}
                alt={data.name}
                className="tw:w-full tw:h-full tw:object-cover tw:block"
                size="300"
              />
            ) : null}
          </div>
        </div>

        <div className="tw:p-3 tw:pt-3">
          <div className="tw:h-14 tw:flex tw:items-center">
            <div className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900 tw:line-clamp-2">
              {data._displayName}
            </div>
          </div>
          <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5 tw:line-clamp-2">
            {data.dealsCount} deals
          </div>
          <div className="tw:mt-3 tw:flex tw:justify-center">
            <AppButton
              size="small"
              className="tw:w-full"
              onClick={handleViewProducts}
            >
              View
            </AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default Item;
