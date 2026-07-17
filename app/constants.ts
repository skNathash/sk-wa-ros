const ENV = "uat";

const config = {
  uat: {
    API: "https://upg.storeking.in/apigw/api/",
    OLD_API: "https://uat.storeking.in/apigateway/api/",
    API_VERSION: "v1",
    ASSET: (version: string) => `https://uat.storeking.in/api/asset/${version}`,
  },
  live: {
    API: "https://app.storeking.in/api/",
    OLD_API: "https://apigw.storeking.in/api/",
    API_VERSION: "v1",
    ASSET: (version: string) =>
      `https://assets.storeking.in/api/asset/${version}`,
  },
}[ENV] || {
  API: "",
  API_VERSION: "v1",
  ASSET: (version: string) =>
    `https://assets.storeking.in/api/asset/${version}`,
};

export const API = config.API;
export const OLD_API = config.OLD_API;
export const API_VERSION = config.API_VERSION;
export const ASSET = config.ASSET(API_VERSION);
export const APP_VERSION = "2.0.0";
export const OLD_APP = "https://localhost:3000";
export const IFRAME_URL = "";
export const GOOGLE_MAP_KEY = "AIzaSyAW2ISSW-C0OWAEb0Bk3-pM8jgHyu2CkLQ";
export const IMG_PATH = "";
export const PAGE_TITLE_PREFIX = "StoreKing - ";
export const PRD_IMG_RESOLUTION = "200x200";
// export const SUPPORT_WHATSAPP_NUMBER = "919606980465";
export const SUPPORT_WHATSAPP_NUMBER = "919108463373";

// Base URL for StoreKing Club (used to share/view retailer club page)
export const CLUB_URL = "https://club.storeking.in";
export const CLUB_STORE_URL = "https://storeking.in/";

export const ROS_URL = "https://app.storeking.in";
export const ROS_STORE_URL = ROS_URL + "/s/";

export const ITEM_QTY_CHANGE_ACTIONS = [
  "added",
  "incr",
  "decr",
  "removed",
  "updated",
];
export const CART_ITEM_ADDED = "added";
export const CART_ITEM_REMOVED = "removed";
export const B2B_ORDER_PROCESS_STATUS = ["Confirmed", "Processing"];
export const RACK_BIN_LOCATION_SELLABLE = "L1";
export const RACK_BIN_LOCATION_NON_SELLABLE = "L2";

export const POS_CART_ITEM_ADDED = "poscart-item-added";
export const POS_CART_ITEM_REMOVED = "poscart-item-removed";
export const POS_SCAN_INCREMENT_CART_ITEM = "pos-scan-increment-cart-item";

export const POS_ORDER_PLACED = "pos-order-placed";

export const POS_STOCK_ADDED = "pos-stock-added";

export const MOVEMENT_TYPE_FAST_MOVING_DESCRIPTION =
  "Sold in the last 0-14 days (15 days)";
export const MOVEMENT_TYPE_NORMAL_DESCRIPTION = "Need description for this";
export const MOVEMENT_TYPE_SLOW_MOVING_DESCRIPTION =
  "Unsold in 15-29 days (30 days)";
export const MOVEMENT_TYPE_NON_MOVING_DESCRIPTION = "Unsold in last 30 days";
export const MOVEMENT_TYPE_OUT_OF_STOCK_DESCRIPTION =
  "Products with zero or negative stock.";
export const MOVEMENT_TYPE_NEAR_EXPIRY_DESCRIPTION =
  "Products with an expiry date within the next 30 days — review for promotions or removal";
export const MOVEMENT_TYPE_EXPIRED_DESCRIPTION =
  "Products past their expiry date and should be quarantined or removed from sale";

export const MASTER_LOGIN_WITH_FULL_ACCESS = [
  "sushma@storeking.in",
  "chandrabhag.kamkar@storeking.in",
];

export const ALERT_DISMISS_TIME = 800;

export const UN_BRAND_ID = "BR19006";

export const EVENTS = {
  CART_ITEM_ADDED: "cart-item-added",
  CART_ITEM_REMOVED: "cart-item-removed",
  CART_ITEM_UPDATED: "cart-item-updated",
  // theme-2: open the overlay account/side menu from the header hamburger.
  OPEN_APP_MENU: "open-app-menu",
};

export const DISCOUNT_DECIMAL_PLACES = 2;
export const B2B_DISCOUNT_TYPE = "markup";
export const B2C_DISCOUNT_TYPE = "markdown";

// Default search radius for buying from the network: show all sellers regardless
// of distance. Pages/services map "all" to an effectively unbounded radius.
export const DEFAULT_BROWSE_DISTANCE = "all";
export const SUBSCRIBE_MAX_PRODUCTS_COUNT = 50;

export const APP_TERMS_KEY = "RETAIL_OS_TERMS";
export const APP_TERMS_VERSION = "1.0";
export const APP_PRIVACY_POLICY_KEY = "RETAIL_OS_PRIVACY_POLICY";
export const APP_PRIVACY_POLICY_VERSION = "1.0";

export const IGNORE_SK_DEAL = true;

export const MAX_RESERVE_QTY = 10000;

/** Storage key used to hand bulk-selected products to the barcode generator preview page. */
export const PRINT_BARCODE_BULK_STORAGE_KEY = "print-barcode-bulk";

/** Maximum number of products that can be queued for a single bulk barcode print sheet. */
export const PRINT_BARCODE_MAX_BULK_ITEMS = 30;

/** Maximum number of prints (copies) allowed per product in a bulk barcode print. */
export const PRINT_BARCODE_MAX_COPIES = 100;
