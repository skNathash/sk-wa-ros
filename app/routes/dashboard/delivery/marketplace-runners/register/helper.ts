import {
  Bike,
  CarTaxiFront,
  Footprints,
  Motorbike,
  Scooter,
  Truck,
} from "lucide-react";
import CommonService from "~/services/CommonService";

/** One uploaded asset, as the file-upload components hand it back. */
export interface RunnerAsset {
  id: string;
}

/** Everything the three registration steps collect, in one flat form. */
export interface RunnerForm extends Record<string, any> {
  /** Basic — proved with an OTP before any other step opens. */
  name: string;
  mobile: string;
  /** Vehicle. */
  vehicleType: string;
  vehicleNo: string;
  capacity: string;
  licenceNo: string;
  /** Lets every franchise in the network hire the runner, not just this one. */
  isAvailableForAllFranchises: boolean;
  /** KYC — the runner's photo and their Aadhaar. */
  photo: RunnerAsset | null;
  aadhaarNo: string;
  aadhaarFront: RunnerAsset | null;
  aadhaarBack: RunnerAsset | null;
}

export const DEFAULT_FORM: RunnerForm = {
  name: "",
  mobile: "",
  vehicleType: "",
  vehicleNo: "",
  capacity: "",
  licenceNo: "",
  isAvailableForAllFranchises: true,
  photo: null,
  aadhaarNo: "",
  aadhaarFront: null,
  aadhaarBack: null,
};

/** The steps, in order; the key drives both validation and what is rendered. */
export const STEPS = [
  { key: "basic", title: "Basic" },
  { key: "vehicle", title: "Vehicle & Area" },
  { key: "kyc", title: "KYC" },
  { key: "preview", title: "Review" },
];

export type RunnerStepKey = (typeof STEPS)[number]["key"];

/** What the runner rides, as the vehicle step offers it. Each tile carries its
    own lucide icon so the picker reads at a glance. */
export const VEHICLE_TYPE_OPTIONS = [
  { value: "walk", label: "Walk", icon: Footprints },
  { value: "cycle", label: "Cycle", icon: Bike },
  { value: "scooter", label: "Scooter", icon: Scooter },
  { value: "bike", label: "Bike", icon: Motorbike },
  { value: "auto", label: "Auto", icon: CarTaxiFront },
  { value: "truck", label: "Truck", icon: Truck },
];

/** Which detail inputs apply to each vehicle type. Non-motorised rides
    (walk, cycle) carry no registration plate or licence, so only capacity
    shows; every motorised type takes all three. */
export const VEHICLE_DETAIL_FIELDS: Record<string, string[]> = {
  walk: ["capacity"],
  cycle: ["capacity"],
  scooter: ["vehicleNo", "capacity", "licenceNo"],
  bike: ["vehicleNo", "capacity", "licenceNo"],
  auto: ["vehicleNo", "capacity", "licenceNo"],
  truck: ["vehicleNo", "capacity", "licenceNo"],
};

/** Each validator returns the first thing wrong, or an empty `msg` when clean. */
export const validateBasic = (data: RunnerForm): { msg: string } => {
  let msg = "";

  if (!data.name?.trim()) {
    msg = "Runner name is required";
  } else if (!data.mobile?.toString().trim()) {
    msg = "Mobile number is required";
  } else if (!CommonService.isValidMobileNo(data.mobile.toString())) {
    msg = "Invalid mobile number";
  }

  return { msg };
};

export const validateVehicle = (data: RunnerForm): { msg: string } => {
  let msg = "";

  // Only the detail fields that apply to the chosen type are required.
  const fields = VEHICLE_DETAIL_FIELDS[data.vehicleType] || [];

  if (!data.vehicleType?.trim()) {
    msg = "Vehicle type is required";
  } else if (fields.includes("vehicleNo") && !data.vehicleNo?.trim()) {
    msg = "Vehicle number is required";
  } else if (fields.includes("capacity") && !data.capacity?.trim()) {
    msg = "Vehicle capacity is required";
  } else if (fields.includes("licenceNo") && !data.licenceNo?.trim()) {
    msg = "Licence number is required";
  }

  return { msg };
};

/**
 * KYC is optional as a whole, but an Aadhaar number commits the runner to both
 * faces of the card — a number with no proof behind it is worse than neither.
 */
export const validateKyc = (data: RunnerForm): { msg: string } => {
  let msg = "";

  const aadhaarNo = data.aadhaarNo?.trim();

  if (aadhaarNo) {
    if (!CommonService.isValidAadhar(aadhaarNo)) {
      msg = "Invalid Aadhaar number";
    } else if (!data.aadhaarFront?.id) {
      msg = "Upload the front of the Aadhaar";
    } else if (!data.aadhaarBack?.id) {
      msg = "Upload the back of the Aadhaar";
    }
  }

  return { msg };
};

/** Validate one step by its key. */
export const validateStep = (
  key: RunnerStepKey,
  data: RunnerForm,
): { msg: string } => {
  if (key === "basic") return validateBasic(data);
  if (key === "vehicle") return validateVehicle(data);
  if (key === "kyc") return validateKyc(data);
  // Review — the last door before save; every collected step must be clean.
  if (key === "preview") {
    const checks = [validateBasic(data), validateVehicle(data), validateKyc(data)];
    return checks.find((c) => c.msg) || { msg: "" };
  }
  return { msg: "" };
};

/** Build the full runner document from the collected form, ready for the
    single create call (the `otpRequestId` is spliced in by the caller). */
export const getCreatePayload = (data: RunnerForm): Record<string, any> => {
  const images = [];
  if (data.photo?.id) images.push(data.photo.id);
  if (data.aadhaarFront?.id) images.push(data.aadhaarFront.id);
  if (data.aadhaarBack?.id) images.push(data.aadhaarBack.id);

  return {
    name: data.name.trim(),
    mobile: data.mobile.toString().trim(),
    isAvailable: true,
    vehicleDetails: {
      type: data.vehicleType,
      vehicleNo: data.vehicleNo.trim(),
      capacity: data.capacity.trim(),
      licenceNo: data.licenceNo.trim(),
    },
    images,
    isAvailableForAllFranchises: data.isAvailableForAllFranchises,
  };
};
