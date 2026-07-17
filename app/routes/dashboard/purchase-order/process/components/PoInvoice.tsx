import { sub, subMonths } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
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
    const fileId = fileObj?._id || fileObj?.id || "";
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
    const fileId = fileObj?._id || fileObj?.id || "";
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
    <AppCard
      title={t("poInvoice.invoiceAndPaymentDetails")}
      className="tw:mb-6"
    >
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mb-6">
        <div className="tw:col-span-2 tw:md:col-span-1">
          <AppInput
            name="invoice.invoiceNumber"
            label={t("poInvoice.invoiceNumber")}
            register={register}
            placeholder={t("poInvoice.enterInvoiceNumber")}
            className="tw:mb-0 "
            isRequired
          />
        </div>
        <div>
          <AppDateInput
            label={t("poInvoice.invoiceDate")}
            callback={(date) => setValue("invoice.invoiceDate", date)}
            value={invoice?.invoiceDate}
            dateConfig={invoiceDateConfig}
            className="tw:mb-0"
            isRequired
          />
        </div>
        <div>
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
        <div className="tw:md:col-span-4 tw:col-span-1">
          <FileUpload
            label={t("poInvoice.uploadInvoice")}
            onFileUpload={onInvoiceFileUpload}
            allowedExtensions={["jpg", "jpeg", "png"]}
            note={<span>{t("poInvoice.onlyJpgJpegPngAllowed")}</span>}
          />
          {uploadedInvoiceFiles && uploadedInvoiceFiles.length > 0 && (
            <div className="tw:mt-2">
              <FileUploadedSlide
                images={uploadedInvoiceFiles}
                onRemove={handleRemoveInvoiceFile}
              />
            </div>
          )}
        </div>
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
          <div className="tw:md:col-span-4 tw:col-span-1">
            <FileUpload
              label={t("poInvoice.uploadPaymentProof")}
              onFileUpload={onPaymentFileUpload}
              allowedExtensions={["jpg", "jpeg", "png"]}
              note={<span>{t("poInvoice.onlyJpgJpegPngAllowed")}</span>}
            />
            {uploadedPaymentFiles && uploadedPaymentFiles.length > 0 && (
              <div className="tw:mt-2">
                <FileUploadedSlide
                  images={uploadedPaymentFiles}
                  onRemove={handleRemovePaymentFile}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </AppCard>
  );
};

export default PoInvoice;
