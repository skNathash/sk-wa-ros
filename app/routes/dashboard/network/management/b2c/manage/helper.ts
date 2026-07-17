import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

export const defaultFormData = {
  name: "",
  mobile: "",
  gender: "",
  email: "",
  address: "",
  pincode: "",
  state: "",
  district: "",
  town: "",
  verifyWithOtp: false,
};

export const preparePayload = (data: any) => {
  const user = AuthService.getLoggedInUser();

  const payload: Record<string, any> = {
    name: data.name.trim(),
    mobile: data.mobile.trim(),
    email: data.email.trim(),
    address: {
      city: data.city || data.town || user?.city || user?.town || "",
      state: data.state || user?.state || "",
      postcode: data.pincode || user?.pincode || "",
      district: data.district || user?.district || "",
      landmark: "",
    },
  };

  // Remove empty address fields
  if (!payload.address.state) {
    delete payload.address.state;
  }
  if (!payload.address.postcode) {
    delete payload.address.postcode;
  }
  if (!payload.address.district) {
    delete payload.address.district;
  }
  if (!payload.address.city) {
    delete payload.address.city;
  }

  if (data.gender) {
    payload.gender = data.gender;
  }

  return payload;
};

export const validateForm = (data: any, t: any) => {
  let msg = "";

  // Name validation
  if (!data.name?.trim()) {
    msg = t("pleaseProvideCustomerName");
  }
  // Mobile validation
  else if (!data.mobile?.trim()) {
    msg = t("pleaseProvideMobile");
  } else if (!CommonService.isValidMobileNo(data.mobile)) {
    msg = t("pleaseProvideValidMobile");
  }
  // Pincode validation
  else if (
    data.pincode?.trim() &&
    !CommonService.isValidPincode(data.pincode)
  ) {
    msg = t("pleaseProvideValidPincode");
  }

  return {
    status: !msg,
    msg: msg,
  };
};
