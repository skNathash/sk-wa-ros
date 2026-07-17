import AppModal from "~/components/core/modal/AppModal";
import AppSwiper from "~/components/core/swiper";
import type { SwiperOptions } from "swiper/types";
import AppButton from "~/components/core/button/AppButton";
import { useEffect, useState } from "react";
import useAppToast from "~/hooks/useAppToast";
import OmsService from "~/services/OmsService";
import ImgRender from "~/components/core/img/ImgRender";
import Amount from "~/components/core/amount/Amount";
import { useForm, useWatch } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import AppTextarea from "~/components/core/form/AppTextarea";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import {
  Copy,
  Paperclip,
  QrCode,
  CheckCircle2,
  Upload,
  CreditCard,
} from "lucide-react";

type Props = {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
  paymentOptions: PaymentOption[];
  orderAmount?: number;
  orderId?: string | number | null;
  clientOnly?: boolean;
  // When true, transaction ID and payment proof are not mandatory
  optionalProof?: boolean;
  initialValues?: {
    transactionId?: string;
    remarks?: string;
    images?: { id: string }[];
    amount?: number | string;
    paymentMethodId?: string;
  };
};

type FormData = {
  transactionId: string;
  remarks: string;
  images: { id: string }[];
  amount?: number | string;
};

type PaymentOption = {
  // New API structure: prefer these keys if present
  paymentMethod?: string;
  merchantName?: string;
  displayName?: string;
  images?: string[];
  refCode?: string;
  processingFee?: number;
  minAmount?: number | null;
  maxAmount?: number | null;
  isActive?: boolean;
  // fallback / legacy
  name?: string;
  value?: string;
  img?: string;
};

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

const PrepaidInfoModal = ({
  show,
  callback,
  paymentOptions,
  orderAmount,
  orderId,
  clientOnly,
  optionalProof,
  initialValues,
}: Props) => {
  const { register, reset, control, setValue, getValues } = useForm<FormData>({
    defaultValues: {
      transactionId: "",
      remarks: "",
      images: [],
      amount: orderAmount ?? 0,
    },
  });

  const appToast = useAppToast();

  const [images, amount] = useWatch({ control, name: ["images", "amount"] });

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentOption | null>(null);
  const [copied, setCopied] = useState(false);

  const onClose = () => {
    callback({ action: "close", data: {} });
  };

  const handlePaymentMethodChange = (option: PaymentOption) => {
    setSelectedPaymentMethod(option);
  };

  const handleFileUpload = (file: any) => {
    setValue("images", [...(images || []), { id: file._id }], {
      shouldValidate: true,
    });
  };

  const handleFileRemove = (index: number) => {
    const images = getValues("images");
    setValue(
      "images",
      images.filter((_, i) => i !== index),
      {
        shouldValidate: true,
      },
    );
  };

  const getOptionId = (o?: PaymentOption | null) =>
    o?.refCode ?? o?.value ?? o?.paymentMethod ?? o?.displayName ?? "";

  const getOptionName = (o?: PaymentOption) =>
    o?.displayName ?? o?.merchantName ?? o?.name ?? o?.paymentMethod ?? "";

  const getOptionImgAsset = (o?: PaymentOption) =>
    o?.images?.[0] ?? o?.img ?? undefined;

  const handleCopy = async () => {
    const id = getOptionId(selectedPaymentMethod);
    if (id) {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = () => {
    submitPayment();
  };

  const submitPayment = async () => {
    const values = getValues();
    const { msg } = validateForm();
    if (msg) {
      appToast.show({ msg, color: "error" });
      return;
    }

    if (clientOnly) {
      appToast.show({
        msg: "Payment details saved",
        color: "success",
      });
      callback({
        action: "submit",
        data: {
          transactionId: values.transactionId,
          remarks: values.remarks || "",
          images: values.images || [],
          amount: Number(values.amount) || 0,
          paymentMethod: selectedPaymentMethod,
        },
      });
      return;
    }

    // orderId will be read from the `orderId` prop passed into the component

    // Build payload
    const payload: any = {
      paymentType: "PREPAID",
      paymentMethod: "PREPAID",
      transactionId: values.transactionId,
      remarks: values.remarks || "",
      paymentMode: [
        {
          type: "UPI",
          paidVia: selectedPaymentMethod?.paymentMethod || "",
          refNo: getOptionId(selectedPaymentMethod) || "",
          proof: (values.images || []).map((i: any) => i.id),
          amount: Number(values.amount) || 0,
          paidAmount: Number(values.amount) || 0,
          change: 0,
        },
      ],
    };

    // orderId comes from props
    const realOrderId = orderId;

    setSubmitting(true);
    try {
      const res: any = await OmsService.submitOrderPayment(
        String(realOrderId),
        payload,
      );
      if (res && res.statusCode === 200) {
        callback({ action: "success", data: res.data });
      } else {
        const errMsg = res?.data?.message || "Failed to submit payment";
        appToast.show({ msg: errMsg, color: "error" });
      }
    } catch (e: any) {
      const msg = e?.message || "Failed to submit payment";
      appToast.show({ msg, color: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = (): { msg: string } => {
    const values = getValues();

    if (!selectedPaymentMethod) {
      return { msg: "Please select a payment method" };
    }

    const amt = Number(values.amount ?? 0);
    if (Number.isNaN(amt)) {
      return { msg: "Enter a valid amount" };
    }
    if (amt < 0) {
      return { msg: "Amount cannot be negative" };
    }

    if (!optionalProof) {
      if (!values.transactionId || !String(values.transactionId).trim()) {
        return { msg: "Please enter transaction ID" };
      }

      if (
        !values.images ||
        (Array.isArray(values.images) && values.images.length === 0)
      ) {
        return { msg: "Please upload payment proof" };
      }
    }

    return { msg: "" };
  };

  const handleAmountChange = (e: any) => {
    const raw = e.target.value;
    if (raw === "") {
      setValue("amount", "", { shouldValidate: true });
      return;
    }

    const num = Number(raw);
    if (Number.isNaN(num)) {
      return;
    }

    if (num < 0) {
      setValue("amount", 0, { shouldValidate: true });
      return;
    }

    setValue("amount", raw, { shouldValidate: true });
  };

  const handleTransactionIdChange = (e: any) => {
    const value = e.target.value;
    const cleanedValue = value.replace(/[^a-zA-Z0-9]/g, "");
    setValue("transactionId", cleanedValue, { shouldValidate: true });
  };

  useEffect(() => {
    if (show) {
      reset({
        transactionId: initialValues?.transactionId ?? "",
        remarks: initialValues?.remarks ?? "",
        images: initialValues?.images ?? [],
        amount: initialValues?.amount ?? orderAmount ?? 0,
      });
      const preselected = initialValues?.paymentMethodId
        ? paymentOptions?.find(
            (p) => getOptionId(p) === initialValues.paymentMethodId,
          )
        : null;
      setSelectedPaymentMethod(preselected || paymentOptions?.[0] || null);
      setCopied(false);
    }
  }, [show, paymentOptions, reset, initialValues]);

  return (
    <AppModal show={show} callback={callback} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose}>Complete Payment</AppModal.Title>
      <AppModal.Content className="tw:h-[90vh] tw:overflow-y-auto">
        <div className="tw:mb-2">
          <label className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:mb-1 tw:block">
            Select Payment Method
          </label>
          <AppSwiper config={swiperConfig}>
            {paymentOptions?.map((option, idx) => (
              <AppSwiper.Slide
                key={getOptionId(option) || String(idx)}
                isAutoWidth={true}
              >
                <AppButton
                  fill={
                    getOptionId(selectedPaymentMethod) === getOptionId(option)
                      ? "solid"
                      : "outline"
                  }
                  color="primary"
                  onClick={() => handlePaymentMethodChange(option)}
                  size="small"
                >
                  {getOptionName(option)}
                </AppButton>
              </AppSwiper.Slide>
            ))}
          </AppSwiper>
        </div>

        {selectedPaymentMethod && (
          <>
            <div className="tw:bg-gradient-to-r tw:from-green-50 tw:to-emerald-50 tw:border tw:border-green-300 tw:rounded-md tw:p-2.5 tw:mb-2.5 tw:shadow-sm">
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                <div className="tw:flex-1">
                  <p className="tw:text-[10px] tw:font-medium tw:text-gray-600 tw:mb-0.5">
                    Amount to Pay
                  </p>
                  <p className="tw:text-2xl tw:font-bold tw:text-green-600">
                    <Amount value={orderAmount ?? 0} />
                  </p>
                </div>
                <div className="tw:bg-white tw:rounded-full tw:p-2 tw:shadow-sm tw:flex-shrink-0">
                  <CreditCard size={20} className="tw:text-green-600" />
                </div>
              </div>
            </div>

            <div className="tw:bg-gradient-to-br tw:from-blue-50 tw:to-indigo-50 tw:border tw:border-blue-200 tw:rounded-md tw:p-2 tw:mb-2">
              <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-1.5">
                <QrCode size={14} className="tw:text-blue-600" />
                <h3 className="tw:text-xs tw:font-bold tw:text-blue-900">
                  Seller Payment Details
                </h3>
              </div>

              <div className="tw:flex tw:items-start tw:gap-3">
                <div className="tw:flex-shrink-0 tw:bg-white tw:p-1.5 tw:rounded-md tw:border tw:border-blue-100">
                  <ImgRender
                    assetId={getOptionImgAsset(selectedPaymentMethod)}
                    alt={getOptionName(selectedPaymentMethod)}
                    className="tw:w-20 tw:h-20 tw:object-contain"
                  />
                </div>

                <div className="tw:flex-1 tw:min-w-0">
                  <label className="tw:text-[9px] tw:font-medium tw:text-gray-600 tw:block tw:mb-0.5">
                    Payment ID / UPI
                  </label>
                  <div className="tw:bg-white tw:border tw:border-blue-200 tw:rounded-md tw:p-1.5 tw:flex tw:items-center tw:justify-between tw:gap-1.5">
                    <span className="tw:text-xs tw:font-bold tw:text-gray-900 tw:break-all">
                      {getOptionId(selectedPaymentMethod)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="tw:flex-shrink-0 tw:p-1 tw:bg-blue-100 tw:hover-bg-blue-200 tw:rounded tw:transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <CheckCircle2 size={12} className="tw:text-green-600" />
                      ) : (
                        <Copy size={12} className="tw:text-blue-600" />
                      )}
                    </button>
                  </div>
                  <p className="tw:text-[9px] tw:text-gray-600 tw:mt-0.5">
                    Scan QR or copy ID to make payment
                  </p>
                </div>
              </div>
            </div>

            <div className="tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-md tw:p-2 tw:mb-2">
              <h4 className="tw:text-xs tw:font-bold tw:text-amber-900 tw:mb-1">
                📋 What you need to do:
              </h4>
              <ol className="tw:text-[10px] tw:text-gray-700 tw:space-y-0.5 tw:ml-4 tw:list-decimal">
                <li>Make payment to the seller using above details</li>
                <li>Enter your transaction ID below</li>
                <li>Upload payment proof (screenshot/receipt)</li>
                <li>Submit to complete your order</li>
              </ol>
            </div>

            <div className="tw:space-y-2">
              {/* <div>
                <div className="tw:flex tw:items-center tw:gap-1 tw:mb-0.5">
                  <CreditCard size={12} className="tw:text-gray-600" />
                  <label className="tw:text-xs tw:font-semibold tw:text-gray-700">
                    Amount <span className="tw:text-red-500">*</span>
                  </label>
                </div>
                <AppInput
                  type="number"
                  name="amount"
                  register={register}
                  placeholder="Enter paid amount"
                  className="tw:w-full"
                  size="sm"
                  onChange={handleAmountChange}
                />
                {typeof orderAmount === "number" &&
                  orderAmount > 0 &&
                  (Number(amount) || 0) > 0 &&
                  Number(amount) < orderAmount && (
                    <p className="tw:text-[10px] tw:text-amber-700 tw:mt-1 tw:font-medium">
                      Entered amount is less than the order amount (
                      <Amount value={orderAmount} />
                      ).
                    </p>
                  )}
              </div> */}
              <div>
                <div className="tw:flex tw:items-center tw:gap-1 tw:mb-0.5">
                  <CreditCard size={12} className="tw:text-gray-600" />
                  <label className="tw:text-xs tw:font-semibold tw:text-gray-700">
                    Transaction ID{" "}
                    {optionalProof ? (
                      <span className="tw:text-gray-500 tw:font-normal">
                        (Optional)
                      </span>
                    ) : (
                      <span className="tw:text-red-500">*</span>
                    )}
                  </label>
                </div>
                <AppInput
                  name="transactionId"
                  register={register}
                  placeholder="Enter transaction/reference ID"
                  className="tw:w-full"
                  size="sm"
                  onChange={handleTransactionIdChange}
                />
              </div>

              <div>
                <div className="tw:flex tw:items-center tw:gap-1 tw:mb-0.5">
                  <Upload size={12} className="tw:text-gray-600" />
                  <label className="tw:text-xs tw:font-semibold tw:text-gray-700">
                    Payment Proof{" "}
                    {optionalProof ? (
                      <span className="tw:text-gray-500 tw:font-normal">
                        (Optional)
                      </span>
                    ) : (
                      <span className="tw:text-red-500">*</span>
                    )}
                  </label>
                </div>
                <FileUpload onFileUpload={handleFileUpload}>
                  <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-md tw:p-2 tw:text-center tw:hover-border-blue-400 tw:hover-bg-blue-50 tw:transition-all tw:cursor-pointer">
                    <Paperclip
                      size={14}
                      className="tw:mx-auto tw:text-gray-400 tw:mb-0.5"
                    />
                    <p className="tw:text-[10px] tw:text-gray-700 tw:font-medium">
                      Upload screenshot or receipt
                    </p>
                    <p className="tw:text-[9px] tw:text-gray-500">
                      JPG, PNG • Max 10MB
                    </p>
                  </div>
                </FileUpload>
                {images.length > 0 && (
                  <div className="tw:mt-2">
                    <FileUploadedSlide
                      images={images}
                      onRemove={handleFileRemove}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="tw:text-xs tw:font-semibold tw:text-gray-700 tw:mb-0.5 tw:block">
                  Remarks (Optional)
                </label>
                <AppTextarea
                  name="remarks"
                  register={register}
                  placeholder="Add any additional notes..."
                  className="tw:w-full tw:text-sm"
                  rows={2}
                />
              </div>
            </div>
          </>
        )}
      </AppModal.Content>
      <AppModal.Footer>
        <AppButton
          fill="solid"
          color="primary"
          onClick={onSubmit}
          isLoading={submitting}
          className="tw:w-full"
        >
          Submit Payment Details
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default PrepaidInfoModal;
