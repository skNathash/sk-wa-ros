import { useEffect, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import RecordPayment from "~/shared/accounts/components/record-payment/RecordPayment";
import RecordPaymentService from "~/services/RecordPaymentService";
import type { RecordPaymentEntityType } from "~/shared/accounts/components/record-payment/types";
import type { PayableReceivableEntityType } from "~/types/CommonTypes";

type Props = {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  entityId: string;
  entityType?: PayableReceivableEntityType;
  /** Kept for API compatibility; the shared wizard no longer uses tabs. */
  hideTabs?: boolean;
  paymentType?: "receivePayment" | "makePayout";
};

const RecordPaymentModal = ({
  show,
  callback,
  entityId,
  entityType,
  paymentType = "receivePayment",
}: Props) => {
  const [entityDetails, setEntityDetails] = useState<any>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);

  // Fetch the party label once so the modal title can show who is being paid.
  useEffect(() => {
    if (!show) return;

    setEntityDetails(null);

    if (!entityType || !entityId) {
      setLoadingEntity(false);
      return;
    }

    let cancelled = false;

    const fetchEntityDetails = async () => {
      setLoadingEntity(true);
      try {
        const res = await RecordPaymentService.getEntityById(
          entityType,
          entityId,
        );
        if (!cancelled) setEntityDetails(res || null);
      } catch {
        if (!cancelled) setEntityDetails(null);
      } finally {
        if (!cancelled) setLoadingEntity(false);
      }
    };

    fetchEntityDetails();

    return () => {
      cancelled = true;
    };
  }, [show, entityType, entityId]);

  const flow = paymentType === "makePayout" ? "out" : "in";
  const title = flow === "in" ? "Receive Payment" : "Make Payout";
  const subtitle =
    flow === "in" ? "Need to receive payment from" : "Need to make payout to";

  const handleClose = () => callback({ action: "close", data: {} });

  const handleSubmit = (payload: Record<string, any>) => {
    // The party is on the opposite side of the logged-in franchise.
    const party = flow === "in" ? payload.fromInfo : payload.toInfo;

    callback({
      action: "success",
      data: {
        name: party?.name,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        isPayout: flow === "out",
      },
    });
  };

  const safeEntityType = (entityType || "franchise") as RecordPaymentEntityType;

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-lg">{title}</div>
        <div className="tw:flex tw:items-center tw:gap-1">
          <div className="tw:text-xs tw:text-gray-500">{subtitle}</div>
          {loadingEntity ? (
            <AppSpinner size="sm" />
          ) : (
            <div className="tw:text-xs tw:text-gray-500">
              &quot;{entityDetails?.label || "-"}&quot;
            </div>
          )}
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh] modal-bg">
        <RecordPayment
          flow={flow}
          entityType={safeEntityType}
          entityId={entityId}
          onCancel={handleClose}
          onSubmit={handleSubmit}
        />
      </AppModal.Content>
    </AppModal>
  );
};

export default RecordPaymentModal;
