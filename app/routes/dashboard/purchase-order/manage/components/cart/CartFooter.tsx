import { ArrowRight, ChevronLeft, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import { getCart } from "../product-list/helper";

type Props = {
  vendorId: string;
  /** Bump to re-read the cart (e.g. after ProductList or the cart modal edits). */
  refreshToken?: number;
  /** actions: `back` | `edit` | `next` */
  callback?: (a: { action: string; data: any }) => void;
};

const PoValue = ({ value }: { value: number }) => (
  <div className="tw:text-right">
    <div className="tw:text-[10px] tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
      PO Value
    </div>
    <Amount
      value={value}
      className="tw:text-lg tw:font-bold tw:tabular-nums tw:text-gray-900"
    />
  </div>
);

/**
 * Sticky PO footer: cart overview (items, units, value) with an edit entry
 * point into the cart modal and the next-step CTA.
 */
const CartFooter = ({ vendorId, refreshToken = 0, callback }: Props) => {
  const [summary, setSummary] = useState<Record<string, any>>({});
  const [itemCount, setItemCount] = useState(0);

  const loadCart = useCallback(async () => {
    if (!vendorId) {
      setSummary({});
      setItemCount(0);
      return;
    }
    const cart = await getCart(vendorId);
    const items = Array.isArray(cart?.items) ? cart.items : [];
    setSummary(cart?.cartSummary || {});
    setItemCount(items.length);
  }, [vendorId]);

  useEffect(() => {
    loadCart();
  }, [loadCart, refreshToken]);

  const totalItems = Number(summary.totalItems ?? itemCount) || 0;
  const totalUnits = Number(summary.totalQuantity) || 0;
  const totalValue = Number(summary.totalPurchaseValue) || 0;
  const isEmpty = totalItems === 0;

  const emit = (action: string) =>
    callback?.({ action, data: { totalItems, totalUnits, totalValue } });

  return (
    <footer className="app-footer">
      <div className="app-container">
        {/* Mobile stacks: cart summary + PO value on one line, then a
            full-width CTA. Desktop keeps everything on a single row. */}
        <div className="tw:flex tw:flex-col tw:gap-2 tw:md:flex-row tw:md:items-center tw:md:justify-between tw:md:gap-3">
          <AppButton
            color="light"
            fill="outline"
            className="tw:hidden tw:md:inline-flex"
            onClick={() => emit("back")}
          >
            <span className="tw:inline-flex tw:items-center tw:gap-1">
              <ChevronLeft className="tw:h-4 tw:w-4" />
              Back
            </span>
          </AppButton>

          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-3">
            <button
              type="button"
              className="tw:relative tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-gray-100 tw:text-gray-500 tw:disabled:opacity-60 tw:hover:bg-gray-200"
              onClick={() => emit("edit")}
              disabled={isEmpty}
              aria-label="Edit draft PO items"
            >
              <ShoppingCart className="tw:h-5 tw:w-5" />
              {totalItems > 0 ? (
                <span className="tw:absolute tw:-top-1.5 tw:-right-1.5 tw:flex tw:h-5 tw:min-w-5 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-700 tw:px-1 tw:text-[10px] tw:font-bold tw:text-white tw:tabular-nums">
                  {totalItems}
                </span>
              ) : null}
            </button>

            <div className="tw:min-w-0">
              {isEmpty ? (
                <>
                  <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                    Draft is empty
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    Add items above to start your PO.
                  </div>
                </>
              ) : (
                <>
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                    <span className="tw:text-sm tw:font-bold tw:text-gray-900 tw:tabular-nums">
                      {totalItems} {totalItems === 1 ? "item" : "items"} ·{" "}
                      {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                    </span>
                    <button
                      type="button"
                      className="tw:text-xs tw:font-semibold tw:text-emerald-700 tw:hover:underline"
                      onClick={() => emit("edit")}
                    >
                      Edit items
                    </button>
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    Draft auto-saves.
                  </div>
                </>
              )}
            </div>

            {/* On mobile the value rides along with the summary line so the
                CTA below can run full width. */}
            <div className="tw:ml-auto tw:md:hidden">
              <PoValue value={totalValue} />
            </div>
          </div>

          <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-3">
            <div className="tw:hidden tw:md:block">
              <PoValue value={totalValue} />
            </div>
            <AppButton
              color="dark"
              fill="solid"
              className="tw:w-full tw:md:w-auto"
              onClick={() => emit("next")}
              disabled={isEmpty}
            >
              <span className="tw:inline-flex tw:items-center tw:gap-1">
                Review PO
                <ArrowRight className="tw:h-4 tw:w-4" />
              </span>
            </AppButton>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default CartFooter;
