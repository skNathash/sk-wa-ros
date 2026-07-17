import {
  CheckCheck,
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

interface ProductGridProps {
  data: SellerDeal[];
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
}: ProductGridProps) => {
  const { t } = useTranslation(["common"]);

  const [busyLoader] = useState({
    show: false,
    message: "",
  });

  const handleAddToCart = async () => {};

  // Helper function to get the appropriate price based on customer type
  const getProductPrice = (product: SellerDeal) => {
    const type = (customerType || "").toLowerCase();
    if (type === "b2b") return product.b2bPrice || product.price || 0;
    // default to B2C pricing
    return product.b2cPrice || product.price || 0;
  };

  if (loading) {
    return (
      <div className="tw:text-center tw:py-8">
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
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:rounded-xl tw:border tw:border-dashed tw:border-border tw:bg-card tw:py-12 tw:px-6 tw:text-center">
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
      </div>
    );
  }

  return (
    <>
      <div className="tw:flex tw:flex-col tw:divide-y tw:divide-border/60 tw:rounded-xl tw:border tw:border-border tw:bg-card tw:overflow-hidden">
        {data.map((product) => {
          const displayPrice = getProductPrice(product);
          const inStock = product.maxQty > 0;

          return (
            <div
              key={product._id}
              className={`tw:group tw:flex tw:items-center tw:gap-3 tw:p-3 tw:transition-colors tw:hover:bg-primary/[0.03] ${
                inStock ? "" : "tw:bg-muted/30"
              }`}
            >
              {/* Thumbnail — circular, WhatsApp chat-list avatar */}
              <div
                className={`tw:relative tw:flex tw:h-14 tw:w-14 tw:shrink-0 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full tw:bg-muted tw:ring-1 tw:ring-border tw:transition ${
                  inStock ? "" : "tw:opacity-60 tw:grayscale"
                }`}
              >
                {product.images?.[0] ? (
                  <ImgRender
                    assetId={product.images?.[0]}
                    alt={product.name}
                    className="tw:h-full tw:w-full tw:object-cover"
                  />
                ) : (
                  <div className="tw:text-muted-foreground tw:text-2xl">📦</div>
                )}
              </div>

              {/* Name + barcode + stock */}
              <div className="tw:flex-1 tw:min-w-0">
                <AppLink
                  asLink={true}
                  href={`/dashboard/inventory/products/view/${product._id}`}
                  className={`tw:text-sm tw:font-semibold tw:line-clamp-2 tw:break-words ${
                    inStock ? "tw:text-foreground" : "tw:text-muted-foreground"
                  }`}
                >
                  {product.name}
                </AppLink>

                <div className="tw:mt-1.5 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5 tw:text-xs">
                  {product.barcodes?.[0] && (
                    <span className="tw:inline-flex tw:items-center tw:rounded tw:bg-muted tw:px-1.5 tw:py-0.5 tw:font-mono tw:text-[11px] tw:tracking-tight tw:text-muted-foreground">
                      {product.barcodes[0]}
                    </span>
                  )}
                  {inStock ? (
                    <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-muted-foreground">
                      <span className="tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full tw:bg-primary"></span>
                      <DisplayQty
                        qty={product.maxQty}
                        isLooseQty={false}
                        uom={product.selectedStockUom}
                        hideDefaultUom={product.sellingType !== "UNIT"}
                      />
                      <span className="tw:text-muted-foreground/70">
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
                    <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-destructive/10 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-semibold tw:text-destructive">
                      Out of stock
                    </span>
                  )}
                </div>

                {inStock &&
                product?.priceSlabs &&
                product.priceSlabs.length > 0 &&
                customerType === "b2b" ? (
                  <div className="tw:mt-1">
                    <KingSlabInfo slabs={product.priceSlabs || []} size="xs" />
                  </div>
                ) : null}
              </div>

              {/* Price */}
              <div className="tw:shrink-0 tw:text-right">
                {customerType === "b2b" &&
                product.b2bScheme?.status === "Running" ? (
                  <>
                    <div className="tw:text-[10px] tw:font-bold tw:text-orange-600 tw:uppercase tw:flex tw:items-center tw:justify-end tw:gap-1">
                      <span className="tw:w-1.5 tw:h-1.5 tw:bg-orange-600 tw:rounded-full tw:animate-pulse"></span>
                      Scheme
                    </div>
                    <DisplayPrice
                      price={product.b2bScheme?.offerPrice || 0}
                      uom={product.selectedStockUom}
                      className="tw:text-base tw:font-bold tw:text-orange-600"
                    />
                    <div className="tw:text-[10px] tw:text-gray-400 tw:flex tw:flex-col tw:items-end">
                      <div className="tw:flex tw:items-center tw:gap-1">
                        <span>MRP:</span>
                        <span className="tw:line-through">
                          <DisplayPrice
                            price={product.mrp}
                            uom={product.selectedStockUom}
                          />
                        </span>
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-1">
                        <span>B2B:</span>
                        <span className="tw:font-medium">
                          <DisplayPrice
                            price={product.b2bPrice}
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
                      className="tw:text-base tw:font-bold tw:text-foreground tw:tabular-nums"
                    />
                    {product.mrp != null &&
                    Number(product.mrp) !== Number(displayPrice) ? (
                      <DisplayPrice
                        price={product.mrp}
                        uom={product.selectedStockUom}
                        className="tw:block tw:line-through tw:text-xs tw:text-muted-foreground tw:tabular-nums"
                      />
                    ) : null}
                  </>
                )}
              </div>

              {/* Add to cart / Add stock */}
              <div className="tw:shrink-0 tw:flex tw:items-center tw:justify-end">
                {inStock ? (
                  (product.inCart?.qty || 0) > 0 ? (
                    <span className="wa-incart tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:bg-primary/10 tw:px-2.5 tw:py-1 tw:text-xs tw:font-semibold tw:text-primary">
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
                      autoAdd={autoAdd}
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
                      autoAdd={autoAdd}
                      assisted={assisted}
                      selectedStockUom={product.selectedStockUom}
                      scannedQty={scannedQty}
                    />
                  )
                ) : (
                  /* Add Stock is available for both b2b and b2c billing, but
                     hidden for assisted orders. */
                  !assisted && (
                    <button
                      type="button"
                      onClick={() => onAddStock?.(product)}
                      className="tw:flex tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-primary/40 tw:px-2 tw:py-1.5 tw:text-[11px] tw:font-semibold tw:text-primary tw:whitespace-nowrap tw:cursor-pointer tw:transition-colors tw:hover:bg-primary/5"
                    >
                      <PlusCircle size={12} />
                      Add stock
                    </button>
                  )
                )}
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
