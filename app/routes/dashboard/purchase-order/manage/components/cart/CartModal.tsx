import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import Amount from "~/components/core/amount/Amount";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import PurchaseCartService, {
  type UpdatePurchaseCartItemPayload,
} from "~/services/PurchaseCartService";
import { getCart, getInitials, getInitialsColor } from "../product-list/helper";

type Props = {
  show: boolean;
  vendorId: string;
  /** actions: `close` | `change` (cart mutated — refresh the caller's view) */
  callback?: (a: { action: string; data: any }) => void;
};

type EditableField = "quantity" | "mrp" | "purchasePrice" | "discount";

/** Local input values, keyed by dealId, kept only while the user is typing. */
type EditMap = Record<string, Partial<Record<EditableField, string>>>;

const UPDATE_DELAY = 600;

const inputClass =
  "tw:w-full tw:rounded-md tw:border tw:border-gray-300 tw:bg-white tw:px-2 tw:py-1.5 tw:text-sm tw:tabular-nums tw:text-gray-900 tw:outline-none tw:focus:border-emerald-600";

const labelClass =
  "tw:mb-0.5 tw:block tw:text-[10px] tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase";

/**
 * Draft PO cart line editor.
 * Renders the purchase-cart API response and pushes inline edits back with a
 * debounced item update; a failed update re-fetches the cart and toasts.
 */
const CartModal = ({ show, vendorId, callback }: Props) => {
  const toast = useAppToast();

  const [cart, setCart] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<EditMap>({});
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);

  const cartRef = useRef<Record<string, any> | null>(null);
  const pendingRef = useRef<Record<string, UpdatePurchaseCartItemPayload>>({});

  const applyCart = (data: Record<string, any> | null) => {
    cartRef.current = data;
    setCart(data);
  };

  const loadCart = useCallback(
    async (silent = false) => {
      if (!vendorId) {
        applyCart(null);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      const data = await getCart(vendorId);
      applyCart(data);
      setLoading(false);
    },
    [vendorId],
  );

  useEffect(() => {
    if (show) loadCart();
  }, [show, loadCart]);

  /** Drop local edits for lines that no longer have a queued change. */
  const clearSettledEdits = (dealIds: string[]) => {
    setEdits((prev) => {
      const next = { ...prev };
      dealIds.forEach((dealId) => {
        if (!pendingRef.current[dealId]) delete next[dealId];
      });
      return next;
    });
  };

  const notifyChange = () => callback?.({ action: "change", data: {} });

  const flushUpdates = useDebouncedCallback(async () => {
    const cartId = cartRef.current?._id;
    const pending = pendingRef.current;
    pendingRef.current = {};

    const entries = Object.entries(pending);
    if (entries.length === 0) return;

    if (!cartId) {
      clearSettledEdits(entries.map(([dealId]) => dealId));
      return;
    }

    const dealIds = entries.map(([dealId]) => dealId);
    setUpdatingIds((prev) => [...new Set([...prev, ...dealIds])]);

    let failedMsg = "";
    for (const [dealId, payload] of entries) {
      try {
        const resp = await PurchaseCartService.updateItem(
          cartId,
          dealId,
          payload,
        );
        if (resp.statusCode !== 200 && resp.statusCode !== 201) {
          failedMsg =
            typeof resp.data?.message === "string"
              ? resp.data.message
              : "Failed to update cart item";
        }
      } catch (error: any) {
        failedMsg = error?.message || "Failed to update cart item";
      }
    }

    await loadCart(true);
    clearSettledEdits(dealIds);
    setUpdatingIds((prev) => prev.filter((id) => !dealIds.includes(id)));
    notifyChange();

    if (failedMsg) {
      toast.show({ msg: failedMsg, color: "danger" });
    }
  }, UPDATE_DELAY);

  const handleFieldChange = (
    item: Record<string, any>,
    field: EditableField,
    value: string,
  ) => {
    const dealId = String(item.dealId || "");
    const currentItemMrp =
      edits[dealId]?.mrp !== undefined
        ? Number(edits[dealId]?.mrp)
        : Number(item.mrp) || 0;
    const currentItemPrice =
      edits[dealId]?.purchasePrice !== undefined
        ? Number(edits[dealId]?.purchasePrice)
        : Number(item.purchasePrice) || 0;

    if (field === "quantity") {
      setEdits((prev) => ({
        ...prev,
        [dealId]: { ...prev[dealId], quantity: value },
      }));
      if (value === "" || Number.isNaN(Number(value))) return;
      const qty = Math.max(1, Number(value));
      pendingRef.current[dealId] = {
        ...pendingRef.current[dealId],
        quantity: qty,
      };
      flushUpdates();
      return;
    }

    if (field === "mrp") {
      setEdits((prev) => ({
        ...prev,
        [dealId]: { ...prev[dealId], mrp: value },
      }));

      if (value === "" || Number.isNaN(Number(value))) return;
      const newMrp = Math.max(
        0,
        CommonService.roundedByDecimalPlace(Number(value), 2),
      );

      // If user enters MRP lesser than price, update the price value to MRP
      if (newMrp > 0 && currentItemPrice > newMrp) {
        setEdits((prev) => ({
          ...prev,
          [dealId]: {
            ...prev[dealId],
            mrp: value,
            purchasePrice: String(newMrp),
            discount: "0",
          },
        }));
        pendingRef.current[dealId] = {
          ...pendingRef.current[dealId],
          mrp: newMrp,
          purchasePrice: newMrp,
        };
      } else {
        const newDisc =
          newMrp > 0
            ? CommonService.calculateDiscount(newMrp, currentItemPrice)
            : 0;
        setEdits((prev) => ({
          ...prev,
          [dealId]: {
            ...prev[dealId],
            mrp: value,
            discount: String(CommonService.roundedByDecimalPlace(newDisc, 2)),
          },
        }));
        pendingRef.current[dealId] = {
          ...pendingRef.current[dealId],
          mrp: newMrp,
        };
      }
      flushUpdates();
      return;
    }

    if (field === "purchasePrice") {
      if (value === "" || Number.isNaN(Number(value))) {
        setEdits((prev) => ({
          ...prev,
          [dealId]: { ...prev[dealId], purchasePrice: value },
        }));
        return;
      }

      let newPrice = Math.max(
        0,
        CommonService.roundedByDecimalPlace(Number(value), 2),
      );

      // When user updates the price, if it's more than MRP, do not allow
      if (currentItemMrp > 0 && newPrice > currentItemMrp) {
        newPrice = currentItemMrp;
        toast.show({
          msg: `Purchase price cannot be greater than MRP (₹${currentItemMrp})`,
          color: "warning",
        });
      }

      const newDisc =
        currentItemMrp > 0
          ? CommonService.calculateDiscount(currentItemMrp, newPrice)
          : 0;

      setEdits((prev) => ({
        ...prev,
        [dealId]: {
          ...prev[dealId],
          purchasePrice: String(newPrice),
          discount: String(CommonService.roundedByDecimalPlace(newDisc, 2)),
        },
      }));

      pendingRef.current[dealId] = {
        ...pendingRef.current[dealId],
        purchasePrice: newPrice,
      };
      flushUpdates();
      return;
    }

    if (field === "discount") {
      setEdits((prev) => ({
        ...prev,
        [dealId]: { ...prev[dealId], discount: value },
      }));

      if (value === "" || Number.isNaN(Number(value))) return;

      const disc = Math.min(100, Math.max(0, Number(value)));
      const calculatedPrice =
        currentItemMrp > 0
          ? CommonService.roundedByDecimalPlace(
              CommonService.calculateDiscountedPrice(disc, currentItemMrp),
              2,
            )
          : currentItemPrice;

      setEdits((prev) => ({
        ...prev,
        [dealId]: {
          ...prev[dealId],
          discount: value,
          purchasePrice: String(calculatedPrice),
        },
      }));

      pendingRef.current[dealId] = {
        ...pendingRef.current[dealId],
        purchasePrice: calculatedPrice,
      };
      flushUpdates();
      return;
    }
  };

  const handleRemove = async (dealId: string) => {
    const cartId = cartRef.current?._id;
    if (!cartId) return;

    delete pendingRef.current[dealId];
    setUpdatingIds((prev) => [...new Set([...prev, dealId])]);

    let failedMsg = "";
    try {
      const resp = await PurchaseCartService.removeItem(cartId, dealId);
      if (resp.statusCode !== 200) {
        failedMsg =
          typeof resp.data?.message === "string"
            ? resp.data.message
            : "Failed to remove cart item";
      }
    } catch (error: any) {
      failedMsg = error?.message || "Failed to remove cart item";
    }

    await loadCart(true);
    clearSettledEdits([dealId]);
    setUpdatingIds((prev) => prev.filter((id) => id !== dealId));
    notifyChange();

    if (failedMsg) {
      toast.show({ msg: failedMsg, color: "danger" });
    }
  };

  const handleClear = async () => {
    const cartId = cartRef.current?._id;
    if (!cartId) return;

    pendingRef.current = {};
    setClearing(true);

    let failedMsg = "";
    try {
      const resp = await PurchaseCartService.clearItems(cartId);
      if (resp.statusCode !== 200) {
        failedMsg =
          typeof resp.data?.message === "string"
            ? resp.data.message
            : "Failed to clear cart";
      }
    } catch (error: any) {
      failedMsg = error?.message || "Failed to clear cart";
    }

    await loadCart(true);
    setEdits({});
    setClearing(false);
    notifyChange();

    if (failedMsg) {
      toast.show({ msg: failedMsg, color: "danger" });
    }
  };

  const fieldValue = (
    item: Record<string, any>,
    field: EditableField,
    apiValue: number,
  ) => {
    const edited = edits[String(item.dealId || "")]?.[field];
    if (edited !== undefined) return edited;
    if (
      apiValue === undefined ||
      apiValue === null ||
      (apiValue as any) === ""
    ) {
      return "";
    }
    if (field === "quantity") return String(apiValue);
    const num = Number(apiValue);
    if (Number.isNaN(num)) return String(apiValue);
    return CommonService.roundedByDecimalPlace(num, 2);
  };

  const handleClose = () => callback?.({ action: "close", data: {} });

  const items: Record<string, any>[] = Array.isArray(cart?.items)
    ? cart.items
    : [];
  const summary = cart?.cartSummary || {};
  const isUpdating = updatingIds.length > 0 || clearing;

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:sm:max-w-4xl tw:max-h-[90vh]"
      noPadding
    >
      <AppModal.Title onClose={handleClose} noShadow>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:text-sm tw:font-bold tw:tracking-wide tw:text-gray-600 tw:uppercase">
            PO Cart{" "}
            <span className="tw:text-xs tw:font-normal tw:text-gray-500">
              (Total {summary.totalItems} items)
            </span>
          </span>
          {isUpdating ? (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-normal tw:text-gray-500">
              <Loader2 className="tw:h-3 tw:w-3 tw:animate-spin" />
              Saving…
            </span>
          ) : null}
        </div>
      </AppModal.Title>

      <AppModal.Content noPadding className="tw:max-h-[70vh]">
        {loading ? (
          <div className="tw:space-y-2 tw:p-4">
            {[0, 1, 2].map((n) => (
              <div
                key={n}
                className="tw:h-16 tw:animate-pulse tw:rounded-lg tw:bg-gray-100"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="tw:px-4 tw:py-12 tw:text-center tw:text-sm tw:text-gray-500">
            No items added yet.
          </div>
        ) : (
          <>
            <div className="tw:flex tw:items-center tw:justify-end tw:border-b tw:border-gray-100 tw:px-4 tw:py-2">
              <button
                type="button"
                className="tw:text-sm tw:font-semibold tw:text-red-600 tw:hover:underline tw:disabled:opacity-50"
                onClick={handleClear}
                disabled={clearing}
              >
                Clear all
              </button>
            </div>

            {items.map((item, index) => {
              const dealId = String(item.dealId || "");
              const rowUpdating = updatingIds.includes(dealId);
              const name = item.dealName || item.productName || "";
              const mrp = Number(item.mrp) || 0;
              const purchasePrice = Number(item.purchasePrice) || 0;
              // The cart API has no discount — derive it from MRP vs purchase price.
              const discount =
                mrp > 0
                  ? CommonService.calculateDiscount(mrp, purchasePrice)
                  : 0;

              return (
                <div
                  key={dealId || index}
                  className="tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:last:border-b-0"
                >
                  <div className="tw:flex tw:flex-col tw:gap-3 tw:md:flex-row tw:md:items-center">
                    <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-start tw:gap-2">
                      <div
                        className={`tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[11px] tw:font-bold ${getInitialsColor(
                          name,
                        )}`}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="tw:min-w-0">
                        <div className="tw:text-sm tw:font-semibold tw:leading-snug tw:text-gray-900">
                          {name}
                        </div>
                        <div className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-gray-500">
                          {[item.dealRefId, item.uom]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        {item.isAvailable === false ? (
                          <div className="tw:mt-0.5 tw:text-xs tw:text-red-600">
                            Not available
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:grid-cols-4 tw:md:w-[28rem] tw:md:shrink-0">
                      <label className="tw:block">
                        <span className={labelClass}>Qty</span>
                        <input
                          type="number"
                          min={1}
                          className={inputClass}
                          value={fieldValue(item, "quantity", item.quantity)}
                          onChange={(e) =>
                            handleFieldChange(item, "quantity", e.target.value)
                          }
                        />
                      </label>
                      <label className="tw:block">
                        <span className={labelClass}>MRP ₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className={inputClass}
                          value={fieldValue(item, "mrp", item.mrp)}
                          onChange={(e) =>
                            handleFieldChange(item, "mrp", e.target.value)
                          }
                        />
                      </label>
                      <label className="tw:block">
                        <span className={labelClass}>Purchase ₹</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className={inputClass}
                          value={fieldValue(
                            item,
                            "purchasePrice",
                            item.purchasePrice,
                          )}
                          onChange={(e) =>
                            handleFieldChange(
                              item,
                              "purchasePrice",
                              e.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="tw:block">
                        <span className={labelClass}>Disc %</span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          className={inputClass}
                          value={fieldValue(item, "discount", discount)}
                          onChange={(e) =>
                            handleFieldChange(item, "discount", e.target.value)
                          }
                        />
                      </label>
                    </div>

                    <div className="tw:flex tw:shrink-0 tw:items-center tw:justify-between tw:gap-2 tw:md:w-28 tw:md:justify-end">
                      <span className="tw:text-xs tw:text-gray-500 tw:md:hidden">
                        Line total
                      </span>
                      <div className="tw:flex tw:items-center tw:gap-2">
                        {rowUpdating ? (
                          <Loader2 className="tw:h-3.5 tw:w-3.5 tw:animate-spin tw:text-gray-400" />
                        ) : null}
                        <Amount
                          value={Number(item.totalAmount) || 0}
                          className="tw:text-sm tw:font-bold tw:tabular-nums tw:text-emerald-700"
                        />
                        <button
                          type="button"
                          className="tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:text-gray-500 tw:hover:border-red-200 tw:hover:text-red-600 tw:disabled:opacity-50"
                          onClick={() => handleRemove(dealId)}
                          disabled={rowUpdating}
                          aria-label="Remove item"
                        >
                          <X className="tw:h-3.5 tw:w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </AppModal.Content>

      {items.length > 0 ? (
        <AppModal.Footer className="tw:justify-between tw:border-t tw:border-gray-100 tw:bg-gray-50">
          <div className="tw:flex tw:w-full tw:items-center tw:justify-between">
            <div className="tw:text-xs tw:text-gray-600 tw:tabular-nums">
              {summary.totalItems} items · {summary.totalQuantity} units
              {summary.unavailableItems ? (
                <span className="tw:ms-2 tw:text-red-600">
                  {summary.unavailableItems} unavailable
                </span>
              ) : null}
            </div>
            <div className="tw:flex tw:items-baseline tw:gap-2">
              <span className="tw:text-xs tw:font-semibold tw:tracking-wide tw:text-gray-500 tw:uppercase">
                PO Value
              </span>
              <Amount
                value={Number(summary.totalPurchaseValue) || 0}
                className="tw:text-lg tw:font-bold tw:tabular-nums tw:text-gray-900"
              />
            </div>
          </div>
        </AppModal.Footer>
      ) : null}
    </AppModal>
  );
};

export default CartModal;
