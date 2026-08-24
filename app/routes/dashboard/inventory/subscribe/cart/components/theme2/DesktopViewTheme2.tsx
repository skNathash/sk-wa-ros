import clsx from "clsx";
import {
  ChevronDown,
  Copy,
  ImagePlus,
  IndianRupee,
  Lock,
  Minus,
  Package,
  Plus,
  Receipt,
  ScanBarcode,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppPopover from "~/components/core/popover/AppPopover";
import AppTable from "~/components/core/table/AppTable";
import ImgRender from "~/components/core/img/ImgRender";
import TableHeader from "~/components/core/table/TableHeader";
import AuthService from "~/services/AuthService";
import UomPriceService from "~/services/UomPriceService";
import ConsumerOfferBadge from "~/shared/catalog/components/consumer-offer-badge/ConsumerOfferBadge";
import type { TableHeaderItem } from "~/types/CommonTypes";
import B2cPriceCellTheme2 from "./B2cPriceCellTheme2";
import ChooseBarcode from "../ChooseBarcode";
import type { CartRowView, CartTotals } from "./helper";

interface Props {
  rows: CartRowView[];
  totals: CartTotals;
  unitOptions?: { label: string; value: string }[];
  callback: (params: { action: string; data?: any }) => void;
}

/* slate-400 on white sat under 3:1 — the headings read as disabled text rather
   than as the labels for the columns. slate-600 keeps them quiet but legible. */
const HEAD_CLASS =
  "tw:bg-white tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-[0.12em] tw:text-slate-600";

/* Widths are tuned so no control has to clip: the UOM select must show a whole
   unit name, and the price cell carries a mode toggle next to its figure. */
const headers: TableHeaderItem[] = [
  { label: "", key: "expand", width: "4%", className: HEAD_CLASS },
  {
    label: "Item · Category · Brand",
    key: "item",
    // 27% + the hidden margin column's 8%.
    width: "35%",
    className: HEAD_CLASS,
  },
  { label: "UOM", key: "unitType", width: "9%", className: HEAD_CLASS },
  {
    label: "B2C Price",
    key: "b2cPrice",
    width: "20%",
    className: HEAD_CLASS,
    info: (
      <div className="tw:text-xs tw:text-gray-500">
        The consumer selling price. Set a discount off MRP, or a fixed price.
      </div>
    ),
  },
  // Margin column hidden for now — its 8% is folded into the item column above
  // so the widths still add up to 100. Restore both together.
  // {
  //   // Centred, like the value under it — left-aligned at 6% the label ran into
  //   // the next heading and read as one column with it.
  //   label: "Margin",
  //   key: "margin",
  //   width: "8%",
  //   className: HEAD_CLASS,
  //   isCentered: true,
  //   info: (
  //     <div className="tw:text-xs tw:text-gray-500">
  //       Margin of your MRP over the purchase price.
  //     </div>
  //   ),
  // },
  {
    label: "Stock qty",
    key: "quantity",
    width: "12%",
    className: HEAD_CLASS,
    isCentered: true,
  },
  {
    label: "Subtotal",
    key: "totalValue",
    width: "12%",
    className: HEAD_CLASS,
    isRightAligned: true,
  },
  { label: "", key: "actions", width: "8%", className: HEAD_CLASS },
];

const COLUMN_COUNT = headers.length;

/** Stable per-row identity for the accordion, since indices shift on clone. */
const rowKey = (row: CartRowView) => row.item?.itemId || `idx-${row.index}`;

/* Detail-panel vocabulary. The open row reads as three workbenches laid side by
   side under the line they belong to, each with an eyebrow, hairline-separated
   so the eye can tell where one job ends and the next begins.

   The drawer is tuned tight: it opens over the list, so every row of padding it
   takes is a cart line pushed off screen. What holds readability at this size is
   contrast, not size — dark labels over muted eyebrows and hints, and fields
   that still clear a comfortable 32px touch height. */
const PANEL_CLASS = "tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-3";

const PANEL_HEAD_CLASS =
  "tw:flex tw:items-baseline tw:justify-between tw:gap-2.5";

const PANEL_TITLE_CLASS =
  "tw:flex tw:items-center tw:gap-1.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-[0.14em] tw:text-slate-400";

const PANEL_NOTE_CLASS = "tw:text-[10px] tw:font-medium tw:text-slate-400";

const FIELD_LABEL_CLASS = "tw:text-[10.5px] tw:font-bold tw:text-slate-600";

/** A fact the store can't edit here — same size as an input's text, a step
 *  quieter in weight and colour so it doesn't out-shout the fields. */
const READ_VALUE_CLASS =
  "tw:text-[12.5px] tw:font-semibold tw:tabular-nums tw:text-slate-700";

const HELP_CLASS ="tw:text-[10px] tw:leading-tight tw:text-slate-400";

const INPUT_CLASS =
  "tw:h-8 tw:w-full tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-2 tw:text-[12.5px] tw:outline-none tw:transition focus:tw:border-primary focus:tw:ring-2 focus:tw:ring-primary/15";

const STEP_BTN_CLASS =
  "tw:flex tw:h-6 tw:w-6 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-slate-500 tw:transition-colors hover:tw:bg-slate-100 hover:tw:text-slate-700 disabled:tw:opacity-40";

const ACTION_BTN_CLASS =
  "tw:flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-lg tw:text-slate-400 tw:transition-colors";

/* Every control on the line sits in one 32px band starting at the top of the
   cell, so the row reads as a single horizontal run rather than a set of
   elements floating at their own heights. Anything a control has to say about
   itself (the unit, the price the customer pays) hangs below that band. */
const BAND_CLASS = "tw:flex tw:h-8 tw:items-center";

const CAPTION_CLASS =
  "tw:mt-1 tw:text-[9px] tw:leading-tight tw:text-slate-400";

/**
 * theme-2 cart table. One scannable line per item: who it is on the left, its
 * unit, then what the shopper pays and the margin that leaves — then stock and
 * subtotal.
 *
 * The long-form fields (the two cost prices, barcode, tax codes) sit in a
 * per-row detail panel instead, so the line stays a line. One panel is open at
 * a time (the first row on load): two open panels push the rest off screen.
 */
const DesktopViewTheme2 = ({ rows, totals, unitOptions, callback }: Props) => {
  const isMasterLogin = AuthService.isMasterLogin();

  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // Open the first line once the cart arrives — but only once, so collapsing it
  // by hand doesn't spring it back open on the next render.
  const openedOnceRef = useRef(false);
  const firstKey = rows.length ? rowKey(rows[0]) : null;
  useEffect(() => {
    if (openedOnceRef.current || !firstKey) return;
    openedOnceRef.current = true;
    setExpandedKey(firstKey);
  }, [firstKey]);

  const toggleRow = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  const emitField = (index: number, key: string, value: any) => {
    callback({ action: "fieldUpdate", data: { value, index, key } });
  };

  // The row reads `hsnNumber` while the save payload reads `hsn` — the edit
  // modal keeps both in step, so an inline edit has to as well.
  const emitHsn = (index: number, value: string) => {
    emitField(index, "hsn", value);
    emitField(index, "hsnNumber", value);
  };

  const handleBarcodeChange = (
    params: { action: string; data?: any },
    index: number,
  ) => {
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
    <div className="tw:overflow-hidden tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white">
      <AppTable fixedLayout container size="sm" stickyHeader condensed>
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {rows.map((row) => {
            const item = row.item;
            const index = row.index;
            const key = rowKey(row);
            const isExpanded = expandedKey === key;

            return (
              <React.Fragment key={key}>
                <AppTable.Row
                  id={`subscribe-cart-row-${index}`}
                  className={clsx(
                    row.rowClass,
                    // Cells hang from a common top edge; middle-aligning them
                    // against the tallest cell is what left the controls at
                    // five different heights.
                    "[&>td]:tw:align-top",
                    // `condensed` sets 4px of cell padding, which is right for
                    // a table of plain figures but not for one whose every cell
                    // holds a 32px control — the line came out with the controls
                    // touching the dividers above and below. This gives each
                    // line its own breathing room without loosening the drawer.
                    "[&>td]:tw:!px-2.5 [&>td]:tw:!py-3",
                    // Open line and its drawer belong together, so the divider
                    // between them goes and the line keeps the drawer's ground.
                    isExpanded &&
                      "tw:bg-slate-50/60 hover:tw:bg-slate-50/60 [&>td]:tw:border-b-transparent",
                  )}
                >
                  {/* Detail toggle */}
                  <AppTable.Cell>
                    <div className={clsx(BAND_CLASS, "tw:justify-center")}>
                      <button
                        type="button"
                        onClick={() => toggleRow(key)}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded ? "Hide details" : "Show details"
                        }
                        title={isExpanded ? "Hide details" : "Show details"}
                        className={clsx(
                          "tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded-full tw:transition-colors",
                          isExpanded
                            ? "tw:bg-primary/10 tw:text-primary"
                            : "tw:text-slate-400 hover:tw:bg-slate-100 hover:tw:text-slate-600",
                        )}
                      >
                        <ChevronDown
                          size={15}
                          className={clsx(
                            "tw:transition-transform",
                            isExpanded ? "tw:rotate-180" : "tw:-rotate-90",
                          )}
                        />
                      </button>
                    </div>
                  </AppTable.Cell>

                  {/* Item — tile, name, and a single meta line under it. */}
                  <AppTable.Cell>
                    <div className="tw:flex tw:min-h-8 tw:items-center tw:gap-2.5">
                      <div className="tw:group tw:relative tw:shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            callback({
                              action: "show-img-preview",
                              data: { images: item.images },
                            })
                          }
                          title="View images"
                          className={clsx(
                            "tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:overflow-hidden tw:rounded-full",
                            row.image ? "tw:bg-slate-100" : row.avatarClass,
                          )}
                        >
                          {row.image ? (
                            <ImgRender
                              key={`${item.itemId}-${row.image}-${
                                item.images?.length || 0
                              }`}
                              assetId={row.image}
                              alt={row.displayName}
                              className="tw:h-9 tw:w-9 tw:object-contain"
                            />
                          ) : row.initials ? (
                            <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-white">
                              {row.initials}
                            </span>
                          ) : (
                            <Package size={15} className="tw:text-white/80" />
                          )}
                        </button>
                        {/* Adding images is housekeeping, not part of listing
                            the item — it surfaces on hover so it doesn't sit
                            in the scan path. */}
                        <button
                          type="button"
                          onClick={() =>
                            callback({
                              action: "add-more-images",
                              data: { item },
                            })
                          }
                          title="Add more images"
                          aria-label="Add more images"
                          className="tw:absolute tw:-bottom-1 tw:-right-1 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:p-0.5 tw:text-slate-400 tw:opacity-0 tw:shadow-sm tw:transition-opacity hover:tw:text-primary group-hover:tw:opacity-100"
                        >
                          <ImagePlus size={10} />
                        </button>
                      </div>

                      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
                        {row.showNameInput ? (
                          <input
                            type="text"
                            className={clsx(
                              INPUT_CLASS,
                              "tw:h-8 tw:font-semibold tw:text-slate-800",
                            )}
                            value={item.dealName || ""}
                            placeholder="Enter deal name"
                            onChange={(e) =>
                              emitField(index, "dealName", e.target.value)
                            }
                          />
                        ) : (
                          <div
                            className="tw:truncate tw:text-[13px] tw:font-semibold tw:leading-snug tw:text-slate-800"
                            title={row.displayName}
                          >
                            {row.displayName}
                          </div>
                        )}

                        {/* Everything that identifies the line, on one line:
                            where it sits in the catalog, then the flags. */}
                        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-1 tw:text-[11px] tw:leading-none tw:text-slate-400">
                          {row.categoryLabel && (
                            <span className="tw:font-semibold tw:text-primary">
                              {row.categoryLabel}
                            </span>
                          )}
                          {row.categoryLabel && row.brandLabel && (
                            <span>·</span>
                          )}
                          {row.brandLabel && (
                            <span className="tw:font-semibold tw:text-slate-600">
                              {row.brandLabel}
                            </span>
                          )}
                          {!row.isCloned && row.dealRefId && (
                            <>
                              <span>·</span>
                              <span>{row.dealRefId}</span>
                            </>
                          )}
                          {row.isLocalDeal && (
                            <span className="tw:rounded tw:bg-emerald-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-emerald-700">
                              Local
                            </span>
                          )}
                          {row.isConsumerOffer && <ConsumerOfferBadge />}
                          {row.isCloned && (
                            <span className="tw:rounded tw:bg-blue-50 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:text-blue-700">
                              Duplicate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AppTable.Cell>

                  {/* UOM — changing it rescales every price on the line, so it
                      stays on the line rather than behind the toggle. */}
                  <AppTable.Cell>
                    <select
                      className="tw:h-8 tw:w-full tw:rounded-lg tw:border tw:border-slate-200 tw:bg-white tw:px-1.5 tw:text-sm tw:text-slate-700 tw:outline-none"
                      value={row.unitType}
                      onChange={(e) =>
                        emitField(index, "unitType", e.target.value)
                      }
                      aria-label="Unit of measure"
                    >
                      {(unitOptions || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </AppTable.Cell>

                  {/* Consumer price — the number the shopper sees. */}
                  <AppTable.Cell>
                    {row.isCloned ? (
                      <AppPopover
                        triggerContent={
                          <button
                            type="button"
                            className="tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-dashed tw:border-slate-200 tw:bg-slate-50 tw:text-slate-400"
                          >
                            <Lock className="tw:h-3.5 tw:w-3.5" />
                          </button>
                        }
                      >
                        <div className="tw:max-w-[220px] tw:text-xs tw:text-slate-700">
                          Consumer price is locked for duplicate items.
                        </div>
                      </AppPopover>
                    ) : (
                      <B2cPriceCellTheme2
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
                  </AppTable.Cell>

                  {/* Margin — hidden for now; restore with the header entry. */}
                  {/* <AppTable.Cell>
                    <div className={clsx(BAND_CLASS, "tw:justify-center")}>
                      {row.hasMargin ? (
                        <span
                          className={clsx(
                            "tw:inline-flex tw:rounded-md tw:px-1.5 tw:py-0.5 tw:text-[11px] tw:font-bold tw:tabular-nums",
                            row.marginClass,
                          )}
                        >
                          {row.marginLabel}
                        </span>
                      ) : (
                        <span className="tw:text-[11px] tw:text-slate-300">
                          --
                        </span>
                      )}
                    </div>
                  </AppTable.Cell> */}

                  {/* Stock qty stepper */}
                  <AppTable.Cell>
                    {row.isCloned ? (
                      <AppPopover
                        triggerContent={
                          <button
                            type="button"
                            className="tw:flex tw:h-8 tw:w-full tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-dashed tw:border-slate-200 tw:bg-slate-50 tw:text-slate-400"
                          >
                            <Lock className="tw:h-3.5 tw:w-3.5" />
                          </button>
                        }
                      >
                        <div className="tw:max-w-[220px] tw:text-xs tw:text-slate-700">
                          Quantity is locked for duplicate items.
                        </div>
                      </AppPopover>
                    ) : (
                      <>
                        <div className="tw:flex tw:h-8 tw:items-center tw:gap-1 tw:rounded-full tw:border tw:border-slate-200 tw:bg-white tw:px-1">
                          <button
                            type="button"
                            onClick={() =>
                              emitField(
                                index,
                                "quantity",
                                Math.max(0, (Number(row.quantity) || 0) - 1),
                              )
                            }
                            disabled={isMasterLogin}
                            aria-label="Decrease stock"
                            className={STEP_BTN_CLASS}
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            value={row.quantity}
                            onChange={(e) =>
                              emitField(index, "quantity", e.target.value)
                            }
                            disabled={isMasterLogin}
                            readOnly={isMasterLogin}
                            aria-label="Store stock"
                            className="no-spinner tw:h-full tw:w-full tw:min-w-0 tw:bg-transparent tw:text-center tw:text-sm tw:font-semibold tw:tabular-nums tw:text-slate-800 tw:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              emitField(
                                index,
                                "quantity",
                                (Number(row.quantity) || 0) + 1,
                              )
                            }
                            disabled={isMasterLogin}
                            aria-label="Increase stock"
                            className={STEP_BTN_CLASS}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className={clsx(CAPTION_CLASS, "tw:text-center")}>
                          {row.isSmallUom ? (
                            <>
                              qty in {row.displayUom} = {row.apiQuantity}{" "}
                              {row.unitType}
                            </>
                          ) : (
                            row.unitType
                          )}
                        </div>
                      </>
                    )}
                  </AppTable.Cell>

                  {/* Subtotal */}
                  <AppTable.Cell className="tw:text-right">
                    <div className={clsx(BAND_CLASS, "tw:justify-end")}>
                      <Amount
                        value={row.totalPrice}
                        decimalPlaces={2}
                        className="tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-900"
                      />
                    </div>
                    {row.isSmallUom && (
                      <div className={CAPTION_CLASS}>
                        <Amount value={row.priceAmount} decimalPlaces={2} /> ×{" "}
                        {row.quantity} {row.displayUom}
                      </div>
                    )}
                  </AppTable.Cell>

                  {/* Row actions — quiet until hovered, so a red X isn't the
                      loudest thing on every line. */}
                  <AppTable.Cell>
                    <div
                      className={clsx(BAND_CLASS, "tw:justify-end tw:gap-1")}
                    >
                      {!row.isCloned && (
                        <button
                          type="button"
                          title="Duplicate"
                          aria-label="Duplicate item"
                          onClick={() =>
                            callback({
                              action: "clone",
                              data: { ...item, index },
                            })
                          }
                          className={clsx(
                            ACTION_BTN_CLASS,
                            "hover:tw:bg-slate-100 hover:tw:text-slate-700",
                          )}
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Remove"
                        aria-label="Remove item"
                        onClick={() =>
                          callback({
                            action: "delete",
                            data: { ...item, index },
                          })
                        }
                        className={clsx(
                          ACTION_BTN_CLASS,
                          "hover:tw:bg-rose-50 hover:tw:text-rose-600",
                        )}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>

                {/* Detail panel — the fields the line doesn't need in order to
                    stay scannable: unit and cost prices, barcode, tax codes. */}
                {isExpanded && (
                  <AppTable.Row
                    className="tw:bg-slate-50/60 hover:tw:bg-slate-50/60"
                    noHover
                  >
                    <AppTable.Cell colSpan={COLUMN_COUNT} className="tw:p-0">
                      {/* Panels stretch to the tallest of the three so the
                          hairlines between them run the full height of the
                          drawer — `items-start` left each one its own height
                          and the dividers stopped at three different points. */}
                      <div className="tw:grid tw:grid-cols-12 tw:items-stretch">
                        {/* Pricing — the unit everything is quoted in, and the
                            two figures the margin comes from. */}
                        <div
                          className={clsx(
                            PANEL_CLASS,
                            "tw:col-span-5 tw:border-r tw:border-slate-200",
                          )}
                        >
                          <div className={PANEL_HEAD_CLASS}>
                            <span className={PANEL_TITLE_CLASS}>
                              <IndianRupee size={12} />
                              MRP &amp; purchase price
                            </span>
                            <span className={PANEL_NOTE_CLASS}>
                              per {row.displayUom}
                            </span>
                          </div>
                          {/* MRP leads: it's the figure the consumer price is
                              set against, so it's the one the store sets first
                              and the one it comes back to change. */}
                          <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
                            <label className="tw:flex tw:flex-col tw:gap-1">
                              <span className={FIELD_LABEL_CLASS}>
                                Your MRP
                              </span>
                              <input
                                type="number"
                                className={clsx(
                                  "no-spinner tw:font-semibold tw:tabular-nums",
                                  INPUT_CLASS,
                                )}
                                value={row.displayMrp}
                                onChange={(e) =>
                                  emitField(
                                    index,
                                    "mrp",
                                    UomPriceService.toApiPrice(
                                      e.target.value,
                                      row.unitType,
                                    ),
                                  )
                                }
                              />
                              <span className={HELP_CLASS}>
                                {row.isSmallUom ? (
                                  <>
                                    per 1 {row.displayUom} ={" "}
                                    <Amount
                                      value={row.baseUnitMrp}
                                      decimalPlaces={3}
                                    />{" "}
                                    / {row.unitType}
                                  </>
                                ) : (
                                  <>per {row.displayUom}</>
                                )}
                              </span>
                            </label>

                            <label className="tw:flex tw:flex-col tw:gap-1">
                              <span className={FIELD_LABEL_CLASS}>
                                Pur. Price
                              </span>
                              {/* A master login can't edit the cost, but the
                                  field still keeps the white ground the rest of
                                  the drawer's inputs have — a grey box in the
                                  middle of the panel read as a hole in it. */}
                              <input
                                type="number"
                                className={clsx(
                                  "no-spinner tw:tabular-nums",
                                  INPUT_CLASS,
                                  isMasterLogin && "tw:text-slate-500",
                                )}
                                value={row.displayPrice}
                                onChange={(e) =>
                                  emitField(
                                    index,
                                    "price",
                                    UomPriceService.toApiPrice(
                                      e.target.value,
                                      row.unitType,
                                    ),
                                  )
                                }
                                disabled={isMasterLogin}
                                readOnly={isMasterLogin}
                              />
                              <span className={HELP_CLASS}>
                                {row.isSmallUom ? (
                                  <>
                                    per 1 {row.displayUom} ={" "}
                                    <Amount
                                      value={row.baseUnitPrice}
                                      decimalPlaces={3}
                                    />{" "}
                                    / {row.unitType}
                                  </>
                                ) : (
                                  <>per {row.displayUom}</>
                                )}
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Barcode. The "add / cancel barcode" affordance hangs
                            below the field on absolute positioning, so the
                            panel reserves the room for it. */}
                        <div
                          className={clsx(
                            PANEL_CLASS,
                            "tw:col-span-4 tw:border-r tw:border-slate-200 tw:pb-7 [&_input]:tw:h-8 [&_input]:tw:rounded-lg [&_input]:tw:bg-white [&_input]:tw:text-[12.5px]",
                          )}
                        >
                          <div className={PANEL_HEAD_CLASS}>
                            <span className={PANEL_TITLE_CLASS}>
                              <ScanBarcode size={12} />
                              Barcode
                            </span>
                            <span className={PANEL_NOTE_CLASS}>
                              EAN/UPC or local sticker
                            </span>
                          </div>
                          <ChooseBarcode
                            barcode={item.barcode}
                            barcodeOptions={item.barcodeOptions}
                            showbarcodeOption={item.showbarcodeOption}
                            dealId={
                              row.isCloned ? undefined : item.dealId || item._id
                            }
                            uom={row.unitType}
                            callback={(params) =>
                              handleBarcodeChange(params, index)
                            }
                            useSubscribeBtn={false}
                          />
                        </div>

                        {/* Tax codes — the store fills these in on its own
                          duplicate lines; on a catalog deal they come from
                          StoreKing, so they read as plain facts. */}
                        <div className={clsx(PANEL_CLASS, "tw:col-span-3")}>
                          <div className={PANEL_HEAD_CLASS}>
                            <span className={PANEL_TITLE_CLASS}>
                              <Receipt size={12} />
                              Tax &amp; codes
                            </span>
                          </div>
                          {row.isDetailEditable ? (
                            <div className="tw:grid tw:grid-cols-2 tw:gap-2.5">
                              <label className="tw:flex tw:flex-col tw:gap-1">
                                <span className={FIELD_LABEL_CLASS}>HSN</span>
                                <input
                                  type="text"
                                  className={clsx(
                                    "tw:tabular-nums",
                                    INPUT_CLASS,
                                  )}
                                  placeholder="HSN code"
                                  value={row.hsnValue}
                                  onChange={(e) =>
                                    emitHsn(index, e.target.value)
                                  }
                                />
                              </label>
                              <label className="tw:flex tw:flex-col tw:gap-1">
                                <span className={FIELD_LABEL_CLASS}>GST %</span>
                                <input
                                  type="number"
                                  className={clsx(
                                    "no-spinner tw:tabular-nums",
                                    INPUT_CLASS,
                                  )}
                                  placeholder="0"
                                  value={row.gstValue}
                                  onChange={(e) =>
                                    emitField(index, "gst", e.target.value)
                                  }
                                />
                              </label>
                            </div>
                          ) : (
                            /* Read-only facts, set in the drawer's reading
                               weight — bold slate-800 made them the loudest
                               thing in a panel nobody has to act on. */
                            <dl className="tw:flex tw:items-start tw:gap-6">
                              <div className="tw:flex tw:flex-col tw:gap-0.5">
                                <dt className={FIELD_LABEL_CLASS}>HSN</dt>
                                <dd className={READ_VALUE_CLASS}>
                                  {row.hsnLabel}
                                </dd>
                              </div>
                              <div className="tw:flex tw:flex-col tw:gap-0.5">
                                <dt className={FIELD_LABEL_CLASS}>GST</dt>
                                <dd className={READ_VALUE_CLASS}>
                                  {row.gstLabel}
                                </dd>
                              </div>
                            </dl>
                          )}
                        </div>
                      </div>
                    </AppTable.Cell>
                  </AppTable.Row>
                )}
              </React.Fragment>
            );
          })}
        </AppTable.Body>
      </AppTable>

      {/* Tally — readiness and cart value, closing the list. */}
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-end tw:gap-2 tw:border-t tw:border-slate-100 tw:bg-slate-50 tw:px-4 tw:py-3">
        {/* Readiness label hidden for now. */}
        {/* <span className="tw:text-[12px] tw:font-medium tw:tabular-nums tw:text-slate-500">
          {totals.readyLabel}
        </span> */}
        <span className="tw:flex tw:items-baseline tw:gap-1.5">
          <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-500">
            Cart value
          </span>
          <Amount
            value={totals.totalValue}
            decimalPlaces={2}
            className="tw:text-base tw:font-bold tw:tabular-nums tw:text-slate-900"
          />
        </span>
      </div>
    </div>
  );
};

export default DesktopViewTheme2;
