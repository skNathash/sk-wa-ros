import { produce } from "immer";
import { ArrowLeft, ArrowRight, SaveIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppSteps from "~/components/core/steps/AppSteps";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import OtpModal from "~/modals/core/otp-modal/OtpModal";
import FranchiseService from "~/services/FranchiseService";
import RbacService from "~/services/RbacService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AddressInfo from "./components/form/AddressInfo";
import BasicInfo from "./components/form/BasicInfo";
import DocInfo from "./components/form/DocInfo";
import JobInfo from "./components/form/JobInfo";
import PhotoInfo from "./components/form/PhotoInfo";
import LinkInfo from "./components/form/LinkInfo";
import VehicleInfo from "./components/form/VehicleInfo";
import Permissions from "./components/Permissions";
import Role from "./components/Role";
import {
  getEmployee,
  validateBasicEmployee,
  validateAddressEmployee,
  validateRolesEmployee,
  validateDocumentEmployee,
  getPayload,
  type EmployeeForm,
} from "./helper";
import PageAccessService from "~/services/PageAccessService";
import CommonService from "~/services/CommonService";
import { useTranslation } from "react-i18next";

export async function clientLoader() {
  return PageAccessService.canAccessPage(
    ["USER-MANAGEMENT.ADD-USER", "USER-MANAGEMENT.UPDATE-USER"],
    {
      blockForMasterLogin: true,
    }
  );
}

interface PermissionChangeData {
  type: "permission" | "feature";
  featureIndex: number;
  permissionIndex?: number;
  checked: boolean;
  action: "check" | "uncheck";
}

const EmployeeManage = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const formMethods = useForm<EmployeeForm>({
    defaultValues: {
      name: "",
      mobileNo: "",
      email: "",
      dob: null,
      dateOfJoining: null,
      pincode: null,
      state: null,
      town: null,
      district: null,
      city: null,
      gender: "Male",
      address: null,
      doorNo: null,
      street: null,
      landmark: "",
      document: null,
      photo: undefined,
      documentFile: [],
      referenceNumber: null,
      vehicleNumber: null,
      vehicleDetails: {
        vehicleNo: null,
        type: null,
        capacity: null,
      },
      department: null,
      position: null,
      systemRole: "User",
      linkedFranchises: [],
      linkedRoutes: [],
      linkedBrands: [],
    },
  });
  const { setValue, getValues } = formMethods;
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const appToast = useAppToast();

  const [busyLoader, setBusyLoader] = useState(false);

  const [loading, setLoading] = useState(true);

  const [otpModal, setOtpModal] = useState({
    show: false,
    verifying: false,
  });

  // State for RBAC features
  const [rbacFeatures, setRbacFeatures] = useState<any[]>([]);

  // State for selected role
  const [selectedRole, setSelectedRole] = useState<string | number | undefined>(
    undefined
  );

  const [mobileNo, position, linkedFranchises, linkedRoutes, linkedBrands] =
    useWatch({
      control: formMethods.control,
      name: [
        "mobileNo",
        "position",
        "linkedFranchises",
        "linkedRoutes",
        "linkedBrands",
      ],
    });

  const otpResp = useRef<any>(null);

  const { isMobile } = useScreenView();
  const [activeStep, setActiveStep] = useState(0);

  const isSalesEmployee = position === "Sales Employee";

  useEffect(() => {
    if (!isSalesEmployee && activeStep > 3) {
      setActiveStep(3);
    }
  }, [isSalesEmployee, activeStep]);

  const stepsConfig = [
    { key: "basic", title: t("basic"), langKey: "basic" },
    { key: "address", title: t("address"), langKey: "address" },
    { key: "kyc", title: t("kycDocuments"), langKey: "kycDocuments" },
    ...(isSalesEmployee
      ? [{ key: "allocate", title: t("allocate"), langKey: "allocate" }]
      : []),
    { key: "roles", title: t("rolesAndPermissions"), langKey: "rolesAndPermissions" },
  ];

  const validateStepByKey = (key: string, data: EmployeeForm) => {
    if (key === "basic") return validateBasicEmployee(data);
    if (key === "address") return validateAddressEmployee(data);
    if (key === "kyc") return validateDocumentEmployee(data);
    if (key === "allocate") return "";
    if (key === "roles") return validateRolesEmployee(selectedRole);
    return "";
  };

  const findFirstInvalidStep = (data: EmployeeForm) => {
    for (let i = 0; i < stepsConfig.length; i++) {
      const msg = validateStepByKey(stepsConfig[i].key, data);
      if (msg) return { step: i, msg };
    }
    return null;
  };

  const handleNext = () => {
    const data = getValues();
    const msg = validateStepByKey(stepsConfig[activeStep].key, data);
    if (msg) {
      appToast.show({ msg, color: "danger" });
      return;
    }
    setActiveStep((s) => Math.min(s + 1, stepsConfig.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Load RBAC features
    const loadRbacFeatures = async () => {
      try {
        const resp = await RbacService.getFeatures({ groupBy: "module" });
        setRbacFeatures(
          (resp?.data?.data || []).map((item: any) => ({
            ...item,
            permissions: (item.features || []).map((perm: any) => ({
              ...perm,
              selected: false,
            })),
          }))
        );
      } catch (e) {
        setRbacFeatures([]);
      }
    };
    loadRbacFeatures();
  }, []);

  useEffect(() => {
    if (id) {
      const loadEmployee = async () => {
        setLoading(true);
        const employee = await getEmployee(id);
        setValue("name", employee.name);
        setValue("mobileNo", employee.mobile);
        setValue("email", employee.email);
        setValue("dob", employee.dob ? [new Date(employee.dob)] : null);
        setValue(
          "dateOfJoining",
          employee.dateOfJoining ? [new Date(employee.dateOfJoining)] : null
        );
        setValue("gender", employee.gender);
        setValue("pincode", employee.address?.postcode);
        setValue("state", employee.address?.state);
        setValue("town", employee.address?.city || employee.address?.town);
        setValue("district", employee.address?.district);
        setValue("city", employee.address?.city || employee.town);
        setValue("address", employee.address?.full_addrees);
        setValue("doorNo", employee.address?.doorNo);
        setValue("street", employee.address?.street);
        setValue("landmark", employee.address?.landmark);
        setValue("vehicleNumber", employee.vehicleNumber);
        setValue("department", employee.department);
        setValue("position", employee.position);

        // Set vehicle details if they exist
        if (employee.vehicleDetails) {
          setValue("vehicleDetails", {
            vehicleNo: employee.vehicleDetails.vehicleNo || null,
            type: employee.vehicleDetails.type || null,
            capacity: employee.vehicleDetails.capacity || null,
          });
        }
        if (employee.linkedFranchises) {
          setValue("linkedFranchises", employee.linkedFranchises);
        }
        if (employee.linkedRoutes) {
          setValue("linkedRoutes", employee.linkedRoutes);
        }
        if (employee.linkedBrands) {
          setValue("linkedBrands", employee.linkedBrands);
        }
        setValue("systemRole", employee.role);
        setSelectedRole(employee.roleTemplate?.roleId ?? employee.roleId);

        // photo
        if (employee.profileImages) {
          setValue("photo", { id: employee.profileImages[0] });
        }

        const docs = employee.documentsRequired?.photo || [];
        const frontDoc = docs.find((doc: any) => doc.documentFace === "Front");
        const backDoc = docs.find((doc: any) => doc.documentFace === "Back");
        let uploadedDocs = [];
        if (frontDoc?.assetId) {
          uploadedDocs.push({ id: frontDoc?.assetId });
        }
        if (backDoc?.assetId) {
          uploadedDocs.push({ id: backDoc?.assetId });
        }

        setValue("document", frontDoc?.name);
        setValue("referenceNumber", frontDoc?.refNo);
        setValue("documentFile", uploadedDocs);

        setRbacFeatures(
          produce((draft) => {
            const employeeFeatures = employee.features || [];
            draft.forEach((feature) => {
              // Check if this feature exists in employee's features
              const featureInEmployee = employeeFeatures.some(
                (f: any) => f.code === feature.code
              );

              // Update permissions for this feature
              if (feature.permissions) {
                feature.permissions.forEach((permission: any) => {
                  // Check if this permission exists in employee's features
                  permission.selected = employeeFeatures.some(
                    (f: any) => f.code === permission.code
                  );
                });
              }

              // Mark feature as checked if all permissions are selected
              const allPermissionsSelected = feature.permissions?.every(
                (perm: any) => perm.selected
              );

              feature.checked = allPermissionsSelected;
            });
          })
        );

        setLoading(false);
      };
      const t = setTimeout(() => {
        clearTimeout(t);
        loadEmployee();
      }, 1000);
    } else {
      setLoading(false);
    }
  }, [id]);

  const onSubmit = async () => {
    const data = getValues();
    const invalid = findFirstInvalidStep(data);
    if (invalid) {
      appToast.show({ msg: invalid.msg, color: "danger" });
      setActiveStep(invalid.step);
      return;
    }
    {
      setBusyLoader(true);
      const payload = getPayload(
        data,
        id ? "update" : "add",
        rbacFeatures,
        selectedRole
      );
      if (!id) {
        delete payload.vehicleNumber;
      }
      let resp;
      if (id) {
        resp = await FranchiseService.updateFranSubUser(id, payload);
      } else {
        resp = await FranchiseService.createFranSubUser(payload);
      }

      setBusyLoader(false);

      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        if (resp?.data?.isOtpRequired) {
          otpResp.current = resp?.data?.data;
          setOtpModal({ show: true, verifying: false });
        } else {
          const successMsg = id
            ? t("employeeUpdatedSuccessfully")
            : t("employeeCreatedSuccessfully");
          appToast.show({
            msg: successMsg,
            color: "success",
          });
          appNav.replace("/dashboard/employee/list");
        }
      } else {
        appToast.show({
          msg: resp?.data?.message || t("somethingWentWrong"),
          color: "danger",
        });
      }
    }
  };

  const verifyOtp = async ({ otp }: { otp: number }) => {
    setOtpModal({ show: true, verifying: true });
    const resp = await FranchiseService.validateSubUserOtp({
      otp: otp?.toString(),
      otpRequestId: otpResp.current?.otp?.otpRequestId,
      mobileNo: mobileNo?.toString(),
    });

    if (resp?.statusCode === 200) {
      setOtpModal({ show: false, verifying: false });
      appToast.show({
        msg: t("employeeCreatedSuccessfully"),
        color: "success",
      });
      appNav.replace("/dashboard/employee/list");
    } else {
      setOtpModal({ show: true, verifying: false });
      appToast.show({
        msg: resp?.data?.message || t("somethingWentWrong"),
        color: "danger",
      });
    }
  };

  const resendOtp = async () => {
    const resp = await FranchiseService.resendSubUserOtp({
      otpRequestId: otpResp.current?.otp?.otpRequestId,
      mobileNo: mobileNo?.toString(),
    });
    if (resp?.statusCode === 200) {
      appToast.show({
        msg: t("otpSentSuccessfully"),
        color: "success",
      });
    } else {
      appToast.show({
        msg: resp?.data?.message || t("somethingWentWrong"),
        color: "danger",
      });
    }
  };

  const handlePermissionChange = (changeData: PermissionChangeData) => {
    setRbacFeatures((prev) => {
      return prev.map((feature, index) => {
        if (index === changeData.featureIndex) {
          if (changeData.type === "feature") {
            // Handle feature-level checkbox (enable all) - mark all permissions as checked/unchecked
            const updatedPermissions = feature.permissions?.map(
              (perm: any) => ({
                ...perm,
                selected: changeData.checked,
              })
            );
            return {
              ...feature,
              checked: changeData.checked,
              permissions: updatedPermissions,
            };
          } else if (
            changeData.type === "permission" &&
            changeData.permissionIndex !== undefined
          ) {
            // Handle individual permission checkbox
            const updatedPermissions = feature.permissions?.map(
              (perm: any, permIndex: number) => {
                if (permIndex === changeData.permissionIndex) {
                  return { ...perm, selected: changeData.checked };
                }
                return perm;
              }
            );

            // Check if all permissions are now selected to update feature checked status
            const allPermissionsSelected = updatedPermissions?.every(
              (perm: any) => perm.selected
            );

            return {
              ...feature,
              checked: allPermissionsSelected,
              permissions: updatedPermissions,
            };
          }
        }
        return feature;
      });
    });
  };

  // Callback for Role selection
  const handleRoleSelect = (
    id: string | number,
    name: string,
    features: { code: string; _id: string | number }[]
  ) => {
    setSelectedRole(id);
    // Set rbacFeatures checked for those in features and update permissions
    setRbacFeatures((prev) =>
      prev.map((feature) => {
        // Check if this feature is in the role's features
        const isFeatureInRole = features.some((f) => f.code === feature._id);

        // Update permissions based on role features
        const updatedPermissions = feature.permissions?.map((perm: any) => ({
          ...perm,
          selected: features.some((f) => f.code === perm.code),
        }));

        // Check if all permissions are selected
        const allPermissionsSelected = updatedPermissions?.every(
          (perm: any) => perm.selected
        );

        return {
          ...feature,
          checked: allPermissionsSelected,
          permissions: updatedPermissions,
        };
      })
    );
  };

  return (
    <>
      <AppHeader title={t("userManagement")} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:mx-auto tw:h-full">
            <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
            {loading ? (
              <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
                <AppSpinner />
              </div>
            ) : (
              <>
                <div className="tw:text-center">
                  <AppSteps
                    steps={stepsConfig}
                    activeKey={stepsConfig[activeStep].key}
                    borderMinWidth={isMobile ? 20 : 120}
                  />
                </div>

                <FormProvider {...formMethods}>
                  <div style={{ display: stepsConfig[activeStep]?.key === "basic" ? "block" : "none" }}>
                    <BasicInfo />
                    <JobInfo />
                    <VehicleInfo />
                    <PhotoInfo />
                  </div>
                  <div style={{ display: stepsConfig[activeStep]?.key === "address" ? "block" : "none" }}>
                    <AddressInfo />
                  </div>
                  <div style={{ display: stepsConfig[activeStep]?.key === "kyc" ? "block" : "none" }}>
                    <DocInfo />
                  </div>
                  {stepsConfig[activeStep]?.key === "allocate" && (
                    <LinkInfo
                      linkedFranchises={linkedFranchises || []}
                      linkedRoutes={linkedRoutes || []}
                      linkedBrands={linkedBrands || []}
                      onFranchisesChange={(v) => setValue("linkedFranchises", v)}
                      onRoutesChange={(v) => setValue("linkedRoutes", v)}
                      onBrandsChange={(v) => setValue("linkedBrands", v)}
                    />
                  )}
                  {stepsConfig[activeStep]?.key === "roles" && (
                    <>
                      <Role
                        callback={handleRoleSelect}
                        selectedRole={selectedRole}
                        position={position}
                        autoSelectFirst={!id}
                      />
                      <Permissions
                        data={rbacFeatures}
                        callback={handlePermissionChange}
                      />
                    </>
                  )}
                </FormProvider>
              </>
            )}
          </div>
        </div>
      </div>
      {!loading && (
        <div className="app-footer tw:px-4 tw:py-3 tw:bg-white tw:border-t tw:flex tw:justify-between tw:gap-2">
          <AppButton
            fill="outline"
            color="secondary"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            <ArrowLeft className="tw:text-xl" />
            {t("back")}
          </AppButton>
          {activeStep < stepsConfig.length - 1 ? (
            <AppButton onClick={handleNext}>
              {t("next")}
              <ArrowRight className="tw:text-xl" />
            </AppButton>
          ) : (
            <AppButton onClick={onSubmit}>
              <SaveIcon className="tw:text-xl" />
              {id ? t("update") : t("save")}
            </AppButton>
          )}
        </div>
      )}
      <BusyLoader show={busyLoader} />
      <OtpModal
        show={otpModal.show}
        close={() => setOtpModal({ show: false, verifying: false })}
        mobile={mobileNo}
        verify={verifyOtp}
        resend={resendOtp}
        validating={otpModal.verifying}
      />
    </>
  );
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Staff Management",
    langKey: "userManagement",
    redirect: { path: "/dashboard/employee/list" },
  },
  {
    label: "Manage",
    langKey: "manage",
  },
];

export default EmployeeManage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Staff Management"),
    },
  ];
}
