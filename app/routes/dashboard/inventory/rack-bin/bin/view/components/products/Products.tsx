import { useState } from "react";

// import Filter from "./Filter";
import AppCard from "~/components/core/card/AppCard";
import useAppNav from "~/hooks/useAppNav";
import AdjustStockModal from "~/modals/feature/inventory/adjust-stock/AdjustStockModal";
import ManageExpiryModal from "~/modals/feature/inventory/manage-expiry/ManageExpiryModal";
import ManageStockBatchModal from "~/modals/feature/inventory/manage-stock-batch/ManageStockBatchModal";
import MoveStockModal from "~/modals/feature/inventory/move-stock/MoveStockModal";
import ProductActivityModal from "~/modals/feature/inventory/product-activity/ProductActivityModal";
import CreateBatchModal from "~/modals/feature/inventory/create-batch/CreateBatchModal";
import PickingLogModal from "~/modals/feature/inventory/picking-log/PickingLogModal";
import Item from "./components/Item";
import NoData from "~/components/core/no-data/NoData";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

interface ProductsProps {
  data: any[];
  binId: string;
  binName?: string;
  callback: (a: { action: string }) => void;
  dealId?: string;
  refresh?: number;
}

const Products = ({
  data,
  binId,
  binName,
  callback,
  dealId,
  refresh,
}: ProductsProps) => {
  const appNav = useAppNav();
  const appToast = useAppToast();
  const { t } = useTranslation(["common"]);

  const [adjustModal, setAdjustModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });

  const [moveModal, setMoveModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });

  const [manageStockBatchModal, setManageStockBatchModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });

  const [manageExpiryModal, setManageExpiryModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });
  const [createBatchModal, setCreateBatchModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });
  const [pickingLogModal, setPickingLogModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });
  const [activityLogModal, setActivityLogModal] = useState<{
    show: boolean;
    data?: any;
  }>({ show: false });

  const handleItemCallback = (a: { action: string; data?: any }) => {
    // if (AuthService.isMasterLogin()) {
    //   appToast.show({
    //     msg: t("youAreNotAuthorizedToDoThisAction"),
    //     color: "danger",
    //   });
    //   return;
    // }
    if (a.action === "adjust") {
      setAdjustModal({ show: true, data: a.data });
    }
    if (a.action === "move") {
      setMoveModal({ show: true, data: a.data });
    }
    if (a.action === "manage-stock-batch") {
      setManageStockBatchModal({ show: true, data: a.data });
    }
    if (a.action === "manage-expiry") {
      setManageExpiryModal({ show: true, data: a.data });
    }
    if (a.action === "view-deal") {
      appNav.to(`/dashboard/inventory/products/view/${a.data.dealId}`);
    }
    if (a.action === "activity-log") {
      setActivityLogModal({ show: true, data: a.data });
    }
    if (a.action === "picking-log") {
      setPickingLogModal({ show: true, data: a.data });
    }
    if (a.action === "batch-updated") {
      // Handle batch update - you can add any additional logic here
      // For example, show a success toast or trigger a refresh

      // Optionally call the parent callback to refresh data
      callback({ action: "batch-updated" });
    }
    if (a.action === "create-variation") {
      // open create batch modal with item context
      setCreateBatchModal({ show: true, data: a.data });
    }
    // Force re-fetch when actions that modify data are triggered
    if (
      [
        "adjust",
        "manage-stock-batch",
        "manage-expiry",
        "barcode-added",
        "batch-created",
      ].includes(a.action)
    ) {
      // Call parent callback to trigger refresh
      callback({ action: a.action });
    }
  };

  const moveStockCallback = (a: { action: string }) => {
    setMoveModal({ show: false });
    if (a.action === "stock-moved") {
      callback({ action: "stock-moved" });
    }
  };

  const adjustStockCallback = (a: { action: string }) => {
    // Debug: trace adjust modal callback
    // eslint-disable-next-line no-console
    console.debug("Products.adjustStockCallback -> received:", a);
    // Close modal first (mirror MoveStockModal pattern) so parent refresh
    // doesn't race with the open modal UI
    setAdjustModal({ show: false });

    // Support action names emitted by the modal and forward them to parent
    // so the bin page can trigger a refresh. Include move-to-non-sellable
    // which AdjustStockModal emits when moving stock to non-sellable.
    if (
      a.action === "stock-adjusted" ||
      a.action === "adjust-stock" ||
      a.action === "move-to-non-sellable"
    ) {
      // forward payload if provided
      callback({ action: a.action });
    }
  };

  const manageStockBatchCallback = (a: { action: string }) => {
    setManageStockBatchModal({ show: false });
    if (a.action === "batch-created" || a.action === "batch-updated") {
      callback({ action: a.action });
    }
  };

  const manageExpiryCallback = (a: { action: string; data?: any }) => {
    setManageExpiryModal({ show: false });
    if (a.action === "expiry-managed" || a.action === "expiry-updated") {
      // forward payload if provided
      callback({ action: a.action, ...(a.data ? { data: a.data } : {}) });
    }
    if (a.action === "move-to-non-sellable") {
      // pass through move action with item data
      callback({ action: a.action, ...(a.data ? { data: a.data } : {}) });
    }
  };

  return (
    <>
      {/* <Filter callback={onFilterChange} /> */}
      <div>
        {data.length === 0 ? (
          <NoData />
        ) : (
          data.map((item, idx) => (
            <div data-deal-id={item.dealId} key={idx}>
              <AppCard>
                <Item
                  callback={handleItemCallback}
                  item={item}
                  binId={binId}
                  refresh={refresh}
                />
              </AppCard>
            </div>
          ))
        )}
      </div>

      <AdjustStockModal
        show={adjustModal.show}
        callback={adjustStockCallback}
        dealId={adjustModal.data?.dealId || ""}
        dealName={adjustModal.data?.dealName || ""}
        binId={binId}
        selectedStockUom={adjustModal.data?.selectedStockUom}
      />

      <MoveStockModal
        show={moveModal.show}
        callback={moveStockCallback}
        dealId={moveModal.data?.dealId || ""}
        binId={binId}
        dealName={moveModal.data?.dealName || ""}
        selectedStockUom={moveModal.data?.selectedStockUom}
      />

      <ManageStockBatchModal
        show={manageStockBatchModal.show}
        callback={manageStockBatchCallback}
      />

      {/* Create Variation modal */}
      {/* import is dynamic above in StockDetails usage; reuse CreateBatchModal here */}
      {createBatchModal.show && (
        <CreateBatchModal
          show={createBatchModal.show}
          callback={(d: { action: string; data?: any }) => {
            setCreateBatchModal({ show: false, data: undefined });
            if (d.action === "save") {
              // Notify parent about batch creation
              callback({ action: "batch-created" });
            }
          }}
          dealId={createBatchModal.data?.dealId}
          dealRefId={
            createBatchModal.data?.dealRefId || createBatchModal.data?.batchId
          }
          dealName={createBatchModal.data?.dealName}
          binId={binId}
          selectedStockUom={createBatchModal.data?.selectedStockUom}
        />
      )}

      <ManageExpiryModal
        show={manageExpiryModal.show}
        callback={manageExpiryCallback}
        data={manageExpiryModal.data}
        binId={binId}
      />

      <PickingLogModal
        show={pickingLogModal.show}
        callback={(d) => {
          setPickingLogModal({ show: false });
          if (d.action === "close") return;
        }}
        dealId={pickingLogModal.data?.dealId}
        binId={binId}
        binName={binName}
        productName={pickingLogModal.data?.dealName}
        selectedStockUom={pickingLogModal.data?.selectedStockUom}
      />

      <ProductActivityModal
        show={activityLogModal.show}
        callback={(d) => {
          setActivityLogModal({ show: false });
          if (d.action === "close") return;
        }}
        dealId={activityLogModal.data?.dealId}
        dealName={activityLogModal.data?.dealName}
      />
    </>
  );
};

export default Products;
