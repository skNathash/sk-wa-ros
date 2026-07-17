import { ChevronDown, ChevronRight, File, Info, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { SwiperOptions } from "swiper/types";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import AppPopover from "~/components/core/popover/AppPopover";
import AppSwiper from "~/components/core/swiper";
import useAppToast from "~/hooks/useAppToast";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";

interface DocumentSectionProps {
  data?: any[];
  title: string;
  nameKey: string; // e.g. 'photoID' | 'businessID' | 'addressProof'
  noKey: string; // e.g. 'photoIDNo'
  fileKey: string; // e.g. 'photoIDFile'
  storageKey: string; // key under user.documents (e.g. 'photo' | 'business' | 'address')
  useSwiper?: boolean;
  onRefresh?: () => void;
  statusKey: string;
  remarksKey: string;
}

const swiperOptions: SwiperOptions = {
  slidesPerView: "auto",
  spaceBetween: 8,
  pagination: false,
  navigation: false,
};

const DocumentSection: React.FC<DocumentSectionProps> = ({
  data,
  title,
  nameKey,
  noKey,
  fileKey,
  storageKey,
  useSwiper = true,
  onRefresh,
  statusKey,
  remarksKey,
}) => {
  const [open, setOpen] = useState(false);
  const [confirmShow, setConfirmShow] = useState(false);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: { id: string }[];
    initialImageId?: string | undefined;
  }>({ show: false, images: [] });
  const { show: showToast } = useAppToast();

  const groupsMap = new Map<string, any>();

  (data || []).forEach((d) => {
    const key = `${(d && d[nameKey]) || ""}::${(d && d[noKey]) || ""}`;
    const fileId = d && d[fileKey];
    const face = d && d.documentFace;
    const isApproved = statusKey && d && d[statusKey] === "Approved";

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        name: d && d[nameKey],
        no: d && d[noKey],
        images: [],
        hasApproved: false,
      });
    }

    if (fileId) {
      groupsMap.get(key)!.images.push({
        id: fileId,
        face,
        status: d[statusKey] === "Pending" ? "Approval Pending" : d[statusKey],
        remarks: d[remarksKey],
      });

      if (isApproved) {
        const g = groupsMap.get(key)!;
        g.hasApproved = true;
        groupsMap.set(key, g);
      }
    }
  });

  const groups = Array.from(groupsMap.values());

  const handleRemoveConfirm = async () => {
    if (!selectedProof) return;
    setRemoving(true);
    try {
      const user = AuthService.getLoggedInUser();
      const rawExistingDocs = Array.isArray(user?.documents?.[storageKey])
        ? user.documents[storageKey]
        : [];

      // Exclude the selected item from payload:
      // - If removing a whole document (no selectedImageId), drop all records for that document name
      // - If removing a single image within a document, drop only that image record
      const filtered = rawExistingDocs
        .filter((d: any) => {
          const docName = (d && d[nameKey]) || "";
          const fileId = d && d[fileKey];
          const isSameDoc =
            docName.toString().toLowerCase() ===
            selectedProof.toString().toLowerCase();

          if (!selectedImageId) {
            // Removing the entire document group
            return !isSameDoc;
          }

          const isSameImage = fileId && fileId === selectedImageId;
          return !(isSameDoc && isSameImage);
        })
        .map((d: any) => {
          const { _id, ...rest } = d || {};
          return rest;
        });

      const payload: any = { documents: {} };
      payload.documents[storageKey] = filtered;

      const res = await FranchiseService.updateFranchise(payload);
      if (res?.statusCode === 200) {
        showToast({ msg: "Document removed successfully", color: "success" });
        try {
          onRefresh && onRefresh();
        } catch {}
      } else {
        showToast({
          msg: res?.data?.message || "Failed to remove document",
          color: "danger",
        });
      }
    } catch (e) {
      showToast({ msg: "Failed to remove document", color: "danger" });
    }
    setRemoving(false);
    setConfirmShow(false);
    setSelectedProof(null);
    setSelectedImageId(null);
  };

  const handleViewImages = (images: any[], clickedId?: string) => {
    if (images && images.length > 0) {
      const formattedImages = images.map((it: any) => ({ id: it.id }));
      setImgPreviewModal({
        show: true,
        images: formattedImages,
        initialImageId: clickedId,
      });
    }
  };

  const imgPreviewModalCallback = (event: { action: string; data?: any }) => {
    if (event.action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  return (
    <div className="tw:mb-4 tw:border-b tw:border-gray-200 pb-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        className="tw:flex tw:items-center tw:gap-2 tw:w-full tw:mb-2 tw:py-1 tw:cursor-pointer"
      >
        <div className="tw:flex tw:items-center tw:gap-2">
          <File className="tw:text-gray-600" size={18} />
          <div className="tw:text-sm tw:font-semibold tw:text-gray-700">
            {title} ({groups.length})
          </div>
        </div>
        <div className="tw:ml-auto">
          {open ? (
            <ChevronDown size={18} className="tw:text-gray-500" />
          ) : (
            <ChevronRight size={18} className="tw:text-gray-500" />
          )}
        </div>
      </button>

      {open && (
        <div className="tw:pb-2">
          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
            {groups.map((g, idx) => (
              <div
                key={idx}
                className="tw:border tw:border-gray-200 tw:rounded-md tw:p-3 tw:flex tw:flex-col tw:gap-2"
              >
                <div className="tw:flex tw:justify-between tw:items-center">
                  <div>
                    <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                      {g.name || "Document"}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500">
                      {g.no || "-"}
                    </div>
                  </div>
                  <div>
                    {!g.hasApproved && (
                      <AppButton
                        size="small"
                        fill="outline"
                        color="danger"
                        onClick={() => {
                          setSelectedProof(g.name || null);
                          setConfirmShow(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </AppButton>
                    )}
                  </div>
                </div>

                {g.images.length > 0 ? (
                  useSwiper ? (
                    <div className="tw: mt-2">
                      <AppSwiper config={swiperOptions}>
                        {g.images.map((img: any) => (
                          <AppSwiper.Slide key={img.id} isAutoWidth={true}>
                            <div
                              className="tw:w-full tw:border tw:border-gray-200 tw:rounded-md tw:p-2 tw:cursor-pointer tw:relative"
                              onClick={() => handleViewImages(g.images, img.id)}
                            >
                              {img.status !== "Approved" ? (
                                <button
                                  type="button"
                                  className="tw:absolute tw:top-2 tw:right-2 tw:bg-white tw:rounded-full tw:p-1 tw:shadow tw:border tw:border-gray-200 hover:tw:bg-gray-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProof(g.name || null);
                                    setSelectedImageId(img.id);
                                    setConfirmShow(true);
                                  }}
                                  aria-label="Remove image"
                                >
                                  <Trash2
                                    size={14}
                                    className="tw:text-gray-600"
                                  />
                                </button>
                              ) : null}
                              <ImgRender
                                assetId={img.id}
                                alt={g.name || "Document Image"}
                                className="tw:w-full tw:h-40 tw:object-cover tw:rounded"
                              />
                              <div className="tw:flex tw:items-center tw:justify-between tw:mt-1">
                                <div className="tw:text-xs tw:text-gray-400">
                                  {img.face || ""}
                                </div>
                              </div>

                              <div className="tw:text-xs tw:text-gray-400 tw:mt-1 tw:flex-col tw:flex">
                                Status:{" "}
                                <AppBadge
                                  variant={
                                    img.status === "Approved"
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {img.status || ""}
                                </AppBadge>
                              </div>

                              {img.remarks && (
                                <div className="tw:text-xs tw:text-gray-400 tw:mt-1">
                                  <AppPopover
                                    triggerContent={
                                      <div>
                                        View Remarks <Info size={14} />
                                      </div>
                                    }
                                  >
                                    {img.remarks || ""}
                                  </AppPopover>
                                </div>
                              )}
                            </div>
                          </AppSwiper.Slide>
                        ))}
                      </AppSwiper>
                    </div>
                  ) : (
                    <div className="tw:mt-2 tw:flex tw:flex-col tw:gap-2">
                      {g.images.map((img: any) => (
                        <div
                          key={img.id}
                          className="tw:w-full tw:cursor-pointer tw:relative"
                          onClick={() => handleViewImages(g.images, img.id)}
                        >
                          {img.status !== "Approved" ? (
                            <button
                              type="button"
                              className="tw:absolute tw:top-2 tw:right-2 tw:bg-white tw:rounded-full tw:p-1 tw:shadow tw:border tw:border-gray-200 hover:tw:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProof(g.name || null);
                                setSelectedImageId(img.id);
                                setConfirmShow(true);
                              }}
                              aria-label="Remove image"
                            >
                              <Trash2 size={14} className="tw:text-gray-600" />
                            </button>
                          ) : null}
                          <ImgRender
                            assetId={img.id}
                            alt={g.name || "Document Image"}
                            className="tw:w-full tw:h-40 tw:object-cover tw:rounded"
                          />
                          <div className="tw:flex tw:items-center tw:justify-between tw:mt-1">
                            <div className="tw:text-xs tw:text-gray-400">
                              {img.face || ""}
                            </div>
                          </div>

                          <div>
                            <AppBadge
                              variant={
                                img.status === "Approved"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {img.status || ""}
                            </AppBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="tw:mt-2 tw:text-xs tw:text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            ))}
          </div>
          {!groups.length && <NoData />}
        </div>
      )}

      <AppAlertDialog
        show={confirmShow}
        title="Remove Document"
        description={
          selectedProof
            ? `Are you sure you want to remove ${selectedProof} proof?`
            : "Are you sure you want to remove this proof?"
        }
        onCancel={() => {
          setConfirmShow(false);
          setSelectedProof(null);
        }}
        onConfirm={handleRemoveConfirm}
        okText={removing ? "Removing..." : "Remove"}
        cancelText="Cancel"
      />
      {/* Image preview modal */}
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </div>
  );
};

export default DocumentSection;
