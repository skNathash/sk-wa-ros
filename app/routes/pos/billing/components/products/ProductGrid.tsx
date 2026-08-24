import {
  CheckCheck,
  Globe,
  PackageSearch,
  PlusCircle,
  ScanLine,
  Search,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import type { SellerDeal } from "~/types/CommonTypes";
import PosAddToCart from "../add-to-cart/PosAddToCart";
import PosB2bAddToCart from "../add-to-cart/PosB2bAddToCart";
import KingSlabInfo from "~/components/feature/products/king-slab/KingSlabInfo";
import CaseQtyPopover from "~/shared/catalog/components/CaseQtyPopover";
import SellingTypeDisplay from "~/shared/catalog/components/SellingTypeDsiplay";
import DisplayQty from "~/components/feature/products/display-qty/DisplayQty";
import AppButton from "~/components/core/button/AppButton";
import Rbac from "~/components/core/rbac/Rbac";
import AuthService from "~/services/AuthService";

const rbacRoles = {
  addStock: ["INVENTORY.ADD-STOCK"],
};

interface ProductGridProps {
  data: (SellerDeal & { isSubscribed?: boolean })[];
  loading: boolean;
  onProductSelect: (product: SellerDeal) => void;
  cartId?: string;
  customerType?: string;
  quickCheckout?: boolean;
  autoAdd?: boolean;
  assisted?: boolean;
  scannedQty?: number;
  hasSearchFilter?: boolean;
  searchBy?: "barcode" | "name";
  onAddStock?: (product: SellerDeal) => void;
  /** Opens the create-product form for the term that returned nothing. */
  onAddProduct?: () => void;
  /** Opens the global (StoreKing) catalog picker for the current search. */
  onGlobalCatalog?: () => void;
  /** Opens the subscribe modal for the product. */
  onSubscribeClick?: (product: SellerDeal) => void;
  /** Deal id that just finished subscribing — auto-adds that row. */
  recentlySubscribedDealId?: string | null;
}

const ProductGrid = ({
  data,
  loading,
  cartId,
  customerType,
  quickCheckout,
  autoAdd,
  assisted,
  scannedQty,
  hasSearchFilter,
  searchBy = "barcode",
  onAddStock,
  onAddProduct,
  onGlobalCatalog,
  onSubscribeClick,
  recentlySubscribedDealId,
}: ProductGridProps) => {
  const { t } = useTranslation(["common"]);

  const [busyLoader] = useState({
    show: false,
    message: "",
  });

  const handleAddToCart = async () => {};

  // Helper function to get the appropriate price based on customer type.
  // For B2B the backend already prices the deal for the selected buyer (groups,
  // schemes and slabs included), so the response price is taken as-is.
  const getProductPrice = (product: SellerDeal) => {
    const type = (customerType || "").toLowerCase();
    if (type === "b2b") return product.price || 0;
    // default to B2C pricing
    return product.b2cPrice || product.price || 0;
  };

  if (loading) {
    return (
      <div className="app-prod-loading tw:text-center tw:py-8">
        <div className="tw:animate-spin tw:rounded-full tw:h-8 tw:w-8 tw:border-2 tw:border-primary/25 tw:border-t-primary tw:mx-auto"></div>
        <p className="tw:mt-3 tw:text-sm tw:text-muted-foreground">
          {t("loadingProducts")}
        </p>
      </div>
    );
  }

  if (data.length === 0) {
    // Before any search, prompt the user to scan/search a product. After a
    // search yields nothing, show the empty result state.
    const isPrompt = !hasSearchFilter;
    const promptByName = searchBy === "name";
    return (
      <div className="app-prod-empty tw:flex tw:flex-col tw:items-center tw:justify-center tw:rounded-xl tw:border tw:border-dashed tw:border-border tw:bg-card tw:py-12 tw:px-6 tw:text-center">
        <div
          className={`tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full ${
            isPrompt
              ? "tw:bg-primary/10 tw:text-primary"
              : "tw:bg-muted tw:text-muted-foreground"
          }`}
        >
          {isPrompt ? (
            promptByName ? (
              <Search size={28} strokeWidth={1.5} />
            ) : (
              <ScanLine size={28} strokeWidth={1.5} />
            )
          ) : (
            <PackageSearch size={28} strokeWidth={1.5} />
          )}
        </div>
        <p className="tw:mt-4 tw:text-base tw:font-semibold tw:text-foreground">
          {isPrompt
            ? promptByName
              ? "Search a product to begin"
              : "Scan a product to begin"
            : t("noProductsFound")}
        </p>
        <p className="tw:mt-1 tw:text-xs tw:text-muted-foreground">
          {isPrompt
            ? promptByName
              ? "Type a product name to see matches."
              : "Point the scanner or type a barcode above."
            : "Check the barcode or try a different name."}
        </p>
        {/* Nothing in the store's catalog matched — offer the two ways out:
            subscribe it from the global catalog (cheapest) or create it. */}
        {!isPrompt && (onGlobalCatalog || onAddProduct) && (
          <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-2">
            {onGlobalCatalog && (
              <button
                type="button"
                onClick={onGlobalCatalog}
                className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:bg-primary tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-white tw:cursor-pointer tw:transition-opacity tw:hover:opacity-90"
              >
                <Globe size={14} />
                Search global catalog
              </button>
            )}
            {onAddProduct && (
              <button
                type="button"
                onClick={onAddProduct}
                className="tw:flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-primary/40 tw:px-3 tw:py-2 tw:text-xs tw:font-semibold tw:text-primary tw:cursor-pointer tw:transition-colors tw:hover:bg-primary/5"
              >
                <PlusCircle size={14} />
                Add this product
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="app-prod-list tw:flex tw:flex-col tw:divide-y tw:divide-border/60 tw:rounded-xl tw:border tw:border-border tw:bg-card tw:overflow-hidden">
        {data.map((product) => {
          const displayPrice = getProductPrice(product);
          const inStock = product.maxQty > 0;
          const gstPerc = Number(product.gst) || 0;
          const shouldAutoAdd =
            Boolean(autoAdd) || recentlySubscribedDealId === product._id;

          return (
            <div
              key={product._id}
              className="app-prod-row tw:group tw:flex tw:items-center tw:gap-2.5 tw:px-3 tw:py-2.5 tw:transition-colors tw:hover:bg-primary/3"
            >
              {/* Thumbnail — circular, WhatsApp chat-list avatar. Hidden on
                  mobile so the name/price/action row gets the full width. */}
              <div className="app-prod-thumb tw:relative tw:hidden tw:md:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-muted tw:ring-1 tw:ring-border tw:transition">
                {product.images?.[0] ? (
                  <ImgRender
                    assetId={product.images?.[0]}
                    alt={product.name}
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                ) : (
                  <div className="tw:text-muted-foreground tw:text-xl">📦</div>
                )}
              </div>

              {/* Name + barcode + stock */}
              <div className="tw:flex-1 tw:min-w-0">
                {/* Subscribed rows carry an inventory product, so the name
                    opens the stocked product; unsubscribed rows only exist in
                    the catalog, so they open the subscribe detail page. */}
                <AppLink
                  asLink={true}
                  href={
                    product.isSubscribed
                      ? `/dashboard/inventory/products/view/${product._id}`
                      : `/dashboard/inventory/subscribe/product-detail/${product._id}`
                  }
                  className="app-prod-name tw:text-[13px] tw:md:text-sm tw:font-semibold tw:leading-snug tw:line-clamp-2 tw:wrap-break-word"
                >
                  {product.name}
                </AppLink>

                {/* Only rendered when there is meta to show, so rows without a
                    barcode or stock line stay on a single tight line. */}
                {(product.barcodes?.[0] ||
                  product.isSubscribed ||
                  gstPerc > 0) && (
                  <div className="app-prod-meta tw:mt-1 tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-[11px] tw:leading-tight">
                    {product.barcodes?.[0] && (
                      <span className="app-prod-code tw:font-mono tw:tracking-tight tw:text-muted-foreground/80">
                        {product.barcodes[0]}
                      </span>
                    )}
                    {product.isSubscribed ? (
                      <>
                        {inStock ? (
                          <span className="app-prod-stock tw:inline-flex tw:items-center tw:gap-1 tw:text-muted-foreground tw:tabular-nums">
                            <span className="app-prod-dot tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full tw:bg-primary"></span>
                            {/* Compact layouts lead with the label and drop the
                                trailing "in stock", so the line reads
                                "Stock 30" instead of wrapping. */}
                            <span className="app-prod-stock-label tw:hidden">
                              Stock
                            </span>
                            <DisplayQty
                              qty={product.maxQty}
                              isLooseQty={false}
                              uom={product.selectedStockUom}
                              hideDefaultUom={product.sellingType !== "UNIT"}
                            />
                            <span className="app-prod-stock-suffix tw:text-muted-foreground/70">
                              in stock
                            </span>
                            {!product.selectedStockUom &&
                              product.sellingType !== "UNIT" && (
                                <SellingTypeDisplay
                                  sellingType={product.sellingType}
                                />
                              )}
                            <CaseQtyPopover
                              packageQty={product.packageQty || 0}
                              sellingType={product.sellingType || "UNIT"}
                            />
                          </span>
                        ) : (
                          <span className="app-prod-stock tw:inline-flex tw:items-center tw:gap-1 tw:font-semibold tw:text-destructive">
                            <span className="tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full tw:bg-destructive"></span>
                            Out of stock
                          </span>
                        )}
                      </>
                    ) : null}
                    {gstPerc > 0 && (
                      <span className="app-prod-gst tw:text-muted-foreground/80 tw:tabular-nums">
                        GST {gstPerc}%
                      </span>
                    )}
                  </div>
                )}

                {inStock &&
                product?.priceSlabs &&
                product.priceSlabs.length > 0 &&
                customerType === "b2b" ? (
                  <div className="tw:mt-1">
                    <KingSlabInfo slabs={product.priceSlabs || []} size="xs" />
                  </div>
                ) : null}
              </div>

              {/* Price and its action share the right rail. They sit side by
                  side in the roomy layouts and stack (price over action) in the
                  compact result sheet, where the row only has one line of
                  horizontal room to give. */}
              <div className="app-prod-side tw:flex tw:shrink-0 tw:items-center tw:gap-2.5">
                {/* Price — min-width keeps amounts on a common right rail */}
                <div className="app-prod-price tw:shrink-0 tw:min-w-14 tw:text-right tw:leading-tight">
                  {customerType === "b2b" &&
                  product.b2bScheme?.status === "Running" ? (
                    <>
                      <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:tracking-wide tw:flex tw:items-center tw:justify-end tw:gap-1">
                        <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                        Scheme
                      </div>
                      <DisplayPrice
                        price={displayPrice}
                        uom={product.selectedStockUom}
                        className="tw:text-sm tw:md:text-base tw:font-bold tw:text-orange-600 tw:tabular-nums"
                      />
                      <div className="tw:mt-0.5 tw:text-[10px] tw:text-muted-foreground tw:tabular-nums tw:flex tw:flex-col tw:items-end">
                        <div className="tw:flex tw:items-center tw:gap-1">
                          <span>MRP</span>
                          <span className="tw:line-through">
                            <DisplayPrice
                              price={product.mrp}
                              uom={product.selectedStockUom}
                            />
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <DisplayPrice
                        price={displayPrice}
                        uom={product.selectedStockUom}
                        className="tw:text-sm tw:md:text-base tw:font-bold tw:text-foreground tw:tabular-nums"
                      />
                      {product.mrp != null &&
                      Number(product.mrp) !== Number(displayPrice) ? (
                        <DisplayPrice
                          price={product.mrp}
                          uom={product.selectedStockUom}
                          className="tw:block tw:line-through tw:text-[10px] tw:text-muted-foreground tw:tabular-nums"
                        />
                      ) : null}
                    </>
                  )}
                </div>

                {/* Add to cart / Add stock — fixed width so every row's control
                  lands on the same right edge. */}
                <div className="app-prod-action tw:shrink-0 tw:min-w-[88px] tw:md:min-w-24 tw:flex tw:items-center tw:justify-end">
                  {product.isSubscribed ? (
                    <>
                      {inStock ? (
                        (product.inCart?.qty || 0) > 0 ? (
                          <span className="wa-incart tw:inline-flex tw:h-7 tw:items-center tw:gap-1 tw:rounded-lg tw:bg-primary/10 tw:px-2.5 tw:text-[11px] tw:font-semibold tw:text-primary">
                            <CheckCheck size={13} strokeWidth={2.5} />
                            In cart
                          </span>
                        ) : ((customerType || "").toLowerCase() === "b2b" &&
                            !quickCheckout) ||
                          assisted ? (
                          <PosB2bAddToCart
                            template={1}
                            qty={product.inCart?.qty || 0}
                            maxQty={product.maxQty}
                            minQty={1}
                            incrQty={1}
                            dealId={product._id}
                            cartId={cartId}
                            callback={() => handleAddToCart()}
                            sellingType={product.sellingType || "UNIT"}
                            packageQty={product.packageQty || 0}
                            autoAdd={shouldAutoAdd}
                            scannedQty={scannedQty}
                          />
                        ) : (
                          <PosAddToCart
                            template={1}
                            qty={1}
                            dealId={product._id}
                            callback={() => handleAddToCart()}
                            cartId={cartId}
                            customerType={customerType}
                            quickCheckout={quickCheckout}
                            showSnapshotModal={true}
                            autoAdd={shouldAutoAdd}
                            assisted={assisted}
                            selectedStockUom={product.selectedStockUom}
                            scannedQty={scannedQty}
                          />
                        )
                      ) : (
                        /* Add Stock is available for both b2b and b2c billing, but
                     hidden for assisted orders. */
                        !assisted && (
                          <Rbac
                            roles={rbacRoles.addStock}
                            forceDisplay={AuthService.isMasterLogin()}
                          >
                            <button
                              type="button"
                              onClick={() => onAddStock?.(product)}
                              className="tw:flex tw:h-7 tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-primary/40 tw:px-2.5 tw:text-[11px] tw:font-semibold tw:text-primary tw:whitespace-nowrap tw:cursor-pointer tw:transition-colors tw:hover:bg-primary/5"
                            >
                              <PlusCircle size={12} />
                              Add stock
                            </button>
                          </Rbac>
                        )
                      )}
                    </>
                  ) : (
                    <AppButton
                      size="small"
                      fill="outline"
                      className="tw:h-7 tw:px-2.5 tw:text-[11px]"
                      onClick={() => onSubscribeClick?.(product)}
                    >
                      Subscribe
                    </AppButton>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <BusyLoader show={busyLoader.show} message={busyLoader.message} />
    </>
  );
};

export default ProductGrid;
