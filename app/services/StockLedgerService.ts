import { API, API_VERSION } from "~/constants";
import AjaxService from "./AjaxService";
import CommonService from "./CommonService";

/**
 * Service for Stock Ledger related API calls
 */
class StockLedgerService {
  /**
   * Get POS stock ledger
   * @param params - Query parameters
   * @param isSellInLoose - Whether to convert quantities to loose units
   * @returns Promise with stock ledger data
   */
  public static async getPosStockLedger(params: any, isSellInLoose = false) {
    const options = [
      { label: "All", value: "all", icon: "list" },
      {
        label: "Purchase from Vendor",
        value: "PURCHASE - Third Party",
        icon: "truck",
      },
      { label: "Purchase from SK", value: "PURCHASE - SK", icon: "store" },
      {
        label: "Sales from POS (B2C Sales)",
        value: "SALES - POS",
        icon: "shopping-cart",
      },
      {
        label: "Network Sales (from Retailer)",
        value: "SALES - Network",
        icon: "users",
      },
      { label: "Stock Adjustment", value: "Adjustment", icon: "settings" },
      { label: "Subscription", value: "Subscription", icon: "repeat" },
      { label: "Return from POS", value: "Sales Return", icon: "undo-2" },
      { label: "Returns", value: "Purchase Return", icon: "corner-up-left" },
    ];

    const r = await AjaxService.request(
      `${API}deal/${API_VERSION}/seller/stock/ledger`,
      "GET",
      params
    );

    if (Array.isArray(r.data)) {
      r.data.forEach((x: any) => {
        if (
          x.referenceType === "PURCHASE - Third Party" &&
          x.purchaseInfo?.name
        ) {
          x._msg = /^SPO/.test(x.refId)
            ? "Purchase Order"
            : `Purchased from ${x.purchaseInfo?.name}`;
          x.icon = "truck";
        } else if (x.referenceType === "SALES - POS") {
          x._msg = "POS Order placed";
          x._orderId = x.refId;
          x.icon = "shopping-cart";
        } else {
          const i = options.find((e) => e.value === x.referenceType);
          x._msg = i ? i.label : x.referenceType;
          x.icon = i ? i.icon : "list";
        }

        // Special handling for _msg values
        if (x._msg && typeof x._msg === "string") {
          // Map _msg to icon if not already set
          const msgIconMap: Record<string, string> = {
            All: "list",
            "Purchase from Vendor": "truck",
            "Purchase from SK": "store",
            "POS Order placed": "shopping-cart",
            "Sales from POS (B2C Sales)": "shopping-cart",
            "Network Sales (from Retailer)": "users",
            "Stock Adjustment": "settings",
            Subscription: "repeat",
            "Return from POS": "undo-2",
            Returns: "corner-up-left",
            "Purchase Order": "indian-rupee",
            "Purchased from": "truck",
            "Sales Return": "undo-2",
            "Purchase Return": "corner-up-left",
          };
          // If _msg is dynamic (e.g., Purchased from ...), check prefix
          if (!x.icon) {
            if (/^Purchased from/.test(x._msg)) {
              x.icon = "truck";
            } else if (/^Purchase Order/.test(x._msg)) {
              x.icon = "indian-rupee";
            } else {
              x.icon = msgIconMap[x._msg] || "list";
            }
          }
        }

        x._effectiveOldQty = x.effectiveOldQty;
        x._quantity = x.changeQtyBy;
        x._effectiveNewQty = x.effectiveNewQty;

        x.lbls = this.getLedgerRefLblVal(x.refId);

        if (isSellInLoose) {
          x._effectiveOldQty = CommonService.roundedByDecimalPlace(
            x.effectiveOldQty / 1000,
            3
          );
          x._quantity = CommonService.roundedByDecimalPlace(
            x.quantity / 1000,
            3
          );
          x._effectiveNewQty = CommonService.roundedByDecimalPlace(
            x.effectiveNewQty / 1000,
            3
          );
          x._effectiveOldQtyUom = "kg";
          x._quantityUom = "kg";
          x._effectiveNewQtyUom = "kg";
        }
      });
    }

    return r;
  }

  /**
   * Get POS stock ledger count
   * @param params - Query parameters
   * @returns Promise with count
   */
  public static getPosStockLedgerCount(params: any) {
    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/stock/ledger/count`,
      "GET",
      params
    );
  }

  /**
   * Get POS stock master
   * @param dealId - Deal ID
   * @param sellerId - Seller ID
   * @param params - Query parameters
   * @param isSellInLoose - Whether to convert quantities to loose units
   * @returns Promise with stock master data
   */
  public static getPosStockMaster(
    dealId: string,
    sellerId: string,
    params: any,
    isSellInLoose = false
  ) {
    const calculateRemainingDays = (expiryDate: string) => {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const timeDifference = +expiry - +today;
      const remainingDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
      return remainingDays;
    };

    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/${sellerId}/stock/${dealId}/master`,
      "GET",
      params
    ).then((r: any) => {
      (r.data || []).forEach((x: any) => {
        x._quantity = x.quantity;

        if (x.expiry) {
          const d = calculateRemainingDays(x.expiry);
          if (d >= 0) {
            x._shelfLifeRemaining = `${d} days`;
          } else {
            x._expired = true;
          }
        }

        if (isSellInLoose) {
          x._quantity = CommonService.roundedByDecimalPlace(
            x.quantity / 1000,
            3
          );
          x._quantityUom = "kg";
        }
      });

      return r;
    });
  }

  /**
   * Get ledger reference label value (stub, implement as needed)
   */
  private static getLedgerRefLblVal(refId: string): Array<{
    type: string;
    lbl: string;
    val: string;
    redirect?: {
      path: string;
      params: {
        id: string;
      };
    };
  }> {
    const a: string[] = (refId || "").split("#");

    const invPatt = /^IN/g;
    const pordPatt = /^ORD/g;
    const sordPatt = /^XOR/g;
    const posOrdPatt = /^POS/g;
    const posReturnPatt = /^POSR/g;
    const po = /^SPO-/g;

    const pickOrdId = (val: string): string => {
      return val.substring(0, val.lastIndexOf("_"));
    };

    const lbls: Array<{
      type: string;
      lbl: string;
      val: string;
      redirect?: {
        path: string;
        params: any;
      };
    }> = [];

    a.forEach((x: string) => {
      if (invPatt.test(x)) {
        lbls.push({
          type: "invoice",
          lbl: "Invoice",
          val: x,
          redirect: {
            path: "",
            params: {
              id: x,
            },
          },
        });
      } else if (pordPatt.test(x)) {
        lbls.push({
          type: "primaryOrder",
          lbl: "Order",
          val: x,
          redirect: {
            path: "/dashboard/orders/view/" + pickOrdId(x),
            params: {},
          },
        });
      } else if (sordPatt.test(x)) {
        lbls.push({
          type: "secondaryOrder",
          lbl: "Order",
          val: x,
          // redirect: {
          //   path:
          //     salesType == "PURCHASE"
          //       ? "dashboard/orders/details"
          //       : "seller/orders/detail",
          //   params: {
          //     id: pickOrdId(x),
          //   },
          // },
        });
      } else if (posReturnPatt.test(x)) {
        lbls.push({
          type: "posReturn",
          lbl: "Return",
          val: x,
          redirect: {
            path: "/dashboard/club/returns/view/" + x,
            params: {},
          },
        });
      } else if (posOrdPatt.test(x)) {
        lbls.push({
          type: "posOrder",
          lbl: "Order",
          val: x,
          redirect: {
            path: "/dashboard/orders/view/" + x,
            params: {},
          },
        });
      } else if (po.test(x)) {
        lbls.push({
          type: "po",
          lbl: "Purchase Order (PO)",
          val: x,
          redirect: {
            path: "/dashboard/orders/view/" + x,
            params: {},
          },
        });
      } else {
      }
    });

    return lbls;
  }

  static downloadDealStockLedger(params = {}) {
    return AjaxService.request(
      `${API}deal/${API_VERSION}/seller/fetch/ledgerDownload`,
      "GET",
      params
    );
  }

  static getStockLedgerTypeOptions() {
    return [
      {
        label: "All",
        value: "all",
        desc: "",
      },
      {
        label: "Purchase from Vendor",
        value: "PURCHASE - Third Party",
        desc: "Products which are purchased from other thirdparty vendors",
      },
      {
        label: "Purchase from SK",
        value: "PURCHASE - SK",
        desc: "Products which are purchased from StoreKing",
      },
      {
        label: "Sales from POS (B2C Sales)",
        value: "SALES - POS",
        desc: "Products which are purchased by customer",
      },
      {
        label: "Network Sales (from Retailer)",
        value: "SALES - Network",
        desc: "Products which are purchased by your Network Retailer",
      },
      {
        label: "Stock Adjustment",
        value: "Adjustment",
        desc: "Stock which are added or reduced",
      },
      {
        label: "Subscription",
        value: "Subscription",
        desc: "StoreKing subscribed product stock",
      },
      {
        label: "POS Returns",
        value: "Sales Return",
        desc: "List of accepted returns from the customer",
      },
      {
        label: "Purchase Returns",
        value: "Purchase Return",
        desc: "List of accepted returns from the StoreKing",
      },
    ];
  }

  static getInventorySnapshots(
    snapshots: any[],
    options: {
      mrp: number;
      barcode: string;
    }
  ) {
    const { mrp, barcode } = options;

    let barcodeSnapshots = [];
    let mrpSnapshots = [];

    if (barcode) {
      barcodeSnapshots = snapshots.filter((e: any) => e.barcode === barcode);
    }

    if (!barcodeSnapshots.length && mrp) {
      mrpSnapshots = snapshots.filter((e: any) => e.mrp === mrp);
    }

    if (!barcodeSnapshots.length && !mrpSnapshots.length) {
      return [...snapshots];
    }

    return [...barcodeSnapshots, ...mrpSnapshots];
  }
}

export default StockLedgerService;
