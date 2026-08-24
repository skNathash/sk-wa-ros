import { API, API_VERSION, OLD_API } from "~/constants";
import AjaxService from "./AjaxService";
import { merge, orderBy } from "lodash";
import AuthService from "./AuthService";
import type { VariantColor } from "~/types/CommonTypes";
import VendorService from "./VendorService";

class AccountService {
  static async getAccountSummaryList(id: string, params: any) {
    const url =
      API +
      "/account/dashboard/" +
      API_VERSION +
      "/getAccountSummaryList/" +
      id;
    const response = await AjaxService.request(url, "GET", params || {});

    if (response.data?.length > 0) {
      response.data = response.data.map((e: any) => {
        const t = e.transferType || "";
        let redirect = { path: "", params: {}, useDskNav: false };

        if (
          typeof e.transferID === "string" &&
          e.transferID.startsWith("SPO-")
        ) {
          redirect.path = `/dashboard/purchase-order/view/${e.transferID}`;
        } else if (["Order Confirm"].indexOf(t) != -1) {
          redirect.path = `/dashboard/orders/view/${e.transferID}`;
        } else if (["Order Refund"].indexOf(t) != -1) {
          redirect.path = `/dashboard/orders/view/${e.transferID}`;
        }

        if (/^dmt/gi.test(t)) {
          redirect.path = "digital/transaction";
          redirect.params = { type: "moneyTransfer", s: e.transferID };
        }

        if (/^recharge/gi.test(t)) {
          redirect.path = "digital/transaction";
          redirect.params = { type: "rechargeAndBill", s: e.transferID };
        }

        e._tranRedirect = redirect;
        return e;
      });
    }

    return response;
  }

  static getAdvanceBalanceStatement(
    id: string,
    accountId: string,
    params: any
  ) {
    let p = {
      view: "listView",
      viewType: "skWallet",
      filter: {
        transaction: {
          $elemMatch: { _id: Number(accountId), walletType: "skWallet" },
        },
        type: [
          "Physical Commission",
          "Order Confirm",
          "Wallet Commission",
          "Wallet Pay",
          "DMT Commission",
          "DMT Pay",
          "Recharge Commission",
          "Recharge Pay",
          "Receipt Reversal",
          "Receipt",
          "Recharge Charge",
          "DMT Charge",
          "Debit Note",
          "Credit Note",
          "Order Refund",
          "PG Credit",
          "Imei Commission",
          "Wallet Charge",
          "Fund Transfer",
          "CashAtPOS Commission",
          "CashAtPOS Pay",
          "Insurance Commission",
          "Insurance Charge",
          "SF Primary Commission",
          "SF Secondary Commission",
          "SF Logistics Commission",
          "SF SK Earning",
          "Insurance Pay",
          "SK Earnings-Digital Commission",
          "Credit Wallet Invoice Payments",
          "SK Earnings-Secondary Sales",
          "Investment Commission",
          "Order Return Refund",
          "SF Seller Debit",
        ],
      },
    };
    p = merge({}, p, params);
    return this.getAccountSummaryList(id, p);
  }

  static async downloadAccountStatement(
    fid: string,
    params: any,
    isDirectDownload = true
  ) {
    const url =
      API + "/account/dashboard/" + API_VERSION + "/accountsummary/" + fid;
    let p: any = {
      type: "ALL",
      isDirectDownload,
      authorization: AuthService.getLoggedInToken(),
    };
    if (params) {
      p = merge({}, p, params);
    }
    const query = new URLSearchParams();
    Object.entries(p).forEach(([k, v]) => {
      query.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    });
    const urlWithParams = url + "?" + query.toString();

    if (isDirectDownload) {
      // For direct download, open in new tab/window
      window.open(urlWithParams, "_blank");
      return;
    } else {
      // Otherwise, fetch the file via AjaxService
      return AjaxService.request(urlWithParams, "GET");
    }
  }

  static async getHostToHostData(params: any) {
    const user = AuthService.getLoggedInUser();
    const services = user?.services?.HostToHost || [];
    const url = `${OLD_API}digitalPartner/${API_VERSION}/partner/hostTohost`;
    const response = await AjaxService.request(url, "GET", params || {});
    const ids = services.map((v: any) => v.partnerId);
    if (response.statusCode === 200) {
      response.data = response.data?.data || [];
      // .filter(
      //   (v: any) => ids.indexOf(v.partnerId) !== -1
      // );
    }
    return response;
  }

  static async getBanks(params: any) {
    const url = `${OLD_API}config/bank`;
    return AjaxService.request(url, "GET", params || {});
  }

  static async depositMoneyAmtValidation(params: any = {}) {
    const url = `${OLD_API}account/${API_VERSION}/depositMoney/validation`;
    return AjaxService.request(url, "GET", params);
  }

  static async getDepositMoneyCharges(params: any) {
    const url = `${OLD_API}account/${API_VERSION}/depositMoney/getCharges`;
    return AjaxService.request(url, "GET", params || {});
  }

  static async generateReceipt(params: any) {
    const url = `${OLD_API}/${API_VERSION}/fundstransfer/depositBalance`;
    return AjaxService.request(url, "POST", params);
  }

  static async getReceiptDetail(id: string) {
    const url = `${OLD_API}account/${API_VERSION}/receipt/${id}`;
    return AjaxService.request(url, "GET");
  }

  static async getSellerAccountStatement(params: any) {
    const url = API + "/oms/" + API_VERSION + "/seller/account/statement";
    const response = await AjaxService.request(url, "GET", params || {});

    if (response.data?.length > 0) {
      response.data = response.data.map((item: any) => {
        const t = item.type || "";
        let redirect = { path: "", params: {}, useDskNav: false };

        if (
          typeof item.entityId === "string" &&
          item.entityId.startsWith("SPO-")
        ) {
          redirect.path = `/dashboard/purchase-order/view/${item.entityId}`;
        } else if (["Order Confirm", "Order Refund"].indexOf(t) !== -1) {
          redirect.path = `/dashboard/orders/view/${item.entityId}`;
        }

        if (/^dmt/gi.test(t)) {
          redirect.path = "digital/transaction";
          redirect.params = { type: "moneyTransfer", s: item.entityId };
        }

        if (/^recharge/gi.test(t)) {
          redirect.path = "digital/transaction";
          redirect.params = { type: "rechargeAndBill", s: item.entityId };
        }

        return {
          ...item,
          _tranRedirect: redirect,
        };
      });
    }

    return response;
  }

  static getPayables(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}account/api/accounts/payables/fetch`,
      "GET",
      params
    );
  }

  static getTransactions(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}accounts/transactions`, "GET", params);
  }

  static fetchAccountsSummary(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}accounts/fetchAccounts`, "GET", params);
  }

  static getPnlReport(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}accounts/reports/pnl`, "GET", params);
  }

  static getProfitLossThisMonthSummary(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/profitLoss/thisMonth`,
      "GET",
      params,
    );
  }

  static getProfitLossFyViewSummary(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/profitLoss/fyView`,
      "GET",
      params,
    );
  }

  static getProfitLossFy(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/profitLoss/fy`,
      "GET",
      params,
    );
  }

  static getProfitLossQuarter(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/profitLoss/quarter`,
      "GET",
      params,
    );
  }

  static getDashboardOverview(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/overview`,
      "GET",
      params
    );
  }

  static getMoneyInDashboard(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/moneyInDashboard`,
      "GET",
      params
    );
  }

  static getMoneyOutDashboard(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/dashboard/moneyOutDashboard`,
      "GET",
      params
    );
  }

  static getStatements(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}accounts/statements`, "GET", params);
  }

  static getVendorStatement(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/vendor-statement`,
      "GET",
      params
    );
  }

  static formatTransactionResponse(data: any) {
    return data.map((e: any) => {
      e._openingBalance = e.closingBalance;
      e._closingBalance =
        (e.transaction || []).find(
          (t: any) =>
            t.owner === AuthService.getLoggedInUserId(true) &&
            t.walletType === "skWallet"
        )?.balance || 0;

      e.sourceRedirectionUrl = this.prepareStatementSourceRedirectionUrl(
        e.sourceType,
        e.sourceId
      );
      e.sourceVariantColor = this.getStatementSourceVariantColor(e.sourceType);
      e._status = e.status === "pending" ? "Pending" : "Paid";
      e._statusColor = e.status === "pending" ? "warning" : "success";

      if (e.fromParty?.type) {
        const type = e.fromParty.type;
        e.fromParty._type = this.getPartyTypeLabel(type);
        e.fromParty.redirectionUrl = this.preparePartyTypeRedirectionUrl(
          type,
          e.fromParty.id || e.fromParty._id
        );
      }

      if (e.toParty?.type) {
        const type = e.toParty.type;
        e.toParty._type = this.getPartyTypeLabel(type);
        e.toParty.redirectionUrl = this.preparePartyTypeRedirectionUrl(
          type,
          e.toParty.id || e.toParty._id
        );
      }

      e._vendorInfo = {};
      if (e.toParty?.type === "vendor" && e.sourceType === "PO") {
        const { type, color } = VendorService.getVendorType(e.toParty);
        e._vendorInfo = {
          name: e.toParty.name,
          id: e.toParty.refId,
          _id: e.toParty.id,
          redirectionUrl: "/dashboard/vendor/view/" + e.toParty.id,
          vendorType: type,
          vendorTypeColor: color,
        };
      }

      e._sourceTypeLbl = this.getSourceTypeLabel(e.sourceType);
      e._sourceTypeShortLbl = this.getSourceTypeShortLabel(e.sourceType);

      // if (e.paymentType === "credit") {
      //   e.balanceBefore = (e.outstandingAmount || 0) - (e.amount || 0);
      // } else {
      //   e.balanceBefore = (e.outstandingAmount || 0) + (e.amount || 0);
      // }
      e.balanceBefore = Number(e.openingBalance || 0);
      e.balanceAfter = e.outstandingAmount;

      // if (e.sourceType === "PO" && e.transactionType === "purchase_charge") {
      //   e._sourceTypeLbl = "PO - Charge";
      //   e.sourceVariantColor = "danger";
      // }

      return e;
    });
  }

  static prepareStatementSourceRedirectionUrl(type: string, id: string) {
    if (
      type == "PO" ||
      type == "PO_CHARGE" ||
      type == "PLATFORM_FEE" ||
      type == "LOCAL_PURCHASE" ||
      type == "OWN_PURCHASE" ||
      type == "SK_PURCHASE"
    ) {
      return `/dashboard/purchase-order/view/${id}`;
    } else if (
      type == "POS_SALES" ||
      type == "SALES" ||
      type == "CLUB_SALES" ||
      type == "B2B_SALES"
    ) {
      return `/dashboard/orders/view/${id}`;
    } else if (type == "EXPENSE") {
      return `/dashboard/expenses/view/${id}`;
    } else {
      return "#";
    }
  }

  static preparePartyTypeRedirectionUrl(type: string, id: string) {
    if (!type || !id) return "#";

    // Convert to lowercase for case-insensitive matching
    const normalizedType = type.toLowerCase().trim();

    switch (normalizedType) {
      case "franchise":
        return `/dashboard/network/view/b2b/${id}`;
      case "customer":
        return `/dashboard/network/view/b2c/${id}`;
      case "vendor":
        return `/dashboard/vendor/view/${id}`;
      default:
        return "#";
    }
  }

  static getStatementSourceVariantColor(type: string): VariantColor {
    if (
      type === "PO" ||
      type === "LOCAL_PURCHASE" ||
      type === "OWN_PURCHASE" ||
      type === "SK_PURCHASE"
    ) {
      return "primary";
    } else if (
      type === "POS_SALES" ||
      type === "SALES" ||
      type === "B2B_SALES"
    ) {
      return "success";
    } else if (type === "REFUND") {
      return "destructive";
    } else if (type === "DEPOSIT" || type === "PAYMENT") {
      return "warning";
    } else if (
      type === "WITHDRAWAL" ||
      type === "PO_CHARGE" ||
      type === "EXPENSE" ||
      type === "PLATFORM_FEE"
    ) {
      return "danger";
    } else {
      return "default";
    }
  }

  static getSourceTypeOptions() {
    const types = [
      "PO",
      // "INVOICE",
      "PAYMENT",
      // "ADJUSTMENT",
      // "SHIPMENT",
      "POS_SALES",
      "B2B_SALES",
      "CLUB_SALES",
      "SALES",
      "LOCAL_PURCHASE",
      "OWN_PURCHASE",
      "SK_PURCHASE",
      "PO_CHARGE",
      "EXPENSE",
      "PLATFORM_FEE",
    ];
    return types.map((type) => ({
      label: this.getSourceTypeLabel(type),
      langKey: this.getSourceTypeLangKey(type),
      value: type,
    }));
  }

  // Returns a language key for the given source type.
  // This lets UI components lookup translated labels from common.json.
  static getSourceTypeLangKey(type: string): string {
    switch (type) {
      case "PO":
        return "sourceType.purchaseOrder";
      case "PO_CHARGE":
        return "sourceType.poCharge";
      case "PLATFORM_FEE":
        return "sourceType.platformFee";
      case "INVOICE":
        return "sourceType.invoice";
      case "PAYMENT":
        return "sourceType.payment";
      case "ADJUSTMENT":
        return "sourceType.adjustment";
      case "SHIPMENT":
        return "sourceType.shipment";
      case "POS_SALES":
        return "sourceType.posSales";
      case "B2B_SALES":
        return "sourceType.b2bSales";
      case "CLUB_SALES":
        return "sourceType.clubSales";
      case "SALES":
        return "sourceType.sales";
      case "LOCAL_PURCHASE":
        return "sourceType.localPurchase";
      case "OWN_PURCHASE":
        return "sourceType.ownPurchase";
      case "SK_PURCHASE":
        return "sourceType.skPurchase";
      default:
        return "sourceType.other";
    }
  }

  static getSourceTypeLabel(type: string): string {
    switch (type) {
      case "PO":
        return "Purchase Order";
      case "PLATFORM_FEE":
        return "Platform Fee";
      case "INVOICE":
        return "Invoice";
      case "PAYMENT":
        return "Payment";
      case "ADJUSTMENT":
        return "Adjustment";
      case "SHIPMENT":
        return "Shipment";
      case "POS_SALES":
        return "POS Sales";
      case "B2B_SALES":
        return "B2B Sales";
      case "CLUB_SALES":
        return "Club Sales";
      case "SALES":
        return "Sales";
      case "LOCAL_PURCHASE":
        return "Local Purchase";
      case "OWN_PURCHASE":
        return "Own Purchase";
      case "SK_PURCHASE":
        return "SK Purchase";
      default:
        return type || "-";
    }
  }

  // Compact 2-4 letter code for tight UI chips (theme-2 mobile ledger cards).
  static getSourceTypeShortLabel(type: string): string {
    switch (type) {
      case "PO":
        return "PO";
      case "PO_CHARGE":
        return "CHG";
      case "PLATFORM_FEE":
        return "FEE";
      case "INVOICE":
        return "INV";
      case "PAYMENT":
        return "PAY";
      case "ADJUSTMENT":
        return "ADJ";
      case "SHIPMENT":
        return "SHIP";
      case "POS_SALES":
        return "POS";
      case "B2B_SALES":
        return "B2B";
      case "CLUB_SALES":
        return "CLUB";
      case "SALES":
        return "SALE";
      case "LOCAL_PURCHASE":
        return "LP";
      case "OWN_PURCHASE":
        return "OP";
      case "SK_PURCHASE":
        return "SKP";
      case "EXPENSE":
        return "EXP";
      case "REFUND":
        return "REF";
      case "DEPOSIT":
        return "DEP";
      case "WITHDRAWAL":
        return "WD";
      case "CREDIT_NOTE":
        return "CN";
      case "GRN":
        return "IN";
      default:
        return (type || "-").slice(0, 4);
    }
  }

  static formatStatementResponse(data: any[]) {
    return data.map((item: any) => {
      // Add redirection URL based on sourceType and sourceReference
      item.sourceRedirectionUrl = this.prepareStatementSourceRedirectionUrl(
        item.sourceType,
        item.sourceId
      );

      // Add variant color for sourceType badge
      item.sourceVariantColor = this.getStatementSourceVariantColor(
        item.sourceType
      );

      // Add formatted sourceType label
      item._sourceTypeLbl = this.getSourceTypeLabel(item.sourceType);
      item._sourceTypeShortLbl = this.getSourceTypeShortLabel(item.sourceType);

      item._vendorInfo = {};
      if (item.toParty?.type === "vendor" && item.sourceType === "PO") {
        const { type, color } = VendorService.getVendorType(item.toParty);
        item._vendorInfo = {
          name: item.toParty.name,
          id: item.toParty.refId,
          _id: item.toParty.id,
          redirectionUrl: "/dashboard/vendor/view/" + item.toParty.id,
          vendorType: type,
          vendorTypeColor: color,
        };
      }

      // Add party type redirection URLs if party information exists
      if (item.fromParty?.type) {
        const type = item.fromParty.type;
        item.fromParty._type = this.getPartyTypeLabel(type);
        item.fromParty.redirectionUrl = this.preparePartyTypeRedirectionUrl(
          type,
          item.fromParty.id || item.fromParty._id
        );
      }

      if (item.toParty?.type) {
        const type = item.toParty.type;
        item.toParty._type = this.getPartyTypeLabel(type);
        item.toParty.redirectionUrl = this.preparePartyTypeRedirectionUrl(
          type,
          item.toParty.id || item.toParty._id
        );
      }

      return item;
    });
  }

  static getPartyTypeLabel(type: string): string {
    if (!type) return "-";

    const typeMap: Record<string, string> = {
      franchise: "Retailer",
      customer: "Customer",
      vendor: "Vendor",
    };

    // Convert to lowercase for case-insensitive matching
    const normalizedType = type.toLowerCase().trim();

    // Return mapped label or the original type if not found
    return typeMap[normalizedType] || type;
  }

  static getSKStatement(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}accounts/fundTransfer`, "GET", params);
  }

  static getSKStatementCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}accounts/fundTransfer/count`,
      "GET",
      params
    );
  }

  static formatSKStatementResponse(data: any) {
    return data.map((item: any) => {
      const t = item.type || "";
      let redirect = { path: "", params: {}, useDskNav: false };

      if (
        typeof item.entityId === "string" &&
        item.entityId.startsWith("SPO-")
      ) {
        redirect.path = `/dashboard/purchase-order/view/${item.entityId}`;
      } else if (["Order Confirm", "Order Refund"].indexOf(t) !== -1) {
        redirect.path = `/dashboard/orders/view/${item.entityId}`;
      }

      if (/^dmt/gi.test(t)) {
        redirect.path = "digital/transaction";
        redirect.params = { type: "moneyTransfer", s: item.entityId };
      }

      if (/^recharge/gi.test(t)) {
        redirect.path = "digital/transaction";
        redirect.params = { type: "rechargeAndBill", s: item.entityId };
      }

      return {
        ...item,
        _tranRedirect: redirect,
      };
    });
  }

  static getCommissionInvoices(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}purchase/orders/commission-invoices`,
      "GET",
      params
    );
  }

  static downloadCommissionInvoiceByReceiptId(
    receiptId: string,
    params: Record<string, any> = {}
  ) {
    return AjaxService.request(
      `${API}purchase/orders/commission-invoices/${receiptId}`,
      "GET",
      params
    );
  }

  static getReceipts(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${OLD_API}account/${API_VERSION}/receipt`,
      "GET",
      params
    );
  }

  static getReceiptsCount(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${OLD_API}account/${API_VERSION}/receipt/count`,
      "GET",
      params
    );
  }

  static async submitPayment(params: any) {
    const url = `${API}franchise/account/payment/update`;
    return AjaxService.request(url, "POST", params || {});
  }

  static async getPayablesReceiveables(params?: any) {
    const url = `${API}accounts/payables-receivables`;
    return AjaxService.request(url, "GET", params);
  }

  static async getFranchisePaymentTransactions(params?: any) {
    const url = `${API}franchise/payment/transactions`;
    const response = await AjaxService.request(url, "GET", params);
    if (Array.isArray(response.data?.data)) {
      response.data.data = response.data.data.map((item: any) => {
        const isCredit = (item?.paymentType || "")?.toLowerCase() === "credit";

        const counterPartyName = isCredit
          ? item?.fromInfo?.name || "-"
          : item?.toInfo?.name || "-";

        const counterPartyId = isCredit
          ? item?.fromInfo?.id || "-"
          : item?.toInfo?.id || "-";

        const counterPartyType = isCredit
          ? item?.fromInfo?.type
          : item?.toInfo?.type;

        const counterPartyPageLink =
          AccountService.preparePartyTypeRedirectionUrl(
            counterPartyType,
            counterPartyId
          );
        return {
          _id: item?._id,
          paidTo: counterPartyName || "-",
          counterPartyName: counterPartyName,
          counterPartyId: counterPartyId,
          counterPartyType:
            counterPartyType === "franchise" ? "Retailer" : counterPartyType,
          dateTime: item?.processedAt,
          amount: Number(item?.amount ?? 0),
          paymentType: isCredit ? "credit" : "debit",
          description: item?.description || "--",
          raw: item,
          counterPartyPageLink: counterPartyPageLink,
          paymentMethod: item?.paymentMethod,
          transactionReference: item?.transactionReference,
          transactionId: item?.transactionId,
        };
      });
    }
    return response;
  }

  static getRecordPaymentOptions() {
    return [
      { value: "Select", label: "Select Payment Method" },
      { value: "upi", label: "UPI" },
      { value: "cash", label: "Cash" },
      { value: "cheque", label: "Cheque" },
      { value: "bank_transfer", label: "Bank Transfer" },
    ];
  }

  static prepareReceivePaymentPayload(
    formData: Record<string, any>,
    entity: {
      id: string;
      type: string;
      name?: string;
      refId?: string;
    },
    action?: "receivePayment" | "makePayout"
  ) {
    const loggedInUser = AuthService.getLoggedInUser();
    let p = {
      paymentType: action === "receivePayment" ? "credit" : "debit",
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

  static downloadStatementUrl(fileName: string) {
    return `${API}accounts/downloadstatement/${fileName}`;
  }
}

export default AccountService;
