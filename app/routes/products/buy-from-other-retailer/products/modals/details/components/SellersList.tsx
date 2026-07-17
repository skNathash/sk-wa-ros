import React from "react";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import { MapPin } from "lucide-react";
import AddToCart from "../../../components/AddToCart";

type Seller = {
  price: number;
  qty: number;
  name: string;
  id: string;
  refId: string;
  mrp: number;
  distance: number;
  discountPercentage: number;
  deal: any;
};

type Props = {
  loading?: boolean;
  silentLoading?: boolean;
  sellers: Seller[];
  onAddToCart?: (response: { action: string; data: any }) => void;
};

const SellersList = ({
  loading = false,
  silentLoading = false,
  sellers = [],
  onAddToCart = () => {},
}: Props) => {
  const handleAddToCart = (seller: Seller, data: Record<string, any>) => {
    onAddToCart({
      action: data.action,
      data: {
        sellerId: seller.id,
        ...(data?.data || {}),
      },
    });
  };

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div className="tw:flex-1 tw:overflow-y-auto tw:relative">
      {silentLoading && (
        <div className="tw:absolute tw:inset-0 tw:bg-white/50 tw:backdrop-blur-[1px] tw:z-20 tw:flex tw:items-center tw:justify-center">
          <div className="tw:bg-white tw:p-3 tw:rounded-full tw:shadow-lg tw:border tw:border-gray-100">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        </div>
      )}

      <h4 className="tw:text-sm tw:font-semibold tw:text-gray-700 tw:mb-3 tw:uppercase tw:tracking-wide">
        Available Sellers ({sellers.length})
      </h4>

      {sellers.length > 0 ? (
        <div className="tw:space-y-2">
          {sellers.map((seller, index) => (
            <div
              key={index}
              className="tw:bg-white tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden hover:tw:border-blue-400 hover:tw:shadow-sm tw:transition-all"
            >
              <div className="tw:p-3">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:mb-2">
                  <div className="tw:flex-1 tw:min-w-0 tw:flex tw:items-center tw:gap-2">
                    <h5 className="tw:font-semibold tw:text-gray-900 tw:text-sm tw:truncate">
                      {seller.name}
                    </h5>
                    <span className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-0.5 tw:flex-shrink-0">
                      <MapPin className="tw:w-3 tw:h-3" />
                      {seller.distance?.toFixed(1) || 0} km
                    </span>
                  </div>
                  {seller.discountPercentage > 0 && (
                    <div className="tw:bg-red-500 tw:text-white tw:px-2 tw:py-0.5 tw:rounded-full tw:text-[10px] tw:font-bold tw:leading-none tw:flex-shrink-0">
                      {seller.discountPercentage}% OFF
                    </div>
                  )}
                </div>

                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
                  <div className="tw:flex tw:flex-col tw:gap-0.5">
                    <div className="tw:flex tw:items-baseline tw:gap-1.5">
                      <div className="tw:text-lg tw:font-bold tw:text-green-600">
                        <Amount value={seller.price || 0} />
                      </div>
                      {seller.mrp > seller.price && (
                        <div className="tw:text-xs tw:font-medium tw:text-gray-400 tw:line-through">
                          <Amount value={seller.mrp || 0} />
                        </div>
                      )}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      <span className="tw:font-medium tw:text-gray-700">
                        {seller.qty}
                      </span>{" "}
                      in stock
                    </div>
                  </div>

                  <AddToCart
                    qty={seller.deal?.inCart?.qty || 0}
                    maxQty={seller.qty}
                    dealId={seller.deal?._id}
                    itemId={seller.deal?.itemId}
                    cartId={seller.deal?.cartId}
                    sellerId={seller.id}
                    callback={(data) => handleAddToCart(seller, data)}
                    type={seller.deal?.inCart?.status ? 2 : 1}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tw:text-center tw:py-8">
          <p className="tw:text-gray-400 tw:text-sm">No sellers available</p>
        </div>
      )}
    </div>
  );
};

export default SellersList;
