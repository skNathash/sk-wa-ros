import { get } from "lodash";
import { add, format, set } from "date-fns";
import PosService from "~/services/PosService";
import AuthService from "~/services/AuthService";
import PurchaseOrderService from "~/services/PurchaseOrderService";

import { CreditCard, Hourglass, Calendar, FileText } from "lucide-react";

export const formatProductData = (
  product: Record<string, any>,
  margins: Array<any>
) => {
  let t: any = {
    _id: product.id,
    name: product.name,
    hsn: get(product, "product[0].HSNNumber", ""),
    pid: get(product, "product[0].id", ""),
    category: product?.category?.name,
    brand: product?.brand?.name,
    categoryId: product?.category?._id,
    brandId: product?.brand?._id,
    mrp: product?._stockDetails?.mrp || product.mrp || 0,
    price: null,
    stock: null,
    shelfLife: "",
    shelfLifeFormatted: "",
    barcode: get(product, "product[0].barcode", ""),
    gst: product?.taxInfo?.gst || "",
    totalValue: 0,
    _anim: true,
    _stockDetails: product._stockDetails,
    _raw: {
      _canRemoveItem: true,
      _canEditMrp: product?._raw?._canEditMrp || true,
    },
    sellInLooseQty: product.sellInLooseQty || false,
    allowedUnitTypes: product.allowedUnitTypes || [],
    preferredUnitType: product._stockDetails?.preferredUnitType || "",
    packSize: product.packSize || 1,
    uom: product.uom || "",
    _qty: 0,
    _additionalMargin: 0,
  };

  const sp = preparePurchaseAndSalesData(
    t?._stockDetails?.salesData || {},
    t?._stockDetails?.purchaseData || {},
    t?._stockDetails?.thirdPartyPosPurchaseData || {}
  );
  t.purchase = sp.purchase;
  t.sales = sp.sales;

  if (t.sellInLooseQty) {
    t.unitType = t.preferredUnitType || (t.allowedUnitTypes[0] ?? "");
  }

  t._baseMargin = getBaseMargin(t, margins);

  t._finalMargin = t._baseMargin;

  t._purchasePrice = calculatePurchasePrice(t.mrp, t._finalMargin);

  t._total = calculateTotal(t);

  return t;
};

export const getBaseMargin = (deal: any, margins: Array<any>) => {
  const m = margins || [];

  const d = m.find(
    (x: any) => x.product == deal.pid && x.marginType == "Product"
  );

  if (d && typeof d.margin != "undefined") {
    return d.margin;
  }

  const bc = m.find(
    (x: any) =>
      x.brand == deal.brandId &&
      x.category == deal.categoryId &&
      x.marginType == "Brand-Category"
  );

  if (bc && typeof bc.margin != "undefined") {
    return bc.margin;
  }

  const c = m.find(
    (x: any) =>
      (x.brand == deal.brandId || x.category == deal.categoryId) &&
      ["Product", "Brand-Category"].indexOf(x.marginType) != -1
  );
  if (c && typeof c.margin != "undefined") {
    return c.margin;
  }

  return 0;
};

export const preparePurchaseAndSalesData = (
  sales: any,
  skPurchase: any,
  thirdParty: any
) => {
  let sp: any = {
    "15": {
      val: skPurchase?.fifteendayQty?._qty || 0,
      actualVal: skPurchase?.fifteendayQty?.qty || 0,
    },
    "30": {
      val: skPurchase?.thirtydaysQty?._qty || 0,
      actualVal: skPurchase?.thirtydaysQty?.qty || 0,
    },
    "60": {
      val: skPurchase?.sixtydaysQty?._qty || 0,
      actualVal: skPurchase?.sixtydaysQty?.qty || 0,
    },
  };

  let tp: any = {
    "15": {
      val: thirdParty?.fifteendayQty || 0,
      actualVal: thirdParty?.fifteendayQty || 0,
    },
    "30": {
      val: thirdParty?.thirtydaysQty || 0,
      actualVal: thirdParty?.thirtydaysQty || 0,
    },
    "60": {
      val: thirdParty?.sixtydaysQty || 0,
      actualVal: thirdParty?.sixtydaysQty || 0,
    },
  };

  let p: any = {};
  ["15", "30", "60"].forEach((x: any) => {
    p[x] = {
      val: sp[x].val + tp[x].val,
      actualVal: sp[x].actualVal + tp[x].actualVal,
    };
  });

  let s = {
    "7": {
      val: sales?.sevenday?._qty || 0,
      actualVal: sales?.sevenday?.qty || 0,
    },
    "15": {
      val: sales?.fifteenday?._qty || 0,
      actualVal: sales?.fifteenday?.qty || 0,
    },
    "30": {
      val: sales?.thirtyday?._qty || 0,
      actualVal: sales?.thirtyday?.qty || 0,
    },
  };

  return {
    purchase: p,
    sales: s,
  };
};

export const calculatePurchasePrice = (mrp: number, discount: number) => {
  return mrp - (mrp * discount) / 100;
};

export const calculateTotal = (deal: {
  sellInLooseQty: boolean;
  _purchasePrice: number;
  _qty: number;
  packSize: number;
  uom: string;
  unitType: string;
}) => {
  if (deal.sellInLooseQty) {
    const c = PosService.calculatePriceOnUom(
      deal._purchasePrice,
      deal._qty,
      {
        packsize: deal.packSize,
        uom: deal.uom,
      },
      deal.unitType
    );
    return c.total;
  } else {
    return deal._purchasePrice * (deal._qty || 0);
  }
};

export const preparePayload = (
  status: string,
  vendor: any,
  products: any[],
  formData: {
    billingTo?: string;
    expectedDate?: string;
  } = {},
  poDetails?: any
) => {
  const u = AuthService.getLoggedInUser();
  const v = vendor?.data || vendor;

  let payload: any = {
    status: status,
    isBillToStore:
      typeof poDetails?.isBillToStore == "undefined" ||
      poDetails?.status == "Draft"
        ? formData.billingTo == "store"
        : poDetails?.isBillToStore,
    franchise: {
      id: u?._id || "",
      name: u?.name || "",
      address: u?.address || "",
      state: u?.state || "",
      district: u?.district || "",
      town: u?.town || "",
      postcode: u?.postcode || "",
      gstNo: u?.finance_details?.gstNo || "",
    },
    vendorDetails: {
      id: v?._id || v?.id || "",
      name: v?.name || "",
      address: v?.address || {},
      state: v?.state || "",
      district: v?.district || "",
      town: v?.city || "",
      postcode: "" + (v?.pincode || ""),
      gstNo: v?.gst_no || "",
    },
    invoiceDetails: poDetails?.invoiceDetails || [],
    paymentSettlement: poDetails?.paymentSettlement || [],
    expectedDeliveryDate: formData.expectedDate || "",
    productList: products.map((x: any) => {
      const dStatus = x?._raw?.status || "";

      let shelfLife = "";

      const mfg =
        x._manufactureDt?.length > 0 ? x._manufactureDt[0] : x._manufactureDt;

      if (mfg) {
        const manufactureDate = new Date(mfg);
        const expiryDate = add(manufactureDate, {
          days: x._expiryDays || 0,
          months: x._expiryMonth || 0,
        });
        const finalExpiryDate = set(expiryDate, {
          hours: 23,
          minutes: 59,
          seconds: 59,
        });
        shelfLife = finalExpiryDate.toISOString();
      }

      let receivedQuantity = 0;

      if (
        dStatus &&
        ["Partially Received", "Approved"].indexOf(dStatus) != -1
      ) {
        receivedQuantity = x._qty;
      }

      let t: any = {
        sellingPrice: x._stockDetails?._finalSellingPrice || 0,
        dealId: x._id,
        pid: x.pid,
        name: x.name,
        mrp: 1 * x.mrp,
        price: 1 * x._purchasePrice,
        discount: 1 * x._finalMargin,
        barcode: x.barcode.trim(),
        hsn: x.hsn || "",
        taxInfo: {
          gst: 1 * x.gst,
        },
        expiry: shelfLife,
        requestedQuantity:
          !dStatus || dStatus == "Draft"
            ? x._qty || 0
            : x._raw.requestedQuantity || 0,
        receivedQuantity: receivedQuantity || 0,
        status: x._raw?.status || "Pending",
        currentStock: x._raw?.currentStock || x._stockDetails?.qty || 0,
        pendingOrder: 0,
        openPo: 0,
        suggested: 0,
        purchasedIn: {
          fifteenDays: x.purchase["15"].actualVal || 0,
          thirtyDays: x.purchase["30"].actualVal || 0,
          sixtyDays: x.purchase["60"].actualVal || 0,
          // ninetyDays: x.purchase['90'].actualVal || 0,
        },
        soldIn: {
          thirtyDays: x.sales["30"].actualVal || 0,
          sevenDays: x.sales["7"].actualVal || 0,
          fifteenDays: x.sales["15"].actualVal || 0,
          sixtyDays: 0,
          ninetyDays: 0,
        },
        additionalDiscount: x._enteredMargin,
        baseMargin: x._baseMargin,
        category: {
          id: x.categoryId,
          name: x.category,
        },
        brand: {
          id: x.brandId,
          name: x.brand,
        },
        damageQuantity: 0,
        shortageQuantity: x._shortageQty || 0,
        damageReason: "",
        manufactureDate: mfg || "",
        // ...existing code...
        remarks: x._raw?.remarkss || "",
        invoiceQty: x._invQty,
        sellInLooseQty: x.sellInLooseQty,
        allowedUnitTypes: x.allowedUnitTypes,
        preferredUnitType: x.preferredUnitType,
        UoM: x.uom,
        packSize: x.packSize,
        unitType: x.unitType,
      };

      if (x._raw?.totalReceivedQuantity) {
        t.totalReceivedQuantity = x._raw?.totalReceivedQuantity;
      }

      if (x._hasDamage) {
        t.damageQuantity = 1 * x._damageQty;
        t.damageReason = x._damageReason;
      }

      if (x._raw?.posPoProductLinkRef) {
        t.posPoProductLinkRef = x._raw.posPoProductLinkRef;
      }

      if (x._raw.prodDealId) {
        if (x._isSplit) {
          delete t.posPoProductLinkRef;
          t.parentId = x._raw.prodDealId;
        } else {
          t.prodDealId = x._raw.prodDealId;
        }
      }

      if (x._location?._id) {
        t.location = {
          name: x._location?.name || "",
          rackId: x._rack?.code,
          binId: x._bin?.code,
          id: x._location._id,
          rackName: x._rack?.name,
          binName: x._bin?.name,
        };
      }

      return t;
    }),
  };

  if (poDetails?.vendorDetails?.mobile) {
    payload.vendorDetails.mobile = poDetails.vendorDetails.mobile;
  }

  return payload;
};

import SellerCatalogService from "~/services/SellerCatalogService";

export const loadDetails = async (id: string) => {
  const response = await PurchaseOrderService.getDetails(id);
  if (!(response && response.data?.data)) return {};
  const poData = response.data.data;
  const formattedPO = PurchaseOrderService.formatPurchaseOrderData(poData);

  // Collect all dealIds from items
  const dealIds = (poData.items || [])
    .map((item: any) => item.dealId)
    .filter(Boolean);
  let catalogProducts: any[] = [];
  if (dealIds.length > 0) {
    const catalogResp = await SellerCatalogService.getProducts({
      filter: { dealId: { $in: dealIds } },
    });
    catalogProducts = catalogResp?.data?.data || [];
  }

  // Attach _locationDetails to each item by matching dealId and _id
  formattedPO.items = (formattedPO.items || []).map((item: any) => {
    const match = catalogProducts.find(
      (prod: any) => prod.dealId === item.dealId
    );

    return {
      ...item,
      _locationDetails: match?.location || [],
    };
  });

  return formattedPO;
};

export const poSummary = [];
