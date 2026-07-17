import React from "react";
import { useNavigate } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AddToCart from "../add-to-cart/AddToCart";
import AddToBasket from "../add-to-basket/AddToBasket";
import clsx from "clsx";
import ImgRender from "~/components/core/img/ImgRender";
import type { Deal } from "~/types/CommonTypes";
import DateFormat from "~/components/core/date/DateFormat";
import { AuthService } from "~/services/AuthService";

type CartAction = "add" | "update" | "remove" | "add-to-basket";

interface ProductItemProps {
  deal: Deal;
  onAddToCart: (response: { action: CartAction; data: any }) => void;
  className?: string;
  cartType?: "normal" | "buyer";
}

const ProductItem: React.FC<ProductItemProps> = ({
  deal,
  onAddToCart,
  className = "",
  cartType,
}) => {
  const navigate = useNavigate();
  const hasDiscount = deal.mrp > deal.price;

  // Determine cartType based on user type if not provided
  const finalCartType =
    cartType || (AuthService.isBuyerUser() ? "buyer" : "normal");

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on the Add to Cart button
    if ((e.target as HTMLElement).closest(".btn")) {
      return;
    }
    navigate(`/products/view/${deal.id}`);
  };

  return (
    <div
      className={clsx(
        "tw:flex tw:flex-col tw:h-full tw:bg-white tw:rounded-lg tw:border tw:border-gray-200 tw:overflow-hidden tw:relative tw:cursor-pointer tw:transition-transform tw:duration-200 tw:hover:scale-102 tw:hover:shadow-lg tw:w-full",
        className
      )}
      onClick={handleClick}
    >
      <div className="tw:relative tw:flex tw:flex-col tw:flex-grow tw:w-full">
        {deal.discount > 0 && (
          <div className="tw:absolute tw:top-2 tw:left-2 tw:bg-green-600 tw:text-white tw:px-2 tw:py-1 tw:rounded-sm tw:text-xs tw:font-medium tw:z-10">
            {deal.discount}% OFF
          </div>
        )}

        <div className="tw:flex tw:flex-col tw:flex-grow tw:p-3 tw:md:p-4 tw:w-full">
          <div className="tw:relative tw:h-32  tw:mb-4">
            <ImgRender
              assetId={deal.images[0]}
              className="tw:object-contain tw:h-full tw:w-full"
              alt={deal.name}
              size="200x200"
            />
            {deal.soldInfo && (
              <div className="tw:absolute tw:bottom-0 tw:left-0 tw:w-full tw:bg-black/45 tw:text-white tw:text-xs tw:px-2 tw:py-1 tw:flex tw:flex-col tw:rounded-b-lg">
                <div className="tw:font-medium">Last ordered</div>
                <div>
                  <DateFormat
                    value={deal.soldInfo.lastOrder}
                    formatStr="dd MMM"
                  />
                  <span className="tw:ml-1">{deal.soldInfo.qty} units</span>
                </div>
              </div>
            )}
          </div>

          <div className="tw:flex tw:flex-col tw:flex-grow">
            {deal.brand && (
              <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                {deal.brand?.name}
              </div>
            )}
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:mb-2 tw:line-clamp-2">
              {deal.name}
            </div>

            <div className="tw:mt-auto tw:flex tw:flex-col tw:gap-2">
              <div className="tw:flex tw:items-center tw:gap-2">
                <Amount
                  value={deal.price}
                  className="tw:text-lg tw:font-bold tw:text-primary"
                />
                {hasDiscount && (
                  <Amount
                    value={deal.mrp}
                    className="tw:text-sm tw:text-gray-500 tw:line-through"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="tw:p-4 tw:pt-0">
          <div onClick={(e) => e.stopPropagation()} className="tw:w-full">
            {deal.buyViaPurchaseBasket ? (
              <AddToBasket deal={deal} callback={onAddToCart} />
            ) : (
              <AddToCart
                deal={deal}
                callback={onAddToCart}
                cartType={finalCartType}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
