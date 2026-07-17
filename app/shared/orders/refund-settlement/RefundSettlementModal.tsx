import { FileText, Paperclip } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import OmsService from "~/services/OmsService";

interface Props {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  orderId?: string | number;
  refundSettlementId?: string | number;
  pendingRefundAmount?: number;
}

interface FormValues {
  paymentType: string;
  paidVia: string;
  referenceNo: string;
  remarks: string;
}

const PAYMENT_TYPE_OPTIONS = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "NEFT", label: "NEFT / Bank Transfer" },
  { value: "CHEQUE", label: "Cheque" },
];

const REFERENCE_NO_PLACEHOLDER: Record<string, string> = {
  UPI: "e.g. UTR / Txn ID",
  CARD: "e.g. Txn ID / Approval Code",
  NEFT: "e.g. UTR / Transaction Ref No.",
  CHEQUE: "e.g. Cheque No.",
};

const PAID_VIA_OPTIONS = [
  { value: "PhonePe", label: "PhonePe" },
  { value: "Google Pay", label: "Google Pay" },
  { value: "Paytm", label: "Paytm" },
  { value: "BHIM UPI", label: "BHIM UPI" },
  { value: "Amazon Pay", label: "Amazon Pay" },
];

const RefundSettlementModal: React.FC<Props> = ({
  show,
  callback,
  orderId,
  refundSettlementId,
  pendingRefundAmount,
}) => {
  const appToast = useAppToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    _id: string;
    name?: string;
  } | null>(null);

  const { register, handleSubmit, reset, control, setValue } =
    useForm<FormValues>({
      defaultValues: {
        paymentType: "UPI",
        paidVia: "",
        referenceNo: "",
        remarks: "",
      },
    });

  const paymentType = useWatch({ control, name: "paymentType" });

  const handleReferenceNoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const sanitized = event.target.value.replace(/[^a-zA-Z0-9.-]/g, "");
    setValue("referenceNo", sanitized);
  };

  const validateForm = (values: FormValues): { msg: string } => {
    if (values.paymentType === "UPI" && !values.paidVia?.trim()) {
      return { msg: "Paid via is required." };
    }
    return { msg: "" };
  };

  const handleClose = () => {
    reset({ paymentType: "UPI", paidVia: "", referenceNo: "", remarks: "" });
    setUploadedFile(null);
    setOrder(null);
    callback({ action: "close" });
  };

  useEffect(() => {
    if (!show || !orderId) return;

    let mounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const resp = await OmsService.getSellerOrderDetail(String(orderId));
        const fetched = resp?.data?.data || null;
        if (!mounted) return;

        if (fetched) {
          const formatted = OmsService.formatOrderResponse([fetched]);
          setOrder(formatted?.[0] || fetched);
        } else {
          setOrder(null);
        }
      } catch {
        if (mounted) setOrder(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [show, orderId]);

  const handleFileUpload = (response: any) => {
    const data = response?.data || response;
    if (data?._id) {
      setUploadedFile({ _id: data._id, name: data.name || data.fileName });
      appToast.show({ msg: "File uploaded successfully", color: "success" });
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!orderId) return;
    if (!refundSettlementId) {
      appToast.show({
        msg: "Refund settlement not found for this order.",
        color: "danger",
      });
      return;
    }

    const { msg } = validateForm(values);
    if (msg) {
      appToast.show({ msg, color: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        paymentMode: [
          {
            type: values.paymentType,
            paidVia: values.paymentType === "UPI" ? values.paidVia : "",
            refNo: values.paymentType === "CASH" ? "" : values.referenceNo,
            proof: uploadedFile ? [uploadedFile._id] : [],
            amount: pendingRefundAmount || 0,
          },
        ],
        paymentRemarks: values.remarks,
      };

      const resp: any = await OmsService.submitRefundSettlementPayment(
        String(refundSettlementId),
        payload,
      );

      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        appToast.show({
          msg: resp?.message || "Refund details submitted successfully.",
          color: "success",
        });
        reset({
          paymentType: "UPI",
          paidVia: "",
          referenceNo: "",
          remarks: "",
        });
        setUploadedFile(null);
        callback({ action: "submit", data: resp });
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to submit refund details.",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to submit refund details.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        Submit Refund Details
      </AppModal.Title>

      <AppModal.Content className="tw:h-[90vh]">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-32">
            <AppSpinner />
          </div>
        ) : !order ? (
          <div className="tw:text-center tw:py-4 tw:text-sm tw:text-gray-500">
            No order data found.
          </div>
        ) : (
          <div className="tw:flex tw:flex-col tw:gap-4">
            <div className="tw:p-3 tw:bg-red-50 tw:border tw:border-red-200 tw:rounded">
              <div className="tw:text-xs tw:text-gray-700 tw:mb-1">
                Refund Amount Payable to Customer
              </div>
              <div className="tw:text-2xl tw:font-bold tw:text-red-700">
                <Amount value={pendingRefundAmount || 0} />
              </div>
              <div className="tw:text-xs tw:text-gray-600 tw:mt-2">
                Order:{" "}
                <span className="tw:font-semibold">{order.orderRefNo}</span>
              </div>
            </div>

            <div className="tw:p-3 tw:bg-blue-50 tw:border tw:border-blue-100 tw:rounded tw:text-xs tw:text-gray-700">
              <div className="tw:font-semibold tw:mb-1">Instructions</div>
              Pay the above amount to the customer, then enter the payment
              reference number, upload proof (receipt/screenshot), and add any
              remarks.
            </div>

            <div className="tw:grid tw:grid-cols-2 tw:gap-3">
              <Controller
                name="paymentType"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    label="Payment Type"
                    options={PAYMENT_TYPE_OPTIONS}
                    value={field.value}
                    onChange={(val: any) => field.onChange(String(val))}
                    placeholder="Select type"
                    inputClassName="tw:w-full"
                  />
                )}
              />
              {paymentType === "UPI" && (
                <Controller
                  name="paidVia"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Paid Via"
                      options={PAID_VIA_OPTIONS}
                      value={field.value}
                      onChange={(val: any) => field.onChange(String(val))}
                      placeholder="Select paid via"
                      inputClassName="tw:w-full"
                      isRequired
                    />
                  )}
                />
              )}
            </div>

            {paymentType !== "CASH" && (
              <AppInput
                label="Payment Reference No."
                name="referenceNo"
                placeholder={
                  REFERENCE_NO_PLACEHOLDER[paymentType] ||
                  "e.g. UTR / Txn ID / Receipt No."
                }
                register={register}
                onChange={handleReferenceNoChange}
              />
            )}

            <div>
              <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:mb-1">
                Payment Proof
              </div>
              {uploadedFile ? (
                <FileUploadPreview
                  image={uploadedFile._id}
                  onRemove={() => setUploadedFile(null)}
                />
              ) : (
                <FileUpload
                  onFileUpload={handleFileUpload}
                  accept="image/*"
                  allowedExtensions={["jpg", "jpeg", "png", "webp"]}
                  note="Upload payment receipt or screenshot (jpg, png — max 10MB)"
                >
                  <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:border tw:border-dashed tw:border-gray-300 tw:rounded tw:px-3 tw:py-4 tw:text-sm tw:text-gray-600 hover:tw:bg-gray-50">
                    <Paperclip className="tw:w-4 tw:h-4" />
                    Click to upload proof
                  </div>
                </FileUpload>
              )}
            </div>

            <AppTextarea
              label="Remarks"
              name="remarks"
              placeholder="Any additional notes about this refund"
              register={register}
              rows={3}
            />
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:w-full tw:flex tw:justify-end tw:gap-2 tw:px-4 tw:pb-3">
          <AppButton
            color="dark"
            fill="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </AppButton>
          <AppButton
            color="success"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={loading || !order}
          >
            <FileText />
            Submit Refund
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default RefundSettlementModal;
