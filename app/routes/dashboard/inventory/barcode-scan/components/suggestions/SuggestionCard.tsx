import { useState } from "react";
import { Barcode, Box, Check } from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

interface SuggestionItem {
  _id: string;
  name: string;
  mrp: number;
  price: number;
  images: string[];
  barcodeStr?: string;
  barcodes?: string[];
  isInCart?: boolean;
  brand?: { id?: string; name?: string };
}

interface Props {
  item: SuggestionItem;
}

const SuggestionCard: React.FC<Props> = ({ item }) => {
  const [inCart, setInCart] = useState(!!item.isInCart);

  return (
    <AppCard noPadding className="tw:overflow-hidden">
      <div className="tw:bg-white tw:p-1">
        <div className="tw:flex tw:justify-center tw:items-center tw:h-28">
          {item.images?.[0] ? (
            <ImgRender
              assetId={item.images[0]}
              alt={item.name}
              className="tw:h-28 tw:object-cover tw:w-28"
            />
          ) : (
            <Box size={28} className="tw:text-gray-400" />
          )}
        </div>
      </div>
      <div className="tw:p-2">
        <div className="tw:h-12">
          <div className="tw:text-xs tw:font-medium tw:line-clamp-2">
            {item.name}
          </div>
        </div>
        {item.brand?.name && (
          <div className="tw:mt-1">
            <span className="tw:inline-block tw:max-w-full tw:truncate tw:text-[10px] tw:font-medium tw:text-gray-600 tw:bg-gray-100 tw:rounded-full tw:px-1.5 tw:py-0.5">
              {item.brand.name}
            </span>
          </div>
        )}
        <div className="tw:flex tw:items-center tw:gap-1 tw:mt-1 tw:h-4 tw:text-[10px] tw:text-gray-500">
          {(item.barcodeStr || item.barcodes?.[0]) && (
            <>
              <Barcode className="tw:w-2.5 tw:h-2.5 tw:shrink-0" />
              <span className="tw:font-mono tw:truncate">
                {item.barcodeStr || item.barcodes?.[0]}
              </span>
            </>
          )}
        </div>
        <div className="tw:flex tw:justify-between tw:gap-2 tw:items-center tw:mt-2">
          <div className="tw:flex tw:flex-col tw:gap-0.5">
            <span className="tw:text-[10px] tw:text-blue-600">MRP</span>
            <Amount
              value={item.mrp || 0}
              className="tw:font-medium tw:text-blue-800 tw:text-sm"
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
              color="success"
              className="tw:px-3"
              callback={(r) => {
                if (r.action === "subscribed") setInCart(true);
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

export default SuggestionCard;
