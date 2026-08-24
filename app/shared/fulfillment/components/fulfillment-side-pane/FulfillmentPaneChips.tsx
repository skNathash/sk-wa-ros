import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import SellerService from "~/services/SellerService";
import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "~/shared/navigation/pane-chips/PaneChips";
import {
  getOrderChannelTabs,
  getOrderListTabRedirect,
} from "~/shared/orders/order-list-tab/OrderListTab";
import {
  getB2BOrderCount,
  getB2COrderCount,
  getCoinStoreOrderCount,
  getPaymentApprovalCount,
  getReceiveOrderCount,
  getUnconfirmedOrderCount,
} from "~/shared/orders/order-list-tab/helper";
import {
  FULFILLMENT_STAGES,
  type FulfillmentChipType,
  type FulfillmentTypeKey,
} from "./helper";

const TYPE_CHIPS: { key: FulfillmentTypeKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "B2B", label: "B2B" },
  { key: "B2C", label: "B2C" },
];

/** Every order status the pipeline covers — the scope of the chip counts. */
const PIPELINE_STATUSES = FULFILLMENT_STAGES.flatMap((stage) => stage.status);

/** What each order channel counts, keyed the same way as its chip. */
const CHANNEL_COUNT_LOADERS: Record<string, () => Promise<number>> = {
  "b2c-orders": getB2COrderCount,
  "b2b-orders": getB2BOrderCount,
  "coinstore-orders": getCoinStoreOrderCount,
  "receive-order": getReceiveOrderCount,
  "unconfirmed-orders": getUnconfirmedOrderCount,
  "payment-approval": getPaymentApprovalCount,
};

const getTypeCount = async (type: FulfillmentTypeKey): Promise<number> => {
  const fid = AuthService.getLoggedInUserId() || "";
  const filter: Record<string, any> = {
    status: { $in: PIPELINE_STATUSES },
  };
  if (type !== "all") filter.orderType = type;

  const response = await SellerService.getSellerOrders(fid, {
    filter,
    outputType: "count",
  });
  return response?.data?.data || 0;
};

interface FulfillmentPaneChipsProps {
  /** Which chip set to render — order types or order channels. */
  chipType?: FulfillmentChipType;
  /**
   * Order type currently filtered on — matches the page's `type` param. Only
   * read for the `order-type` set; the channel set reads the `tab` param.
   */
  value?: FulfillmentTypeKey;
  /** Fired for the `order-type` set; channel chips navigate on their own. */
  onChange?: (key: FulfillmentTypeKey) => void;
  className?: string;
}

/**
 * Filter chips for the fulfilment side pane, in the two flavours the order
 * surfaces need: `order-type` (All / B2B / B2C, the pipeline-wide filter the
 * board applies) and `order-channel` (the same channels as the order list tab
 * bar, which navigate to their own list).
 *
 * Either way the strip is self-contained — it resolves its own counts once on
 * mount and, for channels, its own selection and destination — so a page only
 * says which set it wants.
 */
const FulfillmentPaneChips = ({
  chipType = "order-type",
  value = "all",
  onChange,
  className,
}: FulfillmentPaneChipsProps) => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const [searchParams] = useSearchParams();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const isChannel = chipType === "order-channel";

  // The channel set is whatever the tab bar offers this user; the type set is
  // fixed (the order types the board can filter on).
  const chips = useMemo(
    () =>
      isChannel
        ? getOrderChannelTabs().map((tab) => ({
            key: tab.key,
            label: tab.langKey ? t(tab.langKey) : tab.name,
          }))
        : TYPE_CHIPS.map((chip) => ({ key: chip.key, label: chip.label })),
    [isChannel, t],
  );

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const results = await Promise.all(
          chips.map(async (chip) => {
            const count = isChannel
              ? await (CHANNEL_COUNT_LOADERS[chip.key]?.() ??
                  Promise.resolve(0))
              : await getTypeCount(chip.key as FulfillmentTypeKey);
            return [chip.key, count] as const;
          }),
        );
        if (!cancelled) setCounts(Object.fromEntries(results));
      } catch (e) {
        if (!cancelled) setCounts({});
      }
    };

    loadCounts();

    return () => {
      cancelled = true;
    };
  }, [chips, isChannel]);

  // Channels track the list page's `tab` param, falling back to the `from`
  // param a detail page carries so an order opened out of a channel keeps that
  // channel lit; types track what the page passes down.
  const activeKey = useMemo(() => {
    if (!isChannel) return value;
    const tab = searchParams.get("tab");
    if (tab) return tab;
    const from = searchParams.get("from") || "";
    if (chips.some((chip) => chip.key === from)) return from;
    return "b2c-orders";
  }, [isChannel, value, searchParams, chips]);

  const data: PaneChipItem[] = chips.map((chip) => ({
    key: chip.key,
    label: chip.label,
    active: chip.key === activeKey,
    count: counts[chip.key],
  }));

  const handleCallback = ({ data: item }: PaneChipsAction) => {
    if (isChannel) {
      const redirect = getOrderListTabRedirect(item.key);
      appNav.to(redirect.url, redirect.params);
      return;
    }
    onChange?.(item.key as FulfillmentTypeKey);
  };

  return (
    <PaneChips data={data} callback={handleCallback} className={className} />
  );
};

export default FulfillmentPaneChips;
