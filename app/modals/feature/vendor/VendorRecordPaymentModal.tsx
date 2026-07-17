import { Building2, CreditCard } from "lucide-react";
import React, { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import VendorService from "~/services/VendorService";
import PaymentSummary from "./components/PaymentSummary";
import UnpaidList from "./components/unpaid-list/UnpaidList";
import VendorPaymentForm from "./components/VendorPaymentForm";

type VendorRecordPaymentModalProps = {
  show: boolean;
  callback: (a: { action: string; data: any }) => void;
  vendorId: string;
  vendorName: string;
};

type FormData = {
  paymentMethod: string;
  paymentDate: Date;
  paymentAmount: number;
  paymentNotes: string;
  paymentRefNo: string;
  selectedOrders: any[];
  totalAmount: number;
  proofs: any[];
};

const VendorRecordPaymentModal: React.FC<VendorRecordPaymentModalProps> = ({
  show,
  callback,
  vendorId,
  vendorName,
}) => {
  const appToast = useAppToast();

  const formMethods = useForm<FormData>({
    defaultValues: {
      paymentMethod: "Cash",
      paymentDate: new Date(),
      paymentAmount: 0,
      paymentNotes: "",
      paymentRefNo: "",
      selectedOrders: [],
      totalAmount: 0,
      proofs: [],
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const [selectedOrders, totalAmount] = useWatch({
    control: formMethods.control,
    name: ["selectedOrders", "totalAmount"],
  });

  useEffect(() => {
    if (show) {
      formMethods.reset();
    }
  }, [show]);

  const handleClose = () => {
    callback({ action: "close", data: {} });
  };

  const handlePaymentSuccess = () => {
    callback({
      action: "close",
      data: { paymentSuccess: true, selectedOrders: selectedOrders },
    });
  };

  const unpaidListCallback = (a: { action: string; data: any }) => {
    if (a.action === "select-order") {
      formMethods.setValue("selectedOrders", a.data);
      const total = Array.isArray(a.data)
        ? a.data.reduce((acc: number, curr: any) => {
            const v = Number(curr?.payableAmount ?? 0);
            return acc + (isNaN(v) ? 0 : v);
          }, 0)
        : 0;
      formMethods.setValue("totalAmount", total);
    }
  };

  const handleRecordPayment = async () => {
    if (!Array.isArray(selectedOrders) || selectedOrders.length === 0) {
      appToast.show({
        msg: "Please select at least one order",
        color: "error",
      });
      return;
    }

    setSubmitting(true);
    const formData = formMethods.getValues();

    const results: Array<any> = [];

    for (const ord of selectedOrders) {
      const poId = ord?._id || ord?.id || ord?.poId;
      if (!poId) {
        results.push({ statusCode: 400, data: { message: "Invalid PO id" } });
        continue;
      }

      // Determine amount for this PO defensively
      const amount = Number(ord?.payableAmount ?? 0);

      const payload = {
        amount: isNaN(amount) ? 0 : amount,
        paymentMode: formData.paymentMethod,
        referenceNo: formData.paymentRefNo,
        paymentDate: formData.paymentDate
          ? new Date(formData.paymentDate).toISOString()
          : new Date().toISOString(),
        remarks: formData.paymentNotes,
        proofs: formData.proofs.map((proof: any) => proof.id),
      };

      // Call service for each PO individually
      try {
        // VendorService.recordPayment expects (poId, data)
        // eslint-disable-next-line no-await-in-loop
        const resp = await VendorService.recordPayment(poId, payload);
        results.push(resp);
      } catch (err: any) {
        results.push({
          statusCode: 500,
          data: { message: err?.message || "Request failed" },
        });
      }
    }

    setSubmitting(false);

    const failed = results.filter((r) => r?.statusCode !== 200);
    if (failed.length === 0) {
      appToast.show({
        msg: `Successfully recorded payment of ₹${totalAmount.toFixed(2)} for ${
          selectedOrders.length
        } order${selectedOrders.length > 1 ? "s" : ""}`,
        color: "success",
      });
      handlePaymentSuccess();
    } else if (failed.length === results.length) {
      appToast.show({
        msg: failed[0]?.data?.message || "Something went wrong",
        color: "error",
      });
    } else {
      appToast.show({
        msg: `${failed.length} of ${results.length} payments failed`,
        color: "warning",
      });
      handleClose();
    }
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:!max-w-4xl tw:max-h-[95vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold tw:flex tw:items-center tw:gap-2">
          <Building2 className="tw:w-5 tw:h-5" />
          Record Payment - {vendorName}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
          {/* Unpaid List Section */}
          <div>
            <UnpaidList callback={unpaidListCallback} vendorId={vendorId} />
          </div>
          {/* Payment Form Section with border and title */}
          <div>
            <div className="tw:border tw:rounded tw:p-6 tw:bg-white tw:mb-6">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                <CreditCard className="tw:w-5 tw:h-5" />
                <span className="tw:text-sm tw:font-medium">
                  Payment Information
                </span>
              </div>

              <FormProvider {...formMethods}>
                <VendorPaymentForm />
              </FormProvider>
            </div>

            <PaymentSummary
              selectedOrders={selectedOrders.length}
              totalOrders={selectedOrders.length}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer className="tw:border-t tw:pt-4">
        <div className="tw:text-end tw:flex tw:items-center tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            color="success"
            onClick={handleRecordPayment}
            isLoading={submitting}
          >
            Record Payment <Amount value={totalAmount} decimalPlaces={2} />
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default VendorRecordPaymentModal;
