import AuthService from "~/services/AuthService";

export const getOrderType = (moduleType: string) => {
  let type = moduleType;
  if (
    type == "physical" ||
    type == "unConfirmedOrder" ||
    type == "groupBuying"
  ) {
    return "oms";
  } else if (type == "recharge") {
    return "recharge";
  } else if (type == "dmt") {
    return "dmt";
  } else if (type == "depositMoney") {
    return "deposit";
  } else if (type == "wyp") {
    return "whatsYourPriceContestFee";
  } else if (type == "leadGeneration") {
    return "leadGenerationPayment";
  } else if (type == "insurance") {
    return "leadGenerationPayment";
  } else {
    return "";
  }
};

export const getNetBankingParams = (
  transId: string,
  amount: number,
  moduleType: string
) => {
  const loggedInUser = AuthService.getLoggedInUser();
  let params: any = {
    type: "NetBanking",
    cardType: "",
    amount: amount,
    phoneNumber: loggedInUser?.mobileNo,
    email: loggedInUser?.email,
    customerId: loggedInUser?.id,
    orderTranctionId: transId,
    orderType: getOrderType(moduleType),
  };
  return params;
};

export const getUpiParams = (
  transId: string,
  amount: number,
  moduleType: string
) => {
  const loggedInUser = AuthService.getLoggedInUser();
  let params: any = {
    type: "UPI",
    cardType: "",
    amount: amount,
    phoneNumber: loggedInUser?.mobileNo,
    email: loggedInUser?.email,
    customerId: loggedInUser?.id,
    orderTranctionId: transId,
    orderType: getOrderType(moduleType),
  };
  return params;
};

export const getCardPaymentParams = (
  transId: string,
  cardPayment: any,
  payableAmount: number,
  moduleType: string
) => {
  const loggedInUser = AuthService.getLoggedInUser();
  let payType = "";
  let modeOfPay = "";

  const cardInfo = cardPayment;

  if (cardInfo.paymentType == "Debit") {
    payType = "Debit";
  } else if (cardInfo.paymentType == "Cug") {
    payType = "CUG";
  } else {
    payType = "Credit";
  }

  if (
    ["Credit", "Debit", "Cug", "cugCard"].indexOf(cardInfo.paymentType) != -1
  ) {
    modeOfPay = "Card";
  } else if (cardInfo.paymentType == "NetBanking") {
    modeOfPay = "NetBanking";
  } else if (cardInfo.paymentType == "UPI") {
    getUpiParams(transId, payableAmount, moduleType);
  }
  let params: any = {
    type: modeOfPay,
    cardType: payType,
    name: cardInfo.cardHolderName,
    cardNumber: cardInfo.cardNumber,
    amount: payableAmount,
    phoneNumber: loggedInUser?.mobileNo,
    email: "",
    customerId: loggedInUser?.id,
    orderTranctionId: transId,
    orderType: getOrderType(moduleType),
  };

  return params;
};

export const validateCardPayment = (cardPayment: any) => {
  const formData = cardPayment;
  let msg = "";
  if (!formData.paymentType) {
    msg = "Please select a payment type.";
  } else if (!formData.cardNumber) {
    msg = "Please enter a card number.";
  } else if (!formData.cardHolderName) {
    msg = "Please enter a card holder name.";
  } else if (formData.cardNumber.length < 16) {
    msg = "Please enter a valid card number.";
  } else if (!formData.cardHolderName.trim()) {
    msg = "Please enter a valid card holder name.";
  } else {
    msg = "";
  }

  return {
    valid: !msg,
    msg,
  };
};
