import {
  Check,
  CreditCard,
  Image as ImageIcon,
  IndianRupee,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import OmsService from "~/services/OmsService";
import { useForm } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import ImgRender from "~/components/core/img/ImgRender";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import useAppToast from "~/hooks/useAppToast";

type Payment = {
  type: string;
  paidVia: string;
  proof: string[];
  amount: number;
  paidAmount: number;
  change: number;
  approvalStatus: string;
  merchantName?: string;
  upiHandler?: string;
};

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  payments: Payment[];
  orderAmount: number;
  orderId?: string;
  groupTransactionId?: string;
  linkedOrder?: any;
  currentOrderRefNo?: string;
  isCurrentOrderReserve?: boolean;
};

const PaymentVerifyModal = ({
  show,
  callback,
  payments,
  orderAmount,
  orderId,
  groupTransactionId,
  linkedOrder,
  currentOrderRefNo,
  isCurrentOrderReserve,
}: Props) => {
  const appToast = useAppToast();

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title?: string;
    description?: string;
  }>({ show: false });

  const [paymentDetails, setPaymentDetails] = useState<Payment | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, getValues } = useForm<{
    comments: string;
  }>({
    defaultValues: { comments: "" },
  });

  useEffect(() => {
    if (show) {
      setPaymentDetails(payments?.length > 0 ? payments[0] : null);
      reset({ comments: "" });
      setShowPreview(false);
      setPreviewIndex(0);
    }
  }, [show, payments, reset]);

  const handleClose = () => callback({ action: "close" });

  const onApprove = handleSubmit(() => {
    setAppAlertDialog({
      show: true,
      title: `Did you receive ${"₹"}${expectedAmount}?`,
      description: `Only approve if ${"₹"}${expectedAmount} is in your ${payViaLabel}. This cannot be undone.`,
    });
  });

  const onReject = handleSubmit(async (data) => {
    const comments = data.comments;
    setIsSubmitting(true);
    try {
      const pathId = groupTransactionId || orderId;
      if (!pathId) {
        appToast.show({
          msg: "Missing order id",
          color: "error",
        });
        setIsSubmitting(false);
        return;
      }

      const response = await OmsService.updatePaymentStatus(pathId, {
        action: "reject",
        remarks: comments,
      });

      if (response?.statusCode === 200) {
        appToast.show({
          msg: "Payment rejected successfully",
          color: "success",
        });
        callback({
          action: "rejected",
          data: { comments, payment: paymentDetails },
        });
      } else {
        appToast.show({
          msg: response?.data.message || "Failed to reject payment",
          color: "error",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Error rejecting payment",
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  const alertSuccessCb = async () => {
    setAppAlertDialog((s) => ({ ...s, show: false }));
    setIsSubmitting(true);

    const comments = getValues("comments");
    try {
      const pathId = groupTransactionId || orderId;
      if (!pathId) {
        appToast.show({ msg: "Missing order id", color: "error" });
        setIsSubmitting(false);
        return;
      }

      const r = await OmsService.updatePaymentStatus(pathId, {
        action: "approve",
        remarks: comments,
      });

      if (r?.statusCode === 200) {
        appToast.show({
          msg: "Payment approved successfully",
          color: "success",
        });
        callback({
          action: "approved",
          data: { comments, payment: paymentDetails },
        });
      } else {
        appToast.show({
          msg: r?.data.message || "Failed to approve payment",
          color: "error",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Error approving payment",
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const alertCancelCb = () => {
    // just close the confirmation dialog; do not trigger reject flow
    setAppAlertDialog((s) => ({ ...s, show: false }));
  };

  const paid = paymentDetails?.paidAmount ?? 0;
  const paymentMethod = paymentDetails?.paidVia?.toLowerCase() || "";
  const expectedAmount = linkedOrder?.orderRefNo
    ? (orderAmount || 0) + (linkedOrder._payableAmt || 0)
    : paid || orderAmount || 0;

  const payViaLabel = paymentMethod.includes("upi")
    ? "UPI app"
    : paymentMethod.includes("cash")
      ? "cash"
      : paymentMethod.includes("card")
        ? "card machine"
        : "bank account";

  const getPaymentIcon = (size = 14) => {
    if (paymentMethod.includes("cash")) return <IndianRupee size={size} />;
    if (paymentMethod.includes("card")) return <CreditCard size={size} />;
    if (paymentMethod.includes("upi")) return <Smartphone size={size} />;
    if (paymentMethod.includes("check")) return <Check size={size} />;
    return <ImageIcon size={size} />;
  };

  const previewImages = (paymentDetails?.proof || []).map((p) => ({ id: p }));

  return (
    <>
      <AppModal show={show} callback={callback}>
        <AppModal.Title onClose={handleClose}>
          Payment Verification
        </AppModal.Title>

        <AppModal.Content>
          {paymentDetails ? (
            <div className="tw:space-y-3">
              {/* Headline claim — what the buyer says they paid */}
              <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-gray-50 tw:overflow-hidden">
                <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-3 tw:py-2.5">
                  <div className="tw:min-w-0">
                    <div className="tw:text-[11px] tw:uppercase tw:tracking-wide tw:text-gray-500 tw:font-semibold">
                      Customer says paid
                    </div>
                    <div className="tw:text-xs tw:text-gray-600 tw:inline-flex tw:items-center tw:gap-1 tw:mt-0.5 tw:flex-wrap">
                      {getPaymentIcon(12)} via {paymentDetails.paidVia}
                      {paymentDetails.upiHandler
                        ? ` · ${paymentDetails.upiHandler}`
                        : ""}
                    </div>
                  </div>
                  <div className="tw:text-xl tw:sm:text-2xl tw:font-bold tw:text-gray-900 tw:tabular-nums tw:shrink-0">
                    <Amount value={expectedAmount} />
                  </div>
                </div>

                {linkedOrder?.orderRefNo && (
                  <div className="tw:border-t tw:border-gray-200 tw:bg-white tw:px-3 tw:py-2 tw:text-xs tw:space-y-1">
                    <div className="tw:text-[11px] tw:text-gray-500 tw:mb-1">
                      One payment covers both orders:
                    </div>
                    <div className="tw:flex tw:justify-between tw:items-start tw:gap-3 tw:tabular-nums">
                      <span className="tw:text-gray-700 tw:inline-flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:min-w-0">
                        This order{" "}
                        <span className="tw:text-gray-400">
                          #{currentOrderRefNo}
                        </span>
                        {isCurrentOrderReserve ? (
                          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-blue-700 tw:bg-blue-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                            Reserve · ship later
                          </span>
                        ) : (
                          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-green-700 tw:bg-green-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                            In stock
                          </span>
                        )}
                      </span>
                      <span className="tw:font-medium tw:text-gray-900 tw:shrink-0">
                        <Amount value={orderAmount} />
                      </span>
                    </div>
                    <div className="tw:flex tw:justify-between tw:items-start tw:gap-3 tw:tabular-nums">
                      <span className="tw:text-gray-700 tw:inline-flex tw:items-center tw:gap-1.5 tw:flex-wrap tw:min-w-0">
                        Other order{" "}
                        <span className="tw:text-gray-400">
                          #{linkedOrder.orderRefNo}
                        </span>
                        {isCurrentOrderReserve ? (
                          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-green-700 tw:bg-green-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                            In stock
                          </span>
                        ) : (
                          <span className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide tw:text-blue-700 tw:bg-blue-100 tw:px-1.5 tw:py-0.5 tw:rounded">
                            Reserve · ship later
                          </span>
                        )}
                      </span>
                      <span className="tw:font-medium tw:text-gray-900 tw:shrink-0">
                        <Amount value={linkedOrder._payableAmt || 0} />
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Proof thumbnails */}
              {previewImages.length > 0 && (
                <div>
                  <div className="tw:text-xs tw:text-gray-600 tw:font-medium tw:mb-1.5">
                    Payment screenshots ({previewImages.length})
                  </div>
                  <div className="tw:flex tw:flex-wrap tw:gap-2">
                    {previewImages.map((img, i) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => {
                          setPreviewIndex(i);
                          setShowPreview(true);
                        }}
                        className="tw:relative tw:size-16 tw:rounded tw:border tw:border-gray-200 tw:overflow-hidden tw:bg-gray-50 hover:tw:border-blue-400 tw:transition"
                      >
                        <ImgRender
                          assetId={img.id}
                          className="tw:size-full tw:object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Prompt — tells the seller what to do */}
              <div className="tw:rounded-lg tw:bg-amber-50 tw:border tw:border-amber-200 tw:px-3 tw:py-2 tw:text-sm tw:text-amber-900">
                Open your {payViaLabel} and check if{" "}
                <span className="tw:font-bold">
                  <Amount value={expectedAmount} />
                </span>{" "}
                was received.
              </div>

              {/* Notes */}
              <div>
                <label className="tw:text-xs tw:text-gray-600 tw:font-medium tw:block tw:mb-1.5">
                  Notes <span className="tw:text-gray-400">(optional)</span>
                </label>
                <AppTextarea
                  name="comments"
                  placeholder="Reason for approve / reject..."
                  register={register}
                />
              </div>
            </div>
          ) : (
            <div className="tw:text-center tw:py-8 tw:text-gray-500">
              <div className="tw:text-sm">No payment details found</div>
            </div>
          )}
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:flex tw:flex-col tw:gap-2 tw:w-full">
            <AppButton
              type="button"
              color="success"
              onClick={onApprove}
              disabled={!paymentDetails || isSubmitting}
              isLoading={isSubmitting}
              className="tw:w-full"
            >
              Payment Received — Approve
            </AppButton>
            <AppButton
              type="button"
              color="danger"
              fill="outline"
              onClick={onReject}
              disabled={!paymentDetails || isSubmitting}
              isLoading={isSubmitting}
              className="tw:w-full"
            >
              Not Received — Reject
            </AppButton>
          </div>
        </AppModal.Footer>
      </AppModal>
      <ImgPreviewModal
        show={showPreview}
        images={previewImages}
        initialImageId={previewImages[previewIndex]?.id}
        callback={(res) => {
          if (res.action === "close") setShowPreview(false);
        }}
      />
      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={alertSuccessCb}
        onCancel={alertCancelCb}
      />
    </>
  );
};

export default PaymentVerifyModal;
