export interface VendorFormData {
  vendorName: string;
  doorNo: string;
  addressLine1: string;
  landmark: string;
  pincode: string;
  state: string;
  district: string;
  town: string;
  contactName: string;
  contactMobile: string;
  contactEmail: string;
  pan: string;
  gst: string;
  aadharNo?: string;
  panImg: string;
  gstImg: string;
  cancelChqImg: string;
  sourceAllBrands: boolean;
  verifyWithOtp: boolean;
  lat?: number | null;
  lng?: number | null;
}

export interface VendorContact {
  name: string;
  email?: string;
  mobile: string;
  designation?: string;
  isOwner?: boolean;
}

export interface VendorAddress {
  line1: string;
  line2: string;
}

export interface VendorDocument {
  type: string;
  refNo: string;
  assetId: string;
  status: string;
}

export interface VendorAddressPayload {
  doorNo: string;
  street: string;
  district: string;
  city: string;
  town?: string;
  state: string;
  postcode: string;
  landmark: string;
}

export interface VendorPayload {
  name: string;
  address: VendorAddressPayload;
  pan: string;
  gst_no: string;
  aadharNo?: string;
  vendorType: string;
  contact: VendorContact[];
  documents: VendorDocument[];
  franchise: {
    name: string;
    id: string;
  };
  sourceableBrands?: { id: string; brandId: string; brandName: string }[];
  sourceAllBrands?: boolean;
  mobile?: string;
  geoPoint?: {
    coordinates: number[];
  };
}

export interface VendorData {
  _id: string;
  name: string;
  address?: VendorAddressPayload;
  city: string;
  state: string;
  district: string;
  pincode: string;
  pan: string;
  gst_no: string;
  aadharNo?: string;
  vendorType: string;
  contact: VendorContact[];
  documents?: VendorDocument[];
  franchise?: {
    name: string;
    id: string;
  };
  sourceableBrands: { id: string; brandId: string; brandName: string }[];
  sourceAllBrands?: boolean;
}

export interface PincodeData {
  city: string;
  state: string;
  district: string;
}

export interface VendorValidationResult {
  status: boolean;
  msg: string;
}
