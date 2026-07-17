import clsx from "clsx";
import { useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppSwiper from "~/components/core/swiper";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import PaylaterStatusModal from "../modals/PaylaterStatusModal";
import Amount from "~/components/core/amount/Amount";
import type { SelectedPaymentType } from "../types";
import PrepaidInfoModal from "~/shared/configs/modals/PrepaidInfoModal";
import { Pencil } from "lucide-react";

const swiperConfig: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 10,
};

const PaymentMode = ({
  payments,
  orderAmount,
  selectedPayment,
  callback,
  sellerName,
  sellerFid,
}: {
  payments: any[];
  orderAmount?: number;
  selectedPayment?: SelectedPaymentType;
  callback: (a: { action: string; data: any }) => void;
  sellerName?: string | null;
  sellerFid?: string | null;
}) => {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const [prepaidModal, setPrepaidModal] = useState({ show: false, data: [] });
  const [paylaterModal, setPaylaterModal] = useState({
    show: false,
    status: null as string | null,
    sellerName: null as string | null,
    availableBalance: null as number | null,
    fid: null as string | null,
  });

  const prepaidConfig = (payments || []).find(
    (p) => (p?.type || "").toString().toLowerCase() === "prepaid",
  );
  const prepaidOptions = prepaidConfig?.paymentMethodConfig || [];

  const handlePrepaidModalCallback = (a: { action: string; data: any }) => {
    if (a.action === "close") {
      setPrepaidModal({ show: false, data: [] });
      return;
    }

    if (a.action === "submit") {
      setPrepaidModal({ show: false, data: [] });
      const formData = a.data || {};
      const paymentMethod = formData.paymentMethod || {};

      const methodId =
        paymentMethod.refCode ||
        paymentMethod.value ||
        paymentMethod.paymentMethod ||
        paymentMethod.displayName ||
        "";
      const methodLabel =
        paymentMethod.displayName ||
        paymentMethod.merchantName ||
        paymentMethod.name ||
        paymentMethod.paymentMethod ||
        "PREPAID";

      const paymentMode = {
        type: methodLabel,
        amount: Number(formData.amount) || orderAmount || 0,
        referenceNumber: formData.transactionId || "",
        proof: (formData.images || []).map((i: any) => i.id || i) || [],
        remarks: formData.remarks || "",
        paidVia: paymentMethod.paymentMethod || methodLabel,
        methodId,
      } as any;

      const selected = {
        paymentType: "PREPAID",
        paymentMethod: "PREPAID",
        paymentMode,
      };

      callback({ action: "selectPayment", data: { payment: selected } });
    }
  };

  const openPrepaidModal = () => {
    setPrepaidModal({ show: true, data: [] });
  };

  const handlePaymentModeChange = (type: string) => {
    if ((type || "").toLowerCase() === "prepaid") {
      openPrepaidModal();
      return;
    }

    const t = (type || "").toLowerCase();

    // Handle Paylater selection specially
    if (t === "paylater") {
      const pay = (payments || []).find(
        (p) => (p.type || "").toString().toLowerCase() === "paylater",
      );

      const statusRaw = pay?.status || "";
      const availableBalance = pay.availableBalance || 0;

      // Use raw API statuses: "Approved", "NOT_AVAILABLE", "Pending"
      // If not available or pending -> show modal
      if (statusRaw === "NOT_AVAILABLE" || statusRaw === "Pending") {
        setPaylaterModal({
          show: true,
          status: statusRaw,
          sellerName: sellerName || null,
          availableBalance: pay?.availableBalance || null,
          fid: sellerFid || null,
        });
        return;
      }

      // If Approved and has available balance -> treat like prepaid selection
      if (statusRaw === "Approved" && Number(availableBalance) > 0) {
        const paymentMode = {
          type: "PAYLATER",
          amount: orderAmount || 0,
          referenceNumber: "",
          proof: [],
          remarks: "",
        };

        const selected = {
          paymentType: "PAYLATER",
          paymentMethod: "PAYLATER",
          paymentMode,
        };

        callback({ action: "selectPayment", data: { payment: selected } });
        return;
      }
      // If Approved but no sufficient balance -> show insufficient-balance modal
      if (statusRaw === "Approved" && Number(availableBalance) <= 0) {
        setPaylaterModal({
          show: true,
          status: statusRaw,
          sellerName: sellerName || null,
          availableBalance: pay?.availableBalance ?? null,
          fid: sellerFid || null,
        });
        return;
      }

      // Default fallback: show status modal for any other statuses
      setPaylaterModal({
        show: true,
        status: statusRaw || null,
        sellerName: sellerName || null,
        availableBalance: pay?.availableBalance || null,
        fid: sellerFid || null,
      });
      return;
    }

    // Non-prepaid selection -> inform parent via callback
    const paymentType = (type || "").toUpperCase();
    const paymentMode = {
      type: type || paymentType,
      amount: orderAmount || 0,
      referenceNumber: "",
      proof: [],
      remarks: "",
    };

    const selected = {
      paymentType,
      paymentMethod: paymentType,
      paymentMode,
    };

    callback({ action: "selectPayment", data: { payment: selected } });
  };

  if (payments?.length === 0) {
    return null;
  }

  return (
    <>
      <div className="tw:text-xs tw:font-medium tw:mb-2">
        Choose Payment Mode
      </div>
      <AppSwiper config={swiperConfig}>
        {payments?.map((payment) => (
          <AppSwiper.Slide key={payment._id} isAutoWidth={true}>
            <div
              className="tw:flex tw:items-center tw:justify-between tw:gap-2 tw:cursor-pointer"
              onClick={() => handlePaymentModeChange(payment.type)}
            >
              <div
                className={clsx(
                  "tw:text-xs tw:font-medium tw:border tw:border-gray-200 tw:rounded-lg tw:px-2 tw:py-1",
                  // active if passed selectedPayment matches this payment
                  selectedPayment &&
                    (selectedPayment.paymentType || "").toLowerCase() ===
                      (payment.type || "").toLowerCase()
                    ? "tw:bg-primary tw:text-white"
                    : "tw:bg-white tw:text-gray-500",
                )}
              >
                {payment.type.toUpperCase()}
              </div>
            </div>
          </AppSwiper.Slide>
        ))}
      </AppSwiper>

      {selectedPayment &&
        ["PREPAID", "PAYLATER"].includes(
          (selectedPayment.paymentType || "").toUpperCase(),
        ) &&
        selectedPayment.paymentMode && (
          <div className="tw:mt-2 tw:p-1.5 tw:bg-primary/5 tw:border tw:border-primary/20 tw:rounded-md tw:flex tw:items-center tw:gap-1.5 tw:flex-wrap">
            <div className="tw:text-xs tw:font-semibold tw:text-primary tw:bg-primary/10 tw:px-1.5 tw:py-0.5 tw:rounded">
              {(selectedPayment.paymentMode.type as string) ||
                selectedPayment.paymentMethod ||
                "Prepaid"}
            </div>
            <div className="tw:text-xs tw:text-primary tw:font-medium">
              {typeof selectedPayment.paymentMode.amount === "number" ? (
                <Amount value={selectedPayment.paymentMode.amount} />
              ) : (
                "-"
              )}
            </div>
            {selectedPayment.paymentMode.referenceNumber && (
              <div className="tw:text-xs tw:text-gray-500">
                Ref: {selectedPayment.paymentMode.referenceNumber}
              </div>
            )}
            {(selectedPayment.paymentMode as any).proof &&
              (selectedPayment.paymentMode as any).proof.length > 0 && (
                <div className="tw:text-xs tw:text-gray-500">
                  Proof: {(selectedPayment.paymentMode as any).proof.length}{" "}
                  file
                  {(selectedPayment.paymentMode as any).proof.length > 1
                    ? "s"
                    : ""}
                </div>
              )}
            {(selectedPayment.paymentType || "").toUpperCase() === "PREPAID" && (
              <button
                type="button"
                onClick={openPrepaidModal}
                className="tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-semibold tw:text-primary hover:tw:text-primary/80"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
            {(selectedPayment.paymentType || "").toUpperCase() ===
              "PAYLATER" && (
              <div className="tw:text-[10px] tw:text-primary tw:font-bold tw:bg-primary/10 tw:px-1.5 tw:py-0.5 tw:rounded tw:ml-auto">
                Limit:{" "}
                <Amount
                  value={
                    (payments || []).find(
                      (p) => (p.type || "").toLowerCase() === "paylater",
                    )?.availableBalance ?? 0
                  }
                />
              </div>
            )}
          </div>
        )}

      <PrepaidInfoModal
        show={prepaidModal.show}
        clientOnly
        paymentOptions={prepaidOptions as any}
        orderAmount={orderAmount}
        callback={handlePrepaidModalCallback}
        initialValues={
          selectedPayment &&
          (selectedPayment.paymentType || "").toUpperCase() === "PREPAID"
            ? {
                transactionId:
                  selectedPayment.paymentMode?.referenceNumber || "",
                remarks: selectedPayment.paymentMode?.remarks || "",
                images: (selectedPayment.paymentMode?.proof || []).map(
                  (id: any) => ({ id }),
                ),
                amount: selectedPayment.paymentMode?.amount,
                paymentMethodId:
                  (selectedPayment.paymentMode as any)?.methodId || "",
              }
            : undefined
        }
      />

      <PaylaterStatusModal
        show={paylaterModal.show}
        status={paylaterModal.status || undefined}
        sellerName={paylaterModal.sellerName || undefined}
        availableBalance={paylaterModal.availableBalance ?? undefined}
        callback={(a: { action: string; data: any }) => {
          // close modal
          if (a.action === "close") {
            setPaylaterModal({
              show: false,
              status: null,
              sellerName: null,
              availableBalance: null,
              fid: null,
            });
            return;
          }

          if (a.action === "request") {
            // navigate to paylater request page with fid in query
            const fid = paylaterModal.fid || null;
            setPaylaterModal({
              show: false,
              status: null,
              sellerName: null,
              availableBalance: null,
              fid: null,
            });
            if (fid) {
              appNav.to("/dashboard/paylater/request", { fid });
            } else {
              // fallback: open request page without fid
              appNav.to("/dashboard/paylater/request");
            }
            return;
          }
          // propagate topup action upstream
          if (a.action === "topup") {
            setPaylaterModal({
              show: false,
              status: null,
              sellerName: null,
              availableBalance: null,
              fid: null,
            });
            callback({ action: "topup", data: {} });
          }
        }}
      />
    </>
  );
};

export default PaymentMode;
