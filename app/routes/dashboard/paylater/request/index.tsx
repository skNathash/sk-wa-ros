import React, { useEffect, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { useForm, FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import useAppToast from "~/hooks/useAppToast";
import { preparePayload, validateForm } from "./helper";
import SuccessModal from "./modals/SuccessModal";
import DocumentsUploadModal from "~/shared/others/modals/documents-upload/DocumentsUploadModal";
import PaylaterService from "~/services/PaylaterService";
import useAppNav from "~/hooks/useAppNav";
import {
  Plus,
  Phone,
  User,
  ArrowRight,
  ArrowDown,
  Store,
  MapPin,
} from "lucide-react";
import { useSearchParams } from "react-router";
import FranchiseService from "~/services/FranchiseService";
import KeyValue from "~/components/core/key-value/KeyValue";

import HowItWorks from "./components/HowItWorks";
import AppCard from "~/components/core/card/AppCard";
import NomineeDetails from "./components/NomineeDetails";
import AppButton from "~/components/core/button/AppButton";
import DocumentDisplayItem from "./components/DocumentDisplayItem";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AuthService from "~/services/AuthService";
import { cn } from "~/lib/utils";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "Apply For Paylater",
    langKey: "title",
    langParams: { ns: "applyPaylater" },
  },
];

type Document = {
  id: string;
  documentType: string;
  referenceNo: string;
  frontImage: string;
  backImage?: string;
  type: string;
  refNoHashKey?: string;
};

const PaylaterRequestPage = () => {
  const { t } = useTranslation(["applyPaylater"]);
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("id");
  const fid = searchParams.get("fid");

  const methods = useForm<any>({
    mode: "onChange",
    defaultValues: {
      nominees: [{ name: "", mobile: "", relationship: "" }],
    },
  });

  const toast = useAppToast();
  const { back } = useAppNav();

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{
    requestId?: string;
    amount?: string | number;
  } | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [franchise, setFranchise] = useState<any | null>(null);
  const [requester, setRequester] = useState<any | null>(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);

  // Helper function to transform profile documents to paylater format
  const transformProfileDocuments = (profileDocuments: any): Document[] => {
    const transformedDocs: Document[] = [];
    const docMap = new Map<string, Document>();

    // Process photo documents
    const photoDocs = profileDocuments?.photo || [];
    photoDocs.forEach((doc: any) => {
      if (!doc.photoID || !doc.photoIDNo) return;

      const key = `photo_${doc.photoID}_${doc.photoIDNo}`;
      if (!docMap.has(key)) {
        docMap.set(key, {
          id: doc.photoIDNo,
          documentType: doc.photoID,
          referenceNo: doc.photoIDNo,
          frontImage: "",
          backImage: undefined,
          type: doc.photoID,
        });
      }

      const existingDoc = docMap.get(key)!;
      if (doc.documentFace === "Front" && doc.photoIDFile) {
        existingDoc.frontImage = doc.photoIDFile;
      } else if (doc.documentFace === "Back" && doc.photoIDFile) {
        existingDoc.backImage = doc.photoIDFile;
      }
    });

    // Process business documents
    const businessDocs = profileDocuments?.business || [];
    businessDocs.forEach((doc: any) => {
      if (!doc.businessID || !doc.businessIDNo) return;

      const key = `business_${doc.businessID}_${doc.businessIDNo}`;
      if (!docMap.has(key)) {
        docMap.set(key, {
          id: doc.businessIDNo,
          documentType: doc.businessID,
          referenceNo: doc.businessIDNo,
          frontImage: "",
          backImage: undefined,
          type: doc.businessID,
        });
      }

      const existingDoc = docMap.get(key)!;
      if (doc.documentFace === "Front" && doc.businessIDFile) {
        existingDoc.frontImage = doc.businessIDFile;
      } else if (doc.documentFace === "Back" && doc.businessIDFile) {
        existingDoc.backImage = doc.businessIDFile;
      }
    });

    // Process address documents
    const addressDocs = profileDocuments?.address || [];
    addressDocs.forEach((doc: any) => {
      if (!doc.addressProof || !doc.addressProofNo) return;

      const key = `address_${doc.addressProof}_${doc.addressProofNo}`;
      if (!docMap.has(key)) {
        docMap.set(key, {
          id: doc.addressProofNo,
          documentType: doc.addressProof,
          referenceNo: doc.addressProofNo,
          frontImage: "",
          backImage: undefined,
          type: doc.addressProof,
        });
      }

      const existingDoc = docMap.get(key)!;
      if (doc.documentFace === "Front" && doc.addressProofFile) {
        existingDoc.frontImage = doc.addressProofFile;
      } else if (doc.documentFace === "Back" && doc.addressProofFile) {
        existingDoc.backImage = doc.addressProofFile;
      }
    });

    // Filter out documents without frontImage and convert to array
    return Array.from(docMap.values()).filter((doc) => doc.frontImage);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch logged-in user info
      try {
        const userDetails: any =
          await AuthService.getLoggedInFranchiseDetails();
        const userData = userDetails?.data?.data || null;
        if (userData) {
          setRequester({
            name: userData.name || userData.ownerName,
            mobile: userData.mobile,
            email: userData.email,
          });
        }
      } catch (userErr) {
        console.error("Error fetching user details:", userErr);
      }

      // If fid is present in URL, fetch franchise details
      if (fid) {
        try {
          const franResp: any = await FranchiseService.getFranchise(fid);
          const fran = franResp?.data?.data || null;
          setFranchise(fran);
        } catch (frErr) {
          console.error("Error fetching franchise details:", frErr);
        }
      }
      try {
        // If requestId exists in URL, fetch that specific request
        if (requestId) {
          const resp: any = await PaylaterService.getRequest(requestId);
          const d = resp.data?.data || null;
          if (d) {
            const nominees = (d.NomineeDetails || []).map((nominee: any) => ({
              name: nominee.name,
              mobile: nominee.mobile,
              relationship: nominee.relationShip,
            }));

            const documents = (d.otherDocuments || []).map((document: any) => ({
              id: document.id,
              documentType: document.type,
              referenceNo: document.id, // API uses id as referenceNo
              frontImage: document.frontImage,
              backImage: document.backImage,
              refNoHashKey: document.refNoHashKey,
            }));

            setDocuments(documents);
            methods.setValue(
              "nominees",
              nominees.length > 0
                ? nominees
                : [{ name: "", mobile: "", relationship: "" }],
            );
          }
        } else {
          // Original logic: fetch latest request for auto-population
          const resp: any = await PaylaterService.getRequests({
            filter: {
              "userInfo.id": AuthService.getLoggedInUserId() || "",
            },
          });
          const d = resp.data?.data?.[0] || null;
          if (d) {
            const nominees = (d.NomineeDetails || []).map((nominee: any) => ({
              name: nominee.name,
              mobile: nominee.mobile,
              relationship: nominee.relationShip,
            }));

            const documents = (d.otherDocuments || []).map((document: any) => ({
              id: document.id,
              documentType: document.type,
              referenceNo: document.referenceNo,
              frontImage: document.frontImage,
              backImage: document.backImage,
              refNoHashKey: document.refNoHashKey,
            }));

            setDocuments(documents);
            methods.setValue("nominees", nominees);
          } else {
            // No existing request found - auto-fill from profile documents
            try {
              const profileResp =
                await AuthService.getLoggedInFranchiseDetails();
              const profileData = profileResp?.data?.data || {};
              const profileDocuments = profileData.documents || {};

              const transformedDocs =
                transformProfileDocuments(profileDocuments);
              if (transformedDocs.length > 0) {
                setDocuments(transformedDocs);
                methods.setValue("documents", transformedDocs);
              }
            } catch (profileErr) {
              console.error("Error fetching profile documents:", profileErr);
              // Silently fail - documents are optional
            }
          }
        }
      } catch (err) {
        console.error("Paylater getRequest error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestId, fid]);

  const handleDocumentsModalCallback = (data: any) => {
    if (data?.action === "submit" && data?.data) {
      handleAddDocument(data.data);
      setShowDocumentsModal(false);
    } else if (data?.action === "close") {
      setShowDocumentsModal(false);
    }
  };

  const handleAddDocument = (documentData: {
    documentType: string;
    referenceNo: string;
    frontImage: string;
    backImage?: string;
  }) => {
    const document: Document = {
      id: documentData.referenceNo,
      documentType: documentData.documentType,
      referenceNo: documentData.referenceNo,
      frontImage: documentData.frontImage,
      backImage: documentData.backImage,
      type: documentData.documentType,
    };
    setDocuments((prev) => {
      const updated = [...prev, document];
      // Also update form data for validation
      methods.setValue("documents", updated);
      return updated;
    });
  };

  const handleRemoveDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index);
    setDocuments(newDocuments);
    methods.setValue("documents", newDocuments);
  };

  const onSubmit = async (data: any) => {
    if (submitting) return;

    // Merge documents into form data
    const formDataWithDocs = { ...data, documents };

    // Run custom validation
    const result = validateForm(formDataWithDocs);
    if (result.msg) {
      // result.msg contains a translation key from applyPaylater namespace
      toast.show({ msg: t(result.msg), color: "error" });
      return;
    }

    setSubmitting(true);
    try {
      let resp: any;

      // If requestId exists, update the request; otherwise create a new one
      if (requestId) {
        resp = await PaylaterService.updateRequest(
          requestId,
          preparePayload(formDataWithDocs),
        );
      } else {
        resp = await PaylaterService.createRequest(
          preparePayload(formDataWithDocs),
        );
      }

      if (resp?.statusCode === 200) {
        // reset the form
        methods.reset();
        setDocuments([]);

        // capture any returned ids/amounts if available
        const payload = resp.data?.data || resp.data || {};
        setSuccessData({
          requestId: payload._id || payload.requestId || requestId || undefined,
          amount: payload.amount || payload.requestedAmount || undefined,
        });

        setSuccessOpen(true);
      } else {
        toast.show({
          msg:
            resp?.data?.message ||
            (requestId ? "Update failed" : "Request failed"),
          color: "danger",
        });
      }
    } catch (err) {
      console.error(
        `Paylater ${requestId ? "updateRequest" : "createRequest"} error:`,
        err,
      );
      toast.show({
        msg: requestId
          ? "Failed to update request"
          : "Failed to submit request",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }

    return Promise.resolve();
  };

  const [successOpen, setSuccessOpen] = useState(false);

  return (
    <>
      <AppHeader title={t("title")} />
      <div className="app-page has-footer page-bg tw:p-4">
        <div className="app-container">
          {loading ? (
            <PageLoader />
          ) : (
            <>
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

              <div className="tw:mb-4">
                <HowItWorks />
                <p className="tw:text-sm tw:text-gray-600 tw:mt-3 tw:px-1">
                  {t("howItWorks.description")}
                </p>
              </div>

              {requester && franchise && (
                <div className="tw:mb-4">
                  <AppCard>
                    <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-stretch tw:gap-4 tw:md:gap-0">
                      {requester && (
                        <div
                          className={cn(
                            "tw:flex-1 tw:p-4 tw:rounded-xl tw:bg-emerald-50 tw:border tw:border-emerald-100",
                            !franchise && "tw:w-full",
                          )}
                        >
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                            <div className="tw:p-1.5 tw:bg-white tw:rounded-full tw:shadow-sm">
                              <User size={16} className="tw:text-emerald-600" />
                            </div>
                            <span className="tw:text-[10px] tw:font-bold tw:text-emerald-600 tw:uppercase tw:tracking-wider">
                              Requester Details
                            </span>
                          </div>
                          <div className="tw:space-y-1">
                            <h4 className="tw:text-sm tw:font-bold tw:text-gray-900">
                              {requester.name}
                            </h4>
                            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-600">
                              <Phone size={12} className="tw:text-gray-400" />
                              {requester.mobile}
                            </div>
                            {requester.email && (
                              <div className="tw:text-[11px] tw:text-gray-500 tw:truncate">
                                {requester.email}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {requester && franchise && (
                        <>
                          <div className="tw:hidden tw:md:flex tw:items-center tw:justify-center">
                            <div className="tw:bg-white tw:p-2 tw:rounded-full tw:shadow-md tw:z-10 tw:-mx-4 tw:border tw:border-gray-100">
                              <ArrowRight
                                size={20}
                                className="tw:text-blue-500"
                              />
                            </div>
                          </div>
                          <div className="tw:md:hidden tw:flex tw:items-center tw:justify-center tw:-my-2 tw:z-10">
                            <div className="tw:bg-white tw:p-2 tw:rounded-full tw:shadow-md tw:border tw:border-gray-100">
                              <ArrowDown
                                size={20}
                                className="tw:text-blue-500"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {franchise && (
                        <div
                          className={cn(
                            "tw:flex-1 tw:p-4 tw:rounded-xl tw:bg-blue-50 tw:border tw:border-blue-100",
                            !requester && "tw:w-full",
                          )}
                        >
                          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3">
                            <div className="tw:p-1.5 tw:bg-white tw:rounded-full tw:shadow-sm">
                              <Store size={16} className="tw:text-blue-600" />
                            </div>
                            <span className="tw:text-[10px] tw:font-bold tw:text-blue-600 tw:uppercase tw:tracking-wider">
                              Requesting Paylater From
                            </span>
                          </div>
                          <div className="tw:space-y-1">
                            <h4 className="tw:text-sm tw:font-bold tw:text-gray-900">
                              {franchise.name}
                            </h4>
                            <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-gray-600">
                              <Phone size={12} className="tw:text-gray-400" />
                              {franchise.mobile}
                            </div>
                            <div className="tw:flex tw:items-start tw:gap-1.5 tw:mt-1">
                              <MapPin
                                size={12}
                                className="tw:text-gray-400 tw:mt-0.5 tw:shrink-0"
                              />
                              <div className="tw:text-[11px] tw:text-gray-500 tw:leading-tight">
                                {[
                                  franchise.addressLine1,
                                  franchise.addressLine2,
                                  franchise.city,
                                  franchise.state,
                                  franchise.pincode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </AppCard>
                </div>
              )}

              <FormProvider {...methods}>
                <form onSubmit={methods.handleSubmit(onSubmit)}>
                  <AppCard>
                    <NomineeDetails />
                  </AppCard>

                  <AppCard>
                    <div className="tw:flex tw:items-center tw:justify-between tw:mb-4">
                      <div>
                        <h3 className="tw:text-base tw:font-semibold tw:text-gray-900 tw:mb-1">
                          Documents
                        </h3>
                        <p className="tw:text-sm tw:text-gray-600">
                          Documents are optional
                        </p>
                      </div>
                      <AppButton
                        size="small"
                        color="primary"
                        onClick={() => setShowDocumentsModal(true)}
                      >
                        <Plus size={16} className="tw:mr-1" />
                        Add Document
                      </AppButton>
                    </div>

                    {documents.length === 0 ? (
                      <div className="tw:text-center tw:py-8 tw:text-gray-500">
                        <p className="tw:text-sm">No documents added yet</p>
                        <p className="tw:text-xs tw:mt-1">
                          Click "Add Document" to upload your documents
                        </p>
                      </div>
                    ) : (
                      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                        {documents.map((doc, index) => (
                          <DocumentDisplayItem
                            key={index}
                            title={doc.documentType}
                            front={doc.frontImage}
                            back={doc.backImage}
                            refNo={doc.referenceNo}
                            onRemove={() => handleRemoveDocument(index)}
                          />
                        ))}
                      </div>
                    )}
                  </AppCard>

                  {/* submit is rendered in sticky footer below */}
                </form>
              </FormProvider>
            </>
          )}
          <SuccessModal
            show={successOpen}
            onClose={() => {
              setSuccessOpen(false);
              // navigate back to previous page when modal is closed
              back();
            }}
            requestId={successData?.requestId}
            amount={successData?.amount}
          />
          <DocumentsUploadModal
            show={showDocumentsModal}
            callback={handleDocumentsModalCallback}
            onClose={() => setShowDocumentsModal(false)}
            title="Add Document"
            showSubmitButton={true}
            defaultProofType="photo"
          />
        </div>
      </div>

      <div className="app-footer">
        <div className="app-container">
          <div className="tw:text-end">
            <AppButton
              onClick={methods.handleSubmit(onSubmit)}
              isLoading={submitting}
              color="primary"
              type="button"
            >
              {t("form.submit")}
            </AppButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaylaterRequestPage;
