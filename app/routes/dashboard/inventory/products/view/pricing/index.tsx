import { Tags } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import SellerCatalogService from "~/services/SellerCatalogService";
import PriceConfigModal from "~/shared/catalog/modals/price-config/PriceConfigModal";
import type { PriceConfigGroup } from "~/shared/catalog/modals/price-config/PriceConfigModal";
import type { NetworkGroupPrice } from "~/types/CommonTypes";
import GroupPricing from "./components/group-pricing/GroupPricing";
import PeerPriceComparison from "./components/peer-price-comparison/PeerPriceComparison";
import type { PeerPrice } from "./components/peer-price-comparison/helper";
import { getDetails } from "../helper";
import PriceHistory from "./components/price-history/PriceHistory";
import { normalizePriceHistory } from "./components/price-history/helper";
import type { PricePoint, PriceTarget } from "./components/price-history/helper";

/** Weeks of price history requested from the API. */
const HISTORY_WEEKS = 6;
/** Price series plotted in the history chart. */
const HISTORY_TARGET: PriceTarget = "network";

const ProductPricing = () => {
  const { id } = useParams();

  const [peerPrice, setPeerPrice] = useState<PeerPrice | null>(null);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  /** B2B prices configured per buyer group, plus their roll-up. */
  const [groupPrices, setGroupPrices] = useState<NetworkGroupPrice[]>([]);
  const [groupPriceInfo, setGroupPriceInfo] = useState<{
    totalGroups: number;
    totalSellers: number;
  }>({ totalGroups: 0, totalSellers: 0 });
  const [loading, setLoading] = useState(true);
  const [priceConfigModal, setPriceConfigModal] = useState<{
    show: boolean;
    type: "network" | "customer";
    group?: PriceConfigGroup;
  }>({ show: false, type: "customer" });

  const fetchPeerPrice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const resp = await SellerCatalogService.getPeerPrice(id);
    console.log(resp);
    setPeerPrice(resp.statusCode === 200 ? resp.data?.data || null : null);
    setLoading(false);
  }, [id]);

  /**
   * Price history is keyed by the seller-deal document id, not the deal id in
   * the route, so the deal has to be resolved first.
   */
  const fetchPriceHistory = useCallback(
    async (sellerDealObjId: string) => {
      if (!sellerDealObjId) return;
      const resp = await SellerCatalogService.getPriceHistory(sellerDealObjId, {
        action: "PRICE_UPDATE",
        priceTarget: HISTORY_TARGET,
        weeks: HISTORY_WEEKS,
      });
      setPriceHistory(
        resp.statusCode === 200
          ? normalizePriceHistory(resp.data?.data, HISTORY_TARGET)
          : [],
      );
    },
    [],
  );

  const fetchDeal = useCallback(async () => {
    if (!id) return;
    const deal = await getDetails(id);
    const dealObjId = deal?.sellerDealObjId || "";
    setGroupPrices(deal?.networkGroupPrices || []);
    setGroupPriceInfo(
      deal?.networkGroupPriceInfo || { totalGroups: 0, totalSellers: 0 },
    );
    fetchPriceHistory(dealObjId);
  }, [id, fetchPriceHistory]);

  useEffect(() => {
    fetchPeerPrice();
    fetchDeal();
  }, [fetchPeerPrice, fetchDeal]);

  if (loading) return <ContentLoader />;

  if (!peerPrice) {
    return (
      <NoData
        title="Pricing"
        description="Pricing details for this product will appear here."
        icon={
          <div className="tw:p-4 tw:bg-slate-50 tw:rounded-full tw:border tw:border-slate-200">
            <Tags className="tw:text-slate-400" size={32} />
          </div>
        }
      />
    );
  }

  return (
    <>
      <div className="tw:flex tw:flex-col tw:gap-3">
        <PeerPriceComparison
          data={peerPrice}
          onEdit={(type) => setPriceConfigModal({ show: true, type })}
        />

        <GroupPricing
          groups={groupPrices}
          info={groupPriceInfo}
          onEdit={(group) =>
            setPriceConfigModal({
              show: true,
              type: "network",
              group: {
                id: group.id,
                name: group.name,
                price: group.price,
                discount: group.discount,
                discountType: group.discountType,
              },
            })
          }
        />

        <PriceHistory points={priceHistory} weeks={HISTORY_WEEKS} />
      </div>

      <PriceConfigModal
        show={priceConfigModal.show}
        type={priceConfigModal.type}
        group={priceConfigModal.group}
        dealId={id}
        callback={({ action }: { action: string; data?: any }) => {
          setPriceConfigModal({ show: false, type: "customer" });
          if (action === "update") {
            fetchPeerPrice();
            // Re-read the deal so the group rows show the price just written.
            fetchDeal();
          }
        }}
      />
    </>
  );
};

export default ProductPricing;
