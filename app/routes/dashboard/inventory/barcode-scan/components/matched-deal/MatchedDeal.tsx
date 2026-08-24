import { useEffect, useState } from "react";
import {
  ArrowRight,
  Barcode,
  Box,
  CheckCircle2,
  Minus,
  Plus,
  ScanLine,
  ShoppingCart,
  Tag,
} from "lucide-react";

import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppLink from "~/components/core/link/AppLink";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import SubscribeBtn from "~/shared/catalog/components/subscribe-buttons/SubscribeBtn";

export interface MatchedDealData {
  _id: string;
  dealId: string;
  name: string;
  netWeight?: string;
  mrp: number;
  price: number;
  images: string[];
  barcodes: string[];
  barcodeStr: string;
  brand: { id?: string; name?: string };
  category: { id?: string; name?: string };
  isInCart?: boolean;
  cartQuantity?: number;
  isSubscribed?: boolean;
}

interface Props {
  deal: MatchedDealData;
  onAdded?: () => void;
  onScanNext?: () => void;
  onImagePreview?: (images: string[], initialImageId?: string, useProxy?: boolean) => void;
}

const MatchedDeal: React.FC<Props> = ({ deal, onAdded, onScanNext, onImagePreview }) => {
  const [qty, setQty] = useState<number>(0);
  const [inCart, setInCart] = useState<boolean>(!!deal.isInCart);
  const [addedQty, setAddedQty] = useState<number>(deal.cartQuantity || 0);
  const appNav = useAppNav();

  useEffect(() => {
    setQty(0);
    setInCart(!!deal.isInCart);
    setAddedQty(deal.cartQuantity || 0);
  }, [deal._id, deal.isInCart, deal.cartQuantity]);

  return (
    <AppCard noPadding className="tw:overflow-hidden">
      <div className="tw:flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1 tw:bg-emerald-50 tw:border-b tw:border-emerald-100">
        <CheckCircle2 className="tw:w-3.5 tw:h-3.5 tw:text-emerald-600" />
        <span className="tw:text-[11px] tw:font-semibold tw:text-emerald-700">
          Product found in SK Library
        </span>
      </div>

      <div className="tw:flex tw:flex-col tw:md:flex-row">
        <div className="tw:flex tw:gap-3 tw:p-3 tw:md:flex-1 tw:min-w-0">
          {deal.images?.[0] ? (
            <button
              type="button"
              onClick={() => onImagePreview?.(deal.images, deal.images[0])}
              className="tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:rounded-md tw:w-20 tw:h-20 tw:md:w-24 tw:md:h-24 tw:shrink-0 hover:tw:opacity-90 tw:transition-opacity focus:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-blue-500"
            >
              <ImgRender
                assetId={deal.images[0]}
                alt={deal.name}
                className="tw:max-h-20 tw:max-w-20 tw:md:max-h-24 tw:md:max-w-24 tw:object-contain"
              />
            </button>
          ) : (
            <div className="tw:flex tw:items-center tw:justify-center tw:bg-gray-50 tw:rounded-md tw:w-20 tw:h-20 tw:md:w-24 tw:md:h-24 tw:shrink-0">
              <Box size={28} className="tw:text-gray-300" />
            </div>
          )}

          <div className="tw:flex tw:flex-col tw:flex-1 tw:gap-1 tw:min-w-0">
            <div className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:leading-snug tw:line-clamp-2">
              <AppLink
                asLink
                href={
                  deal.isSubscribed
                    ? `/dashboard/inventory/products/view/${deal._id}`
                    : `/dashboard/inventory/subscribe/product-detail/${deal._id}`
                }
                className="tw:text-blue-600 hover:tw:text-blue-800"
              >
                {deal.name}
              </AppLink>
            </div>

            {deal.dealId && (
              <div className="tw:text-[10px] tw:font-mono tw:text-gray-500 tw:truncate">
                {deal.dealId}
              </div>
            )}

            <div className="tw:flex tw:flex-wrap tw:gap-1">
              {deal.brand?.name && (
                <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  <Tag className="tw:w-2.5 tw:h-2.5" />
                  {deal.brand.name}
                </span>
              )}
              {deal.category?.name && (
                <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  {deal.category.name}
                </span>
              )}
              {deal.netWeight && (
                <span className="tw:inline-flex tw:items-center tw:text-[10px] tw:font-medium tw:text-gray-700 tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                  {deal.netWeight}
                </span>
              )}
            </div>

            {/* <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:text-gray-500">
              <Barcode className="tw:w-2.5 tw:h-2.5" />
              <span className="tw:font-mono">{deal.barcodeStr || "—"}</span>
            </div> */}

            <div className="tw:flex tw:items-baseline tw:gap-1.5">
              <span className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:font-medium">
                MRP
              </span>
              <Amount
                value={deal.mrp || 0}
                className="tw:text-base tw:font-bold tw:text-blue-700"
              />
            </div>
          </div>
        </div>

        {deal.isSubscribed ? (
          <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-3 tw:border-t tw:md:border-t-0 tw:md:border-l tw:border-emerald-100 tw:bg-emerald-50 tw:md:w-80 tw:md:justify-center">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <CheckCircle2 className="tw:w-4 tw:h-4 tw:text-emerald-600 tw:shrink-0" />
              <AppLink
                asLink
                href={`/dashboard/inventory/products/view/${deal._id}`}
                className="tw:text-sm tw:font-semibold tw:text-emerald-800 hover:tw:text-emerald-900 tw:cursor-pointer"
              >
                Already Subscribed
              </AppLink>
            </div>
          </div>
        ) : inCart ? (
          <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-3 tw:border-t tw:md:border-t-0 tw:md:border-l tw:border-emerald-100 tw:bg-emerald-50 tw:md:w-80 tw:md:justify-center">
            <div className="tw:flex tw:items-center tw:gap-1.5">
              <CheckCircle2 className="tw:w-4 tw:h-4 tw:text-emerald-600" />
              <span className="tw:text-sm tw:font-semibold tw:text-emerald-800">
                Added{addedQty ? ` ${addedQty}` : ""} to Subscription Cart
              </span>
            </div>
            <div className="tw:flex tw:gap-2">
              {onScanNext && (
                <AppButton
                  size="small"
                  color="primary"
                  onClick={onScanNext}
                  className="tw:flex-1 tw:font-semibold"
                >
                  <ScanLine className="tw:w-4 tw:h-4 tw:mr-1" />
                  Scan next
                </AppButton>
              )}
              <AppButton
                size="small"
                fill="outline"
                color="primary"
                onClick={() =>
                  appNav.to(
                    "/dashboard/inventory/subscribe/cart?from=barcode-scan",
                  )
                }
                className="tw:flex-1 tw:font-semibold"
              >
                View cart
                <ArrowRight className="tw:w-4 tw:h-4 tw:ml-1" />
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="tw:px-3 tw:py-2 tw:border-t tw:md:border-t-0 tw:md:border-l tw:border-gray-100 tw:bg-gray-50 tw:flex tw:flex-row tw:items-end tw:gap-2 tw:md:flex-col tw:md:items-stretch tw:md:w-80 tw:md:justify-center">
            <div className="tw:flex tw:flex-col tw:shrink-0">
              <span className="tw:text-[10px] tw:font-medium tw:text-gray-600 tw:uppercase">
                Quantity
              </span>
              <div className="tw:flex tw:items-stretch tw:self-start tw:border tw:border-gray-300 tw:rounded-md tw:overflow-hidden tw:bg-white tw:mt-0.5">
                <button
                  type="button"
                  aria-label="Decrease"
                  onClick={() => setQty((q) => Math.max(0, q - 1))}
                  className="tw:px-2.5 tw:py-1 tw:text-gray-700 hover:tw:bg-gray-100 active:tw:bg-gray-200 disabled:tw:opacity-40 tw:cursor-pointer"
                  disabled={qty <= 0}
                >
                  <Minus className="tw:w-4 tw:h-4" />
                </button>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setQty(Number.isNaN(n) || n < 0 ? 0 : n);
                  }}
                  className="tw:w-10 tw:text-center tw:text-sm tw:font-bold tw:bg-white focus:tw:outline-none"
                />
                <button
                  type="button"
                  aria-label="Increase"
                  onClick={() => setQty((q) => q + 1)}
                  className="tw:px-2.5 tw:py-1 tw:text-gray-700 hover:tw:bg-gray-100 active:tw:bg-gray-200 tw:cursor-pointer"
                >
                  <Plus className="tw:w-4 tw:h-4" />
                </button>
              </div>
            </div>

            <SubscribeBtn
              dealId={deal._id}
              dealName={deal.name}
              mrp={deal.mrp}
              price={deal.price}
              images={deal.images || []}
              quantity={qty}
              size="small"
              className="tw:flex-1 tw:md:flex-none tw:md:w-full tw:font-semibold"
              callback={(r) => {
                if (r.action === "subscribed") {
                  setAddedQty(qty);
                  setInCart(true);
                  onAdded?.();
                }
              }}
            >
              <ShoppingCart className="tw:w-4 tw:h-4 tw:mr-1.5" />
              Subscribe
            </SubscribeBtn>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default MatchedDeal;
