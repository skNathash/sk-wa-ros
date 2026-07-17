import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";

export type ValidationResult = {
  msg: string;
};

export function validateForm(formData: any): ValidationResult {
  // Handle both old format (nominee) and new format (nominees array)
  const nominees = formData?.nominees || [];

  // Support backward compatibility with single nominee object
  if (!Array.isArray(nominees) && formData?.nominee) {
    const singleNominee = formData.nominee;
    if (
      singleNominee.name ||
      singleNominee.mobile ||
      singleNominee.relationship
    ) {
      // Convert single nominee to array format
      formData.nominees = [singleNominee];
      return validateForm(formData);
    }
  }

  // Validate that at least one nominee is provided
  if (!Array.isArray(nominees) || nominees.length === 0) {
    return { msg: "validation.atLeastOneNomineeRequired" };
  }

  // Validate each nominee
  for (let i = 0; i < nominees.length; i++) {
    const nominee = nominees[i] || {};

    if (!nominee.name || !String(nominee.name).trim()) {
      return { msg: "validation.nomineeNameRequired" };
    }

    if (!nominee.mobile || !String(nominee.mobile).trim()) {
      return { msg: "validation.nomineeMobileRequired" };
    }

    if (!CommonService.isValidMobileNo(nominee.mobile)) {
      return { msg: "validation.nomineeMobileInvalid" };
    }

    // Nominee mobile should not be same as logged in user's mobile
    try {
      const loggedInMobile = AuthService.getLoggedInUser()?.mobile || "";

      if (loggedInMobile === String(nominee.mobile).trim()) {
        return { msg: "validation.nomineeMobileSameAsUser" };
      }
    } catch (e) {}

    if (!nominee.relationship || !String(nominee.relationship).trim()) {
      return { msg: "validation.nomineeRelationshipRequired" };
    }

    // Check for duplicate mobile numbers
    for (let j = i + 1; j < nominees.length; j++) {
      const otherNominee = nominees[j] || {};
      if (
        nominee.mobile &&
        otherNominee.mobile &&
        String(nominee.mobile).trim() === String(otherNominee.mobile).trim()
      ) {
        return { msg: "validation.duplicateNomineeMobile" };
      }
    }
  }

  // Validate documents array
  const documents = formData?.documents || [];

  // Documents are optional, but if provided, validate each document
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i] || {};

    // Skip validation for documents that contain refNoHashKey
    if (doc.refNoHashKey) {
      continue;
    }

    // Check document type
    if (!doc.documentType || !String(doc.documentType).trim()) {
      return { msg: "validation.documentTypeRequired" };
    }

    // Check reference number
    if (!doc.referenceNo || !String(doc.referenceNo).trim()) {
      return { msg: "validation.referenceNoRequired" };
    }

    // Check front image
    if (!doc.frontImage || !String(doc.frontImage).trim()) {
      return { msg: "validation.frontImageRequired" };
    }

    // Check if Aadhaar requires back image
    const docType = String(doc.documentType).toLowerCase();
    const isAadhaar =
      docType.includes("aadhar") ||
      docType.includes("aadhaar") ||
      docType.includes("aadhaar card");

    if (isAadhaar && (!doc.backImage || !String(doc.backImage).trim())) {
      return { msg: "validation.aadhaarFrontBackRequired" };
    }

    // Validate Aadhaar number format if it's Aadhaar
    if (isAadhaar) {
      const aadhaarNo = String(doc.referenceNo).trim();
      if (!/^\d{12}$/.test(aadhaarNo)) {
        return {
          msg: "validation.aadhaarInvalid",
        };
      }
      if (/^(\d)\1{11}$/.test(aadhaarNo)) {
        return {
          msg: "validation.aadhaarInvalid",
        };
      }
    }
  }

  return { msg: "" };
}

export function preparePayload(formData: any) {
  const linkedFranchise = AuthService.getLoggedInUser()?.linkedFranchise || {};
  const payload: any = {
    userInfo: {
      type: "franchise",
      subType: "SKBUYER",
      id: AuthService.getLoggedInUserId(),
      refId: AuthService.getLoggedInUser()?.franchiseId || "",
    },
    franchiseInfo: {
      type: "franchise",
      subType: "SKSELLER",
      id: linkedFranchise._id || "",
      refId: linkedFranchise.refNo || "",
    },
  };

  // Process documents array
  const documents = formData?.documents || [];

  // Build otherDocuments array with format [{id, frontImage, backImage, type}]
  const otherDocuments: any[] = [];

  if (Array.isArray(documents) && documents.length > 0) {
    for (const doc of documents) {
      if (!doc || !doc.documentType || !doc.referenceNo || !doc.frontImage) {
        continue;
      }

      const refNo = String(doc.referenceNo).trim();
      const frontImage = String(doc.frontImage).trim();
      const backImage = doc.backImage ? String(doc.backImage).trim() : "";

      // Add to otherDocuments array
      otherDocuments.push({
        id: doc.id || refNo,
        frontImage: frontImage,
        backImage: backImage || "",
        type: doc.type || doc.documentType,
      });
    }
  }

  // Always include otherDocuments (even empty) so backend can clear removed docs on update
  payload.otherDocuments = otherDocuments;

  // Nominee payload - API always expects an array with format [{name, mobile, relationShip}]
  const nominees = formData?.nominees || [];

  // Support backward compatibility with single nominee object
  let nomineesArray = nominees;
  if (!Array.isArray(nominees) && formData?.nominee) {
    const singleNominee = formData.nominee;
    if (
      singleNominee.name ||
      singleNominee.mobile ||
      singleNominee.relationship
    ) {
      nomineesArray = [singleNominee];
    }
  }

  // Always send as array with format [{name, mobile, relationShip}]
  if (Array.isArray(nomineesArray) && nomineesArray.length > 0) {
    payload.NomineeDetails = nomineesArray.map((nominee: any) => ({
      name: String(nominee.name || "").trim(),
      mobile: String(nominee.mobile || "").trim(),
      relationShip: String(nominee.relationship || "").trim(),
    }));
  } else {
    // Ensure NomineeDetails is always an array, even if empty
    payload.NomineeDetails = [];
  }

  return payload;
}
