import { CheckCheck, Plus, X } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useState } from "react";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import FileUploadedSlide from "~/components/core/file-upload/FileUploadedSlide";
import { AppInput } from "~/components/core/form";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppHeader from "~/components/core/header/AppHeader";
import AccountsSidePane from "~/shared/accounts/components/accounts-side-pane/AccountsSidePane";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import SectionTabs from "~/shared/navigation/section-tabs/SectionTabs";
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
import RecipientModal from "./modals/recipient/RecipientModal";

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

const ExpenseManage = () => {
  const { t } = useTranslation(["expense", "menu"]);

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

  const [recipientModal, setRecipientModal] = useState({
    show: false,
    data: null,
  });

  const [category, receipt, recipient] = useWatch({
    control,
    name: ["category", "receipt", "recipient"],
  });

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
        // redirect to expense list
        nav.replace("/dashboard/expenses/list?tab=records");
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

  const handleRecipientCb = (data: { action: string; data?: any }) => {
    // Expecting actions: close, select
    if (data.action === "select") {
      const item = data.data;
      setValue("recipient", item ?? null);
      setValue("vendor", item?.name ?? "");
    }
    setRecipientModal({ show: false, data: null });
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
      <AppHeader title={t("manageExpense")} />

      <div className="tw:p-4 app-page page-bg">
        {/* Section tabs — only shown in theme-2 mobile view (see theme-2.css). */}
        <SectionTabs
          sectionKey="business"
          activeTab="expenses"
          noShadow
          sticky
        />

        <div className="section-layout section-layout--tight">
          {/* Desktop-only left rail — business section side menu. */}
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="business"
                activeTab="expenses"
                title={t("manageBusiness", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start theme-2-mobile-gap-top">
              {/* Main column — spans the full grid; the side pane only exists in
                  theme-2 desktop, where the CSS lifts it out of the grid into
                  the fixed list pane (see AppPane / theme-2.css). */}
              <AppPaneMain className="tw:lg:col-span-12">
                <AppBreadcrumbs data={defaultBreadcrumbs} className="tw:mb-4" />
                <AppCard
                  title={t("expenseDetails")}
                  subtitle="Enter the details of the expense below."
                >
                  <form
                    onSubmit={handleSubmit(handleSubmitClick)}
                    className="tw:mt-2"
                  >
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-6">
                      <AppInput
                        name="title"
                        label={t("labelTitle")}
                        placeholder={t("enterTitle")}
                        register={register}
                        isRequired={true}
                      />

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

                      <div>
                        <AppInput
                          name="vendor"
                          label={t("vendorOrReceipt")}
                          placeholder={t("enterVendor")}
                          register={register}
                          onClick={() =>
                            setRecipientModal({ show: true, data: null })
                          }
                          readOnly
                          rightIcon={
                            recipient ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setValue("recipient", null);
                                  setValue("vendor", "");
                                }}
                                className="tw:text-gray-400 hover:tw:text-gray-600 tw:mt-1 tw:cursor-pointer"
                              >
                                <X size={18} />
                              </button>
                            ) : undefined
                          }
                        />
                      </div>

                      <div className="tw:col-span-1 tw:md:col-span-2">
                        <AppTextarea
                          name="description"
                          label={t("description")}
                          placeholder={t("enterDescription")}
                          register={register}
                          rows={4}
                          isRequired={true}
                          maxLength={500}
                        />
                        <div className="tw:text-xs tw:text-gray-500">
                          {t("maxLength")} 500
                        </div>
                      </div>

                      <div className="tw:col-span-1 tw:md:col-span-2">
                        <FileUpload
                          label={t("uploadReceipt")}
                          onFileUpload={handleReceiptUpload}
                          maxSizeMB={10}
                          allowedExtensions={allowedExtensions}
                        />
                        <div className="tw:mt-3 tw:text-xs tw:text-gray-500">
                          Allowed 10MB, JPG, JPEG, PNG
                        </div>
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

                      <AppButton
                        type="submit"
                        color="primary"
                        isLoading={isSubmitting}
                      >
                        <CheckCheck />
                        {t("save")}
                      </AppButton>
                    </div>
                  </form>
                </AppCard>
              </AppPaneMain>

              {/* Side column — only rendered while the theme-2 split layout is
                  active (lg+), where the CSS re-homes it as the fixed list pane
                  beside the icon rail. Shared with the accounts section; the
                  expense chip owns this route, and its Add Expense CTA is
                  dropped here because it points at this very page. */}
              <AccountsSidePane hideCta />
            </div>
          </div>
        </div>
      </div>

      <BusyLoader show={false} />

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

      <RecipientModal show={recipientModal.show} callback={handleRecipientCb} />
    </>
  );
};

export default ExpenseManage;

export function meta() {
  return [
    { title: "Manage Expense" },
    { name: "description", content: "Create or edit expense" },
  ];
}
