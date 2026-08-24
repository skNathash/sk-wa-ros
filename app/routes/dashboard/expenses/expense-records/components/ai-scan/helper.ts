import { format } from "date-fns";
import ExpenseService from "~/services/ExpenseService";

export type ScanFormData = {
  title: string; // used as the description input in the UI
  amount: number | null;
  category: Array<{ label: string; value: string }>;
  subCategory: Array<{ label: string; value: string }>;
  expenseDate: Date | Date[] | undefined | null;
  assets: string[];
};

/** Raw shape returned by the AI bill-scan endpoint (`data` field). */
export type ScannedBill = {
  title?: string;
  amount?: number;
  categoryId?: string;
  categoryName?: string;
  subCategoryId?: string;
  subCategoryName?: string;
  expenseDate?: string;
  description?: string;
  recipient?: { id?: string; name?: string; type?: string };
  assets?: string[];
};

export const emptyScanForm: ScanFormData = {
  title: "",
  amount: null,
  category: [],
  subCategory: [],
  expenseDate: new Date(),
  assets: [],
};

/**
 * Map the AI-extracted bill into the editable form state. Category and
 * sub-category are only pre-filled when the scan returned a concrete id, so the
 * (mandatory) selects stay empty and force a manual choice otherwise.
 */
export const mapScanToForm = (data: ScannedBill): ScanFormData => {
  const parsedDate = data.expenseDate ? new Date(data.expenseDate) : new Date();

  return {
    title: (data.description || data.title || "").trim(),
    amount: typeof data.amount === "number" ? data.amount : null,
    category: data.categoryId
      ? [{ label: data.categoryName || "", value: data.categoryId }]
      : [],
    subCategory: data.subCategoryId
      ? [{ label: data.subCategoryName || "", value: data.subCategoryId }]
      : [],
    expenseDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
    assets: Array.isArray(data.assets) ? data.assets : [],
  };
};

export const validateScanExpense = (
  data: ScanFormData,
  t: (key: string) => string
) => {
  const MAX_AMOUNT = 100000000;

  if (!data.category?.length) {
    return { msg: t("validation.categoryRequired"), status: false };
  }

  if (!data.subCategory?.length) {
    return { msg: t("validation.subCategoryRequired"), status: false };
  }

  if (!data.amount) {
    return { msg: t("validation.amountRequired"), status: false };
  }

  if (data.amount < 0) {
    return { msg: t("validation.amountNegative"), status: false };
  }

  if (data.amount > MAX_AMOUNT) {
    return { msg: t("validation.amountTooLarge"), status: false };
  }

  if (
    !data.expenseDate ||
    (Array.isArray(data.expenseDate) && data.expenseDate.length === 0)
  ) {
    return { msg: t("validation.dateRequired"), status: false };
  }

  if (!data.title?.trim()) {
    return { msg: t("validation.descriptionRequired"), status: false };
  }

  return { msg: "", status: true };
};

export const prepareScanExpensePayload = (data: ScanFormData) => {
  const payload: Record<string, any> = {
    title: data.title.trim(),
    amount: data.amount,
    categoryId: data.category[0]?.value || "",
    subCategoryId: data.subCategory[0]?.value || "",
  };

  const dt = Array.isArray(data.expenseDate)
    ? data.expenseDate[0]
    : data.expenseDate;
  if (dt) {
    payload.expenseDate = format(dt, "yyyy-MM-dd");
  }

  if (data.assets?.length) {
    payload.assets = data.assets;
  }

  return payload;
};

export const submitScanExpense = async (data: ScanFormData) => {
  const payload = prepareScanExpensePayload(data);
  return ExpenseService.createTransaction(payload);
};
