import {
  ArrowLeftRight,
  Clock,
  IndianRupee,
  Info,
  MapPin,
  Package,
} from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppModal from "~/components/core/modal/AppModal";
import AppLink from "~/components/core/link/AppLink";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import RackBinService from "~/services/RackBinService";

interface ViewStockLedgerModalProps {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  ledgerId: string;
}

const ViewStockLedgerModal = ({
  show,
  callback,
  ledgerId,
}: ViewStockLedgerModalProps) => {
  const [loading, setLoading] = useState(false);
  const [ledger, setLedger] = useState<any>(null);

  useEffect(() => {
    if (show && ledgerId) {
      fetchLedger();
    }
  }, [show, ledgerId]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const response = await RackBinService.getLedgerList(
        AuthService.getLoggedInUserId() || "",
        {
          page: 1,
          limit: 1,
          filter: { stockLedgerId: ledgerId },
        },
      );
      const list = response?.data?.data || [];
      setLedger(list.length > 0 ? list[0] : null);
    } catch (error) {
      console.error("Failed to fetch ledger", error);
      setLedger(null);
    } finally {
      setLoading(false);
    }
  };

  const onClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={onClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-bold">Stock Ledger Details</div>
        {ledger && (
          <div className="tw:text-xs tw:text-gray-500">
            {ledger.stockLedgerId}
          </div>
        )}
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:py-10">
            <AppSpinner />
          </div>
        ) : !ledger ? (
          <div className="tw:text-center tw:py-10 tw:text-gray-500">
            No ledger data found
          </div>
        ) : (
          <div className="tw:space-y-4">
            {/* General Info */}
            <AppCard
              title="General Info"
              icon={<Info size={16} />}
              noShadow
              bordered
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <KeyValue label="Ledger ID" size="sm">
                  {ledger.stockLedgerId}
                </KeyValue>
                <KeyValue label="Ref No" size="sm">
                  {ledger.refNo}
                </KeyValue>
                <KeyValue label="Product Name" size="sm">
                  <AppLink
                    asLink
                    href={`/dashboard/inventory/products/view/${ledger.dealId}`}
                    showLinkColor
                  >
                    {ledger.name}
                  </AppLink>
                </KeyValue>
                <KeyValue label="Barcode" size="sm">
                  {ledger.barcode || "-"}
                </KeyValue>
                <KeyValue label="Status" size="sm">
                  {ledger.status}
                </KeyValue>
                <KeyValue label="Remarks" size="sm">
                  {ledger.remarks || "-"}
                </KeyValue>
              </div>
            </AppCard>

            {/* Transaction Info */}
            <AppCard
              title="Transaction Info"
              icon={<ArrowLeftRight size={16} />}
              noShadow
              bordered
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <KeyValue label="Type" size="sm">
                  <span className="tw:uppercase">{ledger.type}</span>
                </KeyValue>
                <KeyValue label="Sub Type" size="sm">
                  <span className="tw:uppercase">{ledger.subType || "-"}</span>
                </KeyValue>
                <KeyValue label="Direction" size="sm">
                  <span
                    className={
                      ledger.direction === "IN"
                        ? "tw:text-green-600"
                        : "tw:text-red-600"
                    }
                  >
                    {ledger.direction}
                  </span>
                </KeyValue>
                <KeyValue label="Reference Type" size="sm">
                  {ledger.referenceType}
                </KeyValue>
                <KeyValue label="Inventory Type" size="sm">
                  {ledger.inventoryType}
                </KeyValue>
              </div>
            </AppCard>

            {/* Quantity Info */}
            <AppCard
              title="Quantity Info"
              icon={<Package size={16} />}
              noShadow
              bordered
            >
              <div className="tw:grid tw:grid-cols-3 tw:gap-4">
                <KeyValue label="Opening Qty" size="sm">
                  {ledger.effectiveOldQty}
                </KeyValue>
                <KeyValue label="Change Qty" size="sm">
                  <span
                    className={
                      ledger.direction === "IN"
                        ? "tw:text-green-600 tw:font-semibold"
                        : "tw:text-red-600 tw:font-semibold"
                    }
                  >
                    {ledger.direction === "IN" ? "+" : "-"}
                    {ledger.changeQtyBy}
                  </span>
                </KeyValue>
                <KeyValue label="Closing Qty" size="sm">
                  {ledger.effectiveNewQty}
                </KeyValue>
                <KeyValue label="Quantity" size="sm">
                  {ledger.quantity} {ledger.uom}
                </KeyValue>
                <KeyValue label="Damaged Qty" size="sm">
                  {ledger.damagedQty}
                </KeyValue>
              </div>
            </AppCard>

            {/* Pricing Info */}
            <AppCard
              title="Pricing Info"
              icon={<IndianRupee size={16} />}
              noShadow
              bordered
            >
              <div className="tw:grid tw:grid-cols-3 tw:gap-4">
                <KeyValue label="MRP" size="sm">
                  <Amount value={ledger.mrp} />
                </KeyValue>
                <KeyValue label="Purchase Price" size="sm">
                  <Amount value={ledger.purchasePrice} />
                </KeyValue>
                <KeyValue label="B2B Price" size="sm">
                  <Amount value={ledger.b2bPrice} />
                </KeyValue>
              </div>
            </AppCard>

            {/* Location Info */}
            <AppCard
              title="Location Info"
              icon={<MapPin size={16} />}
              noShadow
              bordered
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <KeyValue label="Location" size="sm">
                  {ledger.location ? (
                    <AppLink
                      asLink
                      href={`/dashboard/inventory/rack-bin/bin/view/${ledger.location.binId}`}
                      showLinkColor
                    >
                      {ledger.location.name} - {ledger.location.rackName}/
                      {ledger.location.binName}
                    </AppLink>
                  ) : (
                    ledger.locationId || "-"
                  )}
                </KeyValue>
                <KeyValue label="Location ID" size="sm">
                  {ledger.locationId || "-"}
                </KeyValue>
              </div>
            </AppCard>

            {/* Audit Info */}
            <AppCard
              title="Audit Info"
              icon={<Clock size={16} />}
              noShadow
              bordered
            >
              <div className="tw:grid tw:grid-cols-2 tw:gap-4">
                <KeyValue label="Created At" size="sm">
                  <DateFormat value={ledger.createdAt} />
                </KeyValue>
                <KeyValue label="Created By" size="sm">
                  {ledger.createdBy?.name || "-"}
                </KeyValue>
                <KeyValue label="Last Updated" size="sm">
                  <DateFormat value={ledger.lastUpdated} />
                </KeyValue>
                <KeyValue label="Modified By" size="sm">
                  {ledger.modifiedBy?.name || "-"}
                </KeyValue>
              </div>
            </AppCard>
          </div>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default ViewStockLedgerModal;
