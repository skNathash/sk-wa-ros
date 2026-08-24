import { debounce } from "lodash";
import { PackageSearch, Plus, Search, ShoppingCart } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import { AppInput } from "~/components/core/form";
import {
  CATALOG_SOURCES,
  getInitials,
  getInitialsColor,
  getLastBuyPrice,
  getSoldPerMonth,
  getStock,
  type CatalogSource,
  type ProductListViewProps,
  type ProductRow,
} from "./helper";
import YouBought from "./YouBought";

/**
 * Theme-2 mobile PO browse surface.
 *
 * Runs edge to edge (`app-bleed-x`) so the search band, the recent-buys strip
 * and the product feed read as one continuous screen rather than stacked
 * cards. Each row is:
 *
 *   [avatar]  Product name, weight                     [ + Add ]
 *             ₹last buy   MRP ₹x · N stk · N/mo
 */
const MobileView = ({
  vendorName,
  products,
  loadingProducts,
  hasMoreProducts,
  isLoadingMoreProducts,
  loadedCount,
  totalCount,
  youBought,
  loadingYouBought,
  addingDealId,
  onApplyFilter,
  onAddProduct,
  onAdd,
  onAddYouBought,
  onLoadMore,
  onViewCart,
}: ProductListViewProps) => {
  const { t } = useTranslation(["common"]);
  const { register, setValue, control } = useFormContext();
  const catalog = useWatch({ control, name: "catalog" });

  const triggerApply = debounce(() => onApplyFilter(), 400);

  const handleCatalog = (value: CatalogSource) => {
    if ((catalog || "vendor") === value) return;
    setValue("catalog", value);
    onApplyFilter();
  };

  return (
    <div className="tw:space-y-3">
      {/* Search band — scan or type, or create a product that isn't listed. */}
      <div className="app-bleed-x tw:bg-white tw:px-4 tw:py-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <AppInput
            name="search"
            register={register}
            size="sm"
            className="tw:min-w-0 tw:flex-1"
            inputClassName="app-search-field tw:bg-gray-100 tw:border-transparent tw:rounded-full tw:pl-9"
            placeholder={t("searchOrScan", "Search or scan barcode…")}
            leftIcon={<Search size={16} className="tw:text-gray-400" />}
            onChange={() => triggerApply()}
          />
          <button
            type="button"
            onClick={onAddProduct}
            aria-label={t("addProduct", "Add product")}
            className="tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary/10 tw:text-primary tw:active:bg-primary/20"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Which slice of the catalog the feed below is reading. */}
        <div className="tw:mt-3 tw:flex tw:gap-2 tw:overflow-x-auto tw:pb-0.5">
          {CATALOG_SOURCES.map((item) => {
            const active = (catalog || "vendor") === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() => handleCatalog(item.value)}
                className={`tw:shrink-0 tw:rounded-full tw:border tw:px-3.5 tw:py-1.5 tw:text-[13px] tw:font-semibold tw:transition-colors ${
                  active
                    ? "tw:border-primary tw:bg-primary tw:text-primary-foreground"
                    : "tw:border-gray-200 tw:bg-white tw:text-gray-600"
                }`}
              >
                {item.label}
                {active && !loadingProducts && totalCount > 0
                  ? ` · ${totalCount}`
                  : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent buys from this vendor — same strip the desktop card carries. */}
      <YouBought
        vendorName={vendorName}
        items={youBought}
        loading={loadingYouBought}
        addingDealId={addingDealId}
        onAdd={onAddYouBought}
        onViewCart={onViewCart}
        className="app-bleed-x tw:bg-white"
      />

      {/* Product feed */}
      <div className="app-bleed-x tw:divide-y tw:divide-gray-100 tw:bg-white">
        {/* How much of the catalog the feed is showing — the same count the
            desktop card carries above its rows. */}
        <div className="tw:bg-gray-50/70 tw:px-4 tw:py-2 tw:text-[12px] tw:font-medium tw:text-gray-600">
          {loadingProducts
            ? t("loadingProducts", "Loading products…")
            : t("showingOfProducts", {
                defaultValue: `Showing ${loadedCount} of ${totalCount} products`,
                loaded: loadedCount,
                total: totalCount,
              })}
        </div>

        {loadingProducts ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="tw:flex tw:items-center tw:gap-3 tw:p-4">
              <div className="tw:h-11 tw:w-11 tw:shrink-0 tw:animate-pulse tw:rounded-xl tw:bg-gray-100" />
              <div className="tw:flex-1">
                <div className="tw:mb-2 tw:h-4 tw:w-2/3 tw:animate-pulse tw:rounded tw:bg-gray-100" />
                <div className="tw:h-3 tw:w-1/2 tw:animate-pulse tw:rounded tw:bg-gray-100" />
              </div>
            </div>
          ))
        ) : products.length === 0 ? (
          /* Nothing matched — offer creating the product instead of a dead end. */
          <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:px-4 tw:py-12 tw:text-center">
            <span className="tw:flex tw:h-12 tw:w-12 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary/10 tw:text-primary">
              <PackageSearch size={22} />
            </span>
            <div>
              <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                {t("noProductsFound")}
              </div>
              <div className="tw:mt-1 tw:text-[12px] tw:text-gray-500">
                {t(
                  "addItemEmptyHint",
                  "Can't find it in the catalog? Add it yourself.",
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onAddProduct}
              className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-primary tw:px-5 tw:py-2.5 tw:text-[13px] tw:font-semibold tw:text-primary-foreground tw:active:opacity-90"
            >
              <Plus size={16} />
              {t("addItem", "Add item")}
            </button>
          </div>
        ) : (
          products.map((product: ProductRow) => {
            const dealId = String(product._id || product.dealId || "");
            const name = product.name || "";
            const weight = product.netWeight || product.weight?.value || "";
            const mrp = Number(product.mrp) || 0;
            const lastBuyPrice = getLastBuyPrice(product);
            const hasLastBuy = lastBuyPrice > 0;
            const price = hasLastBuy ? lastBuyPrice : mrp;
            const stock = getStock(product);
            const soldPerMonth = getSoldPerMonth(product);
            const inCart = !!product.inCart;

            return (
              <div
                key={dealId}
                className={`tw:flex tw:items-center tw:gap-3 tw:px-4 tw:py-3 ${
                  inCart ? "tw:bg-primary/5" : "tw:bg-white"
                }`}
              >
                <div
                  className={`tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:text-[12px] tw:font-bold ${getInitialsColor(
                    name,
                  )}`}
                >
                  {product.images?.[0] ? (
                    <ImgRender
                      assetId={product.images[0]}
                      alt={name}
                      className="tw:h-full tw:w-full tw:object-cover"
                    />
                  ) : (
                    getInitials(name)
                  )}
                </div>

                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:truncate tw:text-[14px] tw:font-semibold tw:leading-tight tw:text-gray-900">
                    {name}
                    {weight ? (
                      <span className="tw:font-normal tw:text-gray-500">
                        , {weight}
                      </span>
                    ) : null}
                  </div>
                  <div className="tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:text-[12px] tw:leading-tight tw:text-gray-500">
                    <Amount
                      value={price}
                      decimalPlaces={2}
                      className="tw:text-[13px] tw:font-bold tw:text-gray-900 tw:tabular-nums"
                    />
                    {hasLastBuy && mrp > 0 ? (
                      <span className="tw:tabular-nums">
                        {t("mrp", "MRP")} ₹{mrp}
                      </span>
                    ) : !hasLastBuy && mrp > 0 ? (
                      <span className="tw:tabular-nums">{t("mrp", "MRP")}</span>
                    ) : null}
                    <span>·</span>
                    <span className="tw:tabular-nums">
                      {stock} {t("stk", "stk")}
                    </span>
                    <span>·</span>
                    <span className="tw:tabular-nums">{soldPerMonth}/mo</span>
                  </div>
                </div>

                {inCart ? (
                  <button
                    type="button"
                    onClick={onViewCart}
                    className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-primary tw:px-3.5 tw:py-2 tw:text-[13px] tw:font-semibold tw:text-primary-foreground tw:active:opacity-90"
                  >
                    <ShoppingCart size={14} />
                    {t("viewCart", "View Cart")}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={addingDealId === dealId}
                    onClick={() => onAdd(product)}
                    className="tw:inline-flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary tw:px-4 tw:py-2 tw:text-[13px] tw:font-semibold tw:text-primary-foreground tw:active:opacity-90 tw:disabled:opacity-50"
                  >
                    <Plus size={14} />
                    {t("add", "Add")}
                  </button>
                )}
              </div>
            );
          })
        )}

        {hasMoreProducts && !loadingProducts && products.length > 0 && (
          <div className="tw:px-4 tw:py-3">
            <LoadMoreButton
              loadMore={onLoadMore}
              loading={isLoadingMoreProducts}
              totalCount={totalCount}
              loadedCount={loadedCount}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileView;
