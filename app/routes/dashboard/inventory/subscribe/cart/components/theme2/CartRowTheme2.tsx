import clsx from "clsx";
import {
  ChevronDown,
  Copy,
  ImagePlus,
  Lock,
  Minus,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppPopover from "~/components/core/popover/AppPopover";
import ImgRender from "~/components/core/img/ImgRender";
import AuthService from "~/services/AuthService";
import UomPriceService from "~/services/UomPriceService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import B2cPriceConfig from "../B2cPriceConfig";
import ChooseBarcode from "../ChooseBarcode";
import type { CartRowView } from "./helper";

interface Props {
  row: CartRowView;
  unitOptions?: { label: string; value: string }[];
  callback: (params: { action: string; data?: any }) => void;
}

/**
 * theme-2 cart line — one conversational row per product. The head of the row
 * carries what you scan for (item, stock, subtotal, whether it can go live);
 * everything that's a decision rather than a check — UOM, MRP, purchase price,
 * B2C price, barcode — folds into the "Configure" tray so the list stays a
 * list. No field from the classic row is dropped, only re-homed.
 */
const CartRowTheme2 = ({ row, unitOptions, callback }: Props) => {
  const [open, setOpen] = useState(false);
  const isMasterLogin = AuthService.isMasterLogin();
  const item = row.item;
  const index = row.index;

  const emitField = (key: string, value: any) => {
    callback({ action: "fieldUpdate", data: { value, index, key } });
  };

  const handleQtyStep = (delta: number) => {
    const next = Math.max(0, (Number(row.quantity) || 0) + delta);
    emitField("quantity", next);
  };

  const handleBarcodeChange = (params: { action: string; data?: any }) => {
    if (params.action === "markAsLocal") {
      callback({ action: "markAsLocal", data: { ...params.data, index } });
      return;
    }
    callback({
      action: params.action,
      data: { value: params.data?.value, index, key: "barcode" },
    });
  };

  return (
    <div
      id={`subscribe-cart-row-${index}`}
      className={clsx(
        // Each line is a self-contained card; the list spaces them apart. State
        // stays where it reads best — the status bubble at the foot of the row.
        "tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-3.5 tw:shadow-sm",
        row.rowClass,
      )}
    >
      {/* Head — thumb, identity, subtotal. */}
      <div className="tw:flex tw:items-start tw:gap-3">
        <div className="tw:relative tw:shrink-0">
          <button
            type="button"
            onClick={() =>
              callback({
                action: "show-img-preview",
                data: { images: item.images },
              })
            }
            className="tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-xl tw:ring-1 tw:bg-[color-mix(in_srgb,var(--primary)_7%,#fff)] tw:ring-[color-mix(in_srgb,var(--primary)_12%,transparent)]"
          >
            {row.image ? (
              <ImgRender
                key={`${item.itemId}-${row.image}-${item.images?.length || 0}`}
                assetId={row.image}
                alt={row.displayName}
                className="tw:h-14 tw:w-14 tw:object-contain"
              />
            ) : row.initials ? (
              <span className="tw:text-sm tw:font-bold tw:uppercase tw:tracking-tight tw:text-primary">
                {row.initials}
              </span>
            ) : (
              <Package size={20} className="tw:text-slate-300" />
            )}
          </button>
          <button
            type="button"
            onClick={() =>
              callback({ action: "add-more-images", data: { item } })
            }
            title="Add More Images"
            className="tw:absolute tw:-bottom-1 tw:-right-1 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:p-1 tw:text-primary tw:shadow-sm"
          >
            <ImagePlus size={12} />
          </button>
        </div>

        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
          {row.showNameInput ? (
            <input
              type="text"
              className="tw:w-full tw:rounded-lg tw:border tw:border-primary tw:px-2 tw:py-1 tw:text-sm tw:font-semibold tw:text-slate-800 tw:outline-none animate__animated animate__flash"
              value={item.dealName || ""}
              placeholder="Enter deal name"
              onChange={(e) => emitField("dealName", e.target.value)}
            />
          ) : (
            <div
              className="tw:line-clamp-2 tw:text-sm tw:font-semibold tw:leading-snug tw:tracking-tight tw:text-slate-800"
              title={row.displayName}
            >
              {row.displayName}
            </div>
          )}

          <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1 tw:text-[11px] tw:leading-none tw:text-slate-500">
            {row.subtitle && (
              <span className="tw:truncate tw:font-medium">{row.subtitle}</span>
            )}
            {!row.isCloned && row.dealRefId && (
              <span className="tw:truncate">ID: {row.dealRefId}</span>
            )}
            <span>HSN: {row.hsnLabel}</span>
            <span>GST: {row.gstLabel}</span>
          </div>

          {(row.isCloned || row.isLocalDeal || row.isConsumerOffer) && (
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
              {row.isCloned && <AppBadge variant="light">Duplicate</AppBadge>}
              {row.isLocalDeal && (
                <span className="tw:rounded tw:bg-emerald-600/90 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-medium tw:text-white">
                  Local
                </span>
              )}
              {row.isConsumerOffer && <ConsumerOfferBadge />}
            </div>
          )}
        </div>

        <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-end tw:gap-1">
          <Amount
            value={row.totalPrice}
            decimalPlaces={2}
            className="tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-900"
          />
          {/* Margin chip hidden for now. */}
          {/* {row.hasMargin && (
            <span
              className={clsx(
                "tw:rounded-full tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:tabular-nums",
                row.marginClass,
              )}
            >
              {row.marginLabel} margin
            </span>
          )} */}
          <button
            type="button"
            onClick={() =>
              callback({ action: "delete", data: { ...item, index } })
            }
            title="Remove"
            className="tw:text-slate-400 hover:tw:text-rose-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Stock line — the one number most rows come here to change. */}
      <div className="tw:mt-3 tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-t tw:border-slate-100 tw:pt-3">
        {row.isCloned ? (
          <AppPopover
            triggerContent={
              <button
                type="button"
                className="tw:inline-flex tw:items-center tw:gap-1 tw:rounded-lg tw:border tw:border-dashed tw:border-slate-300 tw:bg-slate-50 tw:px-2 tw:py-1 tw:text-xs tw:text-slate-400"
              >
                <Lock className="tw:h-3 tw:w-3" />
                Store stock
              </button>
            }
          >
            <div className="tw:max-w-[220px] tw:text-xs tw:text-slate-700">
              Quantity is locked for duplicate items.
            </div>
          </AppPopover>
        ) : (
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:flex tw:items-center tw:overflow-hidden tw:rounded-lg tw:border tw:border-slate-200">
              <button
                type="button"
                onClick={() => handleQtyStep(-1)}
                disabled={isMasterLogin}
                className="tw:px-2 tw:py-1.5 tw:text-slate-500 disabled:tw:opacity-40"
              >
                <Minus size={14} />
              </button>
              <input
                type="number"
                value={row.quantity}
                onChange={(e) => emitField("quantity", e.target.value)}
                disabled={isMasterLogin}
                readOnly={isMasterLogin}
                aria-label="Store stock"
                className="no-spinner tw:w-12 tw:border-x tw:border-slate-200 tw:py-1.5 tw:text-center tw:text-sm tw:font-semibold tw:tabular-nums tw:text-slate-800 tw:outline-none"
              />
              <button
                type="button"
                onClick={() => handleQtyStep(1)}
                disabled={isMasterLogin}
                className="tw:px-2 tw:py-1.5 tw:text-slate-500 disabled:tw:opacity-40"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="tw:text-[11px] tw:text-slate-400">
              {row.isSmallUom
                ? `${row.displayUom} · = ${row.apiQuantity} ${row.unitType}`
                : row.unitType}
            </span>
          </div>
        )}

        <div className="tw:flex tw:items-baseline tw:gap-1 tw:text-[11px] tw:text-slate-500">
          <span>Buy</span>
          <Amount
            value={row.priceAmount}
            decimalPlaces={2}
            className="tw:font-semibold tw:tabular-nums tw:text-slate-700"
          />
          <span>· MRP</span>
          <Amount
            value={row.mrpAmount}
            decimalPlaces={2}
            className="tw:font-semibold tw:tabular-nums tw:text-slate-700"
          />
        </div>
      </div>

      {/* Status strip — only the positive confirmation; pending lines stay quiet
          so the row doesn't nag while it's still being filled in. */}
      {row.isReady && (
        <div className="tw:mt-2.5 tw:rounded-xl tw:bg-(--wa-bubble) tw:px-3 tw:py-2 tw:text-[12px] tw:font-medium tw:text-(--wa-bubble-text)">
          Ready — will go live in My Items once saved to inventory
        </div>
      )}

      {/* Configure tray — every remaining field from the classic row. */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="tw:mt-2 tw:flex tw:w-full tw:items-center tw:justify-between tw:gap-1 tw:rounded-lg tw:py-1.5 tw:text-[12px] tw:font-semibold tw:text-primary"
      >
        Configure price · stock · barcode
        <ChevronDown
          size={14}
          className={clsx("tw:transition-transform", open && "tw:rotate-180")}
        />
      </button>

      {open && (
        <div className="tw:mt-2 tw:rounded-xl tw:bg-slate-50 tw:p-3">
          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <label className="tw:flex tw:flex-col tw:gap-1">
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
                UOM
              </span>
              <select
                className="tw:h-8 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-2 tw:text-sm tw:outline-none"
                value={row.unitType}
                onChange={(e) => emitField("unitType", e.target.value)}
              >
                {(unitOptions || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="tw:flex tw:flex-col tw:gap-1">
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
                MRP
              </span>
              <input
                type="number"
                className="tw:h-8 tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-2 tw:text-sm tw:tabular-nums tw:outline-none"
                value={row.displayMrp}
                onChange={(e) =>
                  emitField(
                    "mrp",
                    UomPriceService.toApiPrice(e.target.value, row.unitType),
                  )
                }
              />
              <span className="tw:text-[10px] tw:leading-tight tw:text-slate-400">
                {row.isSmallUom ? (
                  <>
                    Enter MRP per 1 {row.displayUom} ={" "}
                    <Amount value={row.baseUnitMrp} decimalPlaces={3} /> /{" "}
                    {row.unitType}
                  </>
                ) : (
                  <>per {row.displayUom}</>
                )}
              </span>
            </label>

            <label className="tw:flex tw:flex-col tw:gap-1">
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
                Purchase Price
              </span>
              <input
                type="number"
                className={clsx(
                  "tw:h-8 tw:rounded-lg tw:px-2 tw:text-sm tw:tabular-nums tw:outline-none",
                  isMasterLogin
                    ? "tw:bg-slate-100 tw:text-slate-500"
                    : "tw:border tw:border-slate-200 tw:bg-white",
                )}
                value={row.displayPrice}
                onChange={(e) =>
                  emitField(
                    "price",
                    UomPriceService.toApiPrice(e.target.value, row.unitType),
                  )
                }
                disabled={isMasterLogin}
                readOnly={isMasterLogin}
              />
              <span className="tw:text-[10px] tw:leading-tight tw:text-slate-400">
                {row.isSmallUom ? (
                  <>
                    Enter price per 1 {row.displayUom} ={" "}
                    <Amount value={row.baseUnitPrice} decimalPlaces={3} /> /{" "}
                    {row.unitType}
                  </>
                ) : (
                  <>per {row.displayUom}</>
                )}
              </span>
            </label>

            <div className="tw:flex tw:flex-col tw:gap-1">
              <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
                B2C Price
              </span>
              {row.isCloned ? (
                <AppPopover
                  triggerContent={
                    <button
                      type="button"
                      className="tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-dashed tw:border-slate-300 tw:bg-white tw:text-slate-400"
                    >
                      <Lock className="tw:h-3.5 tw:w-3.5" />
                    </button>
                  }
                >
                  <div className="tw:max-w-[220px] tw:text-xs tw:text-slate-700">
                    B2C price is locked for duplicate items.
                  </div>
                </AppPopover>
              ) : (
                <B2cPriceConfig
                  config={item.b2cPriceConfig}
                  mrp={item.mrp}
                  unitType={row.unitType}
                  onChange={(config) =>
                    callback({
                      action: "b2cPriceConfigUpdate",
                      data: { value: config, index },
                    })
                  }
                />
              )}
            </div>
          </div>

          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-1">
            <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
              Barcode
            </span>
            <div className="tw:pb-5">
              <ChooseBarcode
                barcode={item.barcode}
                barcodeOptions={item.barcodeOptions}
                showbarcodeOption={item.showbarcodeOption}
                dealId={row.isCloned ? undefined : item.dealId || item._id}
                uom={row.unitType}
                callback={handleBarcodeChange}
                useSubscribeBtn={false}
              />
            </div>
          </div>

          {/* Line-level actions — same set the classic row offered. */}
          <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-3 tw:border-t tw:border-slate-200 tw:pt-2.5">
            {row.categoryLabel && (
              <AppBadge variant="light">{row.categoryLabel}</AppBadge>
            )}
            {!row.isCloned && (
              <button
                type="button"
                onClick={() =>
                  callback({ action: "clone", data: { ...item, index } })
                }
                className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12px] tw:font-semibold tw:text-primary"
              >
                <Copy size={13} />
                Duplicate
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                callback({ action: "edit", data: { ...item, index } })
              }
              className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[12px] tw:font-semibold tw:text-primary"
            >
              <Pencil size={13} />
              {row.isCloned ? "Add more detail" : "Edit"}
            </button>
            <button
              type="button"
              onClick={() =>
                callback({ action: "delete", data: { ...item, index } })
              }
              className="tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:text-[12px] tw:font-semibold tw:text-rose-600"
            >
              <Trash2 size={13} />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartRowTheme2;
