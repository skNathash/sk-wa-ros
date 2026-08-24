import clsx from "clsx";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import TintTile from "~/components/core/tint/TintTile";
import { tintIndexFor } from "~/components/core/tint/tints";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import { mapProductToReorderItem, type ReorderItem } from "./helper";

interface ReorderCardProps {
  product: any;
  item?: ReorderItem;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** "card" renders as a standalone rounded card; "list" renders as a flat
      row with a bottom border for use inside a continuous list. */
  variant?: "card" | "list";
}

const BrandBadge: React.FC<{ brand: string }> = ({ brand }) => {
  return (
    <TintTile
      index={tintIndexFor(brand)}
      className="tw:h-11 tw:w-11 tw:shrink-0 tw:rounded-xl tw:text-[10px] tw:font-bold tw:tracking-wide tw:uppercase"
    >
      <span className="tw:line-clamp-2 tw:px-1 tw:text-center tw:leading-tight">
        {brand}
      </span>
    </TintTile>
  );
};

/**
 * Compact mobile-first reorder card used across the buy-from-other-retailer
 * reorder surfaces. Renders a brand badge, price/MRP/tag line, stock/velocity
 * meta, and an optional action slot (e.g. an add-to-cart control).
 */
const ReorderCard: React.FC<ReorderCardProps> = ({
  product,
  item: itemProp,
  action,
  onClick,
  className,
  variant = "card",
}) => {
  const item = itemProp ?? mapProductToReorderItem(product);

  const content = (
    <div
      className={clsx(
        "tw:flex tw:w-full tw:items-center tw:gap-3 tw:p-3",
        variant === "list" &&
          "tw:border-b tw:border-slate-100 tw:last:border-b-0 tw:hover:bg-slate-50",
        className,
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Product image when the deal carries one; the brand tile is the
          fallback for missing/broken assets. */}
      {item.image ? (
        <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-100 tw:bg-white">
          <ImgRender
            assetId={item.image}
            alt={item.name}
            width={88}
            className="tw:h-full tw:w-full tw:object-contain"
            fallback={<BrandBadge brand={item.brand} />}
          />
        </div>
      ) : (
        <BrandBadge brand={item.brand} />
      )}

      <div className="tw:min-w-0 tw:flex-1">
        <h3 className="tw:truncate tw:text-[15px] tw:font-medium tw:text-foreground">
          {item.name}
        </h3>

        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:mt-1">
          <Amount
            value={item.price}
            decimalPlaces={0}
            className="tw:text-[15px] tw:font-bold tw:text-foreground"
          />
          <span className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-muted-foreground">
            MRP
            <Amount
              value={item.mrp}
              decimalPlaces={0}
              className="tw:text-xs tw:text-muted-foreground"
            />
          </span>
          {item.tag ? (
            <span
              className="tw:px-2 tw:py-0.5 tw:rounded-md tw:text-[10px] tw:font-bold tw:tracking-wide tw:uppercase"
              style={{
                backgroundColor: "var(--accent-in-bg, #d4f5dd)",
                color: "var(--accent-in-dark, #0f5a2e)",
              }}
            >
              {item.tag}
            </span>
          ) : null}
          {item.savings > 0 ? (
            <span className="tw:text-[10px] tw:font-semibold tw:text-primary">
              SAVE{" "}
              <Amount
                value={item.savings}
                decimalPlaces={0}
                className="tw:text-[10px] tw:font-semibold tw:text-primary"
              />
            </span>
          ) : null}
        </div>

        <p className="tw:mt-1 tw:text-[11px] tw:text-muted-foreground tw:truncate">
          your stock:{" "}
          {item.stock > 0 ? (
            <>
              <DisplayQty
                qty={item.stock}
                isLooseQty={false}
                uom={product?.loggedInUserStockUom}
                hideDefaultUom={true}
              />
              {!product?.loggedInUserStockUom && (
                <>
                  {" "}
                  <SellingTypeDisplay sellingType={product?.sellingType} />
                </>
              )}
            </>
          ) : (
            <span className="tw:text-destructive">out of stock</span>
          )}{" "}
          <span className="tw:mx-1">•</span> vsl: {item.velocity}/wk
          {item.previousSeller ? (
            <>
              <span className="tw:mx-1">•</span> prev: {item.previousSeller}
            </>
          ) : null}
        </p>
      </div>

      {action ? <div className="tw:shrink-0">{action}</div> : null}
    </div>
  );

  if (variant === "list") {
    return content;
  }

  return (
    <AppCard noPadding className="tw:mb-0!">
      {content}
    </AppCard>
  );
};

export default ReorderCard;
