import { useState } from "react";
import { Barcode, Box, Check } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

interface Props {
  items: any[];
  activeBrand?: string | null;
  activeCategory?: string | null;
  onSelectBrand?: (brand: string | null) => void;
  onSelectCategory?: (category: string | null) => void;
  onSubscribed?: () => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}

const MobileView: React.FC<Props> = ({
  items,
  activeBrand,
  activeCategory,
  onSelectBrand,
  onSelectCategory,
  onSubscribed,
  onImagePreview,
}) => (
  <div className="tw:flex tw:flex-col tw:gap-2">
    {items.map((item) => (
      <DealRow
        key={item._id}
        item={item}
        activeBrand={activeBrand}
        activeCategory={activeCategory}
        onSelectBrand={onSelectBrand}
        onSelectCategory={onSelectCategory}
        onSubscribed={onSubscribed}
        onImagePreview={onImagePreview}
      />
    ))}
  </div>
);

const DealRow: React.FC<{
  item: any;
  activeBrand?: string | null;
  activeCategory?: string | null;
  onSelectBrand?: (brand: string | null) => void;
  onSelectCategory?: (category: string | null) => void;
  onSubscribed?: () => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}> = ({
  item,
  activeBrand,
  activeCategory,
  onSelectBrand,
  onSelectCategory,
  onSubscribed,
  onImagePreview,
}) => {
  const [inCart, setInCart] = useState(!!item.isInCart);

  const categoryName = item.category?.name;
  const brandName = item.brand?.name;
  const isCategoryActive = !!categoryName && categoryName === activeCategory;
  const isBrandActive = !!brandName && brandName === activeBrand;

  return (
    <AppCard noPadding className="tw:overflow-hidden">
      <div className="tw:flex tw:items-center tw:gap-3 tw:p-2.5">
        {item.images?.[0] ? (
          <button
            type="button"
            onClick={() => onImagePreview?.(item.images, item.images[0])}
            className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:bg-gray-50 tw:rounded-md tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
          >
            <ImgRender
              assetId={item.images[0]}
              alt={item.name}
              className="tw:max-h-16 tw:max-w-16 tw:object-contain"
            />
          </button>
        ) : (
          <div className="tw:flex tw:items-center tw:justify-center tw:w-16 tw:h-16 tw:bg-gray-50 tw:rounded-md tw:shrink-0">
            <Box size={24} className="tw:text-gray-300" />
          </div>
        )}

        <div className="tw:flex tw:flex-col tw:flex-1 tw:min-w-0 tw:gap-0.5">
          <div className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2">
            {item.name}
          </div>
          {item.dealId && (
            <div className="tw:text-[10px] tw:font-mono tw:text-gray-500 tw:truncate">
              {item.dealId}
            </div>
          )}
          {(brandName || categoryName) && (
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1">
              {brandName && (
                <button
                  type="button"
                  title={`Filter by ${brandName}`}
                  onClick={() =>
                    onSelectBrand?.(isBrandActive ? null : brandName)
                  }
                  className={`tw:cursor-pointer tw:max-w-full tw:truncate tw:text-[10px] tw:font-medium tw:rounded-full tw:px-1.5 tw:py-0.5 tw:transition-colors ${
                    isBrandActive
                      ? "tw:bg-blue-600 tw:text-white"
                      : "tw:bg-gray-100 tw:text-gray-600 tw:hover:bg-blue-50 tw:hover:text-blue-700"
                  }`}
                >
                  {brandName}
                </button>
              )}
              {categoryName && (
                <button
                  type="button"
                  title={`Filter by ${categoryName}`}
                  onClick={() =>
                    onSelectCategory?.(isCategoryActive ? null : categoryName)
                  }
                  className={`tw:cursor-pointer tw:max-w-full tw:truncate tw:text-[10px] tw:font-medium tw:rounded-full tw:px-1.5 tw:py-0.5 tw:transition-colors ${
                    isCategoryActive
                      ? "tw:bg-blue-600 tw:text-white"
                      : "tw:bg-gray-100 tw:text-gray-600 tw:hover:bg-blue-50 tw:hover:text-blue-700"
                  }`}
                >
                  {categoryName}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="tw:flex tw:flex-col tw:items-end tw:gap-1.5 tw:shrink-0">
          <div className="tw:flex tw:flex-col tw:items-end">
            <span className="tw:text-[10px] tw:text-gray-500 tw:uppercase">
              MRP
            </span>
            <Amount
              value={item.mrp || 0}
              className="tw:text-sm tw:font-bold tw:text-blue-700"
            />
          </div>
          {inCart ? (
            <span className="tw:inline-flex tw:items-center tw:gap-0.5 tw:text-[10px] tw:font-semibold tw:text-green-600">
              <Check className="tw:w-3 tw:h-3" strokeWidth={3} />
              In cart
            </span>
          ) : (
            <SubscribeBtn
              dealId={item._id}
              dealName={item.name}
              mrp={item.mrp}
              price={item.price}
              images={item.images || []}
              size="small"
              className="tw:px-3"
              callback={(r) => {
                if (r.action === "subscribed") {
                  setInCart(true);
                  onSubscribed?.();
                }
              }}
            >
              Subscribe
            </SubscribeBtn>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default MobileView;
