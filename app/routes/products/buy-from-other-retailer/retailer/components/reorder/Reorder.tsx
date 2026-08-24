import { produce } from "immer";
import { ChevronRight, Sparkles, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import NoData from "~/components/core/no-data/NoData";
import { CART_ITEM_ADDED, CART_ITEM_REMOVED, EVENTS } from "~/constants";
import MiscService from "~/services/MiscService";
import SellerAddToCart from "~/shared/catalog/components/SellerAddToCart";
import AddToCartActionHandler from "~/shared/products/add-to-cart-action-handler/AddToCartActionHandler";
import ReorderCard from "~/shared/products/reorder-card/ReorderCard";
import { mapProductToReorderItem } from "~/shared/products/reorder-card/helper";
import {
  getCount,
  getData,
  mapToReorderProduct,
  prepareParams,
  prepareSummary,
} from "./helper";

type Props = {
  retailerId?: string;
  retailerName?: string;
  onBrowseCatalog?: () => void;
};

const Reorder = ({
  retailerId,
  retailerName = "Retailer",
  onBrowseCatalog,
}: Props) => {
  const { t } = useTranslation("common");

  const [products, setProducts] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const [cartAction, setCartAction] = useState<{
    action: string;
    dealId: string;
    sellerId: string;
  }>({ action: "", dealId: "", sellerId: "" });

  useEffect(() => {
    if (!retailerId) return;

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = prepareParams(retailerId);
        const [result, count] = await Promise.all([
          getData(params),
          getCount(params),
        ]);
        if (!active) return;
        setProducts(result || []);
        setTotalRecords(count);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [retailerId]);

  // Flip a deal's inCart state so the ADD button becomes the qty stepper
  // (and back). Matches deals by either _id (seller deal id) or id (SK ref).
  const applyCartChange = (
    dealId: string,
    change: { added: boolean; qty?: number; itemId?: string; cartId?: string },
  ) => {
    if (!dealId) return;
    setProducts(
      produce((draft) => {
        const index = draft.findIndex(
          (d) => String(d._id) === dealId || String(d.id) === dealId,
        );
        if (index === -1) return;

        if (change.added) {
          draft[index].inCart = { status: true, qty: change.qty || 1 };
          draft[index].itemId = change.itemId;
          draft[index].cartId = change.cartId;
        } else {
          draft[index].inCart = { status: false, qty: 0 };
          draft[index].itemId = undefined;
          draft[index].cartId = undefined;
        }
      }),
    );
  };

  // Cart events from SellerAddToCart: sync the row's inCart state, or open
  // the price-slab modal when the deal has slab pricing.
  const handleCartCallback = (p: { action: string; data?: any }) => {
    if (p.action === "price-slab") {
      setCartAction({
        action: "price-slab",
        dealId: p.data?.dealId,
        sellerId: retailerId || "",
      });
      return;
    }

    if (p.action === CART_ITEM_ADDED || p.action === CART_ITEM_REMOVED) {
      applyCartChange(String(p.data?.dealId || ""), {
        added: p.action === CART_ITEM_ADDED,
        qty: p.data?.qty || p.data?.quantity,
        itemId: p.data?.itemId,
        cartId: p.data?.cartId,
      });
    }
  };

  // Adds made outside the row control (e.g. the price-slab modal) surface as
  // document-level cart events — keep the list in sync with those too.
  useEffect(() => {
    const handleAdded = (ev: any) => {
      const detail = ev?.detail || {};
      applyCartChange(String(detail.dealId || ""), {
        added: true,
        qty: detail.qty || detail.quantity,
        itemId: detail.itemId,
        cartId: detail.cartId,
      });
    };

    const handleRemoved = (ev: any) => {
      const detail = ev?.detail || {};
      applyCartChange(String(detail.dealId || ""), { added: false });
    };

    MiscService.listenEvent(EVENTS.CART_ITEM_ADDED, handleAdded);
    MiscService.listenEvent(EVENTS.CART_ITEM_UPDATED, handleAdded);
    MiscService.listenEvent(EVENTS.CART_ITEM_REMOVED, handleRemoved);

    return () => {
      MiscService.removeEventListener(EVENTS.CART_ITEM_ADDED, handleAdded);
      MiscService.removeEventListener(EVENTS.CART_ITEM_UPDATED, handleAdded);
      MiscService.removeEventListener(EVENTS.CART_ITEM_REMOVED, handleRemoved);
    };
  }, []);

  const summary = prepareSummary(
    retailerName,
    products.map(mapToReorderProduct),
    totalRecords,
  );

  return (
    <div className="tw:space-y-4">
      {/* Suggested reorder banner */}
      <div className="tw:-mx-4 tw:-mt-4 tw:sm:mx-0 tw:sm:mt-0 tw:bg-white tw:p-4 tw:sm:bg-transparent tw:sm:p-0">
        <AppCard
          noPadding
          noShadow
          className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-linear-to-r tw:from-teal-50 tw:to-emerald-50 tw:mb-0"
        >
          <div className="tw:flex tw:items-center tw:gap-4 tw:p-4">
            <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary tw:text-primary-foreground tw:shadow-sm">
              <Sparkles size={22} />
            </div>
            <div className="tw:min-w-0 tw:flex-1">
              <h2 className="tw:text-sm tw:font-bold tw:text-slate-900">
                Suggested reorder · from {summary.retailerName}
              </h2>
              <p className="tw:mt-0.5 tw:text-xs tw:text-slate-600">
                Based on {summary.basedOn} ·{" "}
                <Amount
                  value={summary.totalValue}
                  decimalPlaces={0}
                  className="tw:font-semibold tw:text-slate-900"
                />{" "}
                {summary.shipsToday ? "· ships today" : ""}
              </p>
            </div>
          </div>
        </AppCard>
      </div>

      {/* Bought before section */}
      <div>
        <h3 className="tw:mb-3 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.12em] tw:text-slate-500">
          Bought from {summary.retailerName} before · {summary.itemCount}
        </h3>

        {loading ? (
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="tw:h-20 tw:rounded-2xl tw:bg-white tw:shadow-sm tw:animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <AppCard>
            <NoData />
          </AppCard>
        ) : (
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3">
            {products.map((product) => {
              // We're already inside a retailer's page, so the "prev: <seller>"
              // segment is redundant noise here — drop it.
              const item = {
                ...mapProductToReorderItem(product),
                previousSeller: "",
              };
              return (
                <ReorderCard
                  key={item.id}
                  product={product}
                  item={item}
                  action={
                    !item.isOutOfStock ? (
                      <SellerAddToCart
                        qty={product.inCart?.qty || 0}
                        maxQty={item.maxStock || 0}
                        dealId={product._id || product.id}
                        dealRefId={product.id}
                        itemId={product.itemId}
                        cartId={product.cartId}
                        sellerId={retailerId}
                        type={product.inCart?.status ? 2 : undefined}
                        callback={handleCartCallback}
                        sellingType={product.sellingType}
                        packageQty={product.packageQty}
                        selectedStockUom={product.selectedStockUom}
                        className="tw:shrink-0 tw:rounded-full tw:px-3"
                      />
                    ) : (
                      <span className="tw:whitespace-nowrap tw:rounded-full tw:bg-muted tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:text-muted-foreground">
                        Out of stock
                      </span>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Catalog link */}
      <button
        type="button"
        onClick={onBrowseCatalog}
        className="tw:group tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:text-left tw:shadow-sm tw:transition-all tw:hover:border-primary/40 tw:hover:shadow-md tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary/40 tw:active:scale-[0.99] tw:cursor-pointer"
      >
        <div className="tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-primary/10 tw:text-primary tw:transition-colors tw:group-hover:bg-primary tw:group-hover:text-primary-foreground">
          <Store size={20} />
        </div>
        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
            Browse {summary.retailerName}&apos;s catalog
          </p>
          <p className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
            Explore the full range and add more items
          </p>
        </div>
        <ChevronRight
          size={18}
          className="tw:shrink-0 tw:text-slate-400 tw:transition-transform tw:group-hover:translate-x-0.5 tw:group-hover:text-primary"
        />
      </button>

      {/* Price-slab modal for slab-priced deals */}
      <AddToCartActionHandler
        deal={{}}
        action={cartAction.action}
        sellerId={cartAction.sellerId}
        dealId={cartAction.dealId}
        callback={() => setCartAction({ action: "", dealId: "", sellerId: "" })}
      />
    </div>
  );
};

export default Reorder;
