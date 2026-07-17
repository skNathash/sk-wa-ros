import { API } from "~/constants";
import AjaxService from "./AjaxService";

class BulkUploadService {
  static getBatchStatus(batchId: string) {
    return AjaxService.request(
      `${API}purchase/inventory/excel/status/${batchId}`,
      "GET",
    );
  }

  static submitBulkPriceData(payload: any) {
    return AjaxService.request(
      `${API}catalog/seller-price-config/create-or-update/bulk`,
      "POST",
      payload,
    );
  }

  static syncPriceUpload(batchId: string) {
    return AjaxService.request(
      `${API}purchase/inventory/excel/price-upload/sync/${batchId}`,
      "PUT",
    );
  }

  static getPriceUploadSyncReport(batchId: string) {
    return AjaxService.request(
      `${API}purchase/inventory/excel/price-upload/sync/report/${batchId}`,
      "GET",
    );
  }

  static syncPriceBarcodeUpload(batchId: string) {
    return AjaxService.request(
      `${API}purchase/inventory/excel/price-barcode-upload/sync/${batchId}`,
      "PUT",
    );
  }

  static getPriceBarcodeUploadSyncReport(batchId: string) {
    return AjaxService.request(
      `${API}purchase/inventory/excel/price-barcode-upload/sync/report/${batchId}`,
      "GET",
    );
  }

  static submitStockAdjustmentBulk(franchiseId: string, payload: any) {
    return AjaxService.request(
      `${API}inventory/stock/${franchiseId}/adjustment/bulk`,
      "POST",
      payload,
    );
  }

  static submitStockmasterCorrectionBulk(franchiseId: string, payload: any) {
    return AjaxService.request(
      `${API}inventory/stock/stockmaster/${franchiseId}/correct/bulk`,
      "PATCH",
      payload,
    );
  }
}

export default BulkUploadService;
