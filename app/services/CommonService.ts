import { format } from "date-fns";
import { get } from "lodash";
import { API, API_VERSION, ASSET, GOOGLE_MAP_KEY, OLD_API } from "~/constants";
import type {
  AppliedFilterLabel,
  SectionTab,
  SellerDeal,
} from "~/types/CommonTypes";
import AjaxService from "./AjaxService";
import AuthService from "./AuthService";
import MiscService from "./MiscService";
import StorageService from "./StorageService";

export default class CommonService {
  static roundedByDecimalPlace(number: number, decimal_places: number = 2) {
    const denominator = Math.pow(10, decimal_places);
    const rounded_number = Math.round(number * denominator) / denominator;
    return rounded_number;
  }

  static getAppSupportedLanguages() {
    return [
      { value: "en", label: "English" },
      { value: "hi", label: "हिन्दी" },
      { value: "ta", label: "தமிழ்" },
      { value: "te", label: "తెలుగు" },
      { value: "kn", label: "ಕನ್ನಡ" },
    ];
  }

  static getMessageLanguages() {
    return [
      { value: "en", label: "English" },
      { value: "hi", label: "हिन्दी" },
      { value: "ta", label: "தமிழ்" },
      { value: "te", label: "తెలుగు" },
      { value: "kn", label: "ಕನ್ನಡ" },
    ];
  }

  static formattedAmount(value: number, decimalPlaces: number = 2) {
    const roundedValue = CommonService.roundedByDecimalPlace(
      value || 0,
      decimalPlaces,
    );

    // Format the number with commas
    const formattedValue = roundedValue.toLocaleString("en-IN");

    return formattedValue;
  }

  static windowOpenHandler(url: string, callback: () => void) {
    const newWindow = window.open(
      url,
      MiscService.getCordova() ? "_system" : "_blank",
    );
    if (newWindow) {
      newWindow.onload = callback;
    }
  }

  static calculateDiscount(
    mrp: number,
    price: number,
    denominator = 2,
    type: "markdown" | "markup" = "markdown",
  ) {
    if (type === "markup") {
      const discountInRs = mrp - price;
      const discountInPerc = (discountInRs / price) * 100;
      return this.roundedByDecimalPlace(discountInPerc, denominator);
    }
    return CommonService.roundedByDecimalPlace(
      ((mrp - price) / mrp) * 100,
      denominator,
    );
  }

  static calculateProfit(price: number, offerPrice: number) {
    return this.roundedByDecimalPlace(offerPrice - price, 2);
  }

  static calculateDiscountedPrice(discount: number, price: number) {
    return this.roundedByDecimalPlace(price - (price * discount) / 100, 2);
  }

  /**
   * Compares a seller's selling price (B2B or B2C) against the cheapest live
   * competitor in `partnerPriceData` and returns an at-a-glance verdict the
   * price table / overview cards can render directly.
   *
   * `type`: "low" = you're cheaper than the market, "high" = you're costlier,
   * "exact" = within ₹1 of the cheapest competitor. `value` is the absolute gap
   * (0 when exact); `lowest`/`lowestName` name the competitor that set the
   * baseline. Returns null when there's no competitor data or no price to
   * compare.
   */
  static getMarketPriceComparison(
    partnerPriceData: SellerDeal["partnerPriceData"],
    price: number,
  ): {
    value: number;
    color: "green" | "red" | "gray";
    type: "low" | "high" | "exact";
    msg: string;
    lowest: number;
    lowestName: string;
  } | null {
    if (!price || !partnerPriceData) return null;

    const entries = [
      partnerPriceData.flipkart && {
        name: "Flipkart",
        price: partnerPriceData.flipkart.price,
      },
      partnerPriceData.amazon && {
        name: "Amazon",
        price: partnerPriceData.amazon.price,
      },
      partnerPriceData.other && {
        name: "Other Online Price",
        price: partnerPriceData.other.price,
      },
      ...(partnerPriceData.others || []),
    ].filter(Boolean) as { name: string; price: number }[];

    if (!entries.length) return null;

    const cheapest = entries.reduce((lo, e) =>
      Number(e.price) < Number(lo.price) ? e : lo,
    );
    const lowest = Number(cheapest.price);
    const diff = this.roundedByDecimalPlace(price - lowest, 2);

    // Within ₹1 of the cheapest marketplace — effectively at market.
    if (Math.abs(diff) < 1) {
      return {
        value: 0,
        color: "gray",
        type: "exact",
        msg: "matches",
        lowest,
        lowestName: cheapest.name,
      };
    }

    if (diff < 0) {
      return {
        value: Math.abs(diff),
        color: "green",
        type: "low",
        msg: "cheaper",
        lowest,
        lowestName: cheapest.name,
      };
    }

    return {
      value: diff,
      color: "red",
      type: "high",
      msg: "costlier",
      lowest,
      lowestName: cheapest.name,
    };
  }

  static commaSeparated(number: number) {
    return (number || 0).toLocaleString("en-IN");
  }

  /**
   * Compact figure for tight UI — chips, bar rows, sub-lines — where the full
   * comma-separated amount would wrap or crowd the label beside it.
   *
   * `indian` (default) keeps two significant decimals on the big units:
   * 22400 -> "₹22.4K", 142000 -> "₹1.42L", 35000000 -> "₹3.5Cr".
   * `short` drops the decimal once the figure is large enough not to need it,
   * in lowercase: 8300 -> "₹8.3k", 42900 -> "₹43k", 165000 -> "₹1.7L".
   *
   * Pass `prefix: ""` for plain counts (SKUs, units) and `fallback` for the
   * placeholder a zero should render as.
   */
  static formatCompact(
    value: number,
    options: {
      /** Prepended to every formatted result. Defaults to the rupee sign. */
      prefix?: string;
      /** Rounding ladder — see above. Defaults to `indian`. */
      style?: "indian" | "short";
      /** Rendered instead of a formatted zero, e.g. "—". */
      fallback?: string;
    } = {},
  ) {
    const { prefix = "₹", style = "indian", fallback } = options;
    const n = Number(value) || 0;
    const sign = n < 0 ? "-" : "";
    const abs = Math.abs(n);

    if (!abs && fallback !== undefined) {
      return fallback;
    }

    // Only strip zeros behind a decimal point — a blind trim would turn the
    // whole-number "40" into "4".
    const trim = (num: string) =>
      num.includes(".") ? num.replace(/\.?0+$/, "") : num;

    if (style === "short") {
      if (abs >= 1e5) {
        return `${sign}${prefix}${trim((abs / 1e5).toFixed(abs >= 1e6 ? 0 : 1))}L`;
      }
      if (abs >= 1e3) {
        return `${sign}${prefix}${trim((abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1))}k`;
      }
      return `${sign}${prefix}${abs.toLocaleString("en-IN")}`;
    }

    if (abs >= 1e7) return `${sign}${prefix}${trim((abs / 1e7).toFixed(2))}Cr`;
    if (abs >= 1e5) return `${sign}${prefix}${trim((abs / 1e5).toFixed(2))}L`;
    if (abs >= 1e3) return `${sign}${prefix}${trim((abs / 1e3).toFixed(1))}K`;
    return `${sign}${prefix}${Math.round(abs)}`;
  }

  /**
   * Open an exported temp file in a new tab.
   * Concats the `service` and `fileName` returned by export APIs
   * (outputType=download) with the API base url.
   */
  static downloadExportFile(service: string, fileName: string) {
    if (!service || !fileName) {
      return;
    }
    const url = `${API}${service}/dashboard/temp/${fileName}`;
    CommonService.windowOpenHandler(url, () => {});
  }

  static assetDownload(id: string, showPreview: boolean = false) {
    let url = `${ASSET}/${id}`;
    if (showPreview) {
      url += "?preview=1";
    }
    const newWindow = window.open(
      url,
      MiscService.getCordova() ? "_system" : "_blank",
    );
  }

  /**
   * Opens an external URL in a new window/tab. Uses Cordova's "_system" target
   * so links escape the webview on the mobile app.
   */
  static openInNewWindow(url?: string) {
    if (!url) return;
    window.open(
      url,
      MiscService.getCordova() ? "_system" : "_blank",
      "noopener,noreferrer",
    );
  }

  static isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  static viewOnMap(
    source: { lat: number; lng: number } | null,
    dest: { lat: number; lng: number } | null,
  ) {
    if (
      source &&
      dest &&
      source.lat != null &&
      source.lng != null &&
      dest.lat != null &&
      dest.lng != null
    ) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${source.lat},${source.lng}&destination=${dest.lat},${dest.lng}&travelmode=driving`,
      );
      return {
        success: true,
        status: "success",
      };
    } else {
      return {
        error:
          "Geolocation coordinates are not available for source or destination.",
        status: "error",
      };
    }
  }

  /**
   * Checks if a string is a valid 10-digit mobile number
   */
  static isValidMobileNo(mobile: string): boolean {
    const pattern = /^[0-9]{10}$/;
    const cleanMobile = mobile
      .toString()
      .replace(/^0{0,}/gi, "")
      .trim();
    return pattern.test(cleanMobile);
  }

  /**
   * Validates email format
   */
  static isValidEmail(email: string, allowSkEmail = true): boolean {
    const emailPattern =
      /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const isValid = emailPattern.test(email);

    if (!isValid) {
      return false;
    }

    if (allowSkEmail === false) {
      return !/@storeking\./.test(email);
    }

    return isValid;
  }

  /**
   * Validates PAN number format
   */
  static isValidPan(pan: string): boolean {
    return /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/.test(pan);
  }

  /**
   * Validates GST number format
   */
  static isValidGst(gst: string): boolean {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
      gst,
    );
  }

  /**
   * Validates pincode (6 digits)
   */
  static isValidPincode(pincode: string): boolean {
    return /^[0-9]{6}$/.test(pincode);
  }

  static isValidAadhar(val: string) {
    return /^[0-9]{12,12}$/.test(val);
  }

  /**
   * Determine price from price slab for a given quantity.
   * - `priceSlab` is optional and follows SellersArrayItem.priceSlab shape.
   * - `qty` should be the quantity present in cart (or 0/undefined when not in cart).
   * - If no matching slab is found or slab is not available, `fallbackPrice` is returned.
   */
  static getPriceFromSlab(
    priceSlab:
      | {
          isAvailable: boolean;
          slab: Array<{
            min: number;
            max: number;
            offerPrice: number;
            discount: number;
          }>;
        }
      | undefined
      | null,
    qty?: number,
    fallbackPrice: number = 0,
  ): number {
    if (
      priceSlab?.isAvailable &&
      Array.isArray(priceSlab?.slab) &&
      priceSlab?.slab?.length > 0
    ) {
      const slabs = priceSlab.slab || [];

      if (qty == null || qty <= 0) {
        return fallbackPrice;
      }

      // 1) Exact match: slab where min <= qty <= max
      const exact = slabs.find((s) => s.min <= qty && s.max >= qty);
      if (exact) return exact.offerPrice;

      // 2) Previous slab: pick the slab with highest `max` that is < qty
      const previousSlabs = slabs.filter((s) => s.max < qty);
      if (previousSlabs.length > 0) {
        const prev = previousSlabs.reduce((a, b) => (a.max > b.max ? a : b));
        return prev.offerPrice;
      }

      // 3) If qty is greater than last slab's max, return last slab's price
      const lastSlab = slabs[slabs.length - 1];
      if (lastSlab && qty > lastSlab.max) {
        return lastSlab.offerPrice;
      }

      // 4) No applicable slab found
      return fallbackPrice;
    }
    return fallbackPrice;
  }

  /**
   * Formats mobile number by removing non-digits and limiting to 10 digits
   */
  static formatMobileNo(mobile: string): string {
    return mobile.replace(/[^0-9]/g, "").substr(0, 10);
  }

  /**
   * Formats PAN to uppercase
   */
  static formatPan(pan: string): string {
    return pan.toUpperCase();
  }

  /**
   * Formats GST to uppercase
   */
  static formatGst(gst: string): string {
    return gst.toUpperCase();
  }

  static getKcBalance(
    id: string,
    type: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${API}/commission/${API_VERSION}/loyaltyPoints/account/${id}/${type}`,
      "GET",
      params,
    );
  }

  static getDelvTimeHourMin(slot: { from: number; to: number }) {
    const fromHour = Math.floor(slot.from);
    const fromMins = slot.from % 1 == 0 ? 0 : Math.round((slot.from % 1) * 100);

    const toHour = Math.floor(slot.to);
    const toMins = slot.to % 1 == 0 ? 0 : Math.round((slot.to % 1) * 100);

    return { fromHour, fromMins, toHour, toMins };
  }

  static scrollToView(el: any) {
    if (el && el.scrollIntoView) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  }

  /**
   * Get users data
   * @param params - Query parameters for filtering users
   * @returns Promise with users data
   */
  static async getUsers(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}/user/${API_VERSION}`, "GET", params);
  }

  static googleAddrCmpFormatter(addrCmp: Array<any>) {
    let state = "";
    let district = "";
    let town = "";
    let pincode = "";
    let street = "";
    let cross = "";
    let area = "";

    (addrCmp || []).forEach((x: any) => {
      const t = x.types || [];

      if (
        !area &&
        t.indexOf("sublocality_level_3") != -1 &&
        t.indexOf("sublocality") != -1
      ) {
        area = x.long_name;
      }

      if (!street && t.indexOf("street_number") != -1) {
        street = x.long_name;
      }

      if (!cross && t.indexOf("route") != -1) {
        cross = x.long_name;
      }

      if (
        (!town && t.indexOf("sublocality_level_1") != -1) ||
        t.indexOf("locality") != -1
      ) {
        town = x.long_name;
      }

      if (!district && t.indexOf("administrative_area_level_3") != -1) {
        district = x.long_name;
      }

      if (!state && t.indexOf("administrative_area_level_1") != -1) {
        state = x.long_name;
      }

      if (!pincode && t.indexOf("postal_code") != -1) {
        pincode = x.long_name;
      }
    });

    // Format line1: door no + street address
    const line1 = [street, cross].filter(Boolean).join(", ");

    // Format line2: area (excluding state, district, town, pincode)
    const line2 = area;

    return {
      state,
      district,
      town,
      pincode,
      area,
      street,
      cross,
      line1,
      line2,
    };
  }

  static async getGoogleMapPlaces(search: string) {
    const url = `${API}/customer/address/search`;

    const r = await AjaxService.request(url, "GET", {
      filter: {
        key: GOOGLE_MAP_KEY,
        fields: "formatted_address,name,geometry",
        input: encodeURI(search),
        inputtype: "textquery",
        place_id: "ChIJkbeSa_BfYzARphNChaFPjNc",
      },
    });

    return { data: r.data?.data?.candidates || [] };
  }

  /**
   * Fetch business categories (primary + linked secondary menus)
   * API: api/franchise/business-category
   */
  static async getBusinessCategories(params: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}/franchise/business-category`,
      "GET",
      params,
    );
  }

  static async getUomMasters(params: Record<string, any> = {}) {
    return AjaxService.request(`${API}/catalog/uom-masters`, "GET", params);
  }

  static async getBusinessCategoryDetails(id: string) {
    return AjaxService.request(
      `${API}/franchise/business-category/${id}`,
      "GET",
    );
  }

  public static getPdpDate(fid: string) {
    return AjaxService.request(
      `${OLD_API}/oms/${API_VERSION}/getPDPConfigByFid/${fid}`,
      "GET",
    );
  }

  public static showAppProgressBar() {
    const progressBar = document.getElementById("app-progress-bar");
    if (progressBar) {
      progressBar.classList.remove("hide");
    }
  }

  public static hideAppProgressBar() {
    const progressBar = document.getElementById("app-progress-bar");
    if (progressBar) {
      progressBar.classList.add("hide");
    }
  }

  static async getBuySellPaymentMethodConfig() {
    const imgObj: any = {
      banktransfer: "/payments/bank.svg",
      bank: "/payments/bank.svg",
      upi: "/payments/upi.svg",
      gpay: "/payments/gpay.svg",
      phonepe: "/payments/phonepe.svg",
      paytm: "/payments/paytm.svg",
    };
    const res = await AjaxService.request(
      `${API}/config/acceptingpaymentmethods`,
      "GET",
    );
    if (res?.data) {
      res.data = (res?.data || []).map((e: any) => {
        (e.data.methods || []).forEach((v: any) => {
          v._img = imgObj[v.type.toLowerCase()] || "";
        });
        return e;
      });
    }
    return res;
  }

  static calculateBeforeTax(amount: number, tax: number, type?: string) {
    const taxVal = tax / 100 + 1;
    const a = amount / taxVal;
    if (type == "withDecimal") {
      return a;
    } else {
      return this.roundedByDecimalPlace(a, 2);
    }
  }

  static isDynamicUpiEnabled() {
    const f = AuthService.getLoggedInUser();
    const d =
      (f?.services?.dynamicUPI || []).find(
        (x: any) => x.active === true && x.vpa,
      ) || {};
    const vpa = d?.vpa || "";
    return {
      status: vpa ? true : false,
      vpa: vpa || "",
    };
  }

  static copyToClipboard(msg: string) {
    navigator["clipboard"].writeText(msg);
  }

  static prepareAppliedFilterLabels(
    config: Record<string, AppliedFilterLabel>,
    formData: Record<string, any>,
  ) {
    let t: Record<string, any>[] = [];

    Object.keys(formData).forEach((x) => {
      let c = config[x] || null;
      let v = null;

      if (!c) {
        return;
      }

      // Get original value for ignoreValue check
      const originalValue = c.value?.path
        ? get(formData[x], c.value?.path as string)
        : formData[x];

      // Check if value should be ignored (before any transformation)
      if (c.ignoreValue !== undefined && originalValue === c.ignoreValue) {
        return;
      }

      if (c.value?.isMulti) {
        const co = formData[x];
        if (Array.isArray(co) && co.length > 0) {
          v = co.map((e: any) => get(e, c.value?.path || "")).join(", ");
        } else {
          v = "";
        }
      } else {
        v = c.value?.path
          ? get(formData[x], c.value?.path as string)
          : formData[x];
      }

      // for date range
      if (c.type == "dateRange") {
        if (Array.isArray(v) && v.length == 2) {
          v =
            format(v[0], c.dateFormat || "dd MMM yyyy") +
            " to " +
            format(v[1], c.dateFormat || "dd MMM yyyy");
        } else {
          v = "";
        }
      }

      // for time
      if (c.type == "time") {
        if (Array.isArray(v) && v.length == 1) {
          v = format(v[0], c.dateFormat || "hh:mm a");
        } else {
          v = null;
        }
      }

      // for date
      if (c.type == "date") {
        if (Array.isArray(v) && v.length == 1) {
          v = format(v[0], c.dateFormat || "dd MMM yyyy");
        } else {
          v = "";
        }
      }

      if (v === true || v === "true") {
        v = "Yes";
      }

      if (v === false || v === "false") {
        v = "No";
      }

      // Check if value should be ignored
      if (c.ignoreValues !== undefined) {
        const ignoreValues = Array.isArray(c.ignoreValues)
          ? c.ignoreValues
          : [c.ignoreValues];
        if (ignoreValues.includes(v)) {
          return; // Skip this filter
        }
      }

      t.push({
        label: c.label || x,
        value: v,
        key: x,
        config: c,
      });
    });
    return t.filter((x) => x.value);
  }

  static gridViewSplit(data: Array<any>, elementsPerRow: number) {
    const newArr = [];
    for (let i = 0; i < data.length; i += elementsPerRow) {
      newArr.push(data.slice(i, i + elementsPerRow));
    }
    return newArr;
  }

  static isValidPasswordCharacters(pwd: string, username: any) {
    if (!pwd) {
      return {
        status: false,
        msg: "Please provide password",
      };
    }

    let status = false;
    let msg = "";

    const startCode = pwd.charCodeAt(0);
    const str = [];
    const revStr = [];
    const entered = [];

    const minLen = 8;

    for (let i = 0; i < 3; i++) str.push(startCode + i);
    for (let r = 0; r < 3; r++) revStr.push(startCode - r);
    for (let j = 0; j < 3; j++) entered.push(pwd.charCodeAt(j));

    if (pwd.toString().length < minLen) {
      msg = "Password must have minimum " + minLen + " characters";
    } else if (/[^0-9A-z]/.test(pwd)) {
      msg = "Allowed either numbers or alphabets";
    } else if (
      str.join(",") == entered.join(",") ||
      revStr.join(",") == entered.join(",")
    ) {
      msg = "Password cannot be serialised like 123 or abc";
    } else if (username.toString().indexOf(pwd) != -1) {
      msg = "Password should not contain username characters";
    } else if (username && username == pwd) {
      msg = "Username and password cannot be same";
    } else {
      status = true;
      msg = "";
    }

    return {
      status: status,
      msg: msg,
    };
  }

  static attachOzonetelIframe() {
    let iframe: HTMLIFrameElement | null = document.getElementById(
      "ozonetelFrame",
    ) as HTMLIFrameElement;
    if (!iframe) {
      const emp = AuthService.getLoggedInUser();

      iframe = document.createElement("iframe");
      iframe.id = "ozonetelFrame";
      iframe.sandbox =
        "allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-downloads";
      iframe.allow = "geolocation; microphone; display-capture";
      // iframe.src = "https://agent.cloudagent.ozonetel.com/home";
      iframe.src = `https://agent.cloudagent.ozonetel.com/login?customer=localcube&agentid=${emp.agentId}&phoneNumber=${emp.sipId}&pin=100&action=formLogin`;
      iframe.classList.add("open");

      document.body.appendChild(iframe);

      const toggleButton = document.createElement("button");
      toggleButton.id = "ozonetelToggle";
      toggleButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="M18 15 12 9 6 15"/></svg>';
      toggleButton.style.width = "40px";
      toggleButton.style.height = "40px";
      toggleButton.style.display = "flex";
      toggleButton.style.alignItems = "center";
      toggleButton.style.justifyContent = "center";
      toggleButton.onclick = () => {
        iframe?.classList.toggle("open");
        toggleButton.innerHTML = iframe?.classList.contains("open")
          ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="M18 15 12 9 6 15"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="M6 9 12 15 18 9"/></svg>';
      };
      document.body.appendChild(toggleButton);
    }
    return iframe;
  }

  static isOzonetelLoggedIn() {
    const iframe = document.getElementById("ozonetelFrame");
    return iframe !== null;
  }

  static getStates() {
    return AjaxService.request(`${API}/franchise/config/states`, "GET");
  }

  static getDistricts(stateId: string) {
    return AjaxService.request(
      `${API}/franchise/config/states/${stateId}/districts`,
      "GET",
    );
  }

  static getSubdistricts(stateId: string, districtId: string) {
    return AjaxService.request(
      `${API}/franchise/config/states/${stateId}/districts/${districtId}/subdistricts`,
      "GET",
    );
  }

  static prepareAlphaRegexFilter(alpha: string) {
    return {
      $regex: "^" + (alpha === "123" ? "\\d+" : alpha),
      $options: "i",
    };
  }

  /**
   * Initials for avatar/chip displays — first letter of each word, capped at
   * `length` characters. Falls back to "#" when there is nothing to take.
   * e.g. ("Sri Balaji Traders", 3) -> "SBT", ("Sri Balaji Traders") -> "SB".
   */
  static prepareInitials(name: string = "", length: number = 2) {
    return (
      String(name)
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .slice(0, length)
        .toUpperCase() || "#"
    );
  }

  static prepareAppDocumentTitle(title: string) {
    return `${title} - StoreKing - Transforming Small Town Kiranas into Digital SuperMarkets`;
  }

  static prepareWhatsappMessage(message: string, waNumber: string) {
    const waUrl = waNumber
      ? `https://api.whatsapp.com/send/?phone=${waNumber}&text=${encodeURIComponent(
          message,
        )}`
      : `https://api.whatsapp.com/send/?text=${encodeURIComponent(message)}`;

    return waUrl;
  }

  static getGstOptions() {
    return [
      { label: "Select GST Rate", value: "all" },
      { label: "0%", value: "0" },
      { label: "3%", value: "3" },
      { label: "5%", value: "5" },
      { label: "12%", value: "12" },
      { label: "18%", value: "18" },
      { label: "28%", value: "28" },
      { label: "33%", value: "33" },
      { label: "40%", value: "40" },
      { label: "64%", value: "64" },
    ];
  }

  static async getGoogleDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
  ) {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return { distance: 0, roundedDistance: 0 };
    }

    const url = `${API}/customer/getDistanceByLatLong/fetch`;

    const r = await AjaxService.request(url, "GET", {
      filter: {
        destinations: destination.lat + "," + destination.lng,
        origins: origin.lat + "," + origin.lng,
        units: "imperial",
        key: GOOGLE_MAP_KEY,
      },
    });
    const d = await r?.data?.data;
    const k = get(d, "rows[0].elements[0].distance.value", 0) / 1000;
    return { distance: k, roundedDistance: this.roundedByDecimalPlace(k, 2) };
  }

  static getVoiceSearchLangs() {
    return [
      { key: "en-US", label: "English" },
      { key: "hi-IN", label: "Hindi" },
      { key: "ta-IN", label: "Tamil" },
      { key: "te-IN", label: "Telugu" },
      { key: "kn-IN", label: "Kannada" },
      { key: "ml-IN", label: "Malayalam" },
    ];
  }

  static getVoiceLang(): string | null {
    try {
      const v = StorageService.get("vlng");
      return typeof v === "string" ? v : null;
    } catch (e) {
      console.debug("getVoiceLang error", e);
    }
    return null;
  }

  /**
   * Save the voice language key to localStorage under key 'vlng'.
   */
  static setVoiceLang(lang: string) {
    try {
      StorageService.set("vlng", lang);
    } catch (e) {
      console.debug("setVoiceLang error", e);
    }
  }

  static formatGroupDealData(
    dealId: string | null = null,
    data: {
      name: string;
      groupedDeals: Array<{
        id: string;
        dealObjId: string;
        quantity: number;
        dealName: string;
        subscribed: boolean;
        csaAttr: Array<{
          name: string;
          value: string;
        }>;
      }>;
    },
    ignoreSubscribed: boolean = false,
  ) {
    if (data.groupedDeals.length === 0) {
      return [];
    }

    // filter out subscribed items if requested
    let subscribedData = data.groupedDeals.filter((x) =>
      ignoreSubscribed ? x.subscribed === false : true,
    );

    // If the resulting formatted group would have only one deal, and a dealId
    // is provided, ignore the entry that has the same dealId.
    if (dealId && subscribedData.length === 1) {
      subscribedData = subscribedData.filter((x) => x.id !== dealId);
    }

    if (subscribedData.length === 0) {
      return [];
    }

    const name = data?.name || "";

    return [
      {
        name: name,
        values: subscribedData.map((x) => {
          const csaAttr = (x.csaAttr || []).filter(Boolean);
          return {
            dealId: x.id,
            _id: x.dealObjId,
            name: x.dealName,
            quantity: x.quantity,
            csa: csaAttr.find((e: any) => e.name === name)?.value || "",
            isSubscribed: x.subscribed,
            groupedOn: name,
          };
        }),
      },
    ];
  }

  static async generateBarcode(params: {
    dealId: string;
    quantity?: number;
    format?: string;
  }) {
    return AjaxService.request(
      `${API}/catalog/barcodes/generate`,
      "POST",
      params,
    );
  }

  static async getAiImgInfo(imgUrl: Array<string> = []) {
    const r = await AjaxService.request(
      `${API}/catalog/product-extractor/extract`,
      "POST",
      {
        imageUrls: imgUrl,
        model: "gemini-3-flash-preview",
        systemInstruction:
          "You are an expert product information extractor. Given product images, you need to extract product details in JSON format.",
        extractionPrompt: "",
      },
    );

    return r;
  }

  /**
   * Scan invoice image using AI invoice scanner.
   *
   * - When `isFileObj` is **false** (default), it behaves like before:
   *   sends `{ fileUrls }` as JSON.
   * - When `isFileObj` is **true**, it converts each image URL into a `File`
   *   object and sends them as multipart/form-data.
   */
  static async scanInvoice(fileUrls: string[], isFileObj: boolean = false) {
    // Legacy behaviour: send JSON payload with URLs.
    if (!isFileObj) {
      return AjaxService.request(`${API}/catalog/invoice/scan`, "POST", {
        fileUrls,
      });
    }

    // New behaviour: convert URLs to File objects and send as FormData.
    const files = await Promise.all(
      (fileUrls || []).map(async (url, index) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const nameFromUrl = url.split("?")[0].split("/").pop() || "";
        const filename =
          nameFromUrl ||
          `invoice-${index + 1}.${(blob.type || "image/jpeg").split("/").pop()}`;
        return new File([blob], filename, {
          type: blob.type || "image/jpeg",
        });
      }),
    );

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("file", file);
    });

    return AjaxService.request(`${API}/catalog/invoice/scan`, "POST", formData);
  }

  static async cloneDailyDeliveryTimeSlot(payload: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}/franchise/deliverytimeslot/config/internal/clone-daily`,
      "POST",
      payload,
    );
  }

  static priceBeforeTax(price: number, tax: number) {
    return price - (price * tax) / 100;
  }

  static priceAfterTax(price: number, tax: number) {
    return price + (price * tax) / 100;
  }

  static calculateScheme(
    b2bPrice: number, // Current B2B inclusive price (e.g. 171)
    discount: number, // Scheme discount % (e.g. 12)
    isTaxInclusive: boolean, // Is b2bPrice already including tax?
    tax: number, // Tax rate % (e.g. 64 or 40)
    purchasePrice: number, // Your cost / purchase price (for profit calc)
    fixedCess: number = 0, // NEW: fixed additional cess/excise (e.g. 66.72)
  ): {
    offerPrice: string;
    profit: string;
  } {
    const discRate = discount / 100;
    const taxRate = tax / 100;

    let variablePortion: number; // part we can discount (ex-cess)

    // Step 1: Isolate the variable (tax-affected) portion
    if (fixedCess > 0) {
      // Fixed cess case: remove cess first
      variablePortion = b2bPrice - fixedCess;
    } else {
      // No cess: whole B2B price is variable
      variablePortion = b2bPrice;
    }

    // Step 2: Get the before-tax base from the variable portion
    // b2bPrice is always tax-inclusive, so always extract the base
    const basePrice = variablePortion / (1 + taxRate);

    // Step 3: Apply discount on the base (before tax)
    const discountAmount = basePrice * discRate;
    const netBase = basePrice - discountAmount; // or basePrice * (1 - discRate)

    // Step 4: Re-compute the offer price
    let offerPriceValue: number;
    if (isTaxInclusive) {
      // afterTax: discount applied on the full price (including tax + cess)
      offerPriceValue = b2bPrice * (1 - discRate);
    } else {
      // beforeTax: discount applied on the base (excl. tax & cess), then re-add tax + cess
      offerPriceValue = netBase * (1 + taxRate) + fixedCess;
    }

    // Step 6: Calculate profit (based on offer price and purchase price)
    const profitValue = offerPriceValue - purchasePrice;

    return {
      offerPrice: offerPriceValue.toFixed(2),
      profit: profitValue.toFixed(2),
    };
  }

  static getMonthyTurnoverOptions() {
    return [
      { label: "Less than ₹1 Lakh", value: "Less than ₹1 Lakh" },
      { label: "₹1 Lakh to ₹5 Lakh", value: "₹1 Lakh - ₹5 Lakh" },
      { label: "₹5 Lakh to ₹10 Lakh", value: "₹5 Lakh - ₹10 Lakh" },
      { label: "₹10 Lakh to ₹20 Lakh", value: "₹10 Lakh - ₹20 Lakh" },
      { label: "₹20 Lakh to ₹50 Lakh", value: "₹20 Lakh - ₹50 Lakh" },
      { label: "₹50 Lakh to ₹1 Crore", value: "₹50 Lakh - ₹1 Crore" },
      { label: "₹1 Crore to ₹5 Crore", value: "₹1 Crore - ₹5 Crore" },
      { label: "More than ₹5 Crore", value: "More than ₹5 Crore" },
    ].map((x) => ({
      label: x.label,
      value: x.value,
      langKey: x.label,
    }));
  }

  static getYearsOfExperienceOptions() {
    return [
      { label: "Less than 1 Year", value: "Less than 1 year" },
      { label: "1 Year to 5 Years", value: "1 year - 5 years" },
      { label: "5 Years to 10 Years", value: "5 years - 10 years" },
      { label: "10 Years to 20 Years", value: "10 years - 20 years" },
      { label: "More than 20 Years", value: "More than 20 years" },
    ].map((x) => ({
      label: x.label,
      value: x.value,
      langKey: x.label,
    }));
  }

  static getPendingConfirmationCodes(
    receiverId: string,
    params: Record<string, any> = {},
  ) {
    return AjaxService.request(
      `${API}notification/confirmation-codes/receiver/${receiverId}`,
      "GET",
      {
        filter: { status: "PENDING" },
        sort: { createdAt: -1 },
        ...params,
      },
    );
  }

  static rejectConfirmationCode(id: string, payload: Record<string, any> = {}) {
    return AjaxService.request(
      `${API}notification/confirmation-codes/${id}/reject`,
      "PUT",
      payload,
    );
  }

  /**
   * Group an array of { uom, qty } entries by uom family and return a
   * human-readable label. Lower units (gm, ml) are converted to their higher
   * counterpart (kg, l) when the total reaches >= 1000.
   *
   * eg. [{uom:"unit", qty:10}, {uom:"unit", qty:1}, {uom:"gm", qty:5000}]
   *     => { label: "11 units, 5 kg", groups: [...] }
   */
  static groupQtyByUom(items: Array<{ uom: string; qty: number }> = []): {
    label: string;
    groups: Array<{ uom: string; qty: number; display: string }>;
  } {
    console.log(items);
    const families: Record<
      string,
      { base: string; higher: string; factor: number }
    > = {
      gm: { base: "gm", higher: "kg", factor: 1000 },
      g: { base: "gm", higher: "kg", factor: 1000 },
      kg: { base: "gm", higher: "kg", factor: 1000 },
      ml: { base: "ml", higher: "l", factor: 1000 },
      l: { base: "ml", higher: "l", factor: 1000 },
      ltr: { base: "ml", higher: "l", factor: 1000 },
    };

    // Aggregate totals in the base unit per family (or per uom if no family).
    const totals: Record<string, number> = {};

    (items || []).forEach((item) => {
      if (!item || !item.uom) return;
      const key = item.uom.toLowerCase().trim();
      const qty = Number(item.qty) || 0;
      const fam = families[key];

      if (fam) {
        const baseQty = key === fam.higher ? qty * fam.factor : qty;
        totals[fam.base] = (totals[fam.base] || 0) + baseQty;
      } else {
        totals[key] = (totals[key] || 0) + qty;
      }
    });

    const groups: Array<{ uom: string; qty: number; display: string }> = [];

    Object.keys(totals).forEach((key) => {
      const total = totals[key];
      if (!total) return;

      const famEntry = Object.values(families).find((f) => f.base === key);

      if (famEntry && total >= famEntry.factor) {
        const higherQty = CommonService.roundedByDecimalPlace(
          total / famEntry.factor,
          3,
        );
        groups.push({
          uom: famEntry.higher,
          qty: higherQty,
          display: `${higherQty} ${famEntry.higher}`,
        });
      } else {
        const rounded = CommonService.roundedByDecimalPlace(total, 3);
        const unitLabel =
          key === "unit" || key === "units" || key === "pcs" || key === "pc"
            ? rounded === 1
              ? "unit"
              : "units"
            : key;
        groups.push({
          uom: key,
          qty: rounded,
          display: `${rounded} ${unitLabel}`,
        });
      }
    });

    return {
      label: groups.map((g) => g.display).join(", "),
      groups,
    };
  }

  /**
   * Decide whether the "Model" input should be shown for a given product
   * category. Currently model is only relevant for electronics.
   */
  static shouldShowModelInput(categoryName?: string | null): boolean {
    if (!categoryName) return false;
    return categoryName.toLowerCase().includes("electronic");
  }

  static getNextDay(days: string[], currentDay: string) {
    const week = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];

    const currentIndex = week.indexOf(currentDay.toLowerCase());

    // Sort days based on weekly order
    const sortedDays = days
      .map((day) => day.toLowerCase())
      .sort((a, b) => week.indexOf(a) - week.indexOf(b));

    // Find first day after current day
    for (let day of sortedDays) {
      if (week.indexOf(day) > currentIndex) {
        return day;
      }
    }

    // If none found, wrap to first available day
    return sortedDays[0];
  }

  /**
   * Desktop (>=1024px) slides-per-view for the product carousels on the
   * buy-from-SK / buy-from-network pages. Theme-aware so theme-2 shows more
   * cards per view because its left/right rails are hidden, giving the main
   * content more width.
   */
  static getDesktopPerView(theme: string): number {
    return theme === "theme-2" ? 6 : 5.5;
  }
}
