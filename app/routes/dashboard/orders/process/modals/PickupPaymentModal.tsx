import { CheckCircle2, FileText, Package } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import OmsService from "~/services/OmsService";
import RackBinService from "~/services/RackBinService";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";

interface CallbackArg {
  action: string;
  data?: any;
}

interface PickupPaymentModalProps {
  show: boolean;
  order: any;
  deals: any[];
  pickingId?: string;
  callback: (arg: CallbackArg) => void;
}

const PickupPaymentModal: React.FC<PickupPaymentModalProps> = ({
  show,
  order,
  deals,
  pickingId,
  callback,
}) => {
  const toast = useAppToast();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (show) {
      setSuccess(false);
      setSubmitting(false);
    }
  }, [show]);

  const pickedDeals = (deals || []).filter(
    (d: any) => (Number(d.pickedQty) || 0) > 0,
  );
  const productCount = pickedDeals.length;
  const unitCount = (deals || []).reduce(
    (acc, d: any) => acc + (Number(d.pickedQty) || Number(d.scannedQty) || 0),
    0,
  );
  const pickedValue = pickedDeals.reduce((acc, d: any) => {
    const qty = Number(d.pickedQty) || 0;
    const orderedQty = Number(d.quantity) || 0;
    const finalPrice = Number(d.finalPrice) || 0;
    const unit =
      orderedQty > 0 && finalPrice > 0
        ? finalPrice / orderedQty
        : Number(d.price) || 0;
    return acc + unit * qty;
  }, 0);

  const handleClose = () => {
    if (submitting) return;
    callback({ action: success ? "success-close" : "close" });
  };

  const handleSubmit = async () => {
    if (!pickingId) {
      toast.show({ msg: "Picking ID missing", color: "error" });
      return;
    }
    setSubmitting(true);
    try {
      const closeResp = await RackBinService.closePicking(order?._id);
      if (closeResp.statusCode !== 200) {
        toast.show({
          msg: closeResp.data?.message || "Failed to confirm picking",
          color: "error",
        });
        setSubmitting(false);
        return;
      }

      const resp = await OmsService.createInvoiceFromPicking(
        pickingId,
        order?._id,
      );
      if (resp.statusCode === 200 || resp.statusCode === 201) {
        toast.show({ msg: "Invoice generated", color: "success" });
        setSuccess(true);
        callback({ action: "invoiceGenerated", data: resp.data });
      } else {
        toast.show({
          msg: resp.data?.message || "Failed to generate invoice",
          color: "error",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || "Error generating invoice",
        color: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={handleClose} backdropDismiss={!submitting}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">
          {success ? "Invoice Generated" : "Confirm Pickup & Generate Invoice"}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {success ? (
          <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:py-6 tw:gap-3">
            <div className="tw:bg-green-100 tw:text-green-600 tw:rounded-full tw:p-3">
              <CheckCircle2 className="tw:w-10 tw:h-10" />
            </div>
            <div className="tw:text-lg tw:font-semibold">
              Invoice Generated Successfully
            </div>
            <div className="tw:text-sm tw:text-gray-500">
              Print the invoice for the customer.
            </div>
          </div>
        ) : (
          <div className="tw:space-y-3">
            <div className="tw:bg-blue-50/60 tw:border tw:border-blue-100 tw:rounded-lg tw:p-3 tw:flex tw:items-center tw:gap-3">
              <div className="tw:bg-blue-100 tw:text-blue-600 tw:p-2 tw:rounded-lg">
                <FileText className="tw:w-4 tw:h-4" />
              </div>
              <div>
                <div className="tw:text-xs tw:text-blue-600 tw:font-medium">
                  Order ID
                </div>
                <div className="tw:text-sm tw:font-bold tw:text-gray-900">
                  {order?.orderRefNo || order?._id}
                </div>
              </div>
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-3">
              <div className="tw:border tw:border-gray-200 tw:rounded tw:p-3">
                <div className="tw:text-xs tw:text-gray-500">Created</div>
                <div className="tw:text-sm tw:font-medium">
                  {order?.createdAt ? (
                    <DateFormat value={order.createdAt} />
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
              <div className="tw:border tw:border-gray-200 tw:rounded tw:p-3">
                <div className="tw:text-xs tw:text-gray-500">Picked Value</div>
                <div className="tw:text-sm tw:font-semibold">
                  <Amount value={pickedValue} decimalPlaces={2} />
                </div>
              </div>
            </div>

            <div className="tw:border tw:border-gray-200 tw:rounded tw:p-3 tw:flex tw:items-center tw:gap-3">
              <div className="tw:bg-gray-100 tw:text-gray-600 tw:p-2 tw:rounded-lg">
                <Package className="tw:w-4 tw:h-4" />
              </div>
              <div className="tw:flex tw:gap-4">
                <div>
                  <div className="tw:text-xs tw:text-gray-500">Products</div>
                  <div className="tw:text-sm tw:font-semibold">
                    {productCount}
                  </div>
                </div>
                <div>
                  <div className="tw:text-xs tw:text-gray-500">Units</div>
                  <div className="tw:text-sm tw:font-semibold">{unitCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:justify-end tw:gap-2">
          {success ? (
            <>
              <PrintReceipt orderId={order?._id} color="primary" />
              <AppButton
                onClick={() => callback({ action: "payNow" })}
                color="primary"
              >
                Receive Payment
              </AppButton>
              <AppButton onClick={handleClose} fill="outline">
                Close
              </AppButton>
            </>
          ) : (
            <>
              <AppButton
                onClick={handleClose}
                fill="outline"
                disabled={submitting}
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={handleSubmit}
                isLoading={submitting}
                disabled={submitting || !pickingId}
                color="primary"
              >
                Submit
              </AppButton>
            </>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PickupPaymentModal;
