import clsx from "clsx";
import { Check, Loader2, PencilLine } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";

/**
 * Inline selling-price field.
 *
 * The editor owns the whole write: it debounces the keystrokes, calls the RSP
 * config API itself, shows its own error toast and rolls the field back to the
 * last saved value when the call fails. The host only learns the outcome
 * through `callback`, so a screen never has to thread a save through its own
 * state.
 *
 * The price is written as a fixed price on the channel the `type` names —
 * `b2b` goes to the Network config, `b2c` to the Customer one — which is the
 * same path {@link PriceConfigModal} takes for its "Fixed Price" mode.
 *
 * Passing `group` switches the write to that buyer group's B2B price, which
 * lives on the seller-deal document instead of the RSP config — the same
 * endpoint the group mode of {@link PriceConfigModal} posts to.
 *
 * `force` exists for the match actions (electronics online match, peer match):
 * pushing `{ price, token }` with a new token drops that price into the field
 * and saves it on the same path a manual edit takes.
 */

/** Channel the price belongs to — B2B (retailers) or B2C (CLUB customers). */
export type InlinePriceType = "b2b" | "b2c";

/** What the price is configured on. Deal-level is the only case today. */
export type InlinePriceConfigType = "Deal" | "Brand" | "Category" | "Menu";

/** Buyer group a price belongs to — set when the field edits a group price. */
export interface InlinePriceGroup {
  /** Buyer group id. */
  id: string;
  name?: string;
  /** Seller-deal document id — the group price endpoint is keyed on it. */
  sellerDealObjId: string;
}

export interface InlinePriceResult {
  action: "saved" | "failed";
  dealId: string;
  price: number;
  type: InlinePriceType;
  /** Set when the price was written on a buyer group instead of the deal. */
  groupId?: string;
}

export interface InlinePriceEditProps {
  /** Deal the price is written on — `_id` from the price-comparison response. */
  dealId: string;
  /** B2B / B2C — picks the config the price is written to. */
  type: InlinePriceType;
  /** Current saved price; the field resets to this on a failed save. */
  price: number;
  /** RSP config scope. Defaults to `Deal`. */
  configType?: InlinePriceConfigType;
  /**
   * Buyer group the price belongs to. When passed the field writes that
   * group's B2B price (seller-deal endpoint) instead of the deal-level one.
   */
  group?: InlinePriceGroup;
  callback?: (result: InlinePriceResult) => void;
  /**
   * Turns the pencil into a button — the host opens the full price config
   * modal (margin mode, history, competitors) from it. Without it the pencil
   * stays a plain affordance hint.
   */
  onEdit?: () => void;
  /**
   * Set false when the host renders its own way into the config modal beside
   * the field — the trailing slot then only carries the saving / saved state.
   */
  showEdit?: boolean;
  /** Push a price in from outside; bump `token` each time to re-trigger. */
  force?: { price: number; token: number };
  /** Flags the price as needing attention — the field turns red / dashed. */
  invalid?: boolean;
  disabled?: boolean;
  /** Quiet window after the last keystroke before the save fires. */
  debounceMs?: number;
  /** Small caption above the field — used by the mobile tiles ("You"). */
  label?: string;
  className?: string;
  /** Replaces the field's default dashed border / tint — used to tone it. */
  fieldClassName?: string;
  /** Replaces the price's default colour. */
  textClassName?: string;
  inputClassName?: string;
  "aria-label"?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Writes one deal's price as a fixed price on the given channel. Throws on a
 * non-200 so the editor has a single failure branch to handle.
 */
const savePrice = async (
  dealId: string,
  type: InlinePriceType,
  price: number,
  configType: InlinePriceConfigType,
) => {
  const response = await PosService.createRspConfig({
    applicableFor: type === "b2b" ? "Network" : "Customer",
    configOnType: configType,
    franchiseId: AuthService.getLoggedInUserId(),
    id: dealId,
    discount: 0,
    isFixedPrice: true,
    fixedPrice: price,
  });

  if (response?.statusCode !== 200) {
    throw new Error(
      response?.data?.message ||
        "Could not update the price. Please try again.",
    );
  }

  return response;
};

/**
 * Writes one buyer group's B2B price as a fixed price. The group price lives on
 * the seller-deal document, so it takes its own endpoint rather than the RSP
 * config one.
 */
const saveGroupPrice = async (group: InlinePriceGroup, price: number) => {
  const response = await SellerCatalogService.updateNetworkGroupSellingPrice(
    group.sellerDealObjId,
    group.id,
    {
      price,
      discount: 0,
      discountType: "Fixed",
    },
  );

  if (response?.statusCode !== 200) {
    throw new Error(
      response?.data?.message ||
        "Could not update the group price. Please try again.",
    );
  }

  return response;
};

const InlinePriceEdit: React.FC<InlinePriceEditProps> = ({
  dealId,
  type,
  price,
  configType = "Deal",
  group,
  callback,
  onEdit,
  showEdit = true,
  force,
  invalid = false,
  disabled = false,
  debounceMs = 800,
  label,
  className = "",
  fieldClassName = "",
  textClassName = "",
  inputClassName = "",
  "aria-label": ariaLabel,
}) => {
  const appToast = useAppToast();

  const [draft, setDraft] = useState<string>(price ? String(price) : "");
  const [status, setStatus] = useState<SaveStatus>("idle");

  // Last value the API accepted — both the rollback target and the guard that
  // keeps a re-render from re-saving a price that is already stored.
  const savedRef = useRef<number>(price);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const flashStatus = (next: SaveStatus) => {
    setStatus(next);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      if (mountedRef.current) setStatus("idle");
    }, 2500);
  };

  const save = async (next: number) => {
    // Nothing to write: blank / zero prices and no-op re-saves are dropped.
    if (!next || next <= 0 || next === savedRef.current) return;

    setStatus("saving");
    try {
      if (group?.id) {
        await saveGroupPrice(group, next);
      } else {
        await savePrice(dealId, type, next, configType);
      }
      savedRef.current = next;
      if (mountedRef.current) flashStatus("saved");
      callback?.({
        action: "saved",
        dealId,
        price: next,
        type,
        groupId: group?.id,
      });
    } catch (error: any) {
      // The failure is reported here — the host only needs to know the price
      // did not move.
      appToast.show({
        msg: error?.message || "Could not update the price. Please try again.",
        color: "danger",
      });
      if (mountedRef.current) {
        setDraft(savedRef.current ? String(savedRef.current) : "");
        flashStatus("error");
      }
      callback?.({
        action: "failed",
        dealId,
        price: next,
        type,
        groupId: group?.id,
      });
    }
  };

  const debouncedSave = useDebouncedCallback(save, debounceMs);

  // Adopt a price the host reloaded from the server — but never while an edit
  // is waiting to be written or the field has focus, which would yank the value
  // out from under whoever is typing.
  useEffect(() => {
    if (debouncedSave.isPending() || focusedRef.current) return;
    savedRef.current = price;
    setDraft(price ? String(price) : "");
  }, [price]);

  // The debounced save holds a timer past unmount otherwise.
  useEffect(() => () => debouncedSave.cancel(), []);

  const handleChange = (next: string) => {
    setDraft(next);
    debouncedSave(Number(next));
  };

  // A price pushed in from outside (the match actions) saves straight away —
  // it is a deliberate action, not typing that needs settling. Whatever token
  // the field mounted with is treated as already applied, so remounting a
  // matched row does not re-fire the save.
  const forceToken = force?.token;
  const lastTokenRef = useRef<number | undefined>(force?.token);
  useEffect(() => {
    if (forceToken === undefined || lastTokenRef.current === forceToken) return;
    lastTokenRef.current = forceToken;

    const next = force?.price || 0;
    setDraft(next ? String(next) : "");
    debouncedSave.cancel();
    save(next);
  }, [forceToken]);

  // Leaving the field commits immediately rather than waiting out the debounce.
  const handleBlur = () => {
    focusedRef.current = false;
    debouncedSave.flush();
  };

  return (
    <div
      className={clsx("tw:inline-flex tw:flex-col tw:items-stretch", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {label && (
        <span className="tw:mb-0.5 tw:text-center tw:text-[10px] tw:font-semibold tw:tracking-wide tw:text-emerald-700 tw:uppercase">
          {label}
        </span>
      )}

      <div
        className={clsx(
          "tw:relative tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:px-2 tw:py-1.5 tw:transition-colors",
          invalid
            ? "tw:border-dashed tw:border-red-300 tw:bg-red-50"
            : fieldClassName ||
                "tw:border-dashed tw:border-emerald-400 tw:bg-emerald-50/60",
          status === "error" && "tw:border-red-400",
          status === "saved" && "tw:border-emerald-300 tw:bg-emerald-50",
          disabled && "tw:opacity-60",
        )}
      >
        <span
          className={clsx(
            "tw:font-serif tw:text-sm",
            invalid ? "tw:text-red-600" : textClassName || "tw:text-gray-500",
          )}
        >
          ₹
        </span>

        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={draft}
          disabled={disabled}
          aria-label={
            ariaLabel ||
            (group
              ? `${group.name || "Group"} price`
              : type === "b2b"
                ? "B2B price"
                : "B2C price")
          }
          onClick={(e) => e.stopPropagation()}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e.target.value)}
          className={clsx(
            "tw:w-full tw:min-w-0 tw:border-0 tw:bg-transparent tw:p-0 tw:text-sm tw:font-bold tw:tabular-nums tw:outline-none",
            invalid ? "tw:text-red-600" : textClassName || "tw:text-gray-900",
            inputClassName,
          )}
        />

        {/* Only the saving / saved flash is kept when the host renders its own
            edit affordance — the slot then collapses while idle. */}
        {(showEdit || status === "saving" || status === "saved") && (
          <span className="tw:inline-flex tw:h-3.5 tw:w-3.5 tw:shrink-0 tw:items-center tw:justify-center">
            {status === "saving" ? (
              <Loader2 size={13} className="tw:animate-spin tw:text-gray-400" />
            ) : status === "saved" ? (
              <Check size={13} className="tw:text-emerald-600" />
            ) : onEdit ? (
              // The pencil is the way into the full config modal — the field
              // itself only writes a fixed price.
              <button
                type="button"
                aria-label="Open price settings"
                title="Open price settings"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="tw:inline-flex tw:cursor-pointer tw:items-center tw:justify-center tw:transition-opacity hover:tw:opacity-70"
              >
                <PencilLine
                  size={12}
                  className={
                    invalid ? "tw:text-red-400" : "tw:text-emerald-600"
                  }
                />
              </button>
            ) : (
              <PencilLine
                size={12}
                className={invalid ? "tw:text-red-400" : "tw:text-emerald-500"}
              />
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default InlinePriceEdit;
