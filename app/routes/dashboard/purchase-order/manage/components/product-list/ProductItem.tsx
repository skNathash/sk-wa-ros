import { Plus, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import {
  getInitials,
  getInitialsColor,
  getLastBuyPrice,
  getSoldPerMonth,
  getStock,
  type ProductRow,
} from "./helper";

type Props = {
  product: ProductRow;
  adding?: boolean;
  onAdd: (product: ProductRow) => void;
  onViewCart?: () => void;
};

const ProductItem = ({ product, adding = false, onAdd, onViewCart }: Props) => {
  const { t } = useTranslation(["common"]);
  const name = product.name || "";
  const initials = getInitials(name);
  const colorClass = getInitialsColor(name);
  const inCart = !!product.inCart;
  const brand = product.brand?.name || "";
  const category = product.category?.name || "";
  const barcode = product.barcodes?.[0] || "";
  const mrp = Number(product.mrp) || 0;
  const lastBuyPrice = getLastBuyPrice(product);
  const hasLastBuy = lastBuyPrice > 0;
  const price = hasLastBuy ? lastBuyPrice : mrp;
  // Margin is the one number that decides a purchase, so it earns a chip.
  const marginPct =
    hasLastBuy && mrp > 0 && price > 0 && mrp > price
      ? Math.round(((mrp - price) / mrp) * 100)
      : 0;
  const stock = getStock(product);
  const soldPerMonth = getSoldPerMonth(product);
  const lowStock = stock <= 10;

  return (
    <div
      className={`tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-gray-100 tw:px-3 tw:py-2.5 tw:last:border-b-0 tw:transition-colors ${
        inCart ? "tw:bg-primary/5" : "tw:bg-white tw:hover:bg-gray-50/80"
      }`}
    >
      <div
        className={`tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:text-[11px] tw:font-bold ${colorClass}`}
      >
        {product.images?.[0] ? (
          <ImgRender
            assetId={product.images[0]}
            alt={name}
            className="tw:h-full tw:w-full tw:object-cover"
          />
        ) : (
          initials
        )}
      </div>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:truncate tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900">
          {name}
        </div>
        <div className="tw:mt-0.5 tw:text-[11px] tw:leading-tight tw:text-gray-500">
          {[brand, category, barcode].filter(Boolean).join(" · ")}
        </div>
      </div>

      {/* Price and stock get their own right-aligned columns: the number on top,
          its qualifiers underneath, so the row scans as a table. */}
      <div className="tw:shrink-0 tw:text-right">
        <Amount
          value={price}
          decimalPlaces={2}
          className={`tw:text-sm tw:font-bold tw:tabular-nums ${
            marginPct > 0 ? "tw:text-emerald-600" : "tw:text-gray-900"
          }`}
        />
        <div className="tw:mt-0.5 tw:text-[10px] tw:leading-tight tw:text-gray-500">
          {hasLastBuy ? (
            <>
              {t("lastBuy", "last buy")}
              {mrp > 0 ? (
                <>
                  {" · "}
                  <span className="tw:tabular-nums">
                    {t("mrp", "MRP")} ₹{mrp}
                  </span>
                </>
              ) : null}
            </>
          ) : mrp > 0 ? (
            <span className="tw:tabular-nums">{t("mrp", "MRP")}</span>
          ) : null}
        </div>
      </div>

      {/* Stock reads as a sentence — the count carries the weight, the unit
          trails it in muted text, and last-30-day demand sits underneath. */}
      <div className="tw:w-24 tw:shrink-0">
        <div className="tw:text-[13px] tw:leading-tight">
          <span
            className={`tw:font-bold tw:tabular-nums ${
              lowStock ? "tw:text-amber-600" : "tw:text-gray-900"
            }`}
          >
            {stock}
          </span>{" "}
          <span className="tw:text-gray-500">{t("inStock", "in stock")}</span>
        </div>
        <div className="tw:mt-0.5 tw:text-[11px] tw:leading-tight tw:text-gray-400">
          {t("sold", "sold")}{" "}
          <span className="tw:tabular-nums">{soldPerMonth}</span>/mo
        </div>
      </div>

      <div className="tw:shrink-0">
        {inCart ? (
          <AppButton
            size="small"
            color="primary"
            fill="solid"
            className="tw:min-w-[88px]"
            onClick={onViewCart}
          >
            <ShoppingCart size={14} />
            {t("viewCart", "View Cart")}
          </AppButton>
        ) : (
          <AppButton
            size="small"
            color="primary"
            fill="outline"
            className="tw:min-w-[88px]"
            isLoading={adding}
            onClick={() => onAdd(product)}
          >
            <Plus size={14} />
            {t("add", "Add")}
          </AppButton>
        )}
      </div>
    </div>
  );
};

export default ProductItem;
