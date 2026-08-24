import { format } from "date-fns";
import {
  CheckCheck,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import ExpenseService from "~/services/ExpenseService";
import ExpenseCategorySearch from "~/shared/expense/components/category-search/ExpenseCategorySearch";
import ExpenseSubCategorySearch from "~/shared/expense/components/subcategory-search/ExpenseSubCategorySearch";
import ManageExpenseCategoryModal from "~/shared/expense/modals/manage-category/ManageExpenseCategoryModal";
import ManageExpenseSubCategoryModal from "~/shared/expense/modals/manage-subcategory/ManageExpenseSubCategoryModal";
import {
  emptyScanForm,
  mapScanToForm,
  submitScanExpense,
  validateScanExpense,
  type ScanFormData,
  type ScannedBill,
} from "./helper";

type Step = "upload" | "scanning" | "review" | "success";

type Props = {
  show: boolean;
  callback: (data: { action: "close" | "saved" }) => void;
};

const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
const MAX_SIZE_MB = 10;

const categoryFilters = {
  filter: {
    isActive: true,
  },
};

const AiScanModal = ({ show, callback }: Props) => {
  const { t } = useTranslation(["expense"]);
  const toast = useAppToast();

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [scannedExtras, setScannedExtras] = useState<ScannedBill | null>(null);
  const [form, setForm] = useState<ScanFormData>(emptyScanForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [manageCategoryModal, setManageCategoryModal] = useState(false);
  const [manageSubCategoryModal, setManageSubCategoryModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset everything whenever the modal is re-opened.
  useEffect(() => {
    if (show) {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // Revoke the object URL when it changes / on unmount to avoid leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const resetState = () => {
    setStep("upload");
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setScannedExtras(null);
    setForm(emptyScanForm);
    setIsSubmitting(false);
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    // Allow re-selecting the same file next time.
    e.target.value = "";
    if (!selected) return;

    const sizeInMB = selected.size / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      toast.show({
        msg: t("fileSizeExceedsMaxLimit", { maxSizeMB: MAX_SIZE_MB }),
        color: "warning",
      });
      return;
    }

    const ext = selected.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(ext)) {
      toast.show({
        msg: t("onlyAllowedFiles", {
          allowedExtensions: allowedExtensions.join(", "),
        }),
        color: "warning",
      });
      return;
    }

    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
    setFile(selected);
  };

  const handleScan = async () => {
    if (!file) {
      toast.show({ msg: t("pleaseUploadBill"), color: "error" });
      return;
    }

    setStep("scanning");
    try {
      const res = await ExpenseService.scanBill(file);
      if (
        (res.statusCode === 200 || res.statusCode === 201) &&
        res.data?.success
      ) {
        const data = (res.data.data || {}) as ScannedBill;
        setScannedExtras(data);
        setForm(mapScanToForm(data));
        setStep("review");
      } else {
        toast.show({
          msg: res.data?.message || t("somethingWentWrong"),
          color: "error",
        });
        setStep("upload");
      }
    } catch (err) {
      console.error(err);
      toast.show({ msg: t("somethingWentWrong"), color: "error" });
      setStep("upload");
    }
  };

  const handleCategoryChange = (data: { action: string; data?: any }) => {
    if (data.action === "add") {
      setForm((prev) => ({
        ...prev,
        category: [data.data],
        subCategory: [], // reset sub-category when category changes
      }));
    } else {
      setForm((prev) => ({ ...prev, category: [], subCategory: [] }));
    }
  };

  const handleSubCategoryChange = (data: { action: string; data?: any }) => {
    if (data.action === "add") {
      setForm((prev) => ({ ...prev, subCategory: [data.data] }));
    } else {
      setForm((prev) => ({ ...prev, subCategory: [] }));
    }
  };

  const handleManageCategoryCb = (data: { action: string; data?: any }) => {
    setManageCategoryModal(false);
    if (data.action === "success") {
      setForm((prev) => ({
        ...prev,
        category: [{ label: data.data.name, value: data.data.value }],
        subCategory: [],
      }));
    }
  };

  const handleManageSubCategoryCb = (data: { action: string; data?: any }) => {
    setManageSubCategoryModal(false);
    if (data.action === "success") {
      setForm((prev) => ({
        ...prev,
        subCategory: [{ label: data.data.name, value: data.data.value }],
      }));
    }
  };

  const openSubCategoryModal = () => {
    if (!form.category?.[0]?.value) {
      toast.show({ msg: t("pleaseSelectCategoryFirst"), color: "error" });
      return;
    }
    setManageSubCategoryModal(true);
  };

  const handleSubmit = async () => {
    const res = validateScanExpense(form, t);
    if (!res.status) {
      toast.show({ msg: res.msg, color: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitScanExpense(form);
      if (
        response &&
        (response.statusCode === 200 || response.statusCode === 201)
      ) {
        setStep("success");
        callback({ action: "saved" });
      } else {
        toast.show({ msg: t("somethingWentWrong"), color: "error" });
      }
    } catch (err) {
      console.error(err);
      toast.show({ msg: t("somethingWentWrong"), color: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => callback({ action: "close" });

  const modalCallback = (a: { action: string }) => {
    if (a.action === "close") handleClose();
  };

  return (
    <>
      <AppModal
        show={show}
        callback={modalCallback}
        className="tw:sm:max-w-2xl"
        isAutoHeight
      >
        <AppModal.Title onClose={handleClose}>
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className="tw:flex tw:items-center tw:justify-center tw:rounded-lg tw:bg-[#7c3aed]/10 tw:p-1.5 tw:text-[#7c3aed]">
              <Sparkles size={18} />
            </span>
            <span className="tw:font-semibold">{t("scanBillWithAi")}</span>
          </div>
        </AppModal.Title>

        <AppModal.Content>
          {/* Step 1 — Upload */}
          {step === "upload" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.webp"
                className="tw:hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="tw:relative tw:overflow-hidden tw:rounded-lg tw:border tw:border-border">
                  <img
                    src={previewUrl}
                    alt="bill preview"
                    className="tw:max-h-80 tw:w-full tw:object-contain tw:bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={resetState}
                    className="tw:absolute tw:right-2 tw:top-2 tw:flex tw:items-center tw:justify-center tw:rounded-full tw:bg-black/60 tw:p-1.5 tw:text-white hover:tw:bg-black/80"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handlePickFile}
                  className="tw:flex tw:w-full tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-md tw:border tw:border-dashed tw:border-border tw:bg-gray-50 tw:p-10 tw:text-center tw:transition-colors hover:tw:bg-gray-100"
                >
                  <ImageIcon size={36} className="tw:text-gray-500" />
                  <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                    {t("uploadBillImage")}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {`Allowed: ${allowedExtensions.join(
                      ", "
                    )} • Max: ${MAX_SIZE_MB} MB`}
                  </div>
                </button>
              )}
            </div>
          )}

          {/* Step 2 — Scanning */}
          {step === "scanning" && (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:py-12 tw:text-center">
              <span className="tw:flex tw:h-14 tw:w-14 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#7c3aed]/10 tw:text-[#7c3aed]">
                <Sparkles size={26} className="tw:animate-pulse" />
              </span>
              <div>
                <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                  {t("scanningBill")}
                </div>
                <div className="tw:mt-1 tw:text-xs tw:text-gray-500">
                  {t("aiReadingBill")}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === "review" && (
            <div>
              <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2 tw:rounded-md tw:bg-[#7c3aed]/8 tw:px-3 tw:py-2 tw:text-xs tw:text-[#5b21b6]">
                <Sparkles size={14} />
                <span>{t("reviewExtractedDetails")}</span>
              </div>

              <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
                <div>
                  <ExpenseCategorySearch
                    size="sm"
                    isRequired
                    label={t("category")}
                    value={form.category}
                    callback={handleCategoryChange}
                    filters={categoryFilters}
                  />
                  <AppButton
                    fill="clear"
                    type="button"
                    size="small"
                    className="tw:text-xs tw:text-gray-500 tw:!px-0"
                    onClick={() => setManageCategoryModal(true)}
                  >
                    <Plus size={16} />
                    {t("addCategory")}
                  </AppButton>
                </div>

                <div>
                  <ExpenseSubCategorySearch
                    size="sm"
                    isRequired
                    label={t("subCategory")}
                    value={form.subCategory}
                    callback={handleSubCategoryChange}
                    parentCategoryId={form.category?.[0]?.value || ""}
                    filters={categoryFilters}
                  />
                  <AppButton
                    fill="clear"
                    type="button"
                    size="small"
                    className="tw:text-xs tw:text-gray-500 tw:!px-0"
                    onClick={openSubCategoryModal}
                    noPadding
                  >
                    <Plus size={16} />
                    {t("addSubCategory")}
                  </AppButton>
                </div>

                <div>
                  <label className="tw:mb-1 tw:block tw:text-sm tw:font-medium tw:text-gray-700">
                    {t("amount")}
                    <span className="tw:text-red-500"> *</span>
                  </label>
                  <input
                    type="number"
                    value={form.amount ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        amount:
                          e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    placeholder={t("enterAmount")}
                    className="tw:w-full tw:rounded-md tw:border tw:border-border tw:px-3 tw:py-2 tw:text-sm focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-[#7c3aed]/40"
                  />
                </div>

                <div>
                  <AppDateInput
                    label={t("expenseDate")}
                    size="sm"
                    isRequired
                    value={
                      (Array.isArray(form.expenseDate)
                        ? form.expenseDate[0]
                        : form.expenseDate) ?? undefined
                    }
                    callback={(dt: Date | Date[]) =>
                      setForm((prev) => ({ ...prev, expenseDate: dt }))
                    }
                  />
                </div>

                <div className="tw:md:col-span-2">
                  <label className="tw:mb-1 tw:block tw:text-sm tw:font-medium tw:text-gray-700">
                    {t("description")}
                    <span className="tw:text-red-500"> *</span>
                  </label>
                  <textarea
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    rows={3}
                    maxLength={200}
                    placeholder={t("enterDescription")}
                    className="tw:w-full tw:rounded-md tw:border tw:border-border tw:px-3 tw:py-2 tw:text-sm focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-[#7c3aed]/40"
                  />
                </div>
              </div>

              {/* Extra AI context (read-only) */}
              {(scannedExtras?.recipient?.name ||
                previewUrl ||
                (scannedExtras as any)?.extraction) && (
                <div className="tw:mt-4 tw:flex tw:items-center tw:gap-3 tw:rounded-md tw:border tw:border-border tw:bg-gray-50 tw:p-3">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="bill"
                      className="tw:h-12 tw:w-12 tw:shrink-0 tw:rounded tw:object-cover"
                    />
                  )}
                  <div className="tw:min-w-0 tw:text-xs tw:text-gray-600">
                    {scannedExtras?.recipient?.name && (
                      <div className="tw:truncate">
                        <span className="tw:text-gray-400">
                          {t("recipient")}:{" "}
                        </span>
                        {scannedExtras.recipient.name}
                      </div>
                    )}
                    <div className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[#7c3aed]">
                      <Sparkles size={12} />
                      <span>{t("aiExtractedReviewBeforeSaving")}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Success */}
          {step === "success" && (
            <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:py-10 tw:text-center">
              <span className="tw:flex tw:h-16 tw:w-16 tw:items-center tw:justify-center tw:rounded-full tw:bg-green-100 tw:text-green-600">
                <CheckCircle2 size={34} />
              </span>
              <div>
                <div className="tw:text-base tw:font-semibold tw:text-gray-800">
                  {t("expenseSaved")}
                </div>
                <div className="tw:mt-1 tw:text-sm tw:text-gray-500">
                  {form.title || t("expenseRecordedSuccessfully")}
                </div>
              </div>
              {form.amount != null && (
                <div className="tw:rounded-md tw:bg-gray-50 tw:px-4 tw:py-2 tw:text-sm tw:text-gray-700">
                  {form.category?.[0]?.label
                    ? `${form.category[0].label} • `
                    : ""}
                  ₹{form.amount}
                  {(() => {
                    const dt = Array.isArray(form.expenseDate)
                      ? form.expenseDate[0]
                      : form.expenseDate;
                    return dt ? ` • ${format(dt, "dd MMM yyyy")}` : "";
                  })()}
                </div>
              )}
            </div>
          )}
        </AppModal.Content>

        <AppModal.Footer className="tw:justify-end tw:gap-2">
          {step === "upload" && (
            <>
              <AppButton fill="outline" color="medium" onClick={handleClose}>
                {t("cancel")}
              </AppButton>
              <AppButton color="primary" onClick={handleScan} disabled={!file}>
                <Sparkles size={18} />
                {t("scanBill")}
              </AppButton>
            </>
          )}

          {step === "review" && (
            <>
              <AppButton
                fill="outline"
                color="medium"
                onClick={resetState}
                disabled={isSubmitting}
              >
                {t("rescan")}
              </AppButton>
              <AppButton
                color="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
              >
                <CheckCheck />
                {t("save")}
              </AppButton>
            </>
          )}

          {step === "success" && (
            <>
              <AppButton fill="outline" color="medium" onClick={resetState}>
                {t("scanAnother")}
              </AppButton>
              <AppButton color="primary" onClick={handleClose}>
                {t("done")}
              </AppButton>
            </>
          )}
        </AppModal.Footer>
      </AppModal>

      <ManageExpenseCategoryModal
        show={manageCategoryModal}
        callback={handleManageCategoryCb}
        mode="add"
      />

      <ManageExpenseSubCategoryModal
        show={manageSubCategoryModal}
        callback={handleManageSubCategoryCb}
        mode="add"
        parentCategoryId={form.category?.[0]?.value || ""}
      />
    </>
  );
};

export default AiScanModal;
