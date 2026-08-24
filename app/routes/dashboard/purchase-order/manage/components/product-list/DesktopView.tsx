import { PackageSearch, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import ProductListFilter from "./Filter";
import type { ProductListViewProps } from "./helper";
import ProductItem from "./ProductItem";
import YouBought from "./YouBought";

/**
 * Desktop PO browse surface: filter, recent buys and the product rows share
 * one white card so the whole selection step reads as a single table.
 */
const DesktopView = ({
  vendorId,
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

  return (
    <div className="tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-white">
      <div className="tw:p-3">
        <ProductListFilter
          vendorId={vendorId}
          onApply={onApplyFilter}
          onAddProduct={onAddProduct}
        />
      </div>

      <YouBought
        vendorName={vendorName}
        items={youBought}
        loading={loadingYouBought}
        addingDealId={addingDealId}
        onAdd={onAddYouBought}
        onViewCart={onViewCart}
        className="tw:border-t tw:border-gray-100 tw:bg-gray-50/70"
      />

      <div>
        <div className="tw:border-y tw:border-gray-100 tw:bg-gray-50/70 tw:px-3 tw:py-2.5 tw:text-xs tw:font-medium tw:text-gray-600">
          {loadingProducts
            ? t("loadingProducts", "Loading products…")
            : t("showingOfProducts", {
                defaultValue: `Showing ${loadedCount} of ${totalCount} products`,
                loaded: loadedCount,
                total: totalCount,
              })}
        </div>

        <div>
          {loadingProducts ? (
            <div className="tw:space-y-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="tw:h-[72px] tw:animate-pulse tw:border-b tw:border-gray-100 tw:bg-gray-50"
                />
              ))}
            </div>
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
                <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                  {t(
                    "addItemEmptyHint",
                    "Can't find it in the catalog? Add it yourself.",
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onAddProduct}
                className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:bg-primary tw:px-5 tw:py-2.5 tw:text-[13px] tw:font-semibold tw:text-primary-foreground tw:hover:opacity-90"
              >
                <Plus size={16} />
                {t("addItem", "Add item")}
              </button>
            </div>
          ) : (
            <div>
              {products.map((product) => {
                const dealId = String(product._id || product.dealId || "");
                return (
                  <ProductItem
                    key={dealId}
                    product={product}
                    adding={addingDealId === dealId}
                    onAdd={onAdd}
                    onViewCart={onViewCart}
                  />
                );
              })}
            </div>
          )}

          {hasMoreProducts && !loadingProducts && products.length > 0 && (
            <div className="tw:px-3 tw:pb-3 tw:pt-1">
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
    </div>
  );
};

export default DesktopView;
