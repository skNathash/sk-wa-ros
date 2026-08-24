import { ChevronLeft, ChevronRight, Info, Trash2, Upload } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppCard from "~/components/core/card/AppCard";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import AppPopover from "~/components/core/popover/AppPopover";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

interface StorePhotoProps {
  photos: { id: string; status: string; comment?: string }[];
  callback?: (params: { action: string; data?: any }) => void;
}

const StorePhoto: React.FC<StorePhotoProps> = ({ photos, callback }) => {
  const { t } = useTranslation(["common"]);
  const toast = useAppToast();

  // Allow master users to upload/remove photos — no gating here.

  const [previewModal, setPreviewModal] = useState<{
    show: boolean;
    imageId?: string;
  }>({ show: false, imageId: undefined });

  const [busyLoading, setBusyLoading] = useState<{
    show: boolean;
    message?: string;
  }>({
    show: false,
    message: "Processing...",
  });

  const [reordering, setReordering] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  // comment is shown via AppPopover on the See comment button

  const handlePhotoUpload = async (data: any) => {
    try {
      setBusyLoading({ show: true, message: "Uploading photo..." });

      // Preserve existing photo status and set a default status for the new upload
      const updatedPhotos = [
        ...photos.map((photo) => ({ fileUrl: photo.id, status: photo.status })),
        { fileUrl: data._id, status: "Pending" },
      ];
      const response = await FranchiseService.updateFranchise({
        shopPhotosDetails: updatedPhotos,
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.show({
          msg: "Photo uploaded successfully!",
          color: "success",
        });
        // Inform parent to refresh profile data
        // Inform parent to refresh profile data with the payload sent to backend
        callback?.({
          action: "refresh",
          data: { shopPhotosDetails: updatedPhotos },
        });
      } else {
        toast.show({
          msg: "Failed to upload photo. Please try again.",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.show({
        msg: "An error occurred while uploading the photo. Please try again.",
        color: "error",
      });
    } finally {
      setBusyLoading({ show: false });
    }
  };

  const handleRemovePhoto = async (index: number) => {
    try {
      setBusyLoading({ show: true, message: "Removing photo..." });

      // The removed photo stays in the payload flagged with `isDeleted` — the
      // backend needs the entry to know which one to drop.
      const payload = photos.map((photo, idx) => ({
        fileUrl: photo.id,
        status: photo.status,
        ...(idx === index ? { isDeleted: true } : {}),
      }));

      const response = await FranchiseService.updateFranchise({
        shopPhotosDetails: payload,
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.show({
          msg: "Photo removed successfully!",
          color: "success",
        });
        // Inform parent to refresh profile data
        // Notify parent with same payload shape that backend expects
        callback?.({
          action: "refresh",
          data: { shopPhotosDetails: payload },
        });
      } else {
        toast.show({
          msg: "Failed to remove photo. Please try again.",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.show({
        msg: "An error occurred while removing the photo. Please try again.",
        color: "error",
      });
    } finally {
      setBusyLoading({ show: false });
    }
  };

  // Swaps two photos by their index in the full `photos` array. Approved photos
  // are reordered among themselves, so the caller passes the original indices of
  // the two approved entries being swapped.
  const handleReorderPhoto = async (index: number, targetIndex: number) => {
    if (targetIndex == null || targetIndex < 0 || targetIndex >= photos.length)
      return;
    if (reordering) return;

    try {
      // No full-screen loader here — reordering only affects this grid, so we
      // just disable the arrows while the update is in flight.
      setReordering(true);

      const reordered = [...photos];
      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];
      // Preserve each photo's status when sending the reordered payload
      const payload = reordered.map((photo) => ({
        fileUrl: photo.id,
        status: photo.status,
      }));

      const response = await FranchiseService.updateFranchise({
        shopPhotosDetails: payload,
      });

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.show({
          msg: "Photo order updated successfully!",
          color: "success",
        });
        callback?.({
          action: "refresh",
          data: { shopPhotosDetails: payload },
        });
      } else {
        toast.show({
          msg: "Failed to update photo order. Please try again.",
          color: "error",
        });
      }
    } catch (error) {
      console.error("Error reordering photo:", error);
      toast.show({
        msg: "An error occurred while updating the photo order. Please try again.",
        color: "error",
      });
    } finally {
      setReordering(false);
    }
  };

  const titleContent = (
    <div className="tw:flex tw:justify-between tw:items-center tw:w-full">
      <span>{t("storePhotos")}</span>
      {/* Show upload in title only when there are existing photos; when no photos the upload CTA is shown inside the card body instead */}
      {photos && photos.length > 0 && (
        <FileUpload
          allowedExtensions={["jpg", "jpeg", "png", "webp"]}
          accept="image/*"
          maxSizeMB={10}
          onFileUpload={handlePhotoUpload}
          children={
            <div className="tw:flex tw:items-center tw:gap-2 tw:bg-blue-500 tw:text-white tw:px-3 tw:py-1.5 tw:rounded tw:text-sm tw:cursor-pointer hover:tw:bg-blue-600">
              <Upload size={16} />
              <span>Upload Photo</span>
            </div>
          }
        />
      )}
    </div>
  );

  // One grid, approved photos first then the rest. Only the approved ones can be
  // reordered. `index` keeps each photo's position in the original `photos`
  // array, which is what the update payloads are built from.
  const indexedPhotos = (photos ?? []).map((photo, index) => ({
    ...photo,
    index,
  }));
  const approvedPhotos = indexedPhotos.filter((p) => p.status === "Approved");
  const orderedPhotos = [
    ...approvedPhotos,
    ...indexedPhotos.filter((p) => p.status !== "Approved"),
  ];

  const handleThumbnailClick = (imageId: string, _index: number) => {
    setPreviewModal({ show: true, imageId });
  };

  const handlePreviewCallback = (a: { action: string; data?: any }) => {
    if (a.action === "close") {
      setPreviewModal({ show: false });
    }
  };

  return (
    <>
      {/* Image preview modal */}
      <ImgPreviewModal
        show={previewModal.show}
        callback={handlePreviewCallback}
        images={photos}
        initialImageId={previewModal.imageId}
      />

      <BusyLoader show={busyLoading.show} message={busyLoading.message} />
      <AppCard
        title={titleContent}
        icon="image"
        iconClassName="tw:text-blue-600 tw:h-full"
      >
        {!photos || photos.length === 0 ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:flex-col tw:py-8 tw:text-center tw:gap-3">
            <div className="tw:text-gray-500 tw:text-sm">
              {t("noShopPhotoUploaded", "No shop photo uploaded")}
            </div>
            {/* Show a subtle hint to upload */}
            <div className="tw:mt-2">
              <FileUpload
                allowedExtensions={["jpg", "jpeg", "png", "webp"]}
                accept="image/*"
                maxSizeMB={10}
                onFileUpload={handlePhotoUpload}
                children={
                  <div className="tw:flex tw:items-center tw:gap-2 tw:bg-blue-500 tw:text-white tw:px-3 tw:py-1.5 tw:rounded tw:text-sm tw:cursor-pointer hover:tw:bg-blue-600">
                    <Upload size={16} />
                    <span>{t("uploadPhoto", "Upload Photo")}</span>
                  </div>
                }
              />
            </div>
          </div>
        ) : (
          <>
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-xs tw:text-gray-500 tw:mb-3">
              <Info size={12} />
              <span>
                {t(
                  "firstPhotoIsMainNote",
                  "The first image is considered as the main image. Use the arrows to reorder.",
                )}
              </span>
            </div>
            <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
              {orderedPhotos.map((photo, position) => {
                const isApproved = photo.status === "Approved";
                return (
                  <div
                    key={photo.id}
                    className="tw:border tw:border-gray-300 tw:rounded-md tw:p-2 tw:flex tw:items-center tw:justify-center tw:flex-col tw:relative"
                  >
                    {position === 0 && isApproved && (
                      <div className="tw:absolute tw:top-2 tw:left-2 tw:z-10">
                        <AppBadge variant="primary">
                          {t("mainImage", "Main")}
                        </AppBadge>
                      </div>
                    )}
                    <button
                      type="button"
                      className="tw:absolute tw:top-2 tw:right-2 tw:bg-white tw:rounded-full tw:p-1 tw:shadow tw:border tw:border-gray-200 hover:tw:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(photo.index);
                        setConfirmShow(true);
                      }}
                      aria-label="Remove image"
                    >
                      <Trash2 size={14} className="tw:text-gray-600" />
                    </button>

                    <div
                      className="tw:w-full tw:h-32 tw:cursor-pointer"
                      onClick={() => handleThumbnailClick(photo.id, photo.index)}
                    >
                      <ImgRender
                        assetId={photo.id}
                        alt="Store Photo"
                        className="tw:w-full tw:h-full tw:object-cover"
                      />
                    </div>

                    {/* Reorder controls — approved photos only. Non-approved cards
                        keep an invisible strip so every card stays the same height. */}
                    {approvedPhotos.length > 1 && (
                      <div
                        className={`tw:mt-2 tw:flex tw:w-full tw:items-center tw:justify-between tw:rounded-md tw:bg-gray-100 tw:px-1 tw:py-0.5 ${
                          isApproved ? "" : "tw:invisible"
                        }`}
                        aria-hidden={!isApproved}
                      >
                        <button
                          type="button"
                          disabled={!isApproved || position === 0 || reordering}
                          className="tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded tw:text-gray-600 tw:transition hover:tw:bg-white hover:tw:text-blue-600 disabled:tw:opacity-30 disabled:tw:cursor-not-allowed disabled:hover:tw:bg-transparent"
                          onClick={() =>
                            handleReorderPhoto(
                              photo.index,
                              orderedPhotos[position - 1]?.index,
                            )
                          }
                          aria-label="Move image left"
                          title="Move left"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="tw:text-[11px] tw:text-gray-500">
                          {t("move", "Move")}
                        </span>
                        <button
                          type="button"
                          disabled={
                            !isApproved ||
                            position === approvedPhotos.length - 1 ||
                            reordering
                          }
                          className="tw:flex tw:h-6 tw:w-6 tw:items-center tw:justify-center tw:rounded tw:text-gray-600 tw:transition hover:tw:bg-white hover:tw:text-blue-600 disabled:tw:opacity-30 disabled:tw:cursor-not-allowed disabled:hover:tw:bg-transparent"
                          onClick={() =>
                            handleReorderPhoto(
                              photo.index,
                              orderedPhotos[position + 1]?.index,
                            )
                          }
                          aria-label="Move image right"
                          title="Move right"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}

                    <div className="tw:mt-2 tw:text-xs tw:text-gray-500 tw:w-full">
                      Status:{" "}
                      <div className="tw:flex tw:gap-2 tw:mt-1">
                        <AppBadge
                          variant={
                            isApproved
                              ? "success"
                              : photo.status === "Rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {photo.status}
                        </AppBadge>
                        {photo.status === "Rejected" && photo.comment ? (
                          <AppPopover
                            triggerContent={
                              <button
                                type="button"
                                className="tw:text-xs tw:text-blue-600 hover:tw:underline tw:cursor-pointer"
                              >
                                <Info size={12} />
                              </button>
                            }
                            side="top"
                            align="center"
                          >
                            <div className="tw:max-w-xs tw:text-sm tw:text-gray-700">
                              {photo.comment}
                            </div>
                          </AppPopover>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </AppCard>
      <AppAlertDialog
        show={confirmShow}
        title="Remove Photo"
        description={"Are you sure you want to remove this photo?"}
        onCancel={() => {
          setConfirmShow(false);
          setSelectedIndex(null);
        }}
        onConfirm={async () => {
          if (selectedIndex === null) return;
          await handleRemovePhoto(selectedIndex);
          setConfirmShow(false);
          setSelectedIndex(null);
        }}
        okText={busyLoading.show ? "Removing..." : "Remove"}
        cancelText="Cancel"
      />
      {/* Comment popovers are rendered inline with each photo's See comment trigger */}
    </>
  );
};

export default StorePhoto;
