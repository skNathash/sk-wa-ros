import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AddToCart from "~/components/feature/products/add-to-cart/AddToCart";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import type { BuyCartType, Deal } from "~/types/CommonTypes";

interface CartItemProps {
  item: Deal;
  callback?: (action: string, id: string, qty?: number) => void;
  cartType?: BuyCartType;
  isLast?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  callback,
  cartType,
  isLast,
}) => {
  const { t } = useTranslation();

  const handleRemove = () => {
    callback?.("remove", item.id);
  };

  return (
    <div
      className={`tw:relative tw:bg-white tw:px-2 tw:py-4 tw:mb-0 tw:border-b tw:border-gray-200 ${
        isLast ? "tw:border-b-0" : ""
      }`}
    >
      <button
        onClick={handleRemove}
        className="tw:absolute tw:top-2 tw:right-2 tw:text-gray-400 tw:hover:tw:text-red-500 tw:transition-colors tw:z-10 tw:cursor-pointer"
      >
        <Trash2 size={16} />
      </button>

      <div className="tw:flex tw:gap-2">
        <div className="tw:shrink-0">
          {item.images && item.images.length > 0 ? (
            <ImgRender
              assetId={item.images[0]}
              alt={item.name}
              className="tw:w-14 tw:h-14 tw:object-cover tw:rounded"
            />
          ) : (
            <div className="tw:w-14 tw:h-14 tw:bg-gray-100 tw:rounded tw:flex tw:items-center tw:justify-center">
              <span className="tw-text-gray-400 tw:text-[10px]">No Image</span>
            </div>
          )}
        </div>

        <div className="tw:flex-1 tw:min-w-0">
          <h3 className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-0.5 tw:pr-5 tw:line-clamp-2">
            {item.name}
          </h3>

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1 tw:text-xs tw:text-gray-600 tw:mb-1.5">
            <span>{item.brand?.name}</span>
          </div>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <Amount
                value={item.price}
                className="tw:text-base tw:font-bold tw:text-emerald-600"
              />
              {item.mrp > 0 && item.mrp !== item.price && (
                <>
                  <Amount
                    value={item.mrp}
                    className="tw:text-xs tw:text-gray-400 tw:line-through"
                  />
                  {item.discount > 0 && (
                    <span className="tw:text-xs tw:text-red-500 tw:ml-1">
                      {item.discount}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="tw:flex tw:items-center tw:gap-1">
              <div className="tw:relative">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <span className="tw-text-xs tw-text-gray-600">
                    {t("qty")}:
                  </span>
                  <AddToCart
                    deal={item}
                    callback={(response) => {
                      if (response.action === "remove") {
                        callback?.("remove", item.id);
                      } else if (
                        response.action === "add" ||
                        response.action === "update"
                      ) {
                        callback?.("refresh", item.id);
                      }
                    }}
                    cartType={cartType}
                  />
                </div>
                {item.priceSlabs && item.priceSlabs.length > 0 && (
                  <div className="tw:absolute tw:-top-6 tw:right-1 tw:z-20">
                    <KingSlabInfo slabs={item.priceSlabs} size="xs" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
