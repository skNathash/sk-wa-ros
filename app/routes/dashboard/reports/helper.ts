import { endOfDay, startOfDay } from "date-fns";
import AuthService from "~/services/AuthService";
import ReportService from "~/services/ReportService";

const downloadInventory = (params: any) => {
  try {
    ReportService.getInventoryReport(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadStockLedger = (params: any) => {
  try {
    ReportService.getStockLedgerReport(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadPurchaseOrder = (params: any) => {
  try {
    ReportService.getPurchaseOrderReport(
      AuthService.getLoggedInUserId(),
      params
    );
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadSalesInvoice = (params: any) => {
  try {
    ReportService.getSalesReport(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadCommissionInvoice = (params: any) => {
  try {
    ReportService.getCommissionDeductionReport(
      AuthService.getLoggedInUserId(),
      params
    );
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadKingCoins = (params: any) => {
  try {
    ReportService.getKingCoinsReport(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadGstReportPurchase = (params: any) => {
  try {
    ReportService.getGstReportPurchase(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadGstReportSales = (params: any) => {
  try {
    ReportService.getGstReportSales(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadGstReportB2B = (params: any) => {
  try {
    ReportService.getGstReportB2B(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadGstReportB2C = (params: any) => {
  try {
    ReportService.getGstReportB2C(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadGst1rB2B = (params: any) => {
  try {
    ReportService.getGst1rB2B(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadGst1rB2C = (params: any) => {
  try {
    ReportService.getGst1rB2C(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadHsnB2B = (params: any) => {
  try {
    ReportService.getHsnB2B(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

const downloadHsnB2C = (params: any) => {
  try {
    ReportService.getHsnB2C(AuthService.getLoggedInUserId(), params);
    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
};

export const prepareParams = (filter: Record<string, any>) => {
  let p = {
    startDate: startOfDay(filter.startDate).toISOString(),
    endDate: endOfDay(filter.endDate).toISOString(),
    outputType: "download",
    fileType: filter.fileType,
  };
  return p;
};

export const downloadReport = (type: string, params: any) => {
  switch (type) {
    case "inventory":
      // Inventory report should not receive date filters
      const { startDate, endDate, ...restParams } = params || {};
      return downloadInventory(restParams);
    case "stockLedger":
      return downloadStockLedger(params);
    case "purchaseOrder":
      return downloadPurchaseOrder(params);
    case "commissionInvoice":
      return downloadCommissionInvoice(params);
    case "salesInvoice":
      return downloadSalesInvoice(params);
    case "kingCoins":
      return downloadKingCoins(params);
    case "gstReportPurchase":
      return downloadGstReportPurchase(params);
    case "gstReportSales":
      return downloadGstReportSales(params);
    case "gstReportB2B":
      return downloadGstReportB2B(params);
    case "gstReportB2C":
      return downloadGstReportB2C(params);
    case "gst1rB2B":
      return downloadGst1rB2B(params);
    case "gst1rB2C":
      return downloadGst1rB2C(params);
    case "hsnB2B":
      return downloadHsnB2B(params);
    case "hsnB2C":
      return downloadHsnB2C(params);
    default:
      return {
        success: false,
      };
  }
};
