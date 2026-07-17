import { useEffect, useRef, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import useScreenView from "~/hooks/useScreenView";
import SellerCatalogService from "~/services/SellerCatalogService";
import BlockedSummary from "./BlockedSummary";
import DesktopView from "./DesktopView";
import { getData, prepareParams } from "./helper";
import MobileView from "./MobileView";

type Props = {
  show: boolean;
  callback: (a: { action: string }) => void;
  dealId: string;
};

const BlockedQtyListModal = ({ show, callback, dealId }: Props) => {
  const { isMobile } = useScreenView();

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalUnits: 0,
    totalOrders: 0,
    currentStock: 0,
  });

  const filterRef = useRef({
    dealId: dealId,
  });

  // Apply filter and fetch items
  const applyFilter = async () => {
    setLoading(true);
    const params = prepareParams(filterRef.current);
    const data = await getData(params);
    setItems(data.blockData);
    setDeal(data.deal);
    // compute summary from returned data
    const totalUnits = Array.isArray(data.blockData)
      ? data.blockData.reduce(
          (s: number, it: any) => s + (Number(it.quantity) || 0),
          0,
        )
      : 0;
    const totalOrders = Array.isArray(data.blockData)
      ? data.blockData.length
      : 0;
    const currentStock = (data.deal && Number(data.deal.actualMaxQty)) || 0;
    setSummary({ totalUnits, totalOrders, currentStock });
    setLoading(false);
  };

  useEffect(() => {
    if (show) {
      filterRef.current = {
        dealId: dealId,
      };
      const fetchDeal = async () => {
        setIsLoading(true);
        try {
          const resp = await SellerCatalogService.getProducts({
            page: 1,
            limit: 1,
            filter: { dealId: dealId },
          });
          const deals = resp?.data?.data || [];
          setDeal(deals.length > 0 ? deals[0] : null);
        } catch (e) {
          setDeal(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDeal().then(() => applyFilter());
    }
  }, [show, dealId]);

  const onClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:sm:max-w-4xl">
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-medium">Blocked Inventory - {deal?.name}</div>
      </AppModal.Title>
      <AppModal.Content>
        <BlockedSummary summary={summary} selectedStockUom={deal?.selectedStockUom} />
        {isMobile ? (
          <MobileView
            data={items}
            loading={loading}
            isLoading={isLoading}
            deal={deal}
          />
        ) : (
          <DesktopView data={items} loading={loading} />
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default BlockedQtyListModal;
