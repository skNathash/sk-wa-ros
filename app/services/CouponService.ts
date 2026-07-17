import { API } from "~/constants";
import type { VariantColor } from "~/types/CommonTypes";
import AjaxService from "./AjaxService";

/**
 * Service for handling Coupon configuration related operations
 * Manages CRUD operations for sales/coupon/config
 */
class CouponService {
 
  //  Human-friendly labels for coupon log fields, mapped from the manage form.
  
  static getLogFieldLabelMap(): Record<string, string> {
    return {
      title: "Title",
      description: "Description",
      code: "Coupon Code",
      codeType: "Code Type",
      applicableFor: "Applicable For",
      validFrom: "Valid From",
      validTill: "Valid Till",
      isActive: "Active",
      status: "Status",
      "scope.type": "Applies To",
      "discount.kind": "Discount Type",
      "discount.value": "Discount Value",
      "discount.applyOn": "Apply On",
      "discount.maxDiscountPerUse": "Max Discount Per Use",
      "conditions.minCartValue": "Min Cart Value",
      "conditions.firstOrderOnly": "First Order Only",
      "usagePolicy.maxUsesPerOrder": "Max Uses Per Order",
      "usagePolicy.applyFrequency": "Apply Frequency",
      "usagePolicy.maxUsesPerCustomer": "Max Uses Per Customer",
      "usagePolicy.maxGlobalUses": "Max Global Uses",
    };
  }

  /**
   * Resolve the badge label and color for a coupon status.
   * @param status - The raw coupon status (Running / Completed / Expired)
   * @returns Display label and badge color
   */
  static getStatusLabelAndColor(status?: string): {
    label: string;
    color: VariantColor;
  } {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return { label: "Upcoming", color: "warning" };
      case "running":
        return { label: "Running", color: "success" };
      case "completed":
        return { label: "Completed", color: "primary" };
      case "expired":
        return { label: "Expired", color: "danger" };
      default:
        return { label: status || "-", color: "default" };
    }
  }

  /**
   * Resolve the badge label and color for a coupon log status.
   * @param status - The raw log status (Created / Approved / Updated / Rejected / Cancelled)
   * @returns Display label and badge color
   */
  static getLogStatusLabelAndColor(status?: string): {
    label: string;
    color: VariantColor;
  } {
    switch ((status || "").toLowerCase()) {
      case "created":
        return { label: "Created", color: "success" };
      case "approved":
        return { label: "Approved", color: "success" };
      case "updated":
        return { label: "Updated", color: "primary" };
      case "rejected":
        return { label: "Rejected", color: "danger" };
      case "cancelled":
        return { label: "Cancelled", color: "danger" };
      default:
        return { label: status || "Updated", color: "default" };
    }
  }

  /**
   * Resolve the badge label and color for a coupon active flag.
   * @param isActive - Whether the coupon is active
   * @returns Display label and badge color
   */
  static getActiveLabelAndColor(isActive?: boolean): {
    label: string;
    color: VariantColor;
  } {
    return isActive
      ? { label: "Active", color: "success" }
      : { label: "Inactive", color: "danger" };
  }

  /**
   * Resolve the badge label and color for a coupon's validity window.
   * @param validTill - The coupon's valid-till date
   * @returns Display label (Nd Left) and badge color; empty label when expired
   */
  static getValidityLabelAndColor(validTill?: string | Date): {
    label: string;
    color: VariantColor;
  } {
    if (!validTill) return { label: "-", color: "default" };

    const daysLeft = Math.ceil(
      (new Date(validTill).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    if (daysLeft < 0) return { label: "", color: "default" };
    return {
      label: `${daysLeft}d Left`,
      color: daysLeft <= 3 ? "danger" : "success",
    };
  }

  /**
   * Format a coupon list response, attaching display fields to each row.
   * @param data - The raw coupon list from the API
   * @returns The list with status/active label and color fields attached
   */
  static formatCouponList(data: Array<any>): Array<any> {
    return (data || []).map((item: any) => {
      const { label: statusLabel, color: statusColor } =
        this.getStatusLabelAndColor(item?.status);
      const { label: activeLabel, color: activeColor } =
        this.getActiveLabelAndColor(item?.isActive);
      const { label: validityLabel, color: validityColor } =
        this.getValidityLabelAndColor(item?.validTill);

      return {
        ...item,
        _statusLabel: statusLabel,
        _statusColor: statusColor,
        _activeLabel: activeLabel,
        _activeColor: activeColor,
        _validityLabel: validityLabel,
        _validityColor: validityColor,
      };
    });
  }

  /**
   * Format a coupon logs response, sorting by latest first and attaching
   * display fields to each row.
   * @param logs - The raw coupon logs from the API
   * @returns The logs sorted latest-first with status label/color attached
   */
  static formatCouponLogs(logs: Array<any>): Array<any> {
    return [...(logs || [])]
      .sort((a: any, b: any) => {
        const dateA = new Date(a.loggedOn || 0).getTime();
        const dateB = new Date(b.loggedOn || 0).getTime();
        return dateB - dateA;
      })
      .map((item: any) => {
        const { label: statusLabel, color: statusColor } =
          this.getLogStatusLabelAndColor(item?.status);
        const loggedBy =
          item?.loggedBy?.name || item?.loggedBy?.id || "System";
        const loggedOn = item?.loggedOn;

        return {
          ...item,
          _statusLabel: statusLabel,
          _statusColor: statusColor,
          _loggedBy: loggedBy,
          _loggedOn: loggedOn,
          _changes: this.buildLogChanges(item?.oldData, item?.newData),
        };
      });
  }

  
  static buildLogChanges(oldData: any, newData: any): Array<any> {
    const oldFlat = this.flattenObject(oldData);
    const newFlat = this.flattenObject(newData);
    const fields = Array.from(
      new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])
    );

    return fields.map((field) => {
      const oldRaw = oldFlat[field];
      const newRaw = newFlat[field];
      const type = this.getLogFieldType(field, oldRaw, newRaw);

      return {
        field,
        label: this.getLogFieldLabel(field),
        type,
        oldRaw,
        newRaw,
        oldValue: this.formatLogValue(oldRaw),
        newValue: this.formatLogValue(newRaw),
      };
    });
  }

 
  //  * Get a readable label for a dotted log field path, falling back to a
  //  * title-cased version of the last segment when no mapping exists.
  
 
  static getLogFieldLabel(field: string): string {
    const labels = this.getLogFieldLabelMap();
    if (labels[field]) return labels[field];

    const leaf = field.split(".").pop() || field;
    return leaf
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (c) => c.toUpperCase())
      .trim();
  }

 
  //  * Determine how a log field should be rendered: as a date, a money amount,
  //  * or plain text.
  
  static getLogFieldType(
    field: string,
    oldValue: any,
    newValue: any
  ): "date" | "amount" | "text" {
    const leaf = field.split(".").pop() || "";
    const isIsoDate = (v: any) =>
      typeof v === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v);

    if (isIsoDate(oldValue) || isIsoDate(newValue)) return "date";

    const moneyFields = [
      "minCartValue",
      "maxCartValue",
      "maxDiscountPerUse",
    ];
    if (moneyFields.includes(leaf)) return "amount";

    return "text";
  }

 
  //  * Flatten a nested object into dotted keys, keeping arrays as leaf values.
  
  static flattenObject(obj: any, prefix = ""): Record<string, any> {
    const result: Record<string, any> = {};
    if (obj === null || obj === undefined) return result;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        Object.assign(result, this.flattenObject(value, path));
      } else {
        result[path] = value;
      }
    });

    return result;
  }

 
  //  * Format a log leaf value for display.

  static formatLogValue(value: any): string {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  }

  /**
   * Get list of coupon configs
   * @param params - Optional parameters for filtering and pagination
   * @returns Promise with coupon config list
   */
  static getCoupons(params?: any) {
    const p = { ...params, outputType: "list" };
    return AjaxService.request(`${API}sales/coupon/config`, "GET", p);
  }

  /**
   * Get coupon configs count
   * @param params - Optional parameters for filtering
   * @returns Promise with coupon config count
   */
  static getCouponsCount(params?: any) {
    const p = { ...params, outputType: "count" };
    return AjaxService.request(`${API}sales/coupon/config`, "GET", p);
  }

  /**
   * Get single coupon config by id
   * @param id - The coupon config id to fetch
   * @param params - Optional parameters
   * @returns Promise with single coupon config data
   */
  static getCouponById(id: string, params?: any) {
    const p = { ...params };
    return AjaxService.request(`${API}sales/coupon/config/${id}`, "GET", p);
  }

  /**
   * Update a coupon config's active status
   * @param id - The coupon config id to update
   * @param payload - The status payload
   * @returns Promise with updated coupon config data
   */
  static updateCouponStatus(
    id: string,
    payload: { isActive: boolean; remarks?: string },
  ) {
    return AjaxService.request(`${API}sales/coupon/config/${id}`, "PUT", payload);
  }

  /**
   * Create a new coupon config
   * @param data - The coupon config data to create
   * @returns Promise with created coupon config data
   */
  static createCoupon(data: any) {
    return AjaxService.request(`${API}sales/coupon/config`, "POST", data);
  }

  /**
   * Update an existing coupon config
   * @param id - The coupon config id to update
   * @param data - The coupon config data to update
   * @returns Promise with updated coupon config data
   */
  static updateCoupon(id: string, data: any) {
    return AjaxService.request(`${API}sales/coupon/config/${id}`, "PUT", data);
  }

  /**
   * Get the coupons available to apply on a specific cart
   * @param cartId - The cart id to fetch available coupons for
   * @returns Promise with the list of available coupons
   */
  static getAvailableCartCoupons(cartId: string) {
    return AjaxService.request(
      `${API}sales/coupon/cart/${cartId}/available-coupons`,
      "GET",
      {},
    );
  }

  /**
   * Apply a coupon code to a specific cart
   * @param cartId - The cart id to apply the coupon on
   * @param code - The coupon code to apply
   * @returns Promise with the applied coupon / discount data
   */
  static applyCartCoupon(cartId: string, code: string) {
    return AjaxService.request(
      `${API}sales/coupon/cart/${cartId}/apply-coupon`,
      "POST",
      { code },
    );
  }

  /**
   * Remove the applied coupon from a specific cart
   * @param cartId - The cart id to remove the coupon from
   * @returns Promise with the updated cart / discount data
   */
  static removeCartCoupon(cartId: string) {
    return AjaxService.request(
      `${API}sales/coupon/cart/${cartId}/remove-coupon`,
      "POST",
      {},
    );
  }
}

export default CouponService;
