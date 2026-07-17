import type { FieldValues } from "react-hook-form";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

export function preparePaymentPayload(
  formData: FieldValues,
  activeTab?: string
) {
  const loggedInUser = AuthService.getLoggedInUser();
  const entity = formData.entity?.[0]?.value;
  let p = {
    paymentType: activeTab === "receivePayment" ? "credit" : "debit",
    amount: Number(formData.amount),
    fromInfo: {
      id: AuthService.getLoggedInUserId(),
      type: "franchise",
      name: loggedInUser.name,
      refId: loggedInUser.franchiseId,
    },
    toInfo: {
      id: entity?.id,
      type: entity?.type,
      name: entity?.name,
      refId: entity?.refId,
    },
    paymentMethod: formData.paymentMethod,
    description: formData.notes,
    transactionReference: formData.referenceId,
  };

  return p;
}

export function validateFormData(formData: FieldValues, activeTab?: string) {
  const currentTab = activeTab;

  let msg = "";

  if (!formData.paymentFromType) {
    msg =
      activeTab === "receivePayment"
        ? "Payment From Type is required"
        : "Payment To Type is required";
  } else if (!formData.entity?.length) {
    msg = "Entity is required";
  } else if (!Number(formData.amount)) {
    msg = "Amount is required";
  } else if (Number(formData.amount) <= 0) {
    msg = "Amount cannot be less than or equal to 0";
  } else if (Number(formData.amount) > 1000000000) {
    msg = `Amount cannot be greater than ${CommonService.commaSeparated(
      1000000000
    )}`;
  } else if (!formData.paymentMethod) {
    msg = "Payment Method is required";
  } else {
    msg = "";
  }

  return { msg, status: !msg };
}
