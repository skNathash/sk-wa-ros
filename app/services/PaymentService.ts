import { get } from "lodash";
import AuthService from "./AuthService";
import AjaxService from "./AjaxService";
import { API, API_VERSION } from "~/constants";
import type { TempPaymentData } from "~/types/TempPaymentData";

class PaymentService {
  // Static variable to store temporary data
  static tempData: TempPaymentData;

  // Static method to set temporary data
  static setTempData(data: any): void {
    this.tempData = data;
  }

  static shouldHideBalanceBasedPayments(): boolean {
    return Boolean(this.tempData?.physicalOrder?.allCodOrder);
  }

  static hasMpsOrder(): boolean {
    return (this.tempData?.physicalOrder?.groups || []).some(
      (group: any) => group.fulfilledBy === "MPS0"
    );
  }

  static shouldShowRequestOrder(
    parentDetails: any,
    loggedInUser: any,
    isCodEnabled: boolean
  ): boolean {
    if (isCodEnabled) return false;
    if (loggedInUser?.allowRequestOrders) return true;
    return Boolean(parentDetails?.rfRequestOrderConfig?.status);
  }

  static getEnabledPaymentModes() {
    const user = AuthService.getLoggedInUser();
    const services = user?.services || {};

    const hasActive = (key: string) =>
      Array.isArray(services[key]) && services[key].some((v: any) => v.active);

    return {
      showCreditCardPayment: hasActive("paymentGatewayCredit"),
      showDebitCardPayment: hasActive("paymentGatewayDebit"),
    };
  }

  static confirmPayment(apiParams?: any) {
    return AjaxService.request(
      API + "/pg/" + API_VERSION + "/payment",
      "POST",
      apiParams || {}
    );
  }

  static checkPaymentStatus(id: string) {
    return AjaxService.request(
      API + "/pg/" + API_VERSION + "/payment/" + id + "/status",
      "GET"
    );
  }
}

export default PaymentService;
