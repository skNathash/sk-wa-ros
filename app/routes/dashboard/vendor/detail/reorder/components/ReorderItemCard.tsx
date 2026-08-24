import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import PoAddToCart from "~/shared/purchase-order/components/po-add-to-cart/PoAddToCart";
import PoRemoveCart from "~/shared/purchase-order/components/po-remove-cart/PoRemoveCart";
import type { VendorReorderItem } from "../helper";

type Props = {
  vendorId: string;
  item: VendorReorderItem;
  onCartChange: (dealId: string, inCart: boolean) => void;
};

const BrandBadge = ({ brand }: { brand: string }) => (
  <div
    className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-muted tw:text-[9px] tw:font-bold tw:tracking-wide tw:text-muted-foreground tw:uppercase"
    style={{
      backgroundImage:
        "repeating-linear-gradient(45deg, rgba(148,163,184,0.12) 0, rgba(148,163,184,0.12) 6px, transparent 6px, transparent 12px)",
    }}
  >
    <span className="tw:line-clamp-2 tw:px-1 tw:text-center tw:leading-tight">
      {brand}
    </span>
  </div>
);

const ReorderItemCard = ({ vendorId, item, onCartChange }: Props) => {
  const dealId = item.dealId || item.dealRefId;

  return (
    <div className="tw:flex tw:items-start tw:gap-3 tw:p-3">
        <BrandBadge brand={item.brandCode} />

        <div className="tw:min-w-0 tw:flex-1">
          <h3 className="tw:text-sm tw:font-bold tw:leading-4 tw:text-foreground">
            {item.name}
          </h3>

          <p className="tw:mt-0.5 tw:text-[11px] tw:text-muted-foreground">
            {item.totalQuantityPurchased} {item.uom}
            <span className="tw:mx-1">·</span>
            {item.orderCount} order{item.orderCount === 1 ? "" : "s"}
          </p>

          {item.lastPurchaseDate ? (
            <p className="tw:mt-0.5 tw:text-[11px] tw:text-muted-foreground">
              Last:{" "}
              <DateFormat value={item.lastPurchaseDate} formatStr="dd MMM" />
              {item.lastPurchaseQty ? (
                <>
                  {" "}
                  · {item.lastPurchaseQty} {item.uom}
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-2">
          <Amount
            value={item.price}
            decimalPlaces={0}
            className="tw:text-sm tw:font-bold tw:text-foreground"
          />
          {item.inCart ? (
            <PoRemoveCart
              vendorId={vendorId}
              dealId={dealId}
              buttonClassName="tw:rounded-full tw:px-2.5"
              onSuccess={() => onCartChange(dealId, false)}
            />
          ) : (
            <PoAddToCart
              vendorId={vendorId}
              dealId={dealId}
              type="purchased"
              initialQty={item.suggestedQty}
              buttonClassName="tw:rounded-full tw:px-2.5"
              onSuccess={() => onCartChange(dealId, true)}
            />
          )}
        </div>
      </div>
  );
};

export default ReorderItemCard;
