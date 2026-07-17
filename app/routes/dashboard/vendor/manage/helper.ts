import AuthService from "~/services/AuthService";
import type { VendorFormData, VendorPayload } from "~/types/VendorTypes";
import CommonService from "~/services/CommonService";
import { useTranslation } from "react-i18next";

export const preparePayload = (
  data: VendorFormData,
  selectedBrands: any[],
  pincodeData: { city: string; state: string; district: string }
): VendorPayload => {
  const documents = [];
  if (data.panImg) {
    documents.push({
      type: "PAN",
      refNo: data.pan || "",
      assetId: data.panImg,
      status: "Active",
    });
  }
  if (data.gstImg) {
    documents.push({
      type: "GST",
      refNo: data.gst || "",
      assetId: data.gstImg,
      status: "Active",
    });
  }
  if (data.cancelChqImg) {
    documents.push({
      type: "Cancel Cheque",
      refNo: "",
      assetId: data.cancelChqImg,
      status: "Active",
    });
  }

  // Prepare brands payload
  let sourceableBrands: { id: string; brandId: string; brandName: string }[] =
    [];
  if (data.sourceAllBrands) {
    sourceableBrands = [];
  } else {
    sourceableBrands = selectedBrands.map((b) => ({
      id: b.value?.objId,
      brandId: b.value?.id,
      brandName: b.value?.name,
    }));
  }

  // Address structure similar to employee/manage/index
  const address = {
    doorNo: data.doorNo || "",
    street: data.addressLine1 || "",
    district: data.district || pincodeData.district || "",
    city: data.town || pincodeData.city || "",
    town: data.town || pincodeData.city || "",
    state: data.state || pincodeData.state || "",
    postcode: data.pincode || "",
    landmark: data.landmark || "",
  };

  // Prepare contact object - only include email if it exists
  const contactObj: any = {
    name: data.contactName,
    mobile: data.contactMobile,
    designation: "Owner",
    isOwner: true,
  };

  // Only add email key if email is provided
  if (data.contactEmail && data.contactEmail.trim()) {
    contactObj.email = data.contactEmail;
  }

  const payload: VendorPayload = {
    name: data.vendorName,
    address,
    pan: data.pan,
    gst_no: data.gst,
    // aadharNo: data.aadharNo || "",
    vendorType: "Wholesaler",
    contact: [contactObj],
    documents: documents,
    franchise: {
      name: AuthService.getLoggedInUser().name,
      id: AuthService.getLoggedInUserId() || "",
    },
    sourceableBrands,
    sourceAllBrands: data.sourceAllBrands,
    mobile: data.contactMobile,
    geoPoint: {
      coordinates: [data.lng || 0, data.lat || 0],
    },
  };

  return payload;
};

export const defaultFormData = {
  vendorName: "",
  doorNo: "",
  addressLine1: "",
  landmark: "",
  pincode: "",
  state: "",
  district: "",
  town: "",
  contactName: "",
  contactMobile: "",
  contactEmail: "",
  pan: "",
  gst: "",
  aadharNo: "",
  panImg: "",
  gstImg: "",
  cancelChqImg: "",
  sourceAllBrands: false,
  verifyWithOtp: false,
  lat: null,
  lng: null,
};

export interface VendorValidationResult {
  status: boolean;
  msg: string;
}

export const validateForm = (data: any, t: any): VendorValidationResult => {
  let msg = "";

  // Basic info validation
  if (!data.vendorName?.trim()) {
    msg = t("pleaseProvideVendorName");
  } else if (!data.addressLine1?.trim()) {
    msg = t("pleaseProvideStreetAddress");
  } else if (!data.pincode) {
    msg = t("pleaseProvidePincode");
  } else if (!CommonService.isValidPincode(data.pincode)) {
    msg = t("pleaseProvideValidPincode");
  } else if (!data.contactName?.trim()) {
    msg = t("pleaseProvideContactName");
  } else if (
    data.contactEmail &&
    !CommonService.isValidEmail(data.contactEmail, false)
  ) {
    msg = t("pleaseProvideValidContactEmail");
  } else if (!data.contactMobile) {
    msg = t("pleaseProvideContactMobileNumber");
  } else if (!CommonService.isValidMobileNo(data.contactMobile)) {
    msg = t("pleaseProvideValidContactMobileNumber");
  }

  // Location validation
  else if (
    !data.state ||
    (typeof data.state === "string" && !data.state.trim())
  ) {
    msg = t("pleaseSelectState");
  } else if (
    !data.district ||
    (typeof data.district === "string" && !data.district.trim())
  ) {
    msg = t("pleaseSelectDistrict");
  } else if (
    !data.town ||
    (typeof data.town === "string" && !data.town.trim())
  ) {
    msg = t("pleaseSelectTown");
  }

  // Ensure geographic coordinates are provided (lat & lng)
  else if (data.lat == null || data.lng == null) {
    // Use a translation key consistent with other prompts. If the key is
    // missing in translations, the key string will be shown which is fine
    // until translations are added.
    msg = t("pleaseSelectLocationOnMap") || t("pleaseProvideLocation");
  }

  // Document validation (only if basic validation passes)
  if (!msg) {
    // PAN logic
    if (data.panImg && !data.pan?.trim()) {
      msg = t("pleaseProvidePanNumber");
    } else if (data.pan?.trim()) {
      if (!CommonService.isValidPan(data.pan)) {
        msg = t("pleaseProvideValidPanNo");
      } else if (!data.panImg) {
        msg = t("pleaseUploadPanPhoto");
      }
    }

    // GST logic
    if (!msg && data.gstImg && !data.gst?.trim()) {
      msg = t("pleaseProvideGstNumber");
    } else if (!msg && data.gst?.trim()) {
      if (!CommonService.isValidGst(data.gst)) {
        msg = t("pleaseProvideValidGstNo");
      } else if (!data.gstImg) {
        msg = t("pleaseUploadGstPhoto");
      }
    }

    // Cancel Cheque is not mandatory
  }

  return {
    status: !msg,
    msg: msg,
  };
};
