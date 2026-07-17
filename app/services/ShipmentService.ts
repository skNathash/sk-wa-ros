import { API, API_VERSION, ASSET } from "~/constants";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import CommonService from "./CommonService";

/**
 * Service for Shipment related API calls
 */
export class ShipmentService {
  private static readonly BASE_URL = API;
  private static readonly API_VERSION = API_VERSION;

  /**
   * Get couriers list
   * @param params Search parameters
   * @returns Promise with couriers data
   */
  public static async getCouriers(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/couriers`,
      "GET",
      params
    );
  }

  /**
   * Get SK preferred shipping modes
   * @param sellerId Seller ID
   * @param orderId Order ID
   * @returns Promise with shipping modes data
   */
  public static async getSKPreferredShippingModes(sellerId: string, orderId: string) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/seller/shipping/modes/${sellerId}/${orderId}`,
      "GET"
    );
  }

  /**
   * Get shipping charges based on weight
   * @param params Parameters for calculating shipping charges
   * @returns Promise with shipping charges data
   */
  public static async getShippingChargesOnWeight(params: {
    fromId: string;
    toId: string;
    weight: number;
  }) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/shipping/charges`,
      "GET",
      params
    );
  }

  /**
   * Process shipment for orders
   * @param params Shipment parameters
   * @returns Promise with shipment response
   */
  public static async doShipment(params: Record<string, any>) {
    return AjaxService.request(
      `${this.BASE_URL}oms/${this.API_VERSION}/seller/shipment`,
      "POST",
      params
    );
  }

  /**
   * Prepare shipment parameters for API request
   * @param formData Form data from shipment form
   * @param orderItem Order item data
   * @param images Array of uploaded image IDs
   * @returns Formatted parameters for shipment API
   */
  public static prepareShipmentParams(
    formData: any,
    orderItem: any,
    images: string[]
  ): Record<string, any> {
    const sellerId = AuthService.getLoggedInSellerId();
    
    // Base parameters
    const params: any = {
      sellerId,
      orders: [],
      appInfo: {
        appName: "POS",
        appVersion: "2.0.0",
      },
    };

    // Order parameters
    const orderParams: any = {
      orderId: orderItem._id,
      invoiceIds: (orderItem.subOrders || [])
        .filter((e: any) => e.status === "Packed")
        .map((e: any) => e.invoiceNo),
      shipmentType:
        formData.shippingType === "selfShipment" || formData.shippingType === "courier"
          ? "OwnNetwork"
          : "SkChannel",
      shipmentInfo: {
        details: {},
        type: formData.shipThrough || formData.shipmentType,
      },
    };

    // Add shipping preference for viaSK
    if (formData.shippingType === "viaSK" && formData.shippingPreference) {
      const preference = typeof formData.shippingPreference === 'string' 
        ? JSON.parse(formData.shippingPreference) 
        : formData.shippingPreference;
      
      orderParams.shippingPreference =
        preference.value.toLowerCase() === "warehouse" ? "SK" : "DC_BUYER";
      
      if (formData.viaSkShipType) {
        const shipType = typeof formData.viaSkShipType === 'string'
          ? JSON.parse(formData.viaSkShipType)
          : formData.viaSkShipType;
        
        orderParams.shippingPreferenceValue = shipType.id || shipType.refId;
      }
    }

    // Add courier details
    if (formData.shipThrough === "courier") {
      orderParams.shipmentInfo.details.awbNumber = formData.awbNumber;
      if (formData.courier) {
        orderParams.shipmentInfo.details.courierId = formData.courier._id;
        orderParams.shipmentInfo.details.courierName = formData.courier.name;
      }
      orderParams.shipmentInfo.details.weight = Number(formData.weight);
    }

    // Add self shipment details
    if (formData.shippingType === "selfShipment" || formData.shipThrough === "selfShipment") {
      orderParams.shipmentInfo.details.vehicleNumber = formData.vehicleNumber;
      orderParams.shipmentInfo.details.personnelName = formData.personnelName;
      orderParams.shipmentInfo.details.personnelContactNumber = formData.personnelContactNumber;
      orderParams.shipmentInfo.details.countryCode = 91;
    }

    // Add remarks and receipt images
    if (formData.remarks) {
      orderParams.shipmentInfo.details.remarks = formData.remarks;
    }
    
    orderParams.shipmentInfo.details.uploadedRecieptAssetId = images;
    
    params.orders = [orderParams];
    return params;
  }
}

export default ShipmentService;
