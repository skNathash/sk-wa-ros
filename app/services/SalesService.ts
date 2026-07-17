import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import CommonService from "./CommonService";

/**
 * Service for Sales and Order related API calls
 */
export class SalesService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  /**
   * Get sales summary data
   *
   * @param params - Query parameters for filtering sales data
   * @returns Promise with sales summary data
   */
  public static getSalesSummary(params?: Record<string, any>) {
    // This is a placeholder for the actual API call
    // In a real implementation, this would call an actual endpoint
    return Promise.resolve({
      statusCode: 200,
      data: {
        // Original data points
        totalOrders: 1250,
        avgOrderValue: 2500,
        returnRate: 3.2,
        totalOrdersChange: 8.5,
        avgOrderValueChange: 4.2,
        returnRateChange: -1.5,

        // Additional data points
        billCount: 1250,
        billCountChange: 8.5,
        salesValueMrp: 3500000,
        salesValueMrpChange: 5.2,
        customerDiscount: 350000,
        customerDiscountChange: 2.8,
        salesValueRsp: 3150000,
        salesValueRspChange: 5.5,
        cartOfferPurchaseValueB2B: 125000,
        cartOfferPurchaseValueB2BChange: 3.2,
        coinRedemption: 75000,
        coinRedemptionChange: 4.5,
        couponRedemption: 50000,
        couponRedemptionChange: 6.2,
        salesValueNet: 3025000,
        salesValueNetChange: 5.8,
        overallPurchaseValueB2B: 2250000,
        overallPurchaseValueB2BChange: 3.5,
        storeProfitOnSales: 775000,
        storeProfitOnSalesChange: 7.2,
        profitPercentage: 25.62,
        profitPercentageChange: 1.5,
      },
    });
  }

  /**
   * Get top products by sales
   *
   * @param params - Query parameters for filtering top products
   * @returns Promise with top products data
   */
  public static getTopProducts(params?: Record<string, any>) {
    // This is a placeholder for the actual API call
    return Promise.resolve({
      statusCode: 200,
      data: [
        { id: 1, name: "Product A", sales: 45000, percentage: 12.5 },
        { id: 2, name: "Product B", sales: 38000, percentage: 10.5 },
        { id: 3, name: "Product C", sales: 32000, percentage: 8.9 },
        { id: 4, name: "Product D", sales: 28000, percentage: 7.8 },
        { id: 5, name: "Product E", sales: 25000, percentage: 6.9 },
        { id: 6, name: "Product F", sales: 22000, percentage: 6.1 },
        { id: 7, name: "Product G", sales: 19000, percentage: 5.3 },
        { id: 8, name: "Product H", sales: 17000, percentage: 4.7 },
        { id: 9, name: "Product I", sales: 15000, percentage: 4.2 },
        { id: 10, name: "Product J", sales: 14000, percentage: 3.9 },
        { id: 11, name: "Product K", sales: 12000, percentage: 3.3 },
        { id: 12, name: "Product L", sales: 11000, percentage: 3.1 },
        { id: 13, name: "Product M", sales: 10000, percentage: 2.8 },
        { id: 14, name: "Product N", sales: 9000, percentage: 2.5 },
        { id: 15, name: "Product O", sales: 8500, percentage: 2.4 },
        { id: 16, name: "Product P", sales: 8000, percentage: 2.2 },
        { id: 17, name: "Product Q", sales: 7500, percentage: 2.1 },
        { id: 18, name: "Product R", sales: 7000, percentage: 1.9 },
        { id: 19, name: "Product S", sales: 6500, percentage: 1.8 },
        { id: 20, name: "Product T", sales: 6000, percentage: 1.7 },
      ],
    });
  }

  /**
   * Get sales by category
   *
   * @param params - Query parameters for filtering category sales
   * @returns Promise with category sales data
   */
  public static getCategorySales(params?: Record<string, any>) {
    // This is a placeholder for the actual API call
    return Promise.resolve({
      statusCode: 200,
      data: [
        { category: "Groceries", sales: 120000, percentage: 25 },
        { category: "Personal Care", sales: 85000, percentage: 18 },
        { category: "Household", sales: 75000, percentage: 16 },
        { category: "Beverages", sales: 65000, percentage: 14 },
        { category: "Snacks", sales: 55000, percentage: 12 },
        { category: "Dairy", sales: 35000, percentage: 7 },
        { category: "Bakery", sales: 25000, percentage: 5 },
        { category: "Frozen Foods", sales: 15000, percentage: 3 },
        { category: "Meat", sales: 10000, percentage: 2 },
        { category: "Others", sales: 5000, percentage: 1 },
      ],
    });
  }

  /**
   * Get weekly sales data
   *
   * @param params - Query parameters for filtering weekly sales
   * @returns Promise with weekly sales data
   */
  public static getWeeklySales(params?: Record<string, any>) {
    // This is a placeholder for the actual API call
    return Promise.resolve({
      statusCode: 200,
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        sales: [15000, 18000, 16000, 19000, 22000, 25000, 20000],
      },
    });
  }
}

export default SalesService;
