import { useEffect } from "react";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { AppInput } from "~/components/core/form/AppInput";
import AppButton from "~/components/core/button/AppButton";
import type { InvoiceInfo } from "../types";

interface FormShape {
  invoiceNumber: string;
  invoiceDate: string;
  poNumber: string;
  placeOfSupply: string;
  referenceNumber: string;
}

interface EditInvoiceModalProps {
  show: boolean;
  invoice: InvoiceInfo;
  callback: (params: { action: string; data?: InvoiceInfo }) => void;
}

const EditInvoiceModal = ({
  show,
  invoice,
  callback,
}: EditInvoiceModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormShape>({
    defaultValues: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      poNumber: invoice.poNumber,
      placeOfSupply: invoice.placeOfSupply,
      referenceNumber: invoice.referenceNumber,
    },
  });

  useEffect(() => {
    if (show) {
      reset({
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        poNumber: invoice.poNumber,
        placeOfSupply: invoice.placeOfSupply,
        referenceNumber: invoice.referenceNumber,
      });
    }
  }, [show, invoice, reset]);

  const onSubmit = (data: FormShape) => {
    const payload: InvoiceInfo = {
      ...invoice,
      ...data,
    };
    callback({ action: "submit", data: payload });
  };

  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:max-w-lg">
      <AppModal.Title onClose={handleClose}>Edit Invoice Details</AppModal.Title>
      <AppModal.Content>
        <form
          id="edit-invoice-form"
          onSubmit={handleSubmit(onSubmit)}
          className="tw:space-y-3"
        >
          <AppInput
            name="invoiceNumber"
            label="Invoice Number"
            register={register}
            rules={{ required: "Invoice number is required" }}
            error={errors.invoiceNumber?.message}
            isRequired
          />
          <AppInput
            name="invoiceDate"
            label="Invoice Date"
            register={register}
            error={errors.invoiceDate?.message}
          />
          <AppInput
            name="poNumber"
            label="PO Number"
            register={register}
            error={errors.poNumber?.message}
          />
          <AppInput
            name="placeOfSupply"
            label="Place of Supply"
            register={register}
            error={errors.placeOfSupply?.message}
          />
          <AppInput
            name="referenceNumber"
            label="Reference Number"
            register={register}
            error={errors.referenceNumber?.message}
          />
        </form>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton size="small" color="light" onClick={handleClose}>
            Cancel
          </AppButton>
          <AppButton
            size="small"
            color="primary"
            type="submit"
            form="edit-invoice-form"
          >
            Save
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default EditInvoiceModal;
