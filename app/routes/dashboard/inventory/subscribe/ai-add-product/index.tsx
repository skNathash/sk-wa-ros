import clsx from "clsx";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import FileUpload from "~/components/core/file-upload/FileUpload";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import { ASSET } from "~/constants";
import CommonService from "~/services/CommonService";
import SuccessModal from "../modals/SuccessModal";
import ReviewModal from "./modals/ReviewModal";
import type { BreadcrumbItem } from "~/types/CommonTypes";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Create My Catalog",
    redirect: { path: "/dashboard/inventory/subscribe/search?tab=search" },
    langKey: "inventorySubscribe:breadcrumbs.subscription",
  },
  { label: "StoreKing AI" },
];

type UploadBlock = {
  id: string;
  images: Array<{ id: string }>;
  aiData: any | null;
  fetching: boolean;
};

const makeEmptyBlock = (id: string): UploadBlock => ({
  id,
  images: [],
  aiData: null,
  fetching: false,
});

const AiAddProduct = () => {
  const { t } = useTranslation("common");
  const [blocks, setBlocks] = useState<UploadBlock[]>(() => [
    makeEmptyBlock("b1"),
  ]);

  const [reviewModal, setReviewModal] = useState<{
    show: boolean;
    data?: any;
    blockId?: string;
    images?: Array<{ id: string }>;
  }>({ show: false, data: undefined, blockId: undefined, images: undefined });

  const [successModal, setSuccessModal] = useState<{
    show: boolean;
    blockId?: string;
  }>({ show: false, blockId: undefined });

  const addBlock = () => {
    setBlocks((p) => [...p, makeEmptyBlock("b" + (p.length + 1))]);
  };

  const onFileUpload = (blockId: string) => (response: any) => {
    if (response && response._id) {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id === blockId && b.images.length < 6) {
            return {
              ...b,
              images: [...b.images, { id: response._id }],
              aiData: null,
            };
          }
          return b;
        }),
      );
    }
  };

  const onRemove = (blockId: string) => (index: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const images = [...b.images];
        images.splice(index, 1);
        // if image removed, clear aiData to force re-fetch
        return { ...b, images, aiData: null };
      }),
    );
  };

  const fetchFromAi = async (block: UploadBlock) => {
    if (!block.images || block.images.length === 0) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? { ...b, fetching: true } : b)),
    );
    try {
      const urls = block.images.map((img) => `${ASSET}/${img.id}?size=200x200`);
      const r = await CommonService.getAiImgInfo(urls);

      if (r.statusCode !== 200) {
        throw new Error(r.data?.message || "Failed to fetch StoreKing AI data");
      }

      setBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id
            ? { ...b, aiData: r.data?.data || null, fetching: false }
            : b,
        ),
      );
    } catch (err) {
      console.error("AI fetch error", err);
      setBlocks((prev) =>
        prev.map((b) => (b.id === block.id ? { ...b, fetching: false } : b)),
      );
    }
  };

  const onRemoveBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const onResetAi = (blockId: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, aiData: null } : b)),
    );
  };

  const handleReview = (block: UploadBlock) => {
    setReviewModal({
      show: true,
      data: block.aiData,
      blockId: block.id,
      images: block.images,
    });
  };

  const handleReviewModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close") {
      setReviewModal({
        show: false,
        data: undefined,
        blockId: undefined,
        images: undefined,
      });
      return;
    }
    if (action === "created") {
      // show success modal instead of removing block immediately
      const blockId = data?.blockId;
      setSuccessModal({ show: true, blockId });
      setReviewModal({
        show: false,
        data: undefined,
        blockId: undefined,
        images: undefined,
      });
      return;
    }
    if (action === "save") {
      // legacy save action: just close
      setReviewModal({
        show: false,
        data: undefined,
        blockId: undefined,
        images: undefined,
      });
    }
  };

  const handleSuccessModalCallback = ({
    action,
    data,
  }: {
    action: string;
    data?: any;
  }) => {
    if (action === "close" || action === "view-requests") {
      // clear the block when modal is closed
      const blockId = successModal.blockId;
      if (blockId) {
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      }
      setSuccessModal({ show: false, blockId: undefined });
    }
  };

  return (
    <>
      <AppHeader title={"StoreKing AI"} />

      <div className="app-page page-bg tw:p-4">
        <div className="app-container">
          {/* Header Section */}
          <div className="tw:mb-6">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-4">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-2!" />
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="tw:grid tw:grid-cols-1 tw:lg:grid-cols-2 tw:gap-4">
            {blocks.map((b, index) => (
              <div
                key={b.id}
                className={clsx(
                  "tw:border tw:rounded-xl tw:bg-white tw:transition-all tw:flex tw:flex-col tw:overflow-hidden",
                  b.aiData
                    ? "tw:border-emerald-200"
                    : "tw:border-gray-200 tw:shadow-sm",
                  b.fetching && "tw:opacity-50",
                )}
              >
                {/* Card Header - Compact */}
                <div className="tw:flex tw:justify-between tw:items-center tw:p-3 tw:px-4 tw:border-b tw:border-gray-50 tw:bg-gray-50/50">
                  <div className="tw:flex tw:items-center tw:gap-2.5">
                    <div className="tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-lg tw:bg-primary/10 tw:text-primary tw:font-bold tw:text-sm">
                      #{index + 1}
                    </div>
                    <div className="tw:font-bold tw:text-gray-900 tw:text-sm">
                      Product Details
                    </div>
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-2">
                    {blocks.length > 1 && (
                      <button
                        onClick={() => onRemoveBlock(b.id)}
                        className="tw:p-1.5 tw:text-red-500 tw:rounded-md"
                      >
                        <Trash2 className="tw:w-3.5 tw:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Section - Compact */}
                <div className="tw:p-4 tw:flex-1 tw:space-y-4">
                  {/* Status & Upload Area Combined */}
                  <div className="tw:space-y-3">
                    {b.aiData ? (
                      <div className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:bg-emerald-50 tw:text-emerald-700 tw:rounded-lg tw:border tw:border-emerald-100">
                        <CheckCircle2 className="tw:w-4 tw:h-4 tw:shrink-0" />
                        <span className="tw:text-xs tw:font-bold">
                          StoreKing AI Extraction Complete
                        </span>
                      </div>
                    ) : b.fetching ? (
                      <div className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:bg-blue-50 tw:text-blue-700 tw:rounded-lg tw:border tw:border-blue-100">
                        <RefreshCw className="tw:w-4 tw:h-4 tw:animate-spin tw:shrink-0" />
                        <span className="tw:text-xs tw:font-bold">
                          StoreKing AI is analyzing images...
                        </span>
                      </div>
                    ) : b.images.length === 0 ? (
                      <div className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2 tw:bg-amber-50 tw:text-amber-700 tw:rounded-lg tw:border tw:border-amber-100">
                        <AlertCircle className="tw:w-4 tw:h-4 tw:shrink-0" />
                        <span className="tw:text-xs tw:font-bold">
                          Upload clear images for StoreKing AI
                        </span>
                      </div>
                    ) : null}

                    {/* Dynamic Upload Experience */}
                    {b.images.length === 0 ? (
                      <FileUpload
                        onFileUpload={onFileUpload(b.id)}
                        allowedExtensions={["jpg", "jpeg", "png", "webp"]}
                        accept={"image/*,.webp"}
                      >
                        <div className="tw:border-2 tw:border-dashed tw:border-gray-200 tw:rounded-xl tw:p-4 tw:text-center tw:bg-gray-50/10 tw:hover:tw:border-primary tw:hover:tw:bg-primary/[0.02] tw:transition-all tw:group cursor-pointer">
                          <div className="tw:w-10 tw:h-10 tw:rounded-full tw:bg-white tw:shadow-sm tw:flex tw:items-center tw:justify-center tw:mx-auto tw:mb-2 tw:group-hover:tw:scale-110 tw:transition-transform">
                            <Camera className="tw:w-5 tw:h-5 tw:text-gray-400 tw:group-hover:tw:text-primary" />
                          </div>
                          <div className="tw:text-sm tw:font-bold tw:text-gray-700">
                            Take or Upload Photo
                          </div>
                          <div className="tw:text-[10px] tw:text-gray-400 tw:mt-0.5">
                            Front, back or label of the product (up to 6 images)
                          </div>
                          <div className="tw:text-[10px] tw:text-gray-400 tw:mt-0.5">
                            Max file size: 10MB each. Allowed: JPG, JPEG, PNG,
                            WEBP
                          </div>
                        </div>
                      </FileUpload>
                    ) : (
                      <div className="tw:grid tw:grid-cols-4 tw:gap-2">
                        {/* Image Thumbnails */}
                        {b.images.map((img, idx) => (
                          <div
                            key={img.id}
                            className="tw:relative tw:aspect-square tw:rounded-lg tw:overflow-hidden tw:border tw:border-gray-200 tw:group tw:bg-gray-50"
                          >
                            <ImgRender
                              assetId={img.id}
                              className="tw:w-full tw:h-full tw:object-cover tw:transition-transform group-hover:tw:scale-110"
                              alt="Product"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemove(b.id)(idx);
                              }}
                              className="tw:absolute tw:top-1 tw:right-1 tw:p-1 tw:text-red-600 tw:rounded-full tw:shadow-md tw:bg-red-50 tw:opacity-80 hover:tw:opacity-100 tw:transition-opacity"
                            >
                              <Trash2 className="tw:w-3 tw:h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Add Button - Slot in Gallery */}
                        {b.images.length < 6 && (
                          <FileUpload
                            onFileUpload={onFileUpload(b.id)}
                            allowedExtensions={["jpg", "jpeg", "png", "webp"]}
                            accept={"image/*,.webp"}
                          >
                            <div className="tw:aspect-square tw:border-2 tw:border-dashed tw:border-gray-200 tw:rounded-lg tw:flex tw:flex-col tw:items-center tw:justify-center tw:bg-gray-50/50 tw:hover:tw:border-primary tw:hover:tw:bg-primary/[0.02] tw:transition-all tw:group cursor-pointer">
                              <div className="tw:p-1 tw:bg-white tw:rounded-full tw:shadow-sm tw:group-hover:tw:text-primary tw:transition-colors">
                                <Plus className="tw:w-4 tw:h-4 tw:text-gray-400 group-hover:tw:text-primary" />
                              </div>
                              <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:mt-1 group-hover:tw:text-primary">
                                Add
                              </span>
                            </div>
                          </FileUpload>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer - Compact */}
                <div className="tw:p-3 tw:px-4 tw:bg-gray-50/30 tw:border-t tw:border-gray-50 tw:flex tw:gap-2">
                  {!b.aiData ? (
                    <AppButton
                      onClick={() => fetchFromAi(b)}
                      disabled={b.images.length === 0 || b.fetching}
                      className={clsx(
                        "tw:flex-1 tw:h-10 tw:rounded-lg tw:transition-all",
                        b.images.length > 0 && !b.fetching
                          ? "tw:bg-primary tw:text-white tw:shadow-sm"
                          : "",
                      )}
                    >
                      <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
                        {b.fetching ? (
                          <RefreshCw className="tw:w-3.5 tw:h-3.5 tw:animate-spin" />
                        ) : (
                          <Sparkles className="tw:w-3.5 tw:h-3.5" />
                        )}
                        <span className="tw:font-bold tw:text-sm">
                          {b.fetching ? "Processing" : "Extract Details"}
                        </span>
                      </div>
                    </AppButton>
                  ) : (
                    <>
                      <AppButton
                        onClick={() => handleReview(b)}
                        className="tw:flex-1 tw:h-10 tw:rounded-lg tw:bg-emerald-600 tw:hover:tw:bg-emerald-700 tw:text-white"
                      >
                        <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
                          <ArrowRight className="tw:w-3.5 tw:h-3.5" />
                          <span className="tw:font-bold tw:text-sm">
                            Review & Add
                          </span>
                        </div>
                      </AppButton>
                      <AppButton
                        color="secondary"
                        onClick={() => onResetAi(b.id)}
                        className="tw:w-10 tw:h-10 tw:p-0 tw:rounded-lg tw:border tw:border-gray-200"
                      >
                        <RefreshCw className="tw:w-3.5 tw:h-3.5" />
                      </AppButton>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {blocks.length === 0 && (
            <div className="tw:text-center tw:py-20 tw:bg-white tw:rounded-3xl tw:border tw:border-dashed tw:border-gray-200">
              <div className="tw:flex tw:items-center tw:justify-center tw:w-20 tw:h-20 tw:rounded-full tw:bg-gray-50 tw:mx-auto tw:mb-6">
                <ImageIcon className="tw:w-10 tw:h-10 tw:text-gray-300" />
              </div>
              <div className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mb-2">
                No products added yet
              </div>
              <div className="tw:text-sm tw:text-gray-500 tw:mb-8 tw:max-w-xs tw:mx-auto">
                Start by adding your first product block and let StoreKing AI
                help you extract details.
              </div>
              <AppButton
                onClick={addBlock}
                className="tw:rounded-xl tw:px-8 tw:h-12 tw:shadow-lg tw:shadow-primary/20"
              >
                <Plus className="tw:w-4 tw:h-4 tw:mr-2" />
                <span className="tw:font-bold">Add First Product</span>
              </AppButton>
            </div>
          )}
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="app-footer tw:text-end">
          <AppButton onClick={addBlock}>
            <Plus className="tw:w-4 tw:h-4" />
            <span className="tw:font-bold">Add more Product</span>
          </AppButton>
        </div>
      )}
      <ReviewModal
        show={reviewModal.show}
        data={reviewModal.data}
        blockId={reviewModal.blockId}
        images={reviewModal.images}
        callback={handleReviewModalCallback}
      />
      <SuccessModal
        show={successModal.show}
        callback={handleSuccessModalCallback}
        showViewRequestButton={false}
      />
    </>
  );
};

export default AiAddProduct;
