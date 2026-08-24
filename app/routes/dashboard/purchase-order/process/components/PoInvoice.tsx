import { sub, subMonths } from "date-fns";
import { ChevronDown, ChevronUp, Receipt } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import InvoiceImageUploader from "./InvoiceImageUploader";
import { AppSelect } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import { AppInput } from "~/components/core/form/AppInput";
import AppTab from "~/components/core/tab/AppTab";

const paymentDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { months: 4 }),
};

const invoiceDateConfig: DayPickerProps = {
  defaultMonth: new Date(),
  disabled: { after: new Date() },
  endMonth: new Date(),
  startMonth: sub(new Date(), { months: 4 }),
};

const PoInvoice: React.FC = () => {
  const { t } = useTranslation("common");
  const { control, setValue, register } = useFormContext();

  const tabItems = [
    { key: "UnPaid", name: t("poInvoice.toBePaid") },
    { key: "Paid", name: t("poInvoice.paid") },
  ];

  const paymentModes = [
    { label: t("poInvoice.cash"), value: "Cash" },
    { label: t("poInvoice.upi"), value: "UPI" },
    { label: t("poInvoice.card"), value: "Card" },
  ];

  const [invoice, paymentMode, uploadedInvoiceFiles, uploadedPaymentFiles] =
    useWatch({
      control,
      name: [
        "invoice",
        "invoice.paymentMode",
        "invoice.invoiceUpload",
        "invoice.paymentUpload",
      ],
    });

  // Set activeTab based on invoice.paymentStatus
  const [activeTab, setActiveTab] = useState(
    invoice?.paymentStatus || "UnPaid"
  );

  // Update form value when tab changes
  const handleTabChange = (tab: any) => {
    setActiveTab(tab.key);
    setValue("invoice.paymentStatus", tab.key);
  };

  // Add uploaded file to invoice array
  const onInvoiceFileUpload = (fileObj: any) => {
    const fileId = fileObj?._id || "";
    if (!fileId) return;
    setValue(
      "invoice.invoiceUpload",
      [...(uploadedInvoiceFiles || []), { id: fileId }],
      { shouldValidate: true }
    );
  };

  // Remove invoice file by index
  const handleRemoveInvoiceFile = (index: number) => {
    const newFiles = [...(uploadedInvoiceFiles || [])];
    newFiles.splice(index, 1);
    setValue("invoice.invoiceUpload", newFiles, { shouldValidate: true });
  };

  // Add uploaded file to payment array
  const onPaymentFileUpload = (fileObj: any) => {
    const fileId = fileObj?._id || "";
    if (!fileId) return;
    setValue(
      "invoice.paymentUpload",
      [...(uploadedPaymentFiles || []), { id: fileId }],
      { shouldValidate: true }
    );
  };

  // Remove payment file by index
  const handleRemovePaymentFile = (index: number) => {
    const newFiles = [...(uploadedPaymentFiles || [])];
    newFiles.splice(index, 1);
    setValue("invoice.paymentUpload", newFiles, { shouldValidate: true });
  };

  return (
    // Stays inside the page gutter so it reads as the last bubble in the thread
    // the product rows above form, rather than a full-bleed sheet.
    <AppCard
      title={t("poInvoice.invoiceAndPaymentDetails")}
      icon={<Receipt className="tw:w-4 tw:h-4 tw:text-primary" />}
      className="app-msg-bubble tw:mb-6"
    >
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-4">
        <AppInput
          name="invoice.invoiceNumber"
          label={t("poInvoice.invoiceNumber")}
          register={register}
          placeholder={t("poInvoice.enterInvoiceNumber")}
          className="tw:mb-0"
          isRequired
        />
        <AppDateInput
          label={t("poInvoice.invoiceDate")}
          callback={(date) => setValue("invoice.invoiceDate", date)}
          value={invoice?.invoiceDate}
          dateConfig={invoiceDateConfig}
          className="tw:mb-0"
          isRequired
        />
        <AppInput
          name="invoice.amount"
          label={t("poInvoice.invoiceValue")}
          register={register}
          placeholder={t("poInvoice.enterInvoiceValue")}
          className="tw:mb-0"
          type="number"
          isRequired
        />
      </div>

      {/* The attachment sits below a hairline so the form fields above read as
          one block and the drop zone as its own step. */}
      <div className="tw:mt-5 tw:pt-5 tw:border-t tw:border-border">
        <InvoiceImageUploader
          label={t("poInvoice.invoiceCopy")}
          files={uploadedInvoiceFiles}
          onFileUpload={onInvoiceFileUpload}
          onRemove={handleRemoveInvoiceFile}
        />
      </div>
      {/* <AppTab
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        variant="tabs"
        className="tw:mb-6"
      /> */}
      {activeTab === "Paid" && (
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4 tw:mb-6 tw:hidden">
          <div>
            <Controller
              control={control}
              name="invoice.paymentMode"
              render={({ field }) => (
                <AppSelect
                  label={t("poInvoice.paymentMode")}
                  options={paymentModes}
                  placeholder={t("poInvoice.selectPaymentMode")}
                  className="tw:mb-0"
                  onChange={field.onChange}
                  value={field.value}
                  inputClassName="tw:w-full"
                  isRequired
                />
              )}
            />
          </div>
          <div>
            <AppDateInput
              label={t("poInvoice.paymentDate")}
              callback={(date) => setValue("invoice.paymentDate", date)}
              value={invoice?.paymentDate}
              size="sm"
              placeholder={t("poInvoice.selectPaymentDate")}
              dateConfig={paymentDateConfig}
              className="tw:mb-0"
              isRequired
            />
          </div>
          <div>
            <AppInput
              name="invoice.referenceNumber"
              label={t("poInvoice.referenceNumber")}
              register={register}
              isRequired={paymentMode !== "Cash"}
              placeholder={t("poInvoice.enterReferenceNumber")}
              className="tw:mb-0"
            />
          </div>
          <div>
            <AppInput
              name="invoice.amount"
              label={t("poInvoice.amount")}
              register={register}
              isRequired
              placeholder={t("poInvoice.enterAmount")}
              className="tw:mb-0"
              type="number"
            />
          </div>
          <div className="tw:col-span-2 tw:md:col-span-4">
            <InvoiceImageUploader
              label={t("poInvoice.uploadPaymentProof")}
              files={uploadedPaymentFiles}
              onFileUpload={onPaymentFileUpload}
              onRemove={handleRemovePaymentFile}
            />
          </div>
        </div>
      )}
    </AppCard>
  );
};

export default PoInvoice;
