import { CheckCheck, Plus, Image as ImageIcon } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import ExpenseCategorySearch from "~/shared/expense/components/category-search/ExpenseCategorySearch";
import ExpenseSubCategorySearch from "~/shared/expense/components/subcategory-search/ExpenseSubCategorySearch";
import ManageExpenseCategoryModal from "~/shared/expense/modals/manage-category/ManageExpenseCategoryModal";
import ManageExpenseSubCategoryModal from "~/shared/expense/modals/manage-subcategory/ManageExpenseSubCategoryModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import type { FormData } from "./helper";
import {
  defaultFormData,
  prepareExpensePayload,
  submitExpense,
  validateExpense,
} from "./helper";

const defaultBreadcrumbs: BreadcrumbItem[] = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "Expenses", redirect: { path: "/dashboard/expenses/list" } },
  { label: "Manage Expense" },
];

const categoryFilters = {
  filter: {
    isActive: true,
  },
};

const allowedExtensions = ["jpg", "jpeg", "png"];

type ManageExpenseProps = {
  onSaved?: () => void;
};

const ManageExpense = ({ onSaved }: ManageExpenseProps) => {
  const { t } = useTranslation(["expense"]);

  const toast = useAppToast();
  const nav = useAppNav();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, setValue, getValues, reset } =
    useForm<FormData>({
      defaultValues: defaultFormData,
    });

  const [manageCategoryModal, setManageCategoryModal] = useState({
    show: false,
    data: null,
  });

  const [manageSubCategoryModal, setManageSubCategoryModal] = useState({
    show: false,
    data: null,
  });

  const category = useWatch({ control, name: "category" });
  const receipt = useWatch({ control, name: "receipt" });

  const onSubmit = async (data: FormData) => {
    // Run field-by-field validation before proceeding
    const res = validateExpense(data as any, t);
    if (!res.status) {
      toast.show({ msg: res.msg, color: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitExpense(data as FormData);
      // Expecting 200/201 on success
      if (
        response &&
        (response.statusCode === 200 || response.statusCode === 201)
      ) {
        toast.show({ msg: t("expenseSaved"), color: "success" });
        // reset the form to defaults
        try {
          reset(defaultFormData);
        } catch (e) {
          // ignore reset errors
          console.warn("Failed to reset expense form", e);
        }
        // inform parent to refresh recent expenses
        if (typeof onSaved === "function") {
          try {
            onSaved();
          } catch (e) {
            console.warn("onSaved callback threw an error", e);
          }
        }
      } else {
        toast.show({ msg: t("somethingWentWrong"), color: "error" });
      }
    } catch (err) {
      console.error(err);
      toast.show({
        msg: t("somethingWentWrong"),
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // AppAlertDialog state
  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title?: React.ReactNode | string;
    description?: React.ReactNode | string;
    onConfirm?: () => void;
    onCancel?: () => void;
    okText?: string;
    cancelText?: string;
    type?: "alert" | "confirm";
  }>({ show: false });

  // Wrapper to show confirmation before actual submit
  const handleSubmitClick = async (data: FormData) => {
    // Run field-by-field validation before showing confirm
    const res = validateExpense(data as any, t);
    if (!res.status) {
      toast.show({ msg: res.msg, color: "error" });
      return;
    }

    setAppAlertDialog({
      show: true,
      title: t("pleaseConfirm") || "Please confirm",
      description: t("areYouSureYouWantToSaveExpense") || t("pleaseConfirm"),
      type: "confirm",
      okText: t("confirm") || "Confirm",
      cancelText: t("cancel") || "Cancel",
      onConfirm: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        // call original submit logic
        await onSubmit(data);
      },
      onCancel: () => setAppAlertDialog((prev) => ({ ...prev, show: false })),
    });
  };

  const handleManageCategoryCb = (data: { action: string; data?: any }) => {
    setManageCategoryModal({ show: false, data: null });

    if (data.action === "success") {
      setValue("category", [
        {
          label: data.data.name,
          value: data.data.value,
        },
      ]);
    }
  };

  const handleManageSubCategoryCb = (data: { action: string; data?: any }) => {
    setManageSubCategoryModal({ show: false, data: null });
    if (data.action === "success") {
      setValue("subCategory", [
        {
          label: data.data.name,
          value: data.data.value,
        },
      ]);
    }
  };

  const openCategoryModal = () => {
    setManageCategoryModal({ show: true, data: null });
  };

  const openSubCategoryModal = () => {
    if (!category?.[0]?.value) {
      toast.show({ msg: t("pleaseSelectCategoryFirst"), color: "error" });
      return;
    }
    setManageSubCategoryModal({ show: true, data: null });
  };

  const handleCategoryChange = (data: { action: string; data?: any }) => {
    if (data.action === "add") {
      setValue("category", [data.data]);
      // clear subCategory whenever category changes to a new selection
      setValue("subCategory", []);
    } else {
      setValue("category", []);
      // when category is removed, also clear selected subCategory
      setValue("subCategory", []);
    }
  };

  const handleSubCategoryChange = (data: { action: string; data?: any }) => {
    if (data.action === "add") {
      setValue("subCategory", [data.data]);
    } else {
      setValue("subCategory", []);
    }
  };

  const handleReceiptUpload = (res: any) => {
    const currentReceipt = getValues("receipt");
    setValue("receipt", [...(currentReceipt || []), { id: res._id }]);
  };

  const handleReceiptRemove = (index: number) => {
    const currentReceipt = getValues("receipt");
    const newReceipt = currentReceipt?.filter(
      (item: any, i: number) => i !== index,
    );
    setValue("receipt", newReceipt);
  };

  return (
    <>
      <AppCard
        title={t("expenseDetails")}
        subtitle="Enter the details of the expense below."
      >
        <form onSubmit={handleSubmit(handleSubmitClick)} className="tw:mt-2">
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-6">
            <div>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <ExpenseCategorySearch
                    size="sm"
                    isRequired={true}
                    label={t("category")}
                    value={field.value}
                    callback={handleCategoryChange}
                    filters={categoryFilters}
                  />
                )}
              />
              <AppButton
                fill="clear"
                type="button"
                size="small"
                className="tw:text-xs tw:text-gray-500 tw:!px-0"
                onClick={openCategoryModal}
              >
                <Plus size={16} />
                {t("addCategory")}
              </AppButton>
            </div>

            <div>
              <Controller
                control={control}
                name="subCategory"
                render={({ field }) => (
                  <ExpenseSubCategorySearch
                    size="sm"
                    isRequired={true}
                    label={t("subCategory")}
                    value={field.value}
                    callback={handleSubCategoryChange}
                    parentCategoryId={category?.[0]?.value || ""}
                    filters={categoryFilters}
                  />
                )}
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

            <AppInput
              name="amount"
              label={t("amount")}
              placeholder={t("enterAmount")}
              register={register}
              type="number"
              isRequired={true}
            />

            <div>
              <Controller
                control={control}
                name="expenseDate"
                render={({ field }) => (
                  <AppDateInput
                    label={t("expenseDate")}
                    value={field.value ?? undefined}
                    callback={(dt: any) => field.onChange(dt)}
                    isRequired={true}
                  />
                )}
              />
            </div>

            <div className="tw:col-span-1 tw:md:col-span-2">
              <AppTextarea
                name="title"
                label={t("description")}
                placeholder={t("enterDescription")}
                register={register}
                rows={4}
                isRequired={true}
                maxLength={200}
              />
              <div className="tw:text-xs tw:text-gray-500">
                {t("maxLength")} 200
              </div>
            </div>

            <div className="tw:col-span-1 tw:md:col-span-2">
              <FileUpload
                label={t("receipt")}
                onFileUpload={handleReceiptUpload}
                maxSizeMB={10}
                allowedExtensions={allowedExtensions}
              >
                <div className="tw:border tw:border-dashed tw:rounded-md tw:p-6 tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:gap-2 tw:bg-gray-50 hover:tw:bg-gray-100 tw:transition-colors">
                  <ImageIcon size={32} className="tw:text-gray-500" />
                  <div className="tw:text-sm tw:text-gray-600">
                    {t("uploadReceipt")}
                  </div>
                  <div className="tw:text-xs tw:text-gray-500">
                    {`Allowed: ${allowedExtensions.join(", ")} • Max: 10 MB`}
                  </div>
                </div>
              </FileUpload>
              {receipt && receipt.length > 0 && (
                <div className="tw:mt-3">
                  <FileUploadedSlide
                    images={receipt}
                    onRemove={handleReceiptRemove}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="tw:flex tw:justify-end tw:gap-2">
            <AppButton
              fill="outline"
              color="medium"
              onClick={() => window.history.back()}
            >
              {t("cancel")}
            </AppButton>

            <AppButton type="submit" color="primary" isLoading={isSubmitting}>
              <CheckCheck />
              {t("save")}
            </AppButton>
          </div>
        </form>
      </AppCard>
      <ManageExpenseCategoryModal
        show={manageCategoryModal.show}
        callback={handleManageCategoryCb}
        mode="add"
      />

      <ManageExpenseSubCategoryModal
        show={manageSubCategoryModal.show}
        callback={handleManageSubCategoryCb}
        mode="add"
        parentCategoryId={category?.[0]?.value || ""}
      />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        type={appAlertDialog.type}
        okText={appAlertDialog.okText}
        cancelText={appAlertDialog.cancelText}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
    </>
  );
};

export default ManageExpense;
