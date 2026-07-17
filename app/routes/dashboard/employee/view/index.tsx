import {
  MailIcon,
  PencilIcon,
  PenSquare,
  PhoneIcon,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import NoData from "~/components/core/no-data/NoData";
import Rbac from "~/components/core/rbac/Rbac";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import PageAccessService from "~/services/PageAccessService";
import UserService from "~/services/UserService";
import UserPic from "~/shared/users/components/UserPic";
import Permissions from "./components/Permissions";
import RecentActivity from "./components/recent-activity/RecentActivity";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import { useTranslation } from "react-i18next";
import LinkedFranchisesModal from "./modals/LinkedFranchisesModal";
import LinkedRoutesModal from "./modals/LinkedRoutesModal";
import LinkedBrandsModal from "./modals/LinkedBrandsModal";

const rbacRoles = {
  activity: ["USER-MANAGEMENT.VIEW-USER-ACTIVITY"],
  editUser: ["USER-MANAGEMENT.EDIT-USER"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["USER-MANAGEMENT.VIEW-USER"]);
}

const EmployeeView = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const { id } = useParams();

  const appToast = useAppToast();

  const [busyLoader, setBusyLoader] = useState(false);

  const [appAlert, setAppAlert] = useState({
    show: false,
    title: "",
    description: "",
    type: "confirm",
    okText: "Mark as Active",
    cancelText: "Mark as Inactive",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [isLoading, setIsLoading] = useState(true);
  const [emp, setEmp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [tabs, setTabs] = useState<TabItem[]>([]);

  const [modalState, setModalState] = useState({
    showAccessModal: false,
    showImgPreview: false,
    imgPreviewImages: [] as Array<{ id: string }>,
    showFranchises: false,
    showRoutes: false,
    showBrands: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const resp = await UserService.getUser(id || "");
        const userData = resp?.data?.data
          ? UserService.formatUser(resp.data.data)
          : null;

        // Sort auditLog by latest first if it exists
        if (userData?.auditLog) {
          userData.auditLog.sort(
            (a: any, b: any) =>
              new Date(b.loggedOn).getTime() - new Date(a.loggedOn).getTime(),
          );
        }

        // Sort features by name if it exists
        if (userData?.features) {
          userData.features.sort((a: any, b: any) => {
            const nameA = (a.name || a.code || "").toLowerCase();
            const nameB = (b.name || b.code || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
        }

        setEmp(userData);

        if (userData) {
          const tabList: TabItem[] = [
            { key: "basic", name: "Basic", langKey: "basic" },
            ...(userData.position === "Sales Employee"
              ? [
                  {
                    key: "allocate",
                    name: "Allocate",
                    langKey: "allocate",
                  },
                ]
              : []),
            { key: "kyc", name: "KYC Documents", langKey: "kycDocuments" },
            // {
            //   key: "activity",
            //   name: "Activity",
            //   langKey: "activity",
            //   rbac: rbacRoles.activity,
            // },
            {
              key: "permissions",
              name: "Permissions",
              langKey: "permissions",
              rbac: rbacRoles.activity,
            },
          ];
          setTabs(tabList);
        }
      } catch (e) {
        setEmp(null);
      }
      setIsLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const handleActiveInactive = () => {
    setAppAlert({
      show: true,
      title: !emp.isActive ? t("markAsActive") : t("markAsInactive"),
      description: t("doYouWantToProceed"),
      type: "confirm",
      okText: !emp.isActive ? t("markAsActive") : t("markAsInactive"),
      cancelText: t("cancel"),
      onConfirm: async () => {
        setAppAlert((prev) => ({ ...prev, show: false }));
        await new Promise((resolve) => setTimeout(resolve, 300));

        setBusyLoader(true);
        const response = await UserService.updateUserStatus(
          emp._id,
          !emp.isActive ? "Active" : "Inactive",
        );
        setBusyLoader(false);

        if (response?.statusCode === 200) {
          setEmp((prev: any) => ({ ...prev, isActive: !prev.isActive }));
        } else {
          appToast.show({
            msg: response?.data?.message || t("failedToUpdateUserStatus"),
            color: "error",
          });
        }
      },
      onCancel: () => {
        setAppAlert((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleLinkedUpdate = async (
    key: "linkedFranchises" | "linkedRoutes" | "linkedBrands",
    data: any[],
  ) => {
    setBusyLoader(true);
    const response = await FranchiseService.updateFranSubUser(emp._id, {
      [key]: data,
    });
    setBusyLoader(false);

    if (response?.statusCode === 200) {
      setEmp((prev: any) => ({ ...prev, [key]: data }));
      appToast.show({ msg: t("updatedSuccessfully"), color: "success" });
    } else {
      appToast.show({
        msg: response?.data?.message || t("failedToUpdate"),
        color: "error",
      });
    }
  };

  return (
    <>
      <AppHeader
        title={
          emp?._position
            ? `${t("userDetails")} - ${emp._position}`
            : t("userDetails")
        }
      />

      <div className="tw:p-4 app-page page-bg">
        {isLoading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
            <AppSpinner />
          </div>
        ) : null}
        <div className="app-container">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />
          {!isLoading && !emp ? (
            <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
              <NoData />
            </div>
          ) : null}

          {emp?._id ? (
            <>
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-4 tw:mb-4">
                <div className="tw:flex tw:items-center tw:gap-3">
                  <UserPic
                    assetId={emp.profileImages?.[0]}
                    gender={emp.gender}
                    type={emp._userPicType}
                    className="tw:w-16 tw:h-16 tw:rounded-full tw:border tw:border-gray-200"
                  />
                  <div>
                    <div className="tw:font-semibold tw:text-xl tw:md:text-2xl tw:mb-1">
                      {emp.name}
                    </div>
                    <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                      <span className="tw:text-gray-500 tw:text-sm">
                        {t("id")}: {emp.referenceId}
                      </span>
                      <AppBadge variant={emp._positionBadgeColor}>
                        {emp._position}
                      </AppBadge>
                      <AppBadge variant={emp.isActive ? "success" : "danger"}>
                        {emp.isActive ? t("active") : t("inactive")}
                      </AppBadge>
                    </div>
                  </div>
                </div>
                <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                  {emp.position === "Sales Employee" && (
                    <AppButton
                      size="small"
                      fill="outline"
                      onClick={() => {
                        appNav.to("/dashboard/orders/dashboard", {
                          salesEmployeeId: emp._id,
                          salesEmployeeName: emp.name || "",
                        });
                      }}
                    >
                      <ShoppingCart size={14} />
                      {t("viewOrdersDashboard")}
                    </AppButton>
                  )}

                  <Rbac roles={rbacRoles.editUser}>
                    <AppButton
                      size="small"
                      fill="outline"
                      color={emp.isActive ? "danger" : "success"}
                      onClick={handleActiveInactive}
                    >
                      <PenSquare size={14} />
                      {emp.isActive ? t("markAsInactive") : t("markAsActive")}
                    </AppButton>
                  </Rbac>
                  <Rbac roles={rbacRoles.editUser}>
                    <AppButton
                      size="small"
                      onClick={() => {
                        appNav.to(`/dashboard/employee/manage?id=${emp._id}`);
                      }}
                    >
                      <PencilIcon size={14} />
                      {t("edit")}
                    </AppButton>
                  </Rbac>
                </div>
              </div>

              <div className="tw:mb-4">
                <AppTab
                  activeTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab.key)}
                  tabs={tabs}
                />
              </div>

              {activeTab === "basic" && (
                <>
                  <AppCard title={t("contactInformation")}>
                    <div className="tw:flex tw:gap-4 tw:flex-wrap">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <PhoneIcon size={16} className="tw:text-gray-500" />
                        <div className="tw:flex tw:flex-col">
                          <div>{emp.mobile || "-"}</div>
                          <div className="tw:text-xs tw:text-gray-500">
                            {t("mobileNumber")}
                          </div>
                        </div>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-2">
                        <MailIcon size={16} className="tw:text-gray-500" />
                        <div className="tw:flex tw:flex-col">
                          <div>{emp.email || "-"}</div>
                          <div className="tw:text-xs tw:text-gray-500">
                            {t("email")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard title={t("employeeDetails")}>
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                      <KeyValue label={t("createdOn")} size="sm">
                        <DateFormat value={emp.createdAt} />
                      </KeyValue>

                      <KeyValue label={t("gender")} size="sm">
                        {emp.gender || "-"}
                      </KeyValue>

                      <KeyValue label={t("dateOfBirth")} size="sm">
                        {emp.dob ? (
                          <DateFormat value={emp.dob} formatStr="dd MMM yyyy" />
                        ) : (
                          "-"
                        )}
                      </KeyValue>

                      <KeyValue label={t("address")} size="sm">
                        {emp.address?.doorNo} {emp.address?.street}{" "}
                        {emp.address?.city} {emp.address?.state} -{" "}
                        {emp.address?.postcode}
                      </KeyValue>

                      <KeyValue label={t("type")} size="sm">
                        <AppBadge
                          variant={
                            emp.type === "DeliveryAgent"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {emp.type === "DeliveryAgent"
                            ? t("deliveryAgent")
                            : emp.type === "SalesEmployee"
                              ? t("salesEmployee")
                              : emp.type === "Picker"
                                ? (t("picker") as any) || "Picker"
                                : t("storeEmployee")}
                        </AppBadge>
                      </KeyValue>

                      <KeyValue label={t("lastLogin")} size="sm">
                        {emp.lastLogin ? (
                          <DateFormat value={emp.lastLogin} />
                        ) : (
                          "-"
                        )}
                      </KeyValue>
                    </div>
                  </AppCard>
                </>
              )}

              {activeTab === "allocate" &&
                emp.position === "Sales Employee" && (
                  <>
                    <div className="tw:mb-4 tw:rounded-lg tw:border tw:border-blue-100 tw:bg-linear-to-r tw:from-blue-50 tw:to-white tw:p-4">
                      <div className="tw:text-sm tw:font-semibold tw:text-gray-800">
                        Allocations for this staff
                      </div>
                      <p className="tw:text-xs tw:text-gray-600 tw:mt-0.5">
                        Stores they can serve, routes they cover, and brands
                        they can sell. Use Manage to update.
                      </p>
                      <div className="tw:flex tw:flex-wrap tw:gap-2 tw:mt-2">
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-700 tw:bg-white tw:border tw:rounded-full tw:px-2 tw:py-0.5">
                          {emp.linkedFranchises?.length || 0} B2B retailers
                        </span>
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-700 tw:bg-white tw:border tw:rounded-full tw:px-2 tw:py-0.5">
                          {emp.linkedRoutes?.length || 0} routes
                        </span>
                        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-700 tw:bg-white tw:border tw:rounded-full tw:px-2 tw:py-0.5">
                          {emp.linkedBrands?.length || 0} brands
                        </span>
                      </div>
                    </div>
                    <AppCard
                      title={
                        <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
                          <span className="tw:flex tw:items-center tw:gap-2">
                            {t("linkedFranchises")}
                            <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-6 tw:h-5 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold tw:bg-blue-100 tw:text-blue-700">
                              {emp.linkedFranchises?.length || 0}
                            </span>
                          </span>
                          <Rbac roles={rbacRoles.editUser}>
                            <AppButton
                              size="small"
                              fill="outline"
                              onClick={() =>
                                setModalState((prev) => ({
                                  ...prev,
                                  showFranchises: true,
                                }))
                              }
                            >
                              <Plus size={12} />
                              {t("manage")}
                            </AppButton>
                          </Rbac>
                        </div>
                      }
                      subtitle="Stores this employee is allowed to serve."
                    >
                      {emp.linkedFranchises?.length > 0 ? (
                        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                          {emp.linkedFranchises.map((f: any) => (
                            <div
                              key={f.franchiseId}
                              className="tw:p-2 tw:border tw:rounded tw:bg-gray-50"
                            >
                              <div className="tw:font-medium tw:text-sm">
                                {f.name}
                              </div>
                              <div className="tw:text-xs tw:text-gray-500">
                                {f.refId}
                                {f.mobile ? ` • ${f.mobile}` : ""}
                                {f.email ? ` • ${f.email}` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="tw:text-gray-500 tw:text-sm">
                          {t("noLinkedFranchises")}
                        </div>
                      )}
                    </AppCard>

                    <AppCard
                      title={
                        <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
                          <span className="tw:flex tw:items-center tw:gap-2">
                            {t("linkedRoutes")}
                            <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-6 tw:h-5 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold tw:bg-blue-100 tw:text-blue-700">
                              {emp.linkedRoutes?.length || 0}
                            </span>
                          </span>
                          <Rbac roles={rbacRoles.editUser}>
                            <AppButton
                              size="small"
                              fill="outline"
                              onClick={() =>
                                setModalState((prev) => ({
                                  ...prev,
                                  showRoutes: true,
                                }))
                              }
                            >
                              <Plus size={12} />
                              {t("manage")}
                            </AppButton>
                          </Rbac>
                        </div>
                      }
                      subtitle="Delivery routes this employee covers."
                    >
                      {emp.linkedRoutes?.length > 0 ? (
                        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                          {emp.linkedRoutes.map((r: any) => (
                            <div
                              key={r.routeId}
                              className="tw:p-2 tw:border tw:rounded tw:bg-gray-50"
                            >
                              <div className="tw:font-medium tw:text-sm">
                                {r.routeCode}
                              </div>
                              {r.description && (
                                <div className="tw:text-xs tw:text-gray-500">
                                  {r.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="tw:text-gray-500 tw:text-sm">
                          {t("noLinkedRoutes")}
                        </div>
                      )}
                    </AppCard>

                    <AppCard
                      title={
                        <div className="tw:flex tw:items-center tw:justify-between tw:w-full tw:gap-2">
                          <span className="tw:flex tw:items-center tw:gap-2">
                            {t("linkedBrands")}
                            <span className="tw:inline-flex tw:items-center tw:justify-center tw:min-w-6 tw:h-5 tw:px-2 tw:rounded-full tw:text-xs tw:font-semibold tw:bg-blue-100 tw:text-blue-700">
                              {emp.linkedBrands?.length || 0}
                            </span>
                          </span>
                          <Rbac roles={rbacRoles.editUser}>
                            <AppButton
                              size="small"
                              fill="outline"
                              onClick={() =>
                                setModalState((prev) => ({
                                  ...prev,
                                  showBrands: true,
                                }))
                              }
                            >
                              <Plus size={12} />
                              {t("manage")}
                            </AppButton>
                          </Rbac>
                        </div>
                      }
                      subtitle="Brands this employee is authorised to sell."
                    >
                      {emp.linkedBrands?.length > 0 ? (
                        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-2">
                          {emp.linkedBrands.map((b: any) => (
                            <div
                              key={b.id}
                              className="tw:p-2 tw:border tw:rounded tw:bg-gray-50"
                            >
                              <div className="tw:font-medium tw:text-sm">
                                {b.brandName}
                              </div>
                              <div className="tw:text-xs tw:text-gray-500">
                                {b.id}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="tw:text-gray-500 tw:text-sm">
                          {t("noLinkedBrands")}
                        </div>
                      )}
                    </AppCard>
                  </>
                )}

              {activeTab === "kyc" && (
                <AppCard title={t("proofsUploaded")}>
                  {emp.documentsRequired?.photo?.length ? (
                    <div className="tw:grid tw:grid-cols-1 tw:gap-3">
                      {emp.documentsRequired.photo.map(
                        (doc: any, idx: number) => (
                          <div
                            key={doc.assetId || idx}
                            className="tw:flex tw:items-center tw:gap-3 tw:cursor-pointer"
                            onClick={() => {
                              setModalState((prev) => ({
                                ...prev,
                                imgPreviewImages:
                                  emp.documentsRequired.photo.map((d: any) => ({
                                    id: d.assetId,
                                  })),
                                showImgPreview: true,
                              }));
                            }}
                          >
                            <ImgRender
                              assetId={doc.assetId}
                              alt={doc.name}
                              className="tw:w-12 tw:h-12 tw:rounded tw:object-cover tw:border"
                            />
                            <div>
                              <div className="tw:text-sm tw:font-semibold">
                                {doc.name}
                              </div>
                              {doc.refNo && (
                                <div className="tw:text-xs tw:text-gray-500">
                                  {t("reference")}: {doc.refNo}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="tw:text-gray-500 tw:text-sm">
                      {t("noProofsUploaded")}
                    </div>
                  )}
                </AppCard>
              )}

              {/* {activeTab === "activity" && (
                <Rbac roles={rbacRoles.activity}>
                  <RecentActivity
                    logs={emp?.auditLog || []}
                    userId={id || ""}
                  />
                </Rbac>
              )} */}

              {activeTab === "permissions" && (
                <Rbac roles={rbacRoles.activity}>
                  <Permissions data={emp?.features} />
                </Rbac>
              )}
            </>
          ) : null}
        </div>
      </div>

      <ImgPreviewModal
        show={modalState.showImgPreview}
        images={modalState.imgPreviewImages}
        callback={({ action }) => {
          if (action === "close")
            setModalState((prev) => ({ ...prev, showImgPreview: false }));
        }}
      />

      <AppAlertDialog
        show={appAlert.show}
        title={appAlert.title}
        description={appAlert.description}
        type="confirm"
        okText={appAlert.okText}
        cancelText={appAlert.cancelText}
        onConfirm={appAlert.onConfirm}
        onCancel={appAlert.onCancel}
      />

      <BusyLoader show={busyLoader} />

      <LinkedFranchisesModal
        show={modalState.showFranchises}
        data={emp?.linkedFranchises || []}
        callback={({ action, data }) => {
          setModalState((prev) => ({ ...prev, showFranchises: false }));
          if (action === "submit" && data) {
            handleLinkedUpdate("linkedFranchises", data);
          }
        }}
      />

      <LinkedRoutesModal
        show={modalState.showRoutes}
        data={emp?.linkedRoutes || []}
        callback={({ action, data }) => {
          setModalState((prev) => ({ ...prev, showRoutes: false }));
          if (action === "submit" && data) {
            handleLinkedUpdate("linkedRoutes", data);
          }
        }}
      />

      <LinkedBrandsModal
        show={modalState.showBrands}
        data={emp?.linkedBrands || []}
        callback={({ action, data }) => {
          setModalState((prev) => ({ ...prev, showBrands: false }));
          if (action === "submit" && data) {
            handleLinkedUpdate("linkedBrands", data);
          }
        }}
      />
    </>
  );
};

const breadcrumbs = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Staff",
    langKey: "employees",
    redirect: { path: "/dashboard/employee/list" },
  },
  { label: "Staff Details", langKey: "employeeDetails" },
];

export default EmployeeView;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Staff Details"),
    },
  ];
}
