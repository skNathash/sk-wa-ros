export type FormData = {
  title: string;
  amount: number | null;
  category: Array<any>;
  subCategory: Array<any>;
  expenseDate: Date | Date[] | undefined | null;
  vendor?: string | null;
  recipient?: any | null;
  description?: string | null;
  receipt?: Array<{ id: string }>;
};

export const defaultFormData: FormData = {
  title: "",
  amount: null,
  category: [],
  subCategory: [],
  expenseDate: undefined,
  vendor: null,
  recipient: null,
  description: null,
  receipt: [],
};

export const validateExpense = (data: FormData, t: (key: string) => string) => {
  const MAX_AMOUNT = 100000000;

  if (!data.title?.trim()) {
    return { msg: t("validation.titleRequired"), status: false };
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

  if (!data.category?.length) {
    return { msg: t("validation.categoryRequired"), status: false };
  }

  if (!data.subCategory?.length) {
    return { msg: t("validation.subCategoryRequired"), status: false };
  }

  if (!data.description?.trim()) {
    return { msg: t("validation.descriptionRequired"), status: false };
  }

  if (
    !data.expenseDate ||
    (Array.isArray(data.expenseDate)
      ? data.expenseDate.length === 0
      : !data.expenseDate)
  ) {
    return { msg: t("validation.dateRequired"), status: false };
  }

  return { msg: "", status: true };
};

import { format } from "date-fns";
import ExpenseService from "~/services/ExpenseService";

export const prepareExpensePayload = (data: FormData) => {
  const f = data as FormData;

  const categoryId = f.category[0]?.value || "";
  const subCategoryId = f.subCategory[0]?.value || "";

  const payload: Record<string, any> = {};

  payload.title = f.title.trim();
  payload.amount = f.amount;

  payload.categoryId = categoryId;
  payload.subCategoryId = subCategoryId;

  if (f.vendor && typeof f.vendor === "string" && f.vendor.trim()) {
    if (f.recipient?.id) {
      payload.recipient = {
        id: f.recipient.id ?? null,
        name: f.recipient?.name || "",
        type: "vendor",
      };
    } else {
      payload.recipient = {
        id: null,
        name: "",
        type: "",
      };
    }
  }

  if (f.expenseDate) {
    const dt = Array.isArray(f.expenseDate) ? f.expenseDate[0] : f.expenseDate;
    if (dt) payload.expenseDate = format(dt, "yyyy-MM-dd");
  }

  payload.description = f.description?.trim() || "";

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
