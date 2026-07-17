export type FormData = {
  title: string; // used as description input in UI
  amount: number | null;
  category: Array<any>;
  subCategory: Array<any>;
  expenseDate: Date | Date[] | undefined | null;
  receipt?: Array<{ id: string }>;
  employee?: Array<any>;
};

export const defaultFormData: FormData = {
  title: "",
  amount: null,
  category: [],
  subCategory: [],
  expenseDate: new Date(),
  receipt: [],
  employee: [],
};

export const validateExpense = (data: FormData, t: (key: string) => string) => {
  const MAX_AMOUNT = 100000000;

  // Follow UI order: Category → Sub Category → Amount → Date → Description

  if (!data.category?.length) {
    return { msg: t("validation.categoryRequired"), status: false };
  }

  if (!data.subCategory?.length) {
    return { msg: t("validation.subCategoryRequired"), status: false };
  }

  // Check if employee is required for specific subcategory
  const subCategoryId = data.subCategory[0]?.value;
  if (subCategoryId === "694bd7a0432271fbeda2e17a" && !data.employee?.length) {
    return { msg: t("validation.employeeRequired"), status: false };
  }

  // amount can be number or empty string
  if (!data.amount) {
    return { msg: t("validation.amountRequired"), status: false };
  }

  if (data.amount && data.amount < 0) {
    return { msg: t("validation.amountNegative"), status: false };
  }

  if (data.amount && data.amount > MAX_AMOUNT) {
    return { msg: t("validation.amountTooLarge"), status: false };
  }

  if (
    !data.expenseDate ||
    (Array.isArray(data.expenseDate)
      ? data.expenseDate.length === 0
      : !data.expenseDate)
  ) {
    return { msg: t("validation.dateRequired"), status: false };
  }

  if (!data.title?.trim()) {
    return { msg: t("validation.descriptionRequired"), status: false };
  }

  return { msg: "", status: true };
};

import { format } from "date-fns";
import ExpenseService from "~/services/ExpenseService";

export const prepareExpensePayload = (data: FormData) => {
  const f = data as FormData;

  const categoryId = f.category[0]?.value || "";
  const subCategoryId = f.subCategory[0]?.value || "";
  const employeeId = f.employee?.[0]?.value?.id || "";

  const payload: Record<string, any> = {};

  payload.title = f.title.trim();
  payload.amount = f.amount;

  payload.categoryId = categoryId;
  payload.subCategoryId = subCategoryId;

  if (employeeId) {
    payload.employeeId = employeeId;
  }

  if (f.expenseDate) {
    const dt = Array.isArray(f.expenseDate) ? f.expenseDate[0] : f.expenseDate;
    if (dt) payload.expenseDate = format(dt, "yyyy-MM-dd");
  }

  // assets: accept array/object/string and only include if non-empty
  if (f.receipt) {
    payload.assets = f.receipt.map((r: { id: string }) => r.id);
  }

  return payload;
};

export const submitExpense = async (data: FormData) => {
  const payload = prepareExpensePayload(data);
  const response = await ExpenseService.createTransaction(payload);
  return response;
};
