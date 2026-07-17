import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import { Tag } from "lucide-react";

type Props = {
  item: Record<string, any>;
};

const Item = ({ item }: Props) => {
  // Keys used by SellerCatalogService.formatProductResponse
  const name = item.name || item.dealName || "Deal";
  const images: string[] = item.images || item._raw?.images || [];
  const mrp = item.mrp ?? 0;
  const kcInfo = item.kcStoreInfo || {};
  const requiredKingCoins = kcInfo.requiredKingCoins || 0;

  return (
    <AppCard
      noPadding
      className="tw:mb-0 tw:overflow-hidden hover:tw:shadow-lg tw:transition-shadow tw:duration-200 tw:border-gray-200"
    >
      <div className="tw:flex tw:flex-col tw:h-full">
        {/* Product Image (smaller on desktop) */}
        <div className="tw:relative tw:w-full tw:flex tw:items-center tw:justify-centertw:h-40 sm:tw:h-44 md:tw:h-40 lg:tw:h-28">
          <ImgRender
            assetId={images?.[0]}
            className="tw:max-h-full tw:w-auto tw:object-contain"
            size="400x400"
            alt={name}
          />
        </div>

        {/* Product Details */}
        <div className="tw:p-3 tw:flex tw:flex-col tw:flex-1">
          {/* Product Name with fixed-height container to align cards */}
          <div className="tw:h-12 tw:mb-2">
            <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:line-clamp-2 tw:leading-tight">
              {name}
            </h3>
          </div>

          {/* MRP Section */}
          {/* {mrp > 0 && (
            <p className="tw:text-xs tw:text-red-500 tw:line-through tw:mb-2 tw:font-medium">
              MRP: <Amount value={mrp} />
            </p>
          )} */}

          {/* Coins to Buy - Prominent */}
          <div className="tw:mt-auto tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
            <span className="tw:text-xs tw:text-gray-800 tw:font-medium tw:flex tw:items-center tw:gap-1">
              Buy using{" "}
              <span className="tw:font-semibold tw:text-red-500 tw:text-sm">
                {requiredKingCoins}
              </span>
            </span>
            <ImgRender
              src="kingcoins/logo.png"
              alt="COINS"
              className="tw:h-4"
            />
            {/* <span className="tw:text-xs tw:text-gray-800 tw:font-medium">
              to buy
            </span> */}
          </div>
        </div>
      </div>
    </AppCard>
  );
};

export default Item;
