import { IndianRupee, InfoIcon, Upload } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import DateFormat from "~/components/core/date/DateFormat";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadPreview from "~/components/core/file-upload/FileUploadPreview";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import { AppInput } from "~/components/core/form/AppInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import OmsService from "~/services/OmsService";
import PosService from "~/services/PosService";
import ImgRender from "~/components/core/img/ImgRender";
import InvoiceDownload from "~/shared/orders/invoice-download/InvoiceDownload";
import PrintReceipt from "~/shared/orders/print-receipt/PrintReceipt";

interface MarkAsDeliveredModalProps {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  orderId: string;
}

const MarkAsDeliveredModal: React.FC<MarkAsDeliveredModalProps> = ({
  show,
  callback,
  orderId,
}) => {
  const { t } = useTranslation(["common"]);

  const appToast = useAppToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
  } = useForm<{
    remarks: string;
    cashAmount: number | string;
    upiAmount: number | string;
    proofImg: string;
    transId: string;
  }>({
    defaultValues: {
      remarks: "",
      cashAmount: 0,
      upiAmount: 0,
      proofImg: "",
      transId: "",
    },
  });

  const [orderDetail, setOrderDetail] = React.useState<any>(null);
  const [payableAmount, setPayableAmount] = React.useState<number>(0);
  const [cashChecked, setCashChecked] = React.useState<boolean>(true);
  const [upiChecked, setUpiChecked] = React.useState<boolean>(false);
  const [loadingOrder, setLoadingOrder] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [proofFile, setProofFile] = React.useState<any>(null);

  const shippedDate =
    orderDetail?.shippedOn ||
    orderDetail?.invoices?.[0]?.shippingDetails?.shippedOn;

  const routeInfo = orderDetail?.routeInfo || null;

  React.useEffect(() => {
    const init = async () => {
      if (!show || !orderId) return;
      reset({
        remarks: "",
        cashAmount: 0,
        upiAmount: 0,
        proofImg: "",
        transId: "",
      });
      setCashChecked(true);
      setUpiChecked(false);
      setProofFile(null);
      try {
        setLoadingOrder(true);
        const res = await OmsService.getSellerOrderDetail(orderId);
        const rawOrder = (res as any)?.data?.data || (res as any) || {};
        const formattedList = OmsService.formatOrderResponse([rawOrder]);
        const formattedOrder = formattedList?.[0] || rawOrder;
        setOrderDetail(formattedOrder);
        const payable = Math.round(
          formattedOrder?._payableAmt ?? formattedOrder?.orderAmount ?? 0,
        );
        setPayableAmount(payable);
        // Default full amount to cash when opening — unless PayLater, Prepaid or CoinStore
        const isPaylater = formattedOrder?.paymentMethod === "PAYLATER";
        const isPrepaid = formattedOrder?.paymentMethod === "PREPAID";
        const isCoinStore = formattedOrder?.isKcStore;
        if (isPaylater || isPrepaid || isCoinStore) {
          setCashChecked(false);
          setUpiChecked(false);
          setValue("cashAmount", 0);
          setValue("upiAmount", 0);
        } else {
          setCashChecked(true);
          setUpiChecked(false);
          setValue("cashAmount", payable);
          setValue("upiAmount", 0);
        }
      } catch (e) {
        setOrderDetail(null);
        setPayableAmount(0);
        setValue("cashAmount", 0);
        setValue("upiAmount", 0);
        setValue("proofImg", "");
        setValue("transId", "");
        setProofFile(null);
      } finally {
        setLoadingOrder(false);
      }
    };
    void init();
  }, [show, orderId, reset, setValue]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const onSubmit = async (data: {
    remarks: string;
    proofImg: string;
    transId: string;
  }) => {
    try {
      setSubmitting(true);

      const f = {
        ...data,
        cash: cashChecked ? Number(getValues("cashAmount") || 0) : 0,
        upi: upiChecked ? Number(getValues("upiAmount") || 0) : 0,
        cashChecked,
        upiChecked,
        proofImg: data.proofImg,
        transId: data.transId,
      };

      const payments: Array<any> = [];

      const isPaylater = orderDetail?.paymentMethod === "PAYLATER";
      const isPrepaid = orderDetail?.paymentMethod === "PREPAID";
      const isCoinStore = orderDetail?.isKcStore;

      if (isCoinStore) {
        payments.push({
          paymentMode: "COINSTORE",
          totalAmount: payableAmount,
          proofImage: [],
          refNo: "",
        });
      } else if (isPaylater) {
        payments.push({
          paymentMode: "PAYLATER",
          totalAmount: payableAmount,
          proofImage: [],
          refNo: "",
        });
      } else if (isPrepaid) {
        payments.push({
          paymentMode: "PREPAID",
          totalAmount: payableAmount,
          proofImage: [],
          refNo: "",
        });
      } else {
        if (f.cashChecked) {
          payments.push({
            paymentMode: "CASH",
            totalAmount: Number(f.cash),
            proofImage: [],
            refNo: "",
          });
        }

        if (f.upiChecked) {
          payments.push({
            paymentMode: "UPI",
            totalAmount: Number(f.upi),
            proofImage: proofFile?._id ? [proofFile._id] : [],
            refNo: f.transId || "",
          });
        }
      }

      const payload = {
        shipmentId: orderDetail?.invoices?.[0]?.shippingDetails?.shipmentId,
        status: "Delivered",
        paymentDetails: payments,
        proofOfDelivery: {
          remarks: f.remarks,
          // receivedBy: f.receivedBy,
        },
      };

      const response = await PosService.updateDeliverShipment(payload);

      if (response.statusCode === 200) {
        appToast.show({
          msg: response.data?.message || "Shipment updated successfully",
          color: "success",
        });
        callback({ action: "submit", data: payload });
      } else {
        appToast.show({
          msg: response.data?.message || "Failed to update shipment",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error updating shipment:", error);
      // You might want to show an error toast here
    } finally {
      setSubmitting(false);
    }
  };

  const clamp = (val: number) => {
    if (isNaN(val)) return 0;
    if (val < 0) return 0;
    if (val > payableAmount) return payableAmount;
    return val;
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(e.target.value || 0));
    setValue("cashAmount", value);
    const remaining = clamp(payableAmount - value);
    if (remaining > 0) {
      setUpiChecked(true);
      setValue("upiAmount", remaining);
    } else {
      setValue("upiAmount", 0);
      if (upiChecked) setUpiChecked(false);
    }
    setCashChecked(value > 0);
  };

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(e.target.value || 0));
    setValue("upiAmount", value);
    const remaining = clamp(payableAmount - value);
    if (remaining > 0) {
      setCashChecked(true);
      setValue("cashAmount", remaining);
    } else {
      setValue("cashAmount", 0);
      if (cashChecked) setCashChecked(false);
    }
    setUpiChecked(value > 0);
  };

  const handleCashToggle = (checked: boolean) => {
    const isChecked = Boolean(checked);
    setCashChecked(isChecked);
    if (isChecked) {
      const upiVal = Number(getValues("upiAmount") || 0);
      const val = clamp(payableAmount - upiVal);
      setValue("cashAmount", val);
      if (val === 0 && upiVal === 0) {
        // if both zero, set cash to full
        setValue("cashAmount", payableAmount);
      }
    } else {
      setValue("cashAmount", 0);
      // if UPI also unchecked, move full to UPI
      if (!upiChecked) {
        setUpiChecked(true);
        setValue("upiAmount", payableAmount);
      }
    }
  };

  const handleUpiToggle = (checked: boolean) => {
    const isChecked = Boolean(checked);
    setUpiChecked(isChecked);
    if (isChecked) {
      const cashVal = Number(getValues("cashAmount") || 0);
      const val = clamp(payableAmount - cashVal);
      setValue("upiAmount", val);
      if (val === 0 && cashVal === 0) {
        setValue("upiAmount", payableAmount);
      }
    } else {
      setValue("upiAmount", 0);
      if (!cashChecked) {
        setCashChecked(true);
        setValue("cashAmount", payableAmount);
      }
    }
  };

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[90vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold">{t("confirmDelivery")}</div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[90vh]">
        {orderDetail?.paymentMethod === "PAYLATER" && (
          <InfoBlock
            size="sm"
            className="tw:mb-4 tw:mt-4 tw:font-medium"
            bordered
          >
            <div className="tw:flex tw:items-center tw:gap-2">
              <InfoIcon size={16} />
              Payment for this order will be collected via PayLater.
            </div>
          </InfoBlock>
        )}

        {orderDetail?.paymentMethod === "PREPAID" && (
          <InfoBlock
            size="sm"
            className="tw:mb-4 tw:mt-4 tw:font-medium"
            bordered
          >
            <div className="tw:flex tw:items-center tw:gap-2">
              <InfoIcon size={16} />
              Payment for this order has already been collected (Prepaid).
            </div>
          </InfoBlock>
        )}

        {orderDetail?.isKcStore && (
          <InfoBlock
            size="sm"
            className="tw:mb-4 tw:mt-4 tw:font-medium"
            bordered
            variant="warning"
          >
            <span className="tw:font-bold tw:mr-2">Please Note:</span>
            <span>
              This is a{" "}
              <AppBadge variant={orderDetail._subTypeColor}>CoinStore</AppBadge>{" "}
              order. Customer has redeemed
              <span className="tw:font-bold tw:mx-1">
                {orderDetail.coinsRedeemed ?? 0} {t("coins")}
              </span>
              worth
              <span className="tw:font-bold tw:mx-1">
                {orderDetail.coinsRedeemedValue != null ? (
                  <Amount
                    value={orderDetail.coinsRedeemedValue}
                    decimalPlaces={2}
                  />
                ) : (
                  "0"
                )}
              </span>
              towards this order.
            </span>
          </InfoBlock>
        )}

        <div className="tw:bg-gray-50 tw:rounded tw:p-4 tw:mb-4 tw:text-sm">
          <div className="tw:mb-2 tw:flex tw:justify-between tw:gap-2">
            <span className="tw:font-medium">{t("orderId")}:</span>
            <span>{orderDetail?.orderRefNo}</span>
          </div>
          {orderDetail?.invoices?.[0] && (
            <div className="tw:mb-2 tw:flex tw:justify-between tw:gap-2">
              <span className="tw:font-medium">Invoice No.:</span>
              <span className="tw:flex tw:items-center tw:gap-2">
                {orderDetail?.invoices?.[0]?.invoiceNumber || "N/A"}
                {(orderDetail?.invoices?.[0]?.invoiceDocumentId ||
                  orderDetail?.invoices?.[0]?.invoiceNumber) && (
                  <>
                    <InvoiceDownload
                      invoiceNo={orderDetail?.invoices?.[0]?.invoiceNumber}
                      invoiceDocumentId={
                        orderDetail?.invoices?.[0]?.invoiceDocumentId
                      }
                    />
                    {orderDetail?.orderType === "B2C" && (
                      <PrintReceipt
                        orderId={orderId}
                        size="small"
                        onlyIcon={true}
                      />
                    )}
                  </>
                )}
              </span>
            </div>
          )}
          <div className="tw:mb-2 tw:flex tw:justify-between tw:gap-2">
            <span className="tw:font-medium">
              {orderDetail?.orderType === "B2B" ? t("retailer") : t("customer")}{" "}
              <AppBadge variant={orderDetail?._typeColor}>
                {orderDetail?.orderType}
              </AppBadge>
            </span>
            <span>{orderDetail?.customerInfo?.name}</span>
          </div>
          <div className="tw:flex tw:justify-between tw:gap-2">
            <span className="tw:font-medium">{t("orderedOn")}:</span>
            <span>
              <DateFormat value={orderDetail?.orderedDate} />
            </span>
          </div>
          {(routeInfo || shippedDate) && (
            <>
              {routeInfo && (
                <div className="tw:mt-2 tw:flex tw:justify-between tw:gap-2">
                  <span className="tw:font-medium">{t("route")}:</span>
                  <span className="tw:font-medium">
                    {routeInfo?.description || routeInfo?.routeCode || "-"}
                  </span>
                </div>
              )}

              {shippedDate && (
                <div className="tw:mt-2 tw:flex tw:justify-between tw:gap-2">
                  <span className="tw:font-medium">{t("shippedOn")}:</span>
                  <span>
                    <DateFormat value={shippedDate} />
                  </span>
                </div>
              )}

              {routeInfo?.deliveryDate && (
                <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                  <DateFormat
                    value={routeInfo.deliveryDate}
                    formatStr="dd MMM yyyy"
                  />
                </div>
              )}
            </>
          )}
        </div>
        {/* Payable amount highlight (hidden for KC coin redemptions) */}
        {orderDetail?.coinsRedeemedValue > 0 ? (
          <div className="tw:mb-4">
            <div className="tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded tw:py-2 tw:px-3 tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-1">
                <ImgRender
                  src="kingcoins/logo.png"
                  className="tw:h-5 tw:mr-1"
                />
                <span className="tw:text-emerald-800 tw:font-semibold tw:text-sm">
                  {t("redeemed")}
                </span>
              </div>
              <div className="tw:text-emerald-900 tw:font-bold tw:text-base">
                <Amount value={orderDetail.coinsRedeemedValue} />
              </div>
            </div>
          </div>
        ) : (
          <div className="tw:mb-4">
            <div className="tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded tw:py-2 tw:px-3 tw:flex tw:items-center tw:justify-between">
              <div className="tw:flex tw:items-center tw:gap-1">
                <IndianRupee className="tw:text-emerald-700 tw:w-5 tw:h-5" />
                <span className="tw:text-emerald-800 tw:font-semibold tw:text-sm">
                  {t("payableAmount")}
                </span>
              </div>
              <div className="tw:text-emerald-900 tw:font-bold tw:text-base">
                <Amount value={payableAmount} />
              </div>
            </div>
          </div>
        )}
        {loadingOrder ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-10">
            <AppSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Payment method selection */}
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
              {orderDetail?.paymentMethod !== "PAYLATER" &&
              orderDetail?.paymentMethod !== "PREPAID" &&
              !orderDetail?.isKcStore ? (
                <>
                  <div>
                    <AppCheckbox
                      name="cashChecked"
                      label={
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <span className="tw:font-medium">{t("cash")}</span>
                        </div>
                      }
                      value={cashChecked}
                      onChange={handleCashToggle}
                    />
                    <div className="tw:mt-2">
                      <AppInput
                        name="cashAmount"
                        type="number"
                        placeholder={t("enterCashAmount")}
                        register={register}
                        inputClassName="tw:text-right"
                        onChange={handleCashChange}
                      />
                    </div>
                  </div>
                  <div>
                    <AppCheckbox
                      name="upiChecked"
                      label={<span className="tw:font-medium">{t("upi")}</span>}
                      value={upiChecked}
                      onChange={handleUpiToggle}
                    />
                    <div className="tw:mt-2">
                      <AppInput
                        name="upiAmount"
                        type="number"
                        placeholder={t("enterUpiAmount")}
                        register={register}
                        inputClassName="tw:text-right"
                        onChange={handleUpiChange}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {orderDetail?.paymentMethod !== "PAYLATER" &&
              orderDetail?.paymentMethod !== "PREPAID" &&
              upiChecked && (
              <>
                <div className="tw:mt-2">
                  <AppInput
                    name="transId"
                    placeholder={t("transactionIdOptional")}
                    register={register}
                    label={t("transactionId")}
                  />
                </div>
                <div className="tw:mt-2 tw:mb-4">
                  <label className="tw:text-xs tw:font-medium tw:text-gray-700 tw:mb-2 tw:block">
                    {t("uploadProofImage")}
                  </label>
                  {!proofFile?._id && (
                    <FileUpload
                      onFileUpload={(r: any) => setProofFile(r)}
                      allowedExtensions={["jpg", "jpeg", "png"]}
                      maxSizeMB={10}
                      label={t("uploadProofImage")}
                    >
                      <div className="tw:border-2 tw:border-dashed tw:border-gray-300 tw:rounded-lg tw:p-3 tw:text-center tw:hover:border-gray-400 tw:transition-colors">
                        <Upload className="tw:mx-auto tw:h-6 tw:w-6 tw:text-gray-400 tw:mb-1" />
                        <p className="tw:text-xs tw:text-gray-600">
                          {t("uploadProofImage")}
                        </p>
                      </div>
                    </FileUpload>
                  )}
                  {proofFile?._id && (
                    <div className="tw:mt-2">
                      <FileUploadPreview
                        image={proofFile._id}
                        onRemove={() => setProofFile(null)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
            <div className="tw:mb-4">
              <AppTextarea
                label={t("deliveryRemarks")}
                name="remarks"
                register={register}
                error={errors.remarks?.message}
                placeholder={t("anyNotesAboutTheDeliveryOptional")}
                rows={4}
              />
            </div>
            <div className="tw:flex tw:justify-end tw:gap-2">
              <AppButton
                type="button"
                color="light"
                fill="outline"
                onClick={onClose}
                disabled={submitting}
              >
                {t("cancel")}
              </AppButton>
              <AppButton
                type="submit"
                color="dark"
                disabled={submitting}
                isLoading={submitting}
              >
                {submitting ? t("updating") : t("confirmDelivery")}
              </AppButton>
            </div>
          </form>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default MarkAsDeliveredModal;
