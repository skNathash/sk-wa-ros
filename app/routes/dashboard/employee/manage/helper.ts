import { format } from "date-fns";
import CommonService from "~/services/CommonService";
import UserService from "~/services/UserService";

export type EmployeeForm = {
  name: string;
  mobileNo: string;
  email: string;
  dob: Date[] | null;
  dateOfJoining: Date[] | null;
  pincode: number | null;
  state: string | null;
  town: string | null;
  district: string | null;
  city: string | null;
  gender: string | null;
  address: string | null;
  doorNo: string | null;
  street: string | null;
  landmark: string | null;
  document: string | null;
  photo?: any;
  documentFile?: Array<any> | null;
  referenceNumber?: string | null;
  vehicleNumber: string | null;
  vehicleDetails?: {
    vehicleNo: string | null;
    type: string | null;
    capacity: string | null;
  };
  department: string | null;
  position: string | null;
  systemRole: string | null;
  linkedFranchises: Array<{
    franchiseId: string;
    name: string;
    refId: string;
    mobile: string;
    email: string;
  }>;
  linkedRoutes: Array<{
    routeId: string;
    routeCode: string;
    description: string;
  }>;
  linkedBrands: Array<{
    id: string;
    brandId: string;
    brandName: string;
  }>;
};

export const getEmployee = async (id: string) => {
  const response = await UserService.getUser(id);
  return response?.data?.data || {};
};

export const validateBasicEmployee = (data: EmployeeForm) => {
  let msg = "";
  if (!data.name?.trim()) {
    msg = "Name is required";
  } else if (!data.mobileNo.toString()?.trim()) {
    msg = "Mobile number is required";
  } else if (!CommonService.isValidMobileNo(data.mobileNo.toString())) {
    msg = "Invalid mobile number";
  } else if (!data.email?.trim()) {
    msg = "Email is required";
  } else if (!CommonService.isValidEmail(data.email)) {
    msg = "Invalid email";
  } else if (!data.gender) {
    msg = "Gender is required";
  } else if (!data.dob) {
    msg = "Date of birth is required";
  } else if (!data.dateOfJoining) {
    msg = "Date of joining is required";
  } else if (!data.position?.trim()) {
    msg = "Position is required";
  } else if (!data.systemRole?.trim()) {
    msg = "System role is required";
  } else if (data.position === "Delivery Agent") {
    if (!data.vehicleDetails?.vehicleNo?.trim()) {
      msg = "Vehicle number is required";
    } else if (!data.vehicleDetails?.type?.trim()) {
      msg = "Vehicle type is required";
    } else if (!data.vehicleDetails?.capacity?.trim()) {
      msg = "Vehicle capacity is required";
    }
  } else {
    msg = "";
  }
  return msg;
};

export const validateAddressEmployee = (data: EmployeeForm) => {
  let msg = "";
  if (!data.pincode) {
    msg = "Pincode is required";
  } else if (!data.state?.toString().trim()) {
    msg = "State is required";
  } else if (!(data.city || data.town)?.toString().trim()) {
    msg = "City is required";
  }
  return msg;
};

export const validateRolesEmployee = (
  selectedRole: string | number | undefined
) => {
  if (!selectedRole) return "Role is required";
  return "";
};

export const validateDocumentEmployee = (data: EmployeeForm) => {
  let msg = "";

  // If no document is provided, it's optional - no validation needed
  if (!data.document) {
    return "";
  }

  // If document is provided, then validate the related fields
  if (!data.referenceNumber?.trim()) {
    msg = "Reference number is required";
  } else if (!data.documentFile || data.documentFile.length === 0) {
    msg = "Document file is required";
  } else if (hasBackFront(data.document)) {
    // For documents that require both front and back, ensure both faces are present.
    // Previously the code allowed an undefined front when a back existed at index 1.
    // That caused a missing-front case to pass validation. Make both faces mandatory.
    if (
      !data.documentFile ||
      !data.documentFile[0] ||
      !data.documentFile[0].id
    ) {
      msg = "Upload both front and back";
    } else if (!data.documentFile[1] || !data.documentFile[1].id) {
      msg = "Upload both front and back";
    }
  } else if (
    data.document === "Aadhar card" &&
    !CommonService.isValidAadhar(data.referenceNumber)
  ) {
    msg = "Invalid Aadhar number";
  } else if (
    data.document === "PAN card" &&
    !CommonService.isValidPan(data.referenceNumber)
  ) {
    msg = "Invalid PAN number";
  } else {
    msg = "";
  }
  return msg;
};

export const hasBackFront = (document: string | null) => {
  return document === "Aadhar card";
};

export const getPayload = (
  data: EmployeeForm,
  mode: "add" | "update",
  rbacFeatures: any[],
  selectedRole: string | number | undefined
) => {
  const f = data;

  // Get all checked permissions from each feature
  const selectedFeatures = rbacFeatures.flatMap((feature: any) => {
    // Get all checked permissions from this feature
    const checkedPermissions =
      feature.permissions
        ?.filter((perm: any) => perm.selected)
        .map((perm: any) => ({
          id: perm._id,
          code: perm.code,
        })) || [];

    return checkedPermissions;
  });

  const params: any = {
    roleId: selectedRole,
    roleTemplate: {
      roleId: selectedRole,
      roleName: selectedRole,
    },
    role: f.systemRole,
    features: selectedFeatures,
    name: f.name,
    dateOfJoining: f.dateOfJoining
      ? format(
          Array.isArray(f.dateOfJoining) ? f.dateOfJoining[0] : f.dateOfJoining,
          "yyyy-MM-dd"
        )
      : null,
    position: f.position,
    department: f.department || "Store",
    gender: f.gender
      ? f.gender.charAt(0).toUpperCase() + f.gender.slice(1)
      : null,
    dob: f.dob
      ? format(Array.isArray(f.dob) ? f.dob[0] : f.dob, "yyyy-MM-dd")
      : null,
    mobile: f.mobileNo?.toString(),
    email: f.email,
    address: {
      doorNo: f.doorNo,
      street: f.street,
      district: f.district,
      city: f.city || f.town,
      state: f.state,
      postcode: f.pincode?.toString(),
      landmark: f.landmark,
    },
    documentsRequired: {
      photo: [],
    },
    profileImages: f.photo?.id ? [f.photo.id] : [],
  };

  // Handle document uploads
  if (f.document && f.documentFile && f.documentFile.length > 0) {
    const docType = f.document === "Aadhar card" ? "Aadhar" : "Photo";

    // front (index 0) may be undefined; include only when present
    if (f.documentFile[0] && f.documentFile[0].id) {
      params.documentsRequired.photo.push({
        name: f.document,
        docType,
        refNo: f.referenceNumber,
        assetId: f.documentFile[0].id,
        documentFace: "Front",
      });
    }

    // back (index 1) - include when present; for two-faced documents this is required by validation
    if (f.documentFile[1] && f.documentFile[1].id) {
      params.documentsRequired.photo.push({
        name: f.document,
        docType,
        refNo: f.referenceNumber,
        assetId: f.documentFile[1].id,
        documentFace: "Back",
      });
    }
  }

  if (f.position === "Sales Employee") {
    const stripId = <T extends Record<string, any>>(arr: T[]) =>
      (arr || []).map(({ _id, ...rest }: any) => rest);
    params.linkedFranchises = stripId(f.linkedFranchises || []);
    params.linkedRoutes = stripId(f.linkedRoutes || []);
    params.linkedBrands = stripId(f.linkedBrands || []);
  } else if (f.position === "Delivery Agent") {
    params.vehicleNumber = (f.vehicleNumber || "").trim();
  }

  // Add vehicle details for Delivery Agent position
  if (f.position === "Delivery Agent" && f.vehicleDetails) {
    params.vehicleDetails = {
      vehicleNo: f.vehicleDetails.vehicleNo || "",
      type: f.vehicleDetails.type || "",
      capacity: f.vehicleDetails.capacity || "",
    };
  }

  // if (mode == "add") {
  //   params.isAvailable = true;
  // }

  return params;
};
