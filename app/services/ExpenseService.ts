import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";

/**
 * Service for Expense related API calls
 */
export class ExpenseService {
  private static readonly BASE_URL = API;

  public static createCategory(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/category`,
      "POST",
      params
    );
  }

  public static getCategories(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/category/list`,
      "GET",
      params
    );
  }

  public static updateCategory(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/category/${id}`,
      "PUT",
      params
    );
  }

  public static createSubCategory(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/subcategory`,
      "POST",
      params
    );
  }

  public static getSubCategories(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/subcategory/list`,
      "GET",
      params
    );
  }

  public static updateSubCategory(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/subcategory/${id}`,
      "PUT",
      params
    );
  }

  public static createTransaction(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction`,
      "POST",
      params
    );
  }

  /**
   * Scan an expense bill image with AI to extract the expense details.
   * Sends the raw image as multipart/form-data under the `bill` field; axios
   * sets the multipart boundary automatically for a FormData instance.
   */
  public static scanBill(file: File) {
    const formData = new FormData();
    formData.append("bill", file);
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction/scan`,
      "POST",
      formData
    );
  }

  public static async getTransactions(params: Record<string, any>) {
    const response = await AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction/list`,
      "GET",
      params
    );

    if (response.statusCode === 200) {
      response.data.data = response.data.data.map((item: any) => ({
        ...item,
        statusColor: item.status === "approved" ? "success" : "danger",
      }));
    }

    return response;
  }

  public static updateTransaction(id: string, params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction/${id}`,
      "PUT",
      params
    );
  }

  public static updateTransactionStatus(
    id: string,
    params: Record<string, any>
  ) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction/${id}/status`,
      "PUT",
      params
    );
  }

  public static getTransactionStats(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction/stats`,
      "GET",
      params
    );
  }

  public static getAnalytics(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}/franchise/expense/transaction/analytics`,
      "GET",
      params
    );
  }
}

export default ExpenseService;
