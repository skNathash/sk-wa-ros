import CustomerService from "~/services/CustomerService";
import FranchiseService from "~/services/FranchiseService";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

export type PaylaterUserType = "b2b" | "b2c";

export type PaylaterKycUser = {
  _id?: string;
  id?: string;
  userId?: string;
  referenceId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  occupation?: string;
  dob?: string;
  subType?: string;
  franchiseId?: string;
  refNo?: string;
  initials?: string;
  location?: string;
  [key: string]: any;
};

export type PaylaterKycDocument = {
  documentType: string;
  referenceNo: string;
  frontImage: string;
  backImage?: string;
  autoFilled?: boolean;
};

export type PaylaterNominee = {
  name: string;
  mobile: string;
  relationship: string;
};

export type PaylaterKycDetails = {
  name: string;
  alternatePhone: string;
  photo: string;
  gender: string;
  age: string;
  vehicleNumber: string;
  vehicleName: string;
  address: string;
  pincode: string;
  state: string;
  district: string;
  town: string;
  latitude: number | null;
  longitude: number | null;
};

export type PaylaterKycFormData = {
  kyc: PaylaterKycDetails;
  documents: PaylaterKycDocument[];
  nominees: PaylaterNominee[];
};

export type PaylaterStorePhoto = { id: string; url: string };

export const getEmptyKycDetails = (): PaylaterKycDetails => ({
  name: "",
  alternatePhone: "",
  photo: "",
  gender: "",
  age: "",
  vehicleNumber: "",
  vehicleName: "",
  address: "",
  pincode: "",
  state: "",
  district: "",
  town: "",
  latitude: null,
  longitude: null,
});

export const getEmptyNominee = (): PaylaterNominee => ({
  name: "",
  mobile: "",
  relationship: "",
});

export const getDefaultKycFormValues = (): PaylaterKycFormData => ({
  kyc: getEmptyKycDetails(),
  documents: [],
  nominees: [getEmptyNominee()],
});

export const fetchPaylaterUserDetails = async (
  id: string,
  type: PaylaterUserType,
): Promise<Record<string, any> | null> => {
  if (!id) return null;
  const resp =
    type === "b2c"
      ? await CustomerService.getCustomer(id)
      : await FranchiseService.getFranchise(id);
  return resp?.data?.data || null;
};

const formatProfileDocuments = (
  details: Record<string, any>,
): PaylaterKycDocument[] => {
  const docs = details.documents || {};
  const formatted: PaylaterKycDocument[] = [];

  (docs.business || []).forEach((d: any) => {
    if (d.businessIDFile) {
      formatted.push({
        documentType: d.businessID || "Business Document",
        referenceNo: d.businessIDNo || "",
        frontImage: d.businessIDFile,
        backImage: "",
        autoFilled: true,
      });
    }
  });

  (docs.address || []).forEach((d: any) => {
    if (d.addressProofFile) {
      formatted.push({
        documentType: d.addressProof || "Address Proof",
        referenceNo: d.addressProofNo || "",
        frontImage: d.addressProofFile,
        backImage: "",
        autoFilled: true,
      });
    }
  });

  (docs.photo || []).forEach((d: any) => {
    if (d.photoIDFile) {
      formatted.push({
        documentType: d.photoID || "Photo ID",
        referenceNo: d.photoIDNo || "",
        frontImage: d.photoIDFile,
        backImage: "",
        autoFilled: true,
      });
    }
  });

  return formatted;
};

const formatStorePhotos = (
  details: Record<string, any>,
): PaylaterStorePhoto[] =>
  (details.approvedShopPhotos || details.shopPhotosDetails || [])
    .filter((p: any) => p.status === "Approved" || details.approvedShopPhotos)
    .map((p: any) => ({
      id: p.fileUrl || p.id || "",
      url: p.fileUrl || p.id || "",
    }))
    .filter((p: PaylaterStorePhoto) => !!p.id);

/**
 * Maps a customer/franchise profile onto the KYC form shape so the
 * form opens pre-filled with whatever the profile already knows.
 */
export const buildKycPrefill = (
  details: Record<string, any> | null,
  type: PaylaterUserType,
): { values: PaylaterKycFormData; storePhotos: PaylaterStorePhoto[] } => {
  const values = getDefaultKycFormValues();
  if (!details) return { values, storePhotos: [] };

  if (type === "b2c") {
    values.kyc.name = details.name || "";
    values.kyc.address = details.address?.street || "";
    values.kyc.pincode = details.address?.postcode || "";
    values.kyc.state = details.address?.state || "";
    values.kyc.district = details.address?.district || "";
    values.kyc.town = details.address?.city || "";
  } else {
    values.kyc.name = details.name || details.ownerDetails?.name || "";
    values.kyc.address =
      [details.addressLine1, details.addressLine2].filter(Boolean).join(", ") ||
      "";
    values.kyc.pincode = details.pincode || "";
    values.kyc.state = details.state || "";
    values.kyc.district = details.district || "";
    values.kyc.town = details.city || details.town || "";
    if (details.lat && details.lng) {
      values.kyc.latitude = details.lat;
      values.kyc.longitude = details.lng;
    }
  }

  values.documents = formatProfileDocuments(details);

  return {
    values,
    storePhotos: type === "b2b" ? formatStorePhotos(details) : [],
  };
};

export const cleanObj = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    )
      continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      const cleaned = cleanObj(value);
      if (Object.keys(cleaned).length > 0) result[key] = cleaned;
    } else {
      result[key] = value;
    }
  }
  return result;
};

export type PaylaterApproval = {
  approvalAmount?: number | null;
  approvalValidity?: string;
  approvalReason?: string;
};

/**
 * Builds the PayLater request/assign payload from the KYC form values.
 * `approval` is optional — omit it for flows that only capture KYC.
 */
export const buildPaylaterKycPayload = (
  user: PaylaterKycUser,
  type: PaylaterUserType,
  values: PaylaterKycFormData,
  approval: PaylaterApproval = {},
): Record<string, any> => {
  const loggedInUser = AuthService.getLoggedInUser() || {};
  const kyc = values.kyc;

  return cleanObj({
    userInfo: cleanObj({
      type: type === "b2c" ? "customer" : "franchise",
      subType: type === "b2c" ? "CUSTOMER" : user.subType || "SKSELLER",
      name: type === "b2b" ? user.name : kyc.name || user.name,
      id: user._id || user.id,
      userId: user.userId || user._id || user.id,
      gender: kyc.gender,
      mobile: user.mobile,
      email: user.email,
      occupation: user.occupation,
      dob: user.dob,
      photo: kyc.photo,
      alternateMobile: String(kyc.alternatePhone || ""),
      age: kyc.age,
      address: cleanObj({
        doorNo: "",
        street: kyc.address,
        landmark: "",
        city: kyc.town,
        district: kyc.district,
        state: kyc.state,
        postcode: kyc.pincode,
      }),
      geolocation:
        kyc.latitude && kyc.longitude
          ? { type: "Point", coordinates: [kyc.longitude, kyc.latitude] }
          : undefined,
      vehicleInfo:
        kyc.vehicleNumber || kyc.vehicleName
          ? [
              cleanObj({
                vehicleType: "",
                vehicleNo: kyc.vehicleNumber,
                vehicleImage: "",
                vehileName: kyc.vehicleName,
              }),
            ]
          : [],
    }),
    franchiseInfo: cleanObj({
      type: "franchise",
      subType: loggedInUser.subType || "SFSELLER",
      id: loggedInUser._id || loggedInUser.id || "",
      refId:
        loggedInUser.franchiseId ||
        loggedInUser.refNo ||
        loggedInUser.refId ||
        "",
      name: loggedInUser.name,
    }),
    approvedLimit: approval.approvalAmount || 0,
    kycStatus: "Approved",
    validityPeriod: approval.approvalValidity,
    reason: approval.approvalReason,
    NomineeDetails: (values.nominees || [])
      .filter((n) => n.name || n.mobile)
      .map((n) =>
        cleanObj({
          name: (n.name || "").trim(),
          mobile: String(n.mobile || "").trim(),
          relationShip: (n.relationship || "").trim(),
        }),
      ),
    fullAddress: cleanObj({
      line1: kyc.address,
      line2: "",
      city: kyc.town,
      state: kyc.state,
      pincode: kyc.pincode,
      country: "India",
    }),
    otherDocuments: (values.documents || [])
      .filter((d) => d.documentType && d.frontImage)
      .map((d) =>
        cleanObj({
          id: d.referenceNo,
          frontImage: d.frontImage,
          backImage: d.backImage,
          type: d.documentType,
        }),
      ),
  });
};

/** Returns an error message for the given step, or "" when the step is valid. */
export const validateKycStep = (
  step: "kyc" | "documents" | "nominee",
  values: PaylaterKycFormData,
): string => {
  if (step === "kyc") {
    if (!(values.kyc.name || "").trim()) return "Name is required";
  }
  if (step === "nominee") {
    const nominees = values.nominees || [];
    for (let i = 0; i < nominees.length; i++) {
      const n = nominees[i];
      const hasAnyValue =
        String(n.name || "").trim() ||
        String(n.mobile || "").trim() ||
        String(n.relationship || "").trim();
      if (!hasAnyValue) continue;
      if (!String(n.name || "").trim())
        return `Nominee ${i + 1}: Name is required`;
      if (!String(n.mobile || "").trim())
        return `Nominee ${i + 1}: Mobile is required`;
      if (!CommonService.isValidMobileNo(n.mobile))
        return `Nominee ${i + 1}: Invalid mobile number`;
      if (!String(n.relationship || "").trim())
        return `Nominee ${i + 1}: Relationship is required`;
    }
  }
  return "";
};
