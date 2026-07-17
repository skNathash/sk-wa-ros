import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import AppButton from "~/components/core/button/AppButton";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import { useTranslation } from "react-i18next";
import { useSearchParams, useNavigate } from "react-router";
import Steps from "./components/Steps";
import Customers from "./components/customers/Customers";
import Kyc from "./components/kyc/Kyc";
import Documents from "./components/documents/Documents";
import Nominee from "./components/nominee/Nominee";
import Limit from "./components/limit/Limit";
import { Phone, MapPin, Hash, BadgeCheck } from "lucide-react";
import type { CustomerItem, CustomerType } from "./components/customers/helper";
import { fetchCustomerDetails } from "./components/customers/helper";
import PageLoader from "~/components/core/page-loader/PageLoader";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";
import useAppToast from "~/hooks/useAppToast";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import SuccessModal from "./modals/SuccessModal";

const ALL_STEP_KEYS = [
  "customer",
  "kyc",
  "documents",
  "nominee",
  "limit",
] as const;
type StepKey = (typeof ALL_STEP_KEYS)[number];

const getBreadcrumbs = (
  type: CustomerType,
  isManpower: boolean,
): BreadcrumbItem[] => [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "PayLater",
    redirect: { path: `/dashboard/paylater/wallets/${type}` },
    langKey: "paylater",
  },
  {
    label: isManpower ? "Create PayLater Request" : "Assign PayLater",
  },
];

type FormData = {
  // Selected customer
  customer: CustomerItem | null;
  customerType: CustomerType;
  // KYC fields
  kyc: {
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
  // Documents
  documents: {
    documentType: string;
    referenceNo: string;
    frontImage: string;
    backImage?: string;
  }[];
  // Nominees
  nominees: { name: string; mobile: string; relationship: string }[];
  // Limit
  approvalAmount: number | null;
  approvalValidity: string;
  approvalReason: string;
};

const PaylaterAssignPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const appToast = useAppToast();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get("type") || "b2b") as CustomerType;
  const isManpower = AuthService.isManpowerLoggedIn();
  const actionLabel = isManpower ? "Create PayLater Request" : "Assign PayLater";
  const title = `${actionLabel} - ${type === "b2c" ? "B2C" : "B2B"} Customer`;
  const STEP_KEYS = React.useMemo<readonly StepKey[]>(
    () =>
      isManpower
        ? (["customer", "kyc", "documents", "nominee"] as const)
        : ALL_STEP_KEYS,
    [isManpower],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [fetchingDetails, setFetchingDetails] = React.useState(false);
  const [storePhotos, setStorePhotos] = React.useState<
    { id: string; url: string }[]
  >([]);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const methods = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      customer: null,
      customerType: type,
      kyc: {
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
      },
      documents: [],
      nominees: [{ name: "", mobile: "", relationship: "" }],
      approvalAmount: null,
      approvalValidity: "",
      approvalReason: "",
    },
  });

  const [activeStep, setActiveStep] = React.useState<StepKey>("customer");

  const handleCustomerSelect = async (customer: CustomerItem) => {
    // Reset all form fields before populating new customer data
    methods.setValue("customer", customer);
    methods.setValue("customerType", type);
    methods.setValue("kyc", {
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
    methods.setValue("documents", []);
    methods.setValue("nominees", [{ name: "", mobile: "", relationship: "" }]);
    methods.setValue("approvalAmount", null);
    methods.setValue("approvalValidity", "");
    methods.setValue("approvalReason", "");
    setStorePhotos([]);

    setFetchingDetails(true);
    try {
      const details = await fetchCustomerDetails(customer, type);
      if (details) {
        if (type === "b2c") {
          methods.setValue("kyc.name", details.name || "");
          methods.setValue("kyc.address", details.address?.street || "");
          methods.setValue("kyc.pincode", details.address?.postcode || "");
          methods.setValue("kyc.state", details.address?.state || "");
          methods.setValue("kyc.district", details.address?.district || "");
          methods.setValue("kyc.town", details.address?.city || "");
        } else {
          methods.setValue(
            "kyc.name",
            details.name || details.ownerDetails?.name || "",
          );
          methods.setValue(
            "kyc.address",
            [details.addressLine1, details.addressLine2]
              .filter(Boolean)
              .join(", ") || "",
          );
          methods.setValue("kyc.pincode", details.pincode || "");
          methods.setValue("kyc.state", details.state || "");
          methods.setValue("kyc.district", details.district || "");
          methods.setValue("kyc.town", details.city || details.town || "");
          if (details.lat && details.lng) {
            methods.setValue("kyc.latitude", details.lat);
            methods.setValue("kyc.longitude", details.lng);
          }
          // Set approved store photos for B2B
          const approved = (
            details.approvedShopPhotos ||
            details.shopPhotosDetails ||
            []
          )
            .filter(
              (p: any) => p.status === "Approved" || details.approvedShopPhotos,
            )
            .map((p: any) => ({
              id: p.fileUrl || p.id || "",
              url: p.fileUrl || p.id || "",
            }))
            .filter((p: any) => p.id);
          setStorePhotos(approved);
        }

        // Populate documents from customer/franchise profile
        const docs = details.documents || {};
        const formattedDocs: {
          documentType: string;
          referenceNo: string;
          frontImage: string;
          backImage: string;
          autoFilled: boolean;
        }[] = [];

        (docs.business || []).forEach((d: any) => {
          if (d.businessIDFile) {
            formattedDocs.push({
              documentType: d.businessID || "Business Document",
              referenceNo: d.businessIDNo || "",
              frontImage: d.businessIDFile || "",
              backImage: "",
              autoFilled: true,
            });
          }
        });

        (docs.address || []).forEach((d: any) => {
          if (d.addressProofFile) {
            formattedDocs.push({
              documentType: d.addressProof || "Address Proof",
              referenceNo: d.addressProofNo || "",
              frontImage: d.addressProofFile || "",
              backImage: "",
              autoFilled: true,
            });
          }
        });

        (docs.photo || []).forEach((d: any) => {
          if (d.photoIDFile) {
            formattedDocs.push({
              documentType: d.photoID || "Photo ID",
              referenceNo: d.photoIDNo || "",
              frontImage: d.photoIDFile || "",
              backImage: "",
              autoFilled: true,
            });
          }
        });

        if (formattedDocs.length > 0) {
          methods.setValue("documents", formattedDocs);
        }
      }
    } catch {
      // Continue even if fetch fails - user can fill manually
    } finally {
      setFetchingDetails(false);
    }
    setActiveStep("kyc");
  };

  const currentIndex = STEP_KEYS.indexOf(activeStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEP_KEYS.length - 1;

  const goNext = () => {
    if (!isLastStep) {
      if (activeStep === "kyc") {
        const name = (methods.getValues("kyc.name") || "").trim();
        if (!name) {
          appToast.show({ msg: "Name is required", color: "danger" });
          return;
        }
      }
      setActiveStep(STEP_KEYS[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (!isFirstStep) {
      setActiveStep(STEP_KEYS[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const cleanObj = (obj: Record<string, any>): Record<string, any> => {
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

  const handleSubmitClick = () => {
    const formData = methods.getValues();
    if (!formData.customer) return;

    if (!isManpower) {
      if (!formData.approvalAmount) {
        appToast.show({ msg: "Credit limit is required", color: "danger" });
        return;
      }
      if (!formData.approvalValidity) {
        appToast.show({
          msg: "Credit valid till is required",
          color: "danger",
        });
        return;
      }
      if (!(formData.approvalReason || "").trim()) {
        appToast.show({ msg: "Remarks is required", color: "danger" });
        return;
      }
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    const formData = methods.getValues();
    const customer = formData.customer;
    if (!customer) return;

    const loggedInUser = AuthService.getLoggedInUser() || {};
    const kyc = formData.kyc;

    const payload: Record<string, any> = cleanObj({
      userInfo: cleanObj({
        type: type === "b2c" ? "customer" : "franchise",
        subType: type === "b2c" ? "CUSTOMER" : customer.subType || "SKSELLER",
        name: type === "b2b" ? customer.name : kyc.name || customer.name,
        id: customer._id || customer.id,
        userId: customer.userId || customer._id || customer.id,
        gender: kyc.gender,
        mobile: customer.mobile,
        email: customer.email,
        occupation: customer.occupation,
        dob: customer.dob,
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
            ? {
                type: "Point",
                coordinates: [kyc.longitude, kyc.latitude],
              }
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
      approvedLimit: formData.approvalAmount || 0,
      kycStatus: "Approved",
      validityPeriod: formData.approvalValidity,
      reason: formData.approvalReason,
      NomineeDetails: (formData.nominees || [])
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
      otherDocuments: (formData.documents || [])
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

    setSubmitting(true);
    try {
      const resp: any = isManpower
        ? await PaylaterService.createRequest(payload)
        : await PaylaterService.enablePaylater("b2b", payload);
      if (resp.statusCode === 200) {
        setShowSuccessModal(true);
      } else {
        appToast.show({
          msg:
            resp.data?.message ||
            (isManpower
              ? "Failed to create PayLater request"
              : "Failed to assign PayLater"),
          color: "danger",
        });
      }
    } catch {
      appToast.show({
        msg: "Something went wrong. Please try again.",
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCustomer = methods.watch("customer");

  const renderStepContent = () => {
    switch (activeStep) {
      case "customer":
        return <Customers type={type} onSelect={handleCustomerSelect} />;
      case "kyc":
        return <Kyc type={type} storePhotos={storePhotos} />;
      case "documents":
        return (
          <Documents
            userId={selectedCustomer?._id || selectedCustomer?.id || ""}
            type={type}
          />
        );
      case "nominee":
        return <Nominee />;
      case "limit":
        return <Limit />;
    }
  };

  return (
    <FormProvider {...methods}>
      <AppHeader title={title} />
      <div
        className={`app-page page-bg tw:p-4 ${activeStep !== "customer" ? "has-footer" : ""}`}
      >
        <div className="app-container">
          <AppBreadcrumbs data={getBreadcrumbs(type, isManpower)} className="tw:mb-4" />

          <Steps
            activeKey={activeStep}
            className="tw:mb-4"
            hideLimit={isManpower}
          />

          {activeStep !== "customer" && selectedCustomer && (
            <section
              aria-label="Selected customer"
              className="tw:bg-card tw:border tw:border-border tw:rounded-lg tw:p-4 tw:mb-4"
            >
              <div className="tw:flex tw:items-start tw:gap-3">
                <div
                  aria-hidden="true"
                  className="tw:w-11 tw:h-11 tw:bg-primary tw:text-primary-foreground tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-sm tw:font-semibold tw:shrink-0"
                >
                  {selectedCustomer.initials ||
                    (selectedCustomer.name || "U")[0]?.toUpperCase()}
                </div>
                <div className="tw:min-w-0 tw:flex-1">
                  <div className="tw:text-[10px] tw:font-medium tw:uppercase tw:tracking-wider tw:text-muted-foreground tw:mb-0.5">
                    Selected Customer
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1.5">
                    <h3 className="tw:text-base tw:font-semibold tw:text-foreground tw:truncate">
                      {selectedCustomer.name || "-"}
                    </h3>
                    <span
                      aria-label={`Customer type ${type === "b2b" ? "B2B" : "B2C"}`}
                      className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-emerald-50 tw:text-emerald-700 tw:text-[10px] tw:font-semibold tw:px-1.5 tw:py-0.5 tw:rounded tw:border tw:border-emerald-200 tw:shrink-0"
                    >
                      <BadgeCheck size={10} aria-hidden="true" />
                      {type === "b2b" ? "B2B" : "B2C"}
                    </span>
                  </div>
                  <dl className="tw:flex tw:items-center tw:gap-x-4 tw:gap-y-1 tw:flex-wrap tw:text-xs tw:text-muted-foreground">
                    <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
                      <Phone size={12} aria-hidden="true" className="tw:shrink-0 tw:opacity-70" />
                      <dt className="sr-only">Mobile</dt>
                      <dd className="tw:truncate tw:tabular-nums">{selectedCustomer.mobile || "-"}</dd>
                    </div>
                    <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
                      <Hash size={12} aria-hidden="true" className="tw:shrink-0 tw:opacity-70" />
                      <dt className="sr-only">
                        {type === "b2b" ? "Franchise ID" : "Reference ID"}
                      </dt>
                      <dd className="tw:font-mono tw:truncate">
                        {selectedCustomer.franchiseId ||
                          selectedCustomer.refNo ||
                          selectedCustomer.referenceId ||
                          selectedCustomer._id ||
                          "-"}
                      </dd>
                    </div>
                    {selectedCustomer.location && (
                      <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:min-w-0">
                        <MapPin size={12} aria-hidden="true" className="tw:shrink-0 tw:opacity-70" />
                        <dt className="sr-only">Location</dt>
                        <dd className="tw:truncate">{selectedCustomer.location}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </section>
          )}

          {fetchingDetails ? <PageLoader /> : renderStepContent()}
        </div>
      </div>

      {activeStep !== "customer" && (
        <div className="app-footer">
          <div className="app-container">
            <div className="tw:flex tw:justify-between">
              <AppButton
                color="secondary"
                onClick={goPrev}
                disabled={isFirstStep}
              >
                {t("back", "Back")}
              </AppButton>
              <AppButton
                color="primary"
                onClick={isLastStep ? handleSubmitClick : goNext}
                disabled={submitting}
              >
                {isLastStep
                  ? submitting
                    ? t("submitting", "Submitting...")
                    : t("submit", "Submit")
                  : t("next", "Next")}
              </AppButton>
            </div>
          </div>
        </div>
      )}
      <AppAlertDialog
        show={showConfirm}
        title="Confirm Submission"
        description={
          isManpower
            ? "Are you sure you want to create a PayLater request for this customer?"
            : "Are you sure you want to assign PayLater to this customer?"
        }
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      <SuccessModal
        show={showSuccessModal}
        isManpower={isManpower}
        customerName={selectedCustomer?.name}
        parentRetailerName={AuthService.getLoggedInUser()?.name}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(`/dashboard/paylater/wallets/${type}?tab=${type}-wallets`);
        }}
      />
    </FormProvider>
  );
};

export default PaylaterAssignPage;
