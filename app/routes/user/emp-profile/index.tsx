import { Building2, MailIcon, PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import PageAccessService from "~/services/PageAccessService";
import UserService from "~/services/UserService";
import Permissions from "./components/Permissions";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const EmpProfile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [emp, setEmp] = useState<any>(null);
  const [modalState, setModalState] = useState({
    showAccessModal: false,
    showImgPreview: false,
    imgPreviewImages: [] as Array<{ id: string }>,
  });

  useEffect(() => {
    const id = AuthService.isManpowerLoggedIn()
      ? AuthService.getManpower()?._id
      : AuthService.getLoggedInUserId();

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const resp = await UserService.getUser(id || "");
        const userData = resp?.data?.data || null;

        // Sort auditLog by latest first if it exists
        if (userData?.auditLog) {
          userData.auditLog.sort(
            (a: any, b: any) =>
              new Date(b.loggedOn).getTime() - new Date(a.loggedOn).getTime()
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
      } catch (e) {
        setEmp(null);
      }
      setIsLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, []);

  const imgPreviewCallback = (action: { action: string; data?: any }) => {
    setModalState((prev) => ({ ...prev, showImgPreview: false }));
  };

  return (
    <>
      <AppHeader title="My Profile" />

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
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-4 tw:mb-4">
                <div>
                  <div className="tw:font-semibold tw:text-xl tw:md:text-2xl tw:mb-1">
                    {emp.name}
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <span className="tw:text-gray-500 tw:text-sm">
                      ID: {emp.referenceId}
                    </span>
                    <AppBadge variant="primary">{emp.position}</AppBadge>
                  </div>
                </div>
              </div>

              <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
                <div className="tw:md:col-span-2">
                  <AppCard title="Contact Information">
                    <div className="tw:flex tw:gap-4 tw:flex-wrap">
                      <div className="tw:flex tw:items-center tw:gap-2">
                        <PhoneIcon size={16} className="tw:text-gray-500" />
                        <div className="tw:flex tw:flex-col">
                          <div>{emp.mobile || "-"}</div>
                          <div className="tw:text-xs tw:text-gray-500">
                            Mobile Number
                          </div>
                        </div>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-2">
                        <MailIcon size={16} className="tw:text-gray-500" />
                        <div className="tw:flex tw:flex-col">
                          <div>{emp.email || "-"}</div>
                          <div className="tw:text-xs tw:text-gray-500">
                            Email
                          </div>
                        </div>
                      </div>
                    </div>
                  </AppCard>

                  <AppCard title="Employee Details">
                    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                      <KeyValue label="Created On" size="sm">
                        <DateFormat value={emp.createdAt} />
                      </KeyValue>

                      <KeyValue label="Gender" size="sm">
                        {emp.gender || "-"}
                      </KeyValue>

                      <KeyValue label="DOB" size="sm">
                        {emp.dob ? (
                          <DateFormat value={emp.dob} formatStr="dd MMM yyyy" />
                        ) : (
                          "-"
                        )}
                      </KeyValue>

                      <KeyValue label="Address" size="sm">
                        {emp.address?.doorNo} {emp.address?.street}{" "}
                        {emp.address?.city} {emp.address?.state} -{" "}
                        {emp.address?.postcode}
                      </KeyValue>

                      <KeyValue label="Type" size="sm">
                        <AppBadge
                          variant={
                            emp.type === "DeliveryAgent"
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {emp.type === "DeliveryAgent"
                            ? "Delivery Agent"
                            : emp.type === "Picker"
                            ? "Picker"
                            : "Store Employee"}
                        </AppBadge>
                      </KeyValue>

                      <KeyValue label="Last Login" size="sm">
                        {emp.lastLogin ? (
                          <DateFormat value={emp.lastLogin} />
                        ) : (
                          "-"
                        )}
                      </KeyValue>

                      <KeyValue label="Registered Under" size="sm">
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <Building2 size={16} className="tw:text-gray-500" />
                          {emp.franchiseInfo?.name || "-"}
                        </div>
                      </KeyValue>
                    </div>
                  </AppCard>

                  <AppCard title="Proofs Uploaded">
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
                                    emp.documentsRequired.photo.map(
                                      (d: any) => ({ id: d.assetId })
                                    ),
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
                                    Ref: {doc.refNo}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="tw:text-gray-500 tw:text-sm">
                        No proofs uploaded.
                      </div>
                    )}
                  </AppCard>
                </div>

                <div>
                  <Permissions data={emp?.features} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <ImgPreviewModal
        show={modalState.showImgPreview}
        images={modalState.imgPreviewImages}
        callback={imgPreviewCallback}
      />
    </>
  );
};

const breadcrumbs = [
  { label: "Dashboard", redirect: { path: "/dashboard" } },
  { label: "My Profile" },
];

export default EmpProfile;
