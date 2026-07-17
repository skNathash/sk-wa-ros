import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

function makeIsoDate1970(time?: string, ms = "008") {
  if (!time || typeof time !== "string") return null;
  // expect time in HH:mm format; we rely on validate() earlier
  return `1970-01-01T${time}:00.${ms}+05:30`;
}

interface FormData {
  storeName?: string;
  mobile?: string;
  email?: string;
  ownerName?: string;
  primaryBusiness?: string;
  gstNumber?: string;
  pincode?: string;
  pincodeData?: {
    city?: string;
    state?: string;
    district?: string;
  };
  state?: string;
  district?: string;
  town?: string;
  door_no?: string;
  street?: string;
  locality?: string;
  storeOpenTime?: string;
  storeCloseTime?: string;
  [key: string]: any;
}

interface ValidationResult {
  msg: string;
  status: boolean;
}

interface Payload {
  otpId?: string;
  otp?: string;
  franType?: string;
  email?: string;
  shop_details?: {
    geolocation?: {
      weekly_off_days: any[];
      geolocationStatus: string;
      type: string;
      coordinates: number[];
    };
    open_time?: string;
    close_time?: string;
  };
  sk_franchise_details?: {
    franchise_type?: string;
    franchise_sub_type?: string;
    mandatory_documents?: {
      address: any[];
      photo: any[];
      business: any[];
    };
  };
  name?: string;
  address?: {
    door_no?: string;
    street?: string;
    landmark?: string;
    full_address?: string;
  };
  state?: string;
  district?: string;
  town?: string;
  locality?: string;
  pincode?: number;
  primary_business?: string;
  primary_business_id?: string;
  contact_details?: Array<{
    isOwner?: boolean;
    name?: string;
    mobile?: number;
    email?: string;
  }>;
  daily_limit?: number;
  services?: {
    defined?: boolean;
  };
  OwnerMobileNo?: number;
  finance_details?: {
    gstNo?: string;
  };
  fssai?: {
    hasLicense?: boolean;
    docs?: any[];
    licenseNo?: string;
    views?: number;
  };
  referralInfo?: {
    referrerReferralCode?: string;
    type?: string;
  };
  connectedSellerIds?: any[];
  shop_photos?: any[];
  bankStatements?: any[];
  distributorKyc?: {
    qualification?: string;
  };
  transaction_limit?: number;
  registrationFrom?: string;
  monthlyTurnOver?: string;
  yearsOfExperience?: string;
  networkType?: string;
}

/**
 * Prepares the payload for B2B retailer submission based on form data
 * @param formData - The form data from react-hook-form
 * @returns The prepared payload object
 */
export const prepareB2bRetailerPayload = (
  formData: FormData,
  businessMap?: Record<string, string>,
): Payload => {
  const payload: Payload = {
    daily_limit: 100000,
    franType: "SFSELLER",
    transaction_limit: 100000,
  };

  if (AuthService.isSkSeller()) {
    payload.networkType = "SKBUYER";
  }

  // Basic information - name should be owner name (prioritize ownerName over storeName)
  if (formData.storeName) {
    payload.name = formData.storeName;
  }

  if (formData.primaryBusiness) {
    // keep id for server side and also send human readable name
    payload.primary_business_id = formData.primaryBusiness;
    payload.primary_business =
      businessMap?.[formData.primaryBusiness] || formData.primaryBusiness;
  }

  // Address information
  if (formData.door_no || formData.street) {
    payload.address = {};
    if (formData.door_no) {
      payload.address.door_no = formData.door_no;
    }
    if (formData.street) {
      payload.address.street = formData.street;
    }
    // Build full_address from door_no and street
    const addressParts = [formData.door_no, formData.street]
      .filter(Boolean)
      .join(" ");
    if (addressParts) {
      payload.address.full_address = addressParts;
    }
  }

  if (formData.state) {
    payload.state = formData.state;
  }

  if (formData.district) {
    payload.district = formData.district;
  }

  if (formData.town) {
    payload.town = formData.town;
  }

  if (formData.locality) {
    payload.locality = formData.locality;
  }

  if (formData.pincode) {
    const pincodeNum = parseInt(formData.pincode, 10);
    if (!isNaN(pincodeNum)) {
      payload.pincode = pincodeNum;
    }
  }

  // Contact details
  if (formData.mobile) {
    const mobileNum = parseInt(formData.mobile, 10);
    if (!isNaN(mobileNum)) {
      payload.OwnerMobileNo = mobileNum;
      payload.contact_details = [
        {
          isOwner: true,
          name: formData.ownerName || formData.storeName || "",
          mobile: mobileNum,
          email: formData.email?.trim() || "",
        },
      ];
    }
  }

  // Finance details
  if (formData.gstNumber !== undefined) {
    payload.finance_details = {
      gstNo: formData.gstNumber || "",
    };
  }

  // Default geolocation structure (as per sample payload)
  // Determine coordinates from form (support both lat/lng and latitude/longitude)
  const latVal = formData.latitude ?? null;
  const lngVal = formData.longitude ?? null;

  // Prepare shop details with optional timing
  const shopDetails: any = {
    geolocation: {
      weekly_off_days: [],
      geolocationStatus: "Pending",
      type: "Point",
      // Keep same ordering as signup payload: [lat, lng] fallback to 0
      coordinates: [latVal || 0, lngVal || 0],
    },
  };

  if (formData.storeOpenTime && formData.storeOpenTime.trim()) {
    const openTime = makeIsoDate1970(formData.storeOpenTime, "008");
    if (openTime) {
      shopDetails.open_time = openTime;
    }
  }

  if (formData.storeCloseTime && formData.storeCloseTime.trim()) {
    const closeTime = makeIsoDate1970(formData.storeCloseTime, "010");
    if (closeTime) {
      shopDetails.close_time = closeTime;
    }
  }

  payload.shop_details = shopDetails;

  // Default franchise details structure
  payload.sk_franchise_details = {
    franchise_type: "SF",
    franchise_sub_type: "SFSELLER",
    mandatory_documents: {
      address: [],
      photo: [],
      business: [],
    },
  };

  // Default services
  payload.services = {
    defined: false,
  };

  // Default FSSAI
  payload.fssai = {
    hasLicense: false,
    docs: [],
    licenseNo: "",
    views: 1,
  };

  // Default referral info
  payload.referralInfo = {
    referrerReferralCode: "",
    type: "",
  };

  // Default arrays
  payload.connectedSellerIds = [];
  payload.shop_photos = [];
  payload.bankStatements = [];

  // Default distributor KYC
  payload.distributorKyc = {
    qualification: "",
  };

  // Default registration from
  payload.registrationFrom = "CLUB";

  // Default monthly turnover
  payload.monthlyTurnOver = formData.monthlyTurnover;

  // Default years of experience
  payload.yearsOfExperience = formData.yearsOfExperience;

  return payload;
};

export const validateStoreDetails = (formData: FormData): ValidationResult => {
  // Validate mobile number
  if (!formData.mobile || formData.mobile.trim() === "") {
    return {
      msg: "Please provide mobile number",
      status: false,
    };
  } else {
    if (!CommonService.isValidMobileNo(formData.mobile)) {
      return {
        msg: "pleaseProvideValidContactMobileNumber",
        status: false,
      };
    }
  }

  // Validate store name
  if (!formData.storeName || formData.storeName.trim() === "") {
    return {
      msg: "pleaseProvideStoreName",
      status: false,
    };
  }

  // Validate owner name
  if (!formData.ownerName || formData.ownerName.trim() === "") {
    return {
      msg: "pleaseProvideOwnerName",
      status: false,
    };
  }

  //primary business validation
  if (formData.primaryBusiness === "choose" || !formData.primaryBusiness) {
    return {
      msg: "pleaseSelectPrimaryBusiness",
      status: false,
    };
  }

  // Validate monthly turnover
  if (formData.monthlyTurnover === "choose" || !formData.monthlyTurnover) {
    return {
      msg: "pleaseProvideMonthlyTurnover",
      status: false,
    };
  }

  // Validate years of experience
  if (formData.yearsOfExperience === "choose" || !formData.yearsOfExperience) {
    return {
      msg: "pleaseProvideYearsOfExperience",
      status: false,
    };
  }

  // Validate email
  if (formData.email && formData.email.trim() !== "") {
    if (!CommonService.isValidEmail(formData.email, false)) {
      return {
        msg: "pleaseProvideValidEmail",
        status: false,
      };
    }
  }

  return {
    msg: "",
    status: true,
  };
};

export const validateStoreTimings = (formData: FormData): ValidationResult => {
  // Validate GST number if provided
  if (formData.gstNumber && formData.gstNumber.trim() !== "") {
    if (!CommonService.isValidGst(formData.gstNumber)) {
      return {
        msg: "pleaseProvideValidGstNo",
        status: false,
      };
    }
  }

  // Validate store open time
  if (!formData.storeOpenTime || formData.storeOpenTime.trim() === "") {
    return {
      msg: "pleaseSelectStoreOpenTime",
      status: false,
    };
  }

  // Validate store close time
  if (!formData.storeCloseTime || formData.storeCloseTime.trim() === "") {
    return {
      msg: "pleaseSelectStoreCloseTime",
      status: false,
    };
  }

  // Validate that close time is after open time if both are provided
  if (
    formData.storeOpenTime &&
    formData.storeCloseTime &&
    formData.storeOpenTime.trim() !== "" &&
    formData.storeCloseTime.trim() !== ""
  ) {
    try {
      const open = new Date(`2000-01-01T${formData.storeOpenTime}:00`);
      const close = new Date(`2000-01-01T${formData.storeCloseTime}:00`);
      if (!(close > open)) {
        return {
          msg: "closingTimeMustBeAfterOpeningTime",
          status: false,
        };
      }
    } catch (e) {
      return {
        msg: "pleaseProvideValidTimeFormat",
        status: false,
      };
    }
  }

  return {
    msg: "",
    status: true,
  };
};

export const validateStoreAddress = (formData: FormData): ValidationResult => {
  // Validate latitude and longitude
  if (!formData.latitude || !formData.longitude) {
    return {
      msg: "Please select location on map",
      status: false,
    };
  }

  // Validate pincode
  if (!formData.pincode || formData.pincode.trim() === "") {
    return {
      msg: "pleaseProvidePincode",
      status: false,
    };
  } else {
    if (!CommonService.isValidPincode(formData.pincode)) {
      return {
        msg: "pleaseProvideValidPincode",
        status: false,
      };
    }
  }

  // Validate door_no
  if (!formData.door_no || formData.door_no.trim() === "") {
    return {
      msg: "pleaseProvideDoorNo",
      status: false,
    };
  }

  // Validate street
  if (!formData.street || formData.street.trim() === "") {
    return {
      msg: "pleaseProvideStreet",
      status: false,
    };
  }

  // Validate state
  if (!formData.state || formData.state.trim() === "") {
    return {
      msg: "pleaseSelectState",
      status: false,
    };
  }

  // Validate district
  if (!formData.district || formData.district.trim() === "") {
    return {
      msg: "pleaseSelectDistrict",
      status: false,
    };
  }

  // Validate town
  if (!formData.town || formData.town.trim() === "") {
    return {
      msg: "pleaseSelectTown",
      status: false,
    };
  }

  return {
    msg: "",
    status: true,
  };
};

/**
 * Validates form fields one at a time using if-else conditions
 * @param formData - The form data to validate
 * @returns Validation result with msg and status
 */
export const validateB2bRetailerForm = (
  formData: FormData,
): ValidationResult => {
  // Validate mobile number
  if (!formData.mobile || formData.mobile.trim() === "") {
    return {
      msg: "pleaseProvideContactMobileNumber",
      status: false,
    };
  } else {
    if (!CommonService.isValidMobileNo(formData.mobile)) {
      return {
        msg: "pleaseProvideValidContactMobileNumber",
        status: false,
      };
    }
  }

  // Validate store name
  if (!formData.storeName || formData.storeName.trim() === "") {
    return {
      msg: "pleaseProvideStoreName",
      status: false,
    };
  }

  // Validate owner name
  if (!formData.ownerName || formData.ownerName.trim() === "") {
    return {
      msg: "pleaseProvideOwnerName",
      status: false,
    };
  }

  // Validate primary business
  if (!formData.primaryBusiness || formData.primaryBusiness.trim() === "") {
    return {
      msg: "pleaseSelectPrimaryBusiness",
      status: false,
    };
  }

  // Validate GST number if provided
  if (formData.gstNumber && formData.gstNumber.trim() !== "") {
    if (!CommonService.isValidGst(formData.gstNumber)) {
      return {
        msg: "pleaseProvideValidGstNo",
        status: false,
      };
    }
  }

  // Validate store open time if provided
  if (formData.storeOpenTime && formData.storeOpenTime.trim() !== "") {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.storeOpenTime)) {
      return {
        msg: "pleaseProvideValidTimeFormat",
        status: false,
      };
    }
  }

  // Validate store close time if provided
  if (formData.storeCloseTime && formData.storeCloseTime.trim() !== "") {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.storeCloseTime)) {
      return {
        msg: "pleaseProvideValidTimeFormat",
        status: false,
      };
    }
  }

  // Validate that close time is after open time if both are provided
  if (
    formData.storeOpenTime &&
    formData.storeCloseTime &&
    formData.storeOpenTime.trim() !== "" &&
    formData.storeCloseTime.trim() !== ""
  ) {
    try {
      const open = new Date(`2000-01-01T${formData.storeOpenTime}:00`);
      const close = new Date(`2000-01-01T${formData.storeCloseTime}:00`);
      if (!(close > open)) {
        return {
          msg: "closingTimeMustBeAfterOpeningTime",
          status: false,
        };
      }
    } catch (e) {
      return {
        msg: "pleaseProvideValidTimeFormat",
        status: false,
      };
    }
  }

  // Validate pincode
  if (!formData.pincode || formData.pincode.trim() === "") {
    return {
      msg: "pleaseProvidePincode",
      status: false,
    };
  } else {
    if (!CommonService.isValidPincode(formData.pincode)) {
      return {
        msg: "pleaseProvideValidPincode",
        status: false,
      };
    }
  }

  // Validate door_no
  if (!formData.door_no || formData.door_no.trim() === "") {
    return {
      msg: "pleaseProvideDoorNo",
      status: false,
    };
  }

  // Validate street
  if (!formData.street || formData.street.trim() === "") {
    return {
      msg: "pleaseProvideStreet",
      status: false,
    };
  }

  // Validate state (from pincode data)
  if (!formData.state || formData.state.trim() === "") {
    return {
      msg: "pleaseProvideState",
      status: false,
    };
  }

  // Validate district (from pincode data)
  if (!formData.district || formData.district.trim() === "") {
    return {
      msg: "pleaseProvideDistrict",
      status: false,
    };
  }

  // Validate town (from pincode data)
  if (!formData.town || formData.town.trim() === "") {
    return {
      msg: "pleaseProvideTown",
      status: false,
    };
  }

  // All validations passed
  return { msg: "", status: true };
};
