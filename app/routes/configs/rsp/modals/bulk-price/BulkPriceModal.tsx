import clsx from "clsx";
import { BarChart3, Check, Tag, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PosService from "~/services/PosService";
import SellerCatalogService from "~/services/SellerCatalogService";
import SellerGroupPriceConfigService from "~/services/SellerGroupPriceConfigService";
import UomPriceService from "~/services/UomPriceService";
import { getFinalPrice } from "~/shared/catalog/helpers/price-calc";
import { GROUP_TYPE } from "~/shared/catalog/modals/price-group-config/helper";
import { PRICE_COMPARISON_DISTANCE } from "../../list/helper";

/** How the new price is derived for every selected SKU. */
export type BulkPriceStrategy = "onMrp" | "fixed" | "matchPeers";

export interface BulkPriceConfig {
  strategy: BulkPriceStrategy;
  /** % off MRP for `onMrp`, rupee price for `fixed`, 0 for `matchPeers`. */
  value: number;
  /** Chosen B2B pricing groups — empty for B2C or "All buyers". */
  groupIds: string[];
  groupNames: string[];
  /** The deals the strategy applies to. */
  deals: any[];
}

/** What the apply run wrote — reported back so the parent can refresh. */
export interface BulkPriceResult {
  succeeded: number;
  failed: number;
  /** SKUs left untouched — no seller price, or no seller deal to write on. */
  skipped: number;
}

export interface BulkPriceModalProps {
  show: boolean;
  /** Selected deal rows — the SKUs the bulk change applies to. */
  selected: any[];
  type: "network" | "customer";
  callback: (args: {
    action: "applied" | "clear" | "close";
    data?: BulkPriceResult;
  }) => void;
}

const STRATEGIES: {
  key: BulkPriceStrategy;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "onMrp", label: "% off MRP", icon: <Tag size={13} /> },
  // Fixed ₹ is parked — bulk pricing runs on a % off MRP or the peer average.
  // { key: "fixed", label: "Fixed ₹", icon: <CreditCard size={13} /> },
  { key: "matchPeers", label: "Match sellers", icon: <BarChart3 size={13} /> },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="tw:mb-2 tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-slate-400 tw:uppercase">
    {children}
  </p>
);

const Chip = ({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:whitespace-nowrap tw:transition-colors",
      active
        ? "tw:border-primary tw:bg-primary tw:text-white"
        : "tw:border-slate-200 tw:bg-white tw:text-slate-600 hover:tw:bg-slate-50",
    )}
  >
    {children}
  </button>
);

/**
 * Seller price per deal for the "match sellers" strategy: one price-comparison
 * call for every selected SKU (`priceMismatch` narrows it to the deals actually
 * priced away from their peers), keyed by deal id. The channel's
 * `minNetworkB2bPrice` / `minNetworkB2cPrice` is the price a matched SKU lands
 * on. SKUs missing from the response have no seller price and are skipped.
 */
const fetchPeerPrices = async (
  dealIds: string[],
  isNetwork: boolean,
): Promise<Record<string, number>> => {
  if (!dealIds.length) return {};

  const response = await SellerCatalogService.getPriceComparison({
    distance: PRICE_COMPARISON_DISTANCE,
    priceType: isNetwork ? "b2b" : "b2c",
    priceMismatch: true,
    outputType: "list",
    page: 1,
    limit: dealIds.length,
    filter: { dealId: { $in: dealIds } },
  });

  const prices: Record<string, number> = {};

  (response?.data?.data || []).forEach((row: any) => {
    const price = Number(
      isNetwork ? row?.minNetworkB2bPrice : row?.minNetworkB2cPrice,
    );
    // Keyed the way the rows are held on screen — the seller-deal id the
    // formatter puts on `_id`, with the catalog deal id as the fallback.
    const key = row?.sellerDealObjId || row?.dealId;
    if (key && price > 0) {
      prices[key] = CommonService.roundedByDecimalPlace(price, 2);
    }
  });

  return prices;
};

/**
 * Bulk price setter — changes the price of many selected SKUs in one action.
 *
 * Two strategies: a % off MRP, or "match sellers", which takes each SKU's price
 * from what other sellers charge for it. Match sellers has no amount to type, so
 * the input block is swapped for a note and the apply is confirmed through an
 * alert dialog that spells out what will happen per SKU.
 *
 * B2B additionally picks the pricing groups the change is written for — several
 * groups can take the same change in one go; B2C has a single price, so no
 * group row is shown there.
 *
 * The selected products are listed below the controls with the price each one
 * will end up on, recalculated as the amount is typed. Applying is done here —
 * the parent only hears `{ action: "applied", data }` so it can refresh.
 */
const BulkPriceModal = ({
  show,
  selected,
  type,
  callback,
}: BulkPriceModalProps) => {
  const appToast = useAppToast();

  const [strategy, setStrategy] = useState<BulkPriceStrategy>("onMrp");
  const [amount, setAmount] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [showPeerAlert, setShowPeerAlert] = useState(false);
  const [applying, setApplying] = useState(false);

  // Seller price per deal, fetched the moment "Match sellers" is picked so the
  // preview below can show the exact price each SKU lands on.
  const [peerPrices, setPeerPrices] = useState<Record<string, number>>({});
  const [loadingPeers, setLoadingPeers] = useState(false);

  const isNetwork = type === "network";
  const count = selected.length;
  const isMatchPeers = strategy === "matchPeers";

  // The modal stays mounted between opens, so the controls carry over from the
  // last run — every open starts from the default strategy and an empty amount.
  useEffect(() => {
    if (!show) return;
    setStrategy("onMrp");
    setAmount("");
    setGroupIds([]);
    setShowPeerAlert(false);
    setApplying(false);
    setPeerPrices({});
  }, [show]);

  // Picking "Match sellers" reads the seller price for every selected SKU in one
  // call — the strategy has no amount to type, so the preview is the only way
  // to see what it will do before applying.
  useEffect(() => {
    if (!show || !isMatchPeers) return;

    const dealIds = selected
      .map((deal) => deal?._id)
      .filter(Boolean) as string[];

    let active = true;
    setLoadingPeers(true);

    fetchPeerPrices(dealIds, isNetwork)
      .then((prices) => {
        if (active) setPeerPrices(prices);
      })
      .catch((error) => {
        console.error("Error loading seller prices:", error);
        if (active) setPeerPrices({});
      })
      .finally(() => {
        if (active) setLoadingPeers(false);
      });

    return () => {
      active = false;
    };
  }, [show, isMatchPeers, isNetwork, selected]);

  // Pricing groups exist for B2B only — B2C carries one price for everyone.
  useEffect(() => {
    if (!isNetwork) {
      setGroups([]);
      setGroupIds([]);
      return;
    }

    let active = true;

    (async () => {
      try {
        const response = await SellerGroupPriceConfigService.getGroups({
          filter: {
            type: GROUP_TYPE,
            "franchiseInfo.id": AuthService.getLoggedInUserId(),
          },
          page: 1,
          count: 20,
        });
        if (!active) return;
        setGroups(
          (response?.data?.data || []).map((group: any) => ({
            id: group._id,
            name: group.name,
          })),
        );
      } catch (error) {
        console.error("Error loading pricing groups:", error);
        if (active) setGroups([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [isNetwork]);

  const selectedGroups = useMemo(
    () => groups.filter((group) => groupIds.includes(group.id)),
    [groups, groupIds],
  );

  const groupSummary = selectedGroups.length
    ? selectedGroups.map((group) => group.name).join(", ")
    : "all buyers";

  // Every group chip toggles independently; "All buyers" is the empty
  // selection, so picking it clears the rest.
  const toggleGroup = (id: string) => {
    setGroupIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id].filter(Boolean),
    );
  };

  // One preview row per selected SKU, carrying the price it lands on for the
  // amount currently typed. Match sellers has no amount — the price is resolved
  // per SKU at apply time, so the row says so instead of showing a number.
  const rows = useMemo(() => {
    const singleGroupId = groupIds.length === 1 ? groupIds[0] : "";

    return selected.map((deal) => {
      const uom = deal?.selectedStockUom;
      const groupPrice = singleGroupId
        ? (deal?.networkGroupPrices || []).find(
            (group: any) => group.id === singleGroupId,
          )?.price
        : undefined;

      const currentApiPrice = isNetwork
        ? groupPrice || deal?.b2bPrice || 0
        : deal?.b2cPrice || 0;

      const peerPrice = peerPrices[deal?._id];

      const finalPrice = isMatchPeers
        ? peerPrice
          ? Number(UomPriceService.toDisplayPrice(peerPrice, uom))
          : null
        : getFinalPrice({
            mrp: deal?.mrp,
            uom,
            mode: strategy === "onMrp" ? "on_mrp" : "fixed",
            value: amount,
          });

      return {
        key: deal?._id || deal?.id,
        name: deal?.name || "",
        image: deal?.images?.[0] || "",
        uomLabel: UomPriceService.getDisplayUom(uom),
        mrp: Number(UomPriceService.toDisplayPrice(deal?.mrp, uom)) || 0,
        currentPrice:
          Number(UomPriceService.toDisplayPrice(currentApiPrice, uom)) || 0,
        finalPrice,
        finalNote: isMatchPeers
          ? loadingPeers
            ? "Loading…"
            : finalPrice === null
              ? "No seller price"
              : ""
          : finalPrice === null
            ? "Enter amount"
            : "",
      };
    });
  }, [
    selected,
    amount,
    strategy,
    isMatchPeers,
    isNetwork,
    groupIds,
    peerPrices,
    loadingPeers,
  ]);

  const buildConfig = useCallback(
    (): BulkPriceConfig => ({
      strategy,
      value: isMatchPeers ? 0 : Number(amount) || 0,
      groupIds: selectedGroups.map((group) => group.id),
      groupNames: selectedGroups.map((group) => group.name),
      deals: selected,
    }),
    [strategy, isMatchPeers, amount, selectedGroups, selected],
  );

  // Resolves the new price for one deal. `matchPeers` has no single amount —
  // each SKU takes the network minimum read for it by `fetchPeerPrices`, so a
  // SKU the comparison had no price for is skipped rather than repriced.
  const resolvePriceUpdate = async (deal: any, config: BulkPriceConfig) => {
    if (config.strategy === "onMrp") {
      return { discount: config.value, isFixedPrice: false, fixedPrice: 0 };
    }
    if (config.strategy === "fixed") {
      return { discount: 0, isFixedPrice: true, fixedPrice: config.value };
    }

    const peerPrice = peerPrices[deal?._id];
    if (!peerPrice || peerPrice <= 0) {
      return null; // no seller price for this SKU — skipped
    }

    return { discount: 0, isFixedPrice: true, fixedPrice: peerPrice };
  };

  // Group-scoped B2B prices go to the bulk seller-deal endpoint in one call.
  // A % off MRP is written as a discount across every picked group; match
  // peers resolves a price per SKU first, so it goes as one fixed-price item
  // per group.
  const applyGroupPrice = async (
    config: BulkPriceConfig,
  ): Promise<BulkPriceResult> => {
    const items: Record<string, any>[] = [];
    let skipped = 0;

    for (const deal of config.deals) {
      const sellerDealId = deal.sellerDealObjId;
      if (!sellerDealId) {
        skipped++;
        continue;
      }

      if (config.strategy === "matchPeers") {
        const update = await resolvePriceUpdate(deal, config);
        if (!update) {
          skipped++;
          continue;
        }
        config.groupIds.forEach((groupId) => {
          items.push({
            sellerDealId,
            groupId,
            price: update.fixedPrice,
            discountType: "Fixed",
          });
        });
        continue;
      }

      items.push({
        sellerDealId,
        groups: config.groupIds.map((groupId) => ({
          id: groupId,
          discount: config.value,
          discountType: "Normal",
        })),
      });
    }

    if (!items.length) {
      return { succeeded: 0, failed: 0, skipped };
    }

    try {
      const response =
        await SellerCatalogService.bulkUpdateNetworkGroupSellingPrice(items);
      const ok = response.statusCode === 200;
      const touched = config.deals.length - skipped;
      return {
        succeeded: ok ? touched : 0,
        failed: ok ? 0 : touched,
        skipped,
      };
    } catch (error) {
      console.error("Error applying bulk group price:", error);
      return { succeeded: 0, failed: config.deals.length - skipped, skipped };
    }
  };

  // Deal-level price (B2C, or B2B "All buyers") — one RSP config call per SKU.
  const applyDealPrice = async (
    config: BulkPriceConfig,
  ): Promise<BulkPriceResult> => {
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const deal of config.deals) {
      try {
        const update = await resolvePriceUpdate(deal, config);
        if (!update) {
          skipped++;
          continue;
        }

        const response = await PosService.createRspConfig({
          applicableFor: isNetwork ? "Network" : "Customer",
          configOnType: "Deal",
          franchiseId: AuthService.getLoggedInUserId(),
          id: deal._id,
          ...update,
        });

        if (response.statusCode === 200) {
          succeeded++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error("Error applying bulk price:", error);
        failed++;
      }
    }

    return { succeeded, failed, skipped };
  };

  // Writes the change, reports the outcome, and hands the result to the parent
  // so it can clear the selection and re-read the rows.
  const applyBulkPrice = async () => {
    if (AuthService.isMasterLogin()) {
      appToast.show({
        msg: "You are not authorized to do this action",
        color: "danger",
      });
      return;
    }

    const config = buildConfig();
    const useGroupApi = isNetwork && config.groupIds.length > 0;

    setApplying(true);
    const result = useGroupApi
      ? await applyGroupPrice(config)
      : await applyDealPrice(config);
    setApplying(false);

    const { succeeded, failed, skipped } = result;
    const skippedNote = skipped ? ` ${skipped} skipped.` : "";

    if (failed && !succeeded) {
      appToast.show({
        msg: `Could not update pricing for ${failed} products.${skippedNote}`,
        color: "danger",
      });
      return;
    }

    appToast.show({
      msg: `Updated pricing for ${succeeded} products.${skippedNote}${
        failed ? ` ${failed} failed.` : ""
      }`,
      color: failed || skipped ? "warning" : "success",
    });

    callback({ action: "applied", data: result });
  };

  const handleClose = () => {
    if (applying) return;
    callback({ action: "close" });
  };

  const handleApply = () => {
    if (!count) {
      appToast.show({
        msg: "Select at least one product to apply the price on.",
        color: "warning",
      });
      return;
    }

    // Match sellers derives a price per SKU, so it only needs a confirmation that
    // explains what it is about to do — everything else needs an amount.
    if (isMatchPeers) {
      if (loadingPeers) {
        appToast.show({
          msg: "Still reading the seller prices — try again in a moment.",
          color: "warning",
        });
        return;
      }
      if (!Object.keys(peerPrices).length) {
        appToast.show({
          msg: "None of the selected products have a seller price to match.",
          color: "danger",
        });
        return;
      }
      setShowPeerAlert(true);
      return;
    }

    const value = Number(amount);
    if (!amount || isNaN(value) || value <= 0) {
      appToast.show({
        msg:
          strategy === "onMrp"
            ? "Enter the discount percentage to apply on MRP."
            : "Enter the fixed price to apply.",
        color: "danger",
      });
      return;
    }

    if (strategy === "onMrp" && value > 100) {
      appToast.show({
        msg: "Discount percentage cannot be more than 100%.",
        color: "danger",
      });
      return;
    }

    applyBulkPrice();
  };

  const handlePeerConfirm = () => {
    setShowPeerAlert(false);
    applyBulkPrice();
  };

  return (
    <>
      <AppModal show={show} callback={handleClose} isAutoHeight>
        <AppModal.Title onClose={handleClose}>
          Bulk price setter · {isNetwork ? "B2B" : "B2C"}
        </AppModal.Title>
        <AppModal.Content>
          <p className="tw:mb-4 tw:text-xs tw:text-slate-500">
            Change price on many SKUs at once · preview before apply
          </p>

          <div className="tw:flex tw:flex-wrap tw:items-start tw:gap-x-8 tw:gap-y-4">
            {isNetwork && (
              <div className="tw:min-w-0">
                <SectionLabel>Pricing groups</SectionLabel>
                <div className="tw:flex tw:flex-wrap tw:gap-2">
                  <Chip
                    active={!groupIds.length}
                    onClick={() => setGroupIds([])}
                  >
                    <Users size={13} />
                    All buyers
                  </Chip>
                  {groups.map((group) => (
                    <Chip
                      key={group.id}
                      active={groupIds.includes(group.id)}
                      onClick={() => toggleGroup(group.id)}
                    >
                      {group.name}
                    </Chip>
                  ))}
                </div>
                <p className="tw:mt-1.5 tw:text-[11px] tw:text-slate-400">
                  Pick more than one group to write the same price to each.
                </p>
              </div>
            )}

            <div>
              <SectionLabel>Strategy</SectionLabel>
              <div className="tw:flex tw:flex-wrap tw:gap-2">
                {STRATEGIES.map((item) => (
                  <Chip
                    key={item.key}
                    active={strategy === item.key}
                    onClick={() => setStrategy(item.key)}
                  >
                    {item.icon}
                    {item.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* The amount and the apply sit on one row — typing a discount and
                committing it is a single move. */}
            <div className="tw:min-w-[260px] tw:flex-1">
              <SectionLabel>Discount (%)</SectionLabel>
              <div className="tw:flex tw:items-center tw:gap-2">
                {isMatchPeers ? (
                  <p className="tw:flex-1 tw:text-xs tw:text-slate-500 tw:italic">
                    Uses the seller price per SKU
                  </p>
                ) : (
                  <div className="tw:flex tw:min-w-[140px] tw:flex-1 tw:items-center tw:gap-2 tw:rounded-lg tw:border tw:border-slate-200 tw:px-3 tw:py-2 focus-within:tw:border-primary">
                    {strategy === "fixed" && (
                      <span className="tw:text-sm tw:font-semibold tw:text-slate-400">
                        ₹
                      </span>
                    )}
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={strategy === "onMrp" ? "0" : "0.00"}
                      className="tw:w-full tw:min-w-0 tw:bg-transparent tw:text-sm tw:font-semibold tw:text-slate-900 tw:outline-none"
                    />
                    {strategy === "onMrp" && (
                      <span className="tw:text-sm tw:font-semibold tw:text-slate-400">
                        %
                      </span>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || !count}
                  className={clsx(
                    "tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:px-5 tw:py-2.5 tw:text-sm tw:font-bold tw:text-white tw:transition-colors",
                    applying || !count
                      ? "tw:cursor-not-allowed tw:bg-primary/50"
                      : "tw:cursor-pointer tw:bg-primary hover:tw:opacity-90",
                  )}
                >
                  <Check size={16} />
                  {applying ? "Applying…" : `Apply to ${count}`}
                </button>
              </div>
              <p className="tw:mt-1 tw:text-[11px] tw:text-slate-400">
                preview shown in the list below
              </p>
            </div>
          </div>

          {/* Selected products — the price each one lands on, live as the
              amount is typed. */}
          <div className="tw:mt-5 tw:border-t tw:border-slate-100 tw:pt-4">
            <div className="tw:mb-2 tw:flex tw:items-center tw:justify-between tw:gap-2">
              <SectionLabel>Selected products ({count})</SectionLabel>
              <span className="tw:text-[11px] tw:text-slate-400">
                Price for {groupSummary}
              </span>
            </div>

            {/* A plain scroller, not AppScrollArea: the Radix viewport sizes
                its content to the widest child, which pushed the cards past
                the drawer's right edge on mobile. */}
            <div className="tw:max-h-64 tw:overflow-x-hidden tw:overflow-y-auto">
              <div className="tw:flex tw:flex-col tw:gap-2">
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className="tw:flex tw:w-full tw:min-w-0 tw:items-center tw:gap-3 tw:rounded-xl tw:border tw:border-slate-100 tw:bg-white tw:p-2"
                  >
                    <div className="tw:size-10 tw:shrink-0 tw:overflow-hidden tw:rounded-lg tw:bg-slate-50">
                      <ImgRender
                        assetId={row.image}
                        alt={row.name}
                        className="tw:size-10 tw:object-contain"
                      />
                    </div>

                    <div className="tw:min-w-0 tw:flex-1">
                      <p className="tw:truncate tw:text-xs tw:font-semibold tw:text-slate-900">
                        {row.name}
                      </p>
                      <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-2 tw:text-[11px] tw:text-slate-500">
                        <span className="tw:flex tw:items-baseline tw:gap-1">
                          MRP <Amount value={row.mrp} decimalPlaces={2} />
                        </span>
                        <span className="tw:flex tw:items-baseline tw:gap-1">
                          Now{" "}
                          <Amount value={row.currentPrice} decimalPlaces={2} />
                        </span>
                      </p>
                    </div>

                    <div className="tw:shrink-0 tw:text-right">
                      <p className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-slate-400 tw:uppercase">
                        Final
                      </p>
                      {row.finalNote ? (
                        <p className="tw:text-xs tw:font-semibold tw:text-slate-400 tw:italic">
                          {row.finalNote}
                        </p>
                      ) : (
                        <div className="tw:flex tw:items-baseline tw:justify-end tw:gap-0.5">
                          <Amount
                            value={row.finalPrice || 0}
                            decimalPlaces={2}
                            className="tw:text-sm tw:font-bold tw:text-emerald-600"
                          />
                          {row.uomLabel ? (
                            <span className="tw:text-[10px] tw:text-slate-400">
                              /{row.uomLabel}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AppModal.Content>
      </AppModal>

      <AppAlertDialog
        show={showPeerAlert}
        title="Match seller prices?"
        description={
          <>
            {Object.keys(peerPrices).length} of the {count} selected{" "}
            {count === 1 ? "SKU" : "SKUs"} will be repriced to the lowest{" "}
            {isNetwork ? "B2B" : "B2C"} price other sellers in your network
            charge for that same SKU
            {selectedGroups.length ? ` for ${groupSummary}` : ""}. There is no
            single amount — every SKU gets its own seller price.
            <br />
            <br />
            SKUs with no seller price are skipped, and any fixed price already set
            on a matched SKU is replaced. The new prices show in the rows below
            once applied.
          </>
        }
        onConfirm={handlePeerConfirm}
        onCancel={() => setShowPeerAlert(false)}
        type="confirm"
        okText="Match sellers"
        cancelText="Cancel"
      />
    </>
  );
};

export default BulkPriceModal;
