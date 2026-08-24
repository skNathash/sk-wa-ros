import { ExternalLink, Upload } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import FileUpload from "~/components/core/file-upload/FileUpload";
import AppHeader from "~/components/core/header/AppHeader";
import { CLUB_URL } from "~/constants";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import { AppPaneMain, AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AddPhotoCard from "./components/AddPhotoCard";
import PhotoSlotCard from "./components/PhotoSlotCard";
import StorePhotosSidePane from "./components/StorePhotosSidePane";
import { UPLOAD_PROPS } from "./components/uploadProps";
import { buildPhotoModel, MAX_PHOTOS, type PhotoSlot } from "./helper";

const breadcrumbsBase: BreadcrumbItem[] = [
  { label: "dashboard", redirect: { path: "/dashboard" } },
  { label: "myProfile", redirect: { path: "/user/my-profile" } },
  { label: "Store photos" },
];

const StorePhotosPage: React.FC = () => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ show: boolean; message?: string }>({
    show: false,
  });
  const [removeSlot, setRemoveSlot] = useState<PhotoSlot | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    show: boolean;
    imageId?: string;
  }>({ show: false });

  const breadcrumbs: BreadcrumbItem[] = breadcrumbsBase.map((b) => ({
    ...b,
    label: typeof b.label === "string" ? t(b.label as string) : b.label,
  }));

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const resp = await AuthService.getLoggedInFranchiseDetails();
      // Other profile surfaces read the cached user, so keep it in step with
      // what this page just read.
      if (resp?.data?.data?._id) {
        AuthService.setloggedInUser(resp.data.data);
      }
      setProfileData(FranchiseService.formatFranchise(resp?.data?.data || {}));
    } catch {
      setProfileData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const model = useMemo(() => buildPhotoModel(profileData), [profileData]);

  const storeName = profileData?.name || "";
  const clubUrl = `${CLUB_URL}/${profileData?.mobile || ""}`;
  const summary = `${model.progressLabel} · appears on ${CLUB_URL.replace(
    "https://",
    "",
  )}`;

  /** Single write path — every action rebuilds the whole photo array. */
  const savePhotos = async (
    photos: Array<{ fileUrl: string; status: string }>,
    messages: { busy: string; success: string; error: string },
  ) => {
    setBusy({ show: true, message: messages.busy });
    try {
      const response = await FranchiseService.updateFranchise({
        shopPhotosDetails: photos,
      });
      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.show({ msg: messages.success, color: "success" });
        await fetchProfile();
      } else {
        toast.show({ msg: messages.error, color: "danger" });
      }
    } catch {
      toast.show({ msg: messages.error, color: "danger" });
    }
    setBusy({ show: false });
  };

  const handleUpload = (asset: any) => {
    if (!asset?._id) return;
    savePhotos([...model.payload, { fileUrl: asset._id, status: "Pending" }], {
      busy: "Uploading photo...",
      success: "Photo uploaded successfully!",
      error: "Failed to upload photo. Please try again.",
    });
  };

  const handleReplace = (slot: PhotoSlot, asset: any) => {
    if (!asset?._id || slot.index < 0) return;
    const photos = model.payload.map((photo, index) =>
      index === slot.index ? { fileUrl: asset._id, status: "Pending" } : photo,
    );
    savePhotos(photos, {
      busy: "Replacing photo...",
      success: "Photo replaced successfully!",
      error: "Failed to replace photo. Please try again.",
    });
  };

  const handleRemove = async () => {
    const slot = removeSlot;
    setRemoveSlot(null);
    if (!slot || slot.index < 0) return;
    await savePhotos(
      model.payload.filter((_, index) => index !== slot.index),
      {
        busy: "Removing photo...",
        success: "Photo removed successfully!",
        error: "Failed to remove photo. Please try again.",
      },
    );
  };

  return (
    <>
      <AppHeader
        title="Store photos"
        subtitle={summary}
        sectionKey="profile"
        activeTab="store-photos"
        mobileLead="menu"
      />
      <BusyLoader show={busy.show} message={busy.message} />

      <div className="app-page page-bg tw:p-3 tw:sm:p-4">
        <div className="app-container">
          <div className="section-layout">
            {/* Desktop-only left rail — profile section menu. */}
            <aside className="section-menu-aside">
              <div className="tw:sticky tw:top-20">
                <SectionMenu
                  sectionKey="profile"
                  activeTab="store-photos"
                  title="Manage profile"
                />
              </div>
            </aside>

            <div className="section-content">
              <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
                <AppPaneMain className="tw:lg:col-span-12 tw:mx-auto tw:w-full tw:max-w-5xl">
                  <AppBreadcrumbs data={breadcrumbs} />

                  <AppCard
                    title={
                      <div className="tw:flex tw:w-full tw:flex-col tw:md:flex-row tw:md:items-center tw:md:justify-between tw:gap-3">
                        <div>
                          <div className="tw:text-base tw:font-semibold tw:text-gray-800">
                            Photo gallery
                          </div>
                          <div className="tw:text-xs tw:font-normal tw:text-gray-500">
                            {model.approved} approved · {model.pending} in
                            review · {model.rejected} rejected
                          </div>
                        </div>
                        {/* Mobile keeps both actions on one row, each taking
                            half the width so neither wraps. */}
                        {/* Mobile keeps both actions on one row, each taking
                            half the width so neither wraps. */}
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <a
                            href={clubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:gap-1 tw:rounded-md tw:border tw:border-gray-300 tw:bg-white tw:px-3 tw:py-1.5 tw:text-sm tw:font-medium tw:text-gray-700 tw:md:flex-none tw:hover:bg-gray-50"
                          >
                            <ExternalLink size={14} />
                            Preview
                          </a>
                          {model.canAddMore && (
                            <div className="tw:flex-1 tw:md:flex-none">
                              <FileUpload
                                {...UPLOAD_PROPS}
                                onFileUpload={handleUpload}
                              >
                                <AppButton
                                  size="small"
                                  color="primary"
                                  className="tw:w-full tw:md:w-auto"
                                >
                                  <Upload size={16} />
                                  Upload
                                </AppButton>
                              </FileUpload>
                            </div>
                          )}
                        </div>
                      </div>
                    }
                  >
                    {loading ? (
                      <div className="tw:flex tw:h-64 tw:items-center tw:justify-center">
                        <div className="tw:h-10 tw:w-10 tw:animate-spin tw:rounded-full tw:border-t-2 tw:border-b-2 tw:border-gray-900" />
                      </div>
                    ) : (
                      <div className="tw:grid tw:grid-cols-2 tw:lg:grid-cols-3 tw:gap-3 tw:sm:gap-4">
                        {model.slots.map((slot) => (
                          <PhotoSlotCard
                            key={slot.key}
                            slot={slot}
                            onReplace={handleReplace}
                            onRemove={setRemoveSlot}
                            onPreview={(s) =>
                              setPreviewModal({
                                show: true,
                                imageId: s.fileUrl,
                              })
                            }
                          />
                        ))}
                        {model.canAddMore && (
                          <AddPhotoCard
                            onUpload={handleUpload}
                            label={model.filled ? "Add more" : "Add photo"}
                            hint={`Up to ${MAX_PHOTOS} photos`}
                          />
                        )}
                      </div>
                    )}
                  </AppCard>

                  {/* Progress and shooting tips live in the side pane on
                      theme-2 desktop; mobile gets them inline instead. */}
                  <div className="app-pane-hide">
                    <AppCard>
                      <StorePhotosSidePane
                        compact
                        model={model}
                        clubUrl={clubUrl}
                        storeName={storeName}
                      />
                    </AppCard>
                  </div>
                </AppPaneMain>

                <AppPaneSide className="app-pane-only">
                  <StorePhotosSidePane
                    model={model}
                    clubUrl={clubUrl}
                    storeName={storeName}
                  />
                </AppPaneSide>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImgPreviewModal
        show={previewModal.show}
        images={model.slots.map((slot) => ({ id: slot.fileUrl }))}
        initialImageId={previewModal.imageId}
        callback={() => setPreviewModal({ show: false })}
      />

      <AppAlertDialog
        show={!!removeSlot}
        title="Remove photo"
        description={`Are you sure you want to remove the "${removeSlot?.title || ""}" photo?`}
        okText="Remove"
        cancelText="Cancel"
        onCancel={() => setRemoveSlot(null)}
        onConfirm={handleRemove}
      />
    </>
  );
};

export default StorePhotosPage;
