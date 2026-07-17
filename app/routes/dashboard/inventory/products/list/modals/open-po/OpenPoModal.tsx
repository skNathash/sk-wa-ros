import React from "react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";

interface PurchaseOrder {
  vendorInfo: {
    vendorId: string;
    vendorName: string;
  };
  poId: string;
  orderId: string;
  poDate: string;
  status: string;
  quantity: number;
  pendingQuantity: number;
  unitPrice: number;
  totalValue: number;
  expectedDeliveryDate: string;
  createdAt: string;
  lastUpdated: string;
  _id: string;
}

interface OpenPoModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  data: {
    productName?: string;
    purchaseOrders?: PurchaseOrder[];
    loading?: boolean;
  };
}

const OpenPoModal: React.FC<OpenPoModalProps> = ({ show, callback, data }) => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();

  const handlePoClick = (poId: string) => {
    callback({ action: "viewPo", data: { poId } });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:!max-w-4xl">
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:space-y-1 tw:text-left">
          <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900">
            {t("openPurchaseOrdersFor")}: {data?.productName || t("product")}
          </h2>
          <p className="tw:text-sm tw:text-gray-600">
            {t("openPurchaseOrdersDescription")}
          </p>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:py-4">
          {isMobile ? (
            <MobileView
              loading={data?.loading}
              data={data?.purchaseOrders || []}
            />
          ) : (
            <DesktopView
              loading={data?.loading}
              data={data?.purchaseOrders || []}
            />
          )}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default OpenPoModal;
