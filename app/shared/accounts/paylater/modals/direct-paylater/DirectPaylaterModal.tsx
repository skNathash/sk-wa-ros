import React, { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import {
  CheckCircle,
  X,
  Zap,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Users,
  IndianRupee,
} from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import CustomerService from "~/services/CustomerService";
import PaylaterService from "~/services/PaylaterService";
import CommonService from "~/services/CommonService";
import { AuthService } from "~/services/AuthService";
import clsx from "clsx";

import UserInfoSection from "./components/UserInfoSection";
import NomineeSection from "./components/NomineeSection";
import ApprovalSection from "./components/ApprovalSection";
import KycVerificationSection from "./components/KycVerificationSection";
import SuccessStep from "./components/SuccessStep";

type UploadedKycDocument = {
  documentType: string;
  referenceNo: string;
  frontImage: string;
  backImage?: string;
};

type Props = {
  show: boolean;
  onClose: () => void;
  /** The franchise refId (fid) or customer ID of the target user */
  fid: string;
  /** Callback after the full flow completes */
  onSuccess?: () => void;
  /** Type of user: b2b (franchise) or b2c (customer) */
  type?: "b2b" | "b2c";
};

type FormData = {
  nominees: { name: string; mobile: string; relationship: string }[];
  approvalAmount: number | null;
  approvalValidity: string;
  approvalReason: string;
};

const DirectPaylaterModal: React.FC<Props> = ({
  show,
  onClose,
  fid,
  onSuccess,
  type = "b2b",
}) => {
  const toast = useAppToast();

  const [franchiseDetails, setFranchiseDetails] = useState<Record<
    string,
    any
  > | null>(null);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [franchiseError, setFranchiseError] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedKycDocs, setUploadedKycDocs] = useState<UploadedKycDocument[]>(
    [],
  );

  const methods = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      nominees: [{ name: "", mobile: "", relationship: "" }],
      approvalAmount: null,
      approvalValidity: "",
      approvalReason: "",
    },
  });

  // Fetch franchise details when modal opens with a valid fid
  useEffect(() => {
    if (!show || !fid) return;

    const fetchFranchise = async () => {
      setFranchiseLoading(true);
      setFranchiseError("");
      setFranchiseDetails(null);
      try {
        const fullResp =
          type === "b2c"
            ? await CustomerService.getCustomer(fid)
            : await FranchiseService.getFranchise(fid);
        const data = fullResp?.data?.data;
        if (data) {
          setFranchiseDetails(data);
        } else {
          const label = type === "b2c" ? "customer" : "franchise";
          setFranchiseError(
            `No ${label} found with ID "${fid}". Please try again.`,
          );
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        const label = type === "b2c" ? "customer" : "franchise";
        setFranchiseError(
          `Failed to fetch ${label} details. Please try again.`,
        );
      } finally {
        setFranchiseLoading(false);
      }
    };

    fetchFranchise();
  }, [show, fid]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      methods.reset({
        nominees: [{ name: "", mobile: "", relationship: "" }],
        approvalAmount: null,
        approvalValidity: "",
        approvalReason: "",
      });
      setFranchiseDetails(null);
      setFranchiseError("");
      setCurrentStep(1);
      setIsSuccess(false);
      setUploadedKycDocs([]);
    }
  }, [show]);

  const validateStep = (step: number): string => {
    const data = methods.getValues();
    if (step === 2) {
      // Validate only filled nominees (nominee is optional)
      if (data.nominees && data.nominees.length > 0) {
        for (let i = 0; i < data.nominees.length; i++) {
          const nominee = data.nominees[i];
          const hasAnyValue =
            String(nominee.name || "").trim() ||
            String(nominee.mobile || "").trim() ||
            String(nominee.relationship || "").trim();
          if (hasAnyValue) {
            if (!String(nominee.name || "").trim())
              return `Nominee ${i + 1}: Name is required if adding a nominee`;
            if (!String(nominee.mobile || "").trim())
              return `Nominee ${i + 1}: Mobile is required if adding a nominee`;
            if (!CommonService.isValidMobileNo(nominee.mobile)) {
              return `Nominee ${i + 1}: Invalid mobile number`;
            }
            if (!String(nominee.relationship || "").trim()) {
              return `Nominee ${i + 1}: Relationship is required if adding a nominee`;
            }
          }
        }
      }
    }
    if (step === 3) {
      // Validate approval fields
      if (!data.approvalAmount || Number(data.approvalAmount) <= 0) {
        return "Please enter a valid credit limit amount";
      }
      if (!data.approvalValidity) {
        return "Please select a validity period";
      }
      if (!data.approvalReason?.trim()) {
        return "Please enter approval remarks";
      }
    }
    return "";
  };

  const handleNext = () => {
    const error = validateStep(currentStep);
    if (error) {
      toast.show({ msg: error, color: "error" });
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const data = methods.getValues();
    const validationError = validateStep(3);
    if (validationError) {
      toast.show({ msg: validationError, color: "error" });
      return;
    }

    if (!franchiseDetails) {
      toast.show({ msg: "Franchise details not found", color: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = AuthService.getLoggedInUser();
      const userId = franchiseDetails._id || franchiseDetails.id || "";

      // Step 1: Check if a PayLater request already exists for this user
      let requestId = "";
      try {
        const existingResp: any = await PaylaterService.getRequests({
          filter: {
            "userInfo.id": userId,
            "franchiseInfo.id": AuthService.getLoggedInUserId(),
          },
        });
        const existingRequests = existingResp?.data?.data || [];
        if (existingRequests.length > 0) {
          requestId =
            existingRequests[0]._id || existingRequests[0].requestId || "";
        }
      } catch {
        // No existing request found, proceed to create
      }

      // Step 2: If no existing request, create a new one
      if (!requestId) {
        // Filter out empty nominees
        const filledNominees = data.nominees.filter(
          (n) =>
            String(n.name || "").trim() ||
            String(n.mobile || "").trim() ||
            String(n.relationship || "").trim(),
        );

        // Build documents array from existing user docs + newly uploaded docs
        const existingDocs = [
          ...(franchiseDetails.documents?.business || []),
          ...(franchiseDetails.documents?.address || []),
          ...(franchiseDetails.documents?.photo || []),
        ]
          .map((doc: any) => {
            const fileId =
              doc.businessIDFile || doc.addressProofFile || doc.photoIDFile || doc.id;
            const docType =
              doc.businessID || doc.addressProof || doc.photoID || "";
            const refNo =
              doc.businessIDNo || doc.addressProofNo || doc.photoIDNo || "";
            if (!fileId) return null;
            return {
              id: refNo || fileId,
              frontImage: fileId,
              type: docType,
              isApprovedByRetailer: false,
            };
          })
          .filter(Boolean);

        const newDocs = uploadedKycDocs.map((doc) => ({
          id: doc.referenceNo,
          frontImage: doc.frontImage,
          ...(doc.backImage ? { backImage: doc.backImage } : {}),
          type: doc.documentType,
          isApprovedByRetailer: false,
        }));

        const otherDocs = [...existingDocs, ...newDocs];

        const payload = {
          userInfo: {
            type: type === "b2c" ? "customer" : "franchise",
            subType: type === "b2c" ? "CUSTOMER" : franchiseDetails.subType,
            id: userId,
            refId:
              franchiseDetails.franchiseId ||
              franchiseDetails.refNo ||
              franchiseDetails.refId ||
              "",
          },
          franchiseInfo: {
            type: "franchise",
            subType: loggedInUser.subType || "SKSELLER",
            id: loggedInUser._id || loggedInUser.id || "",
            refId:
              loggedInUser.franchiseId ||
              loggedInUser.refNo ||
              loggedInUser.refId ||
              "",
          },
          NomineeDetails: filledNominees.map((n) => ({
            name: String(n.name || "").trim(),
            mobile: String(n.mobile || "").trim(),
            relationShip: String(n.relationship || "").trim(),
          })),
          ...(otherDocs.length > 0 ? { otherDocuments: otherDocs } : {}),
        };

        const createResp: any = await PaylaterService.createRequest(payload);

        if (createResp?.statusCode !== 200) {
          toast.show({
            msg:
              createResp?.data?.message || "Failed to create PayLater request",
            color: "danger",
          });
          return;
        }

        requestId = createResp?.data?.data?.id;
      }

      if (!requestId) {
        toast.show({
          msg: "PayLater request ID not found for approval",
          color: "error",
        });
        return;
      }

      // Step 3: Update nominee details and documents on the request (before approval)
      const filledNomineesForUpdate = data.nominees.filter(
        (n) =>
          String(n.name || "").trim() ||
          String(n.mobile || "").trim() ||
          String(n.relationship || "").trim(),
      );

      const updatePayload: Record<string, any> = {};

      if (filledNomineesForUpdate.length > 0) {
        updatePayload.NomineeDetails = filledNomineesForUpdate.map((n) => ({
          name: String(n.name || "").trim(),
          mobile: String(n.mobile || "").trim(),
          relationShip: String(n.relationship || "").trim(),
        }));
      }

      // Include existing user documents + newly uploaded ones
      const existingDocsForUpdate = [
        ...(franchiseDetails?.documents?.business || []),
        ...(franchiseDetails?.documents?.address || []),
        ...(franchiseDetails?.documents?.photo || []),
      ]
        .map((doc: any) => {
          const fileId =
            doc.businessIDFile || doc.addressProofFile || doc.photoIDFile || doc.id;
          const docType =
            doc.businessID || doc.addressProof || doc.photoID || "";
          const refNo =
            doc.businessIDNo || doc.addressProofNo || doc.photoIDNo || "";
          if (!fileId) return null;
          return {
            id: refNo || fileId,
            frontImage: fileId,
            type: docType,
          };
        })
        .filter(Boolean);

      const newDocsForUpdate = uploadedKycDocs.map((doc) => ({
        id: doc.referenceNo,
        frontImage: doc.frontImage,
        backImage: doc.backImage || "",
        type: doc.documentType,
      }));

      const allDocsForUpdate = [...existingDocsForUpdate, ...newDocsForUpdate];
      if (allDocsForUpdate.length > 0) {
        updatePayload.otherDocuments = allDocsForUpdate;
      }

      if (Object.keys(updatePayload).length > 0) {
        const updateResp: any = await PaylaterService.updateRequest(
          requestId,
          updatePayload,
        );

        if (updateResp?.statusCode !== 200) {
          toast.show({
            msg:
              updateResp?.data?.message || "Failed to update request",
            color: "error",
          });
          return;
        }
      }

      // Step 4: Approve the request
      const approveResp: any = await PaylaterService.approveRequest(requestId, {
        action: "approve",
        approvedLimit: Number(data.approvalAmount) || 0,
        kycStatus: "Approved",
        reason: data.approvalReason || "",
        validityPeriod: data.approvalValidity || "",
      });

      if (approveResp?.statusCode === 200) {
        setIsSuccess(true);
        onSuccess?.();
      } else {
        toast.show({
          msg:
            approveResp?.data?.message ||
            "Request created but approval failed. Please approve manually.",
          color: "error",
        });
      }
    } catch (err) {
      console.error("DirectPaylater submit error:", err);
      toast.show({
        msg: "An error occurred. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasFranchiseData = !!franchiseDetails && !franchiseError;

  const steps = [
    { title: "Documents", icon: ShieldCheck },
    { title: "Nominee", icon: Users },
    { title: "Limit", icon: IndianRupee },
  ];

  return (
    <AppModal
      show={show}
      backdropDismiss={false}
      className="tw:h-[95vh] tw:md:max-w-2xl"
    >
      {!isSuccess && (
        <AppModal.Title onClose={onClose}>
          <div className="tw:flex tw:items-center tw:gap-2">
            <div className="tw:bg-green-100 tw:p-1.5 tw:rounded-full">
              <Zap className="tw:text-green-600" size={16} />
            </div>
            <div>
              <div className="tw:text-sm tw:font-bold tw:text-gray-800">
                {AuthService.isManpowerLoggedIn()
                  ? "Create Paylater"
                  : "Assign Paylater"}
              </div>
              <div className="tw:text-[10px] tw:text-gray-500">
                Quick creation and approval workflow
              </div>
            </div>
          </div>
        </AppModal.Title>
      )}

      <AppModal.Content className="tw:h-[95vh] tw:p-0">
        {isSuccess ? (
          <SuccessStep
            onClose={onClose}
            franchiseName={franchiseDetails?.name || "-"}
            limit={methods.getValues("approvalAmount") || 0}
            validity={methods.getValues("approvalValidity")}
          />
        ) : (
          <div className="tw:flex tw:flex-col tw:h-full">
            {/* Step Indicator */}
            {hasFranchiseData && (
              <div className="tw:px-3 tw:pt-3 tw:pb-1 tw:bg-gray-50 tw:border-b tw:border-gray-100">
                <div className="tw:flex tw:items-center tw:justify-between tw:mb-4 tw:px-6">
                  {steps.map((s, i) => {
                    const stepNum = i + 1;
                    const isActive = currentStep === stepNum;
                    const isCompleted = currentStep > stepNum;
                    return (
                      <React.Fragment key={i}>
                        <div className="tw:flex tw:flex-col tw:items-center tw:z-10">
                          <div
                            className={clsx(
                              "tw:w-6 tw:h-6 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:transition-all tw:duration-300",
                              isActive
                                ? "tw:bg-blue-600 tw:text-white tw:scale-110 tw:shadow-sm"
                                : isCompleted
                                  ? "tw:bg-green-500 tw:text-white"
                                  : "tw:bg-gray-200 tw:text-gray-400",
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle size={12} />
                            ) : (
                              <s.icon size={12} />
                            )}
                          </div>
                          <span
                            className={clsx(
                              "tw:text-[9px] tw:mt-1 tw:font-bold",
                              isActive
                                ? "tw:text-blue-600"
                                : "tw:text-gray-400",
                            )}
                          >
                            {s.title}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className="tw:flex-1 tw:h-[1px] tw:bg-gray-200 tw:mx-1 tw:-mt-4">
                            <div
                              className="tw:h-full tw:bg-blue-600 tw:transition-all tw:duration-500"
                              style={{ width: isCompleted ? "100%" : "0%" }}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="tw:flex-1 tw:overflow-y-auto tw:p-3">
              {franchiseLoading && (
                <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:py-20 tw:space-y-4">
                  <AppSpinner size="lg" />
                  <p className="tw:text-gray-500 tw:text-sm animate-pulse">
                    Fetching {type === "b2c" ? "customer" : "franchise"}{" "}
                    metadata...
                  </p>
                </div>
              )}

              {franchiseError && (
                <div className="tw:p-4 tw:bg-red-50 tw:border tw:border-red-100 tw:rounded-xl tw:text-center tw:py-10">
                  <X className="tw:text-red-500 tw:mx-auto tw:mb-3" size={40} />
                  <p className="tw:text-red-600 tw:text-sm tw:font-medium">
                    {franchiseError}
                  </p>
                </div>
              )}

              {hasFranchiseData && (
                <FormProvider {...methods}>
                  {/* Quick User Context */}
                  {currentStep !== 1 && (
                    <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:rounded-lg tw:p-2 tw:mb-3 tw:flex tw:items-center tw:gap-3">
                      <div className="tw:w-10 tw:h-10 tw:bg-blue-600 tw:text-white tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:text-xs tw:font-bold tw:flex-shrink-0">
                        {(franchiseDetails.name || "U")[0]}
                      </div>
                      <div className="tw:min-w-0 tw:flex-1">
                        <div className="tw:text-sm tw:font-bold tw:text-gray-900 tw:truncate">
                          {franchiseDetails.name}
                        </div>
                        <div className="tw:text-xs tw:text-gray-500">
                          ID:{" "}
                          {franchiseDetails.franchiseId ||
                            franchiseDetails.refId}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="tw:space-y-3">
                    {currentStep === 1 && (
                      <>
                        <UserInfoSection user={franchiseDetails} />
                        <KycVerificationSection
                          franchise={franchiseDetails}
                          uploadedDocuments={uploadedKycDocs}
                          onDocumentsChange={setUploadedKycDocs}
                          type={type}
                        />
                      </>
                    )}

                    {currentStep === 2 && <NomineeSection />}

                    {currentStep === 3 && <ApprovalSection />}
                  </div>
                </FormProvider>
              )}
            </div>
          </div>
        )}
      </AppModal.Content>

      {!isSuccess && !franchiseLoading && (
        <AppModal.Footer className="tw:bg-white tw:border-t tw:p-3">
          <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
            {currentStep === 1 ? (
              <AppButton
                onClick={onClose}
                color="secondary"
                fill="outline"
                className="tw:justify-center tw:h-10 tw:px-5"
              >
                Cancel
              </AppButton>
            ) : (
              <AppButton
                onClick={handlePrev}
                color="secondary"
                fill="outline"
                className="tw:justify-center tw:h-10 tw:px-5"
              >
                <ArrowLeft size={16} className="tw:mr-2" />
                Back
              </AppButton>
            )}

            {hasFranchiseData &&
              (currentStep < 3 ? (
                <AppButton
                  onClick={handleNext}
                  color="primary"
                  fill="solid"
                  className="tw:justify-center tw:h-10 tw:px-8 tw:font-bold"
                >
                  Next
                  <ArrowRight size={16} className="tw:ml-2" />
                </AppButton>
              ) : (
                <AppButton
                  onClick={handleSubmit}
                  color="success"
                  fill="solid"
                  disabled={submitting || franchiseLoading}
                  isLoading={submitting}
                  className="tw:justify-center tw:h-10 tw:px-6 tw:font-bold"
                >
                  <CheckCircle size={16} className="tw:mr-2" />
                  {submitting ? "Processing..." : "Assign & Approve"}
                </AppButton>
              ))}
          </div>
        </AppModal.Footer>
      )}
    </AppModal>
  );
};

export default DirectPaylaterModal;
