import { AlertCircle, Check, Delete, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import { POS_CART_ITEM_ADDED } from "~/constants";

interface KeypadProps {
  onSubmit: (value: string) => void;
  onClose?: () => void;
  cart?: any[];
  notice?: { type: "info" | "error"; msg: string; ts: number } | null;
}

interface LastAdded {
  name: string;
  qty: number;
  ts: number;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

const Keypad = ({ onSubmit, onClose, cart = [], notice = null }: KeypadProps) => {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);
  const pendingRef = useRef<{ dealId: string; qty: number } | null>(null);

  const press = useCallback((key: string) => {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    if (key === "clear") {
      setValue("");
    } else if (key === "back") {
      setValue((v) => v.slice(0, -1));
    } else {
      setValue((v) => (v + key).slice(0, 30));
    }
  }, []);

  const handleEnter = () => {
    const trimmed = value.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    onSubmit(trimmed);
    setValue("");
  };

  // Capture dealId from add-to-cart event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent)?.detail || {};
      if (!detail.dealId) return;
      pendingRef.current = {
        dealId: detail.dealId,
        qty: Number(detail.quantity) || 1,
      };
    };
    document.addEventListener(POS_CART_ITEM_ADDED, handler);
    return () => document.removeEventListener(POS_CART_ITEM_ADDED, handler);
  }, []);

  // Resolve product name once cart prop reflects the new item
  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    const found = cart.find(
      (it: any) => it.deal?.id === pending.dealId || it.dealId === pending.dealId,
    );
    if (found) {
      const name =
        found.deal?.name || found.dealName || found.name || "Item";
      setLastAdded({ name, qty: pending.qty, ts: Date.now() });
      pendingRef.current = null;
      setSubmitting(false);
    }
  }, [cart]);

  // Stop the spinner once a result (error/info notice) comes back
  useEffect(() => {
    if (notice) setSubmitting(false);
  }, [notice]);

  // Safety: never leave the spinner stuck if no result event fires
  useEffect(() => {
    if (!submitting) return;
    const t = setTimeout(() => setSubmitting(false), 8000);
    return () => clearTimeout(t);
  }, [submitting]);

  // Auto-clear banner after 4s
  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => setLastAdded(null), 4000);
    return () => clearTimeout(t);
  }, [lastAdded]);

  return (
    <AppCard noPadding>
      <div className="tw:relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="tw:absolute tw:top-3 tw:right-3 tw:z-10 tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:cursor-pointer tw:hover:bg-gray-50 tw:active:bg-gray-100 tw:shadow-sm"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        <div className="tw:p-4 tw:flex tw:flex-col tw:gap-3 tw:max-w-md tw:mx-auto">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:flex-1 tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-md tw:px-3 tw:py-3 tw:text-right tw:text-2xl tw:font-mono tw:min-h-[52px] tw:tracking-wider">
            {value || <span className="tw:text-gray-300">0</span>}
          </div>
        </div>

        {notice && (
          <div
            key={notice.ts}
            className={`tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:px-3 tw:py-2 tw:text-sm tw:border ${
              notice.type === "error"
                ? "tw:bg-red-50 tw:border-red-200 tw:text-red-800"
                : "tw:bg-amber-50 tw:border-amber-200 tw:text-amber-800"
            }`}
          >
            <AlertCircle size={16} className="tw:shrink-0" />
            <span className="tw:flex-1">{notice.msg}</span>
          </div>
        )}

        {lastAdded && (
          <div
            key={lastAdded.ts}
            className="tw:flex tw:items-center tw:gap-2 tw:bg-green-50 tw:border tw:border-green-200 tw:text-green-800 tw:rounded-md tw:px-3 tw:py-2 tw:text-sm tw:animate-in tw:fade-in tw:slide-in-from-top-1"
          >
            <Check size={16} className="tw:shrink-0" />
            <span className="tw:flex-1 tw:truncate">
              <span className="tw:font-semibold">Added:</span> {lastAdded.name}
            </span>
            <span className="tw:font-mono tw:text-xs tw:bg-green-100 tw:px-2 tw:py-0.5 tw:rounded">
              x{lastAdded.qty}
            </span>
          </div>
        )}

        <div className="tw:grid tw:grid-cols-3 tw:gap-2">
          {KEYS.map((k) => {
            const isClear = k === "clear";
            const isBack = k === "back";
            return (
              <button
                key={k}
                type="button"
                onClick={() => press(k)}
                className={`tw:py-4 tw:rounded-md tw:border tw:text-lg tw:font-semibold tw:cursor-pointer tw:select-none tw:transition tw:active:scale-95 ${
                  isClear
                    ? "tw:bg-red-50 tw:border-red-200 tw:text-red-600 tw:hover:bg-red-100 tw:active:bg-red-200"
                    : isBack
                      ? "tw:bg-gray-100 tw:border-gray-300 tw:text-gray-700 tw:active:bg-gray-200"
                      : "tw:bg-white tw:border-gray-300 tw:text-gray-900 tw:hover:bg-gray-50 tw:active:bg-gray-200"
                }`}
              >
                {isBack ? (
                  <Delete size={20} className="tw:mx-auto" />
                ) : isClear ? (
                  <span className="tw:text-sm tw:font-semibold tw:tracking-wide">
                    CLEAR
                  </span>
                ) : (
                  k
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleEnter}
          disabled={submitting || !value.trim()}
          className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-4 tw:rounded-md tw:bg-primary tw:text-white tw:text-lg tw:font-semibold tw:cursor-pointer tw:active:scale-[.98] tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="tw:animate-spin" />
              <span>Fetching item…</span>
            </>
          ) : (
            "Enter"
          )}
        </button>
        </div>
      </div>
    </AppCard>
  );
};

export default Keypad;
