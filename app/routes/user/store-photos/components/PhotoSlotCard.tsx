import clsx from "clsx";
import { Info, RefreshCw, Trash2 } from "lucide-react";
import React from "react";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import AppPopover from "~/components/core/popover/AppPopover";
import type { PhotoSlot, PhotoStatus } from "../helper";
import { UPLOAD_PROPS } from "./uploadProps";

interface PhotoSlotCardProps {
  slot: PhotoSlot;
  /** Swaps the file at this slot's index, keeping the order stable. */
  onReplace: (slot: PhotoSlot, asset: any) => void;
  onRemove: (slot: PhotoSlot) => void;
  onPreview: (slot: PhotoSlot) => void;
}

const statusClassMap: Record<PhotoStatus, string> = {
  approved: "tw:bg-emerald-100 tw:text-emerald-700",
  pending: "tw:bg-amber-100 tw:text-amber-700",
  rejected: "tw:bg-red-100 tw:text-red-700",
};

/**
 * One tile of the photo gallery — the uploaded photo with its review status
 * and actions.
 */
const PhotoSlotCard: React.FC<PhotoSlotCardProps> = ({
  slot,
  onReplace,
  onRemove,
  onPreview,
}) => (
  <div>
    <div className="tw:relative tw:aspect-square tw:overflow-hidden tw:rounded-xl tw:border tw:border-gray-200 tw:bg-gray-50 tw:sm:aspect-auto tw:sm:h-44">
      <button
        type="button"
        className="tw:h-full tw:w-full tw:cursor-pointer"
        onClick={() => onPreview(slot)}
        aria-label={`Preview ${slot.title}`}
      >
        <ImgRender
          assetId={slot.fileUrl}
          alt={slot.title}
          className="tw:block tw:h-full tw:w-full tw:object-cover"
        />
      </button>

      <span
        className={clsx(
          "tw:absolute tw:top-2 tw:left-2 tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
          statusClassMap[slot.status],
        )}
      >
        {slot.statusLabel}
      </span>

      {/* Approved shots are locked — the reviewer's copy stays on record. */}
      {slot.status !== "approved" ? (
        <div className="tw:absolute tw:top-2 tw:right-2 tw:flex tw:items-center tw:gap-1">
          <FileUpload
            {...UPLOAD_PROPS}
            onFileUpload={(asset: any) => onReplace(slot, asset)}
          >
            <span
              className="tw:flex tw:size-8 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:bg-white/95 tw:shadow tw:sm:size-7 tw:hover:bg-gray-50"
              title="Replace photo"
            >
              <RefreshCw size={13} className="tw:text-gray-600" />
            </span>
          </FileUpload>
          <button
            type="button"
            className="tw:flex tw:size-8 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-gray-200 tw:bg-white/95 tw:shadow tw:sm:size-7 tw:hover:bg-gray-50"
            onClick={() => onRemove(slot)}
            aria-label={`Remove ${slot.title}`}
          >
            <Trash2 size={13} className="tw:text-gray-600" />
          </button>
        </div>
      ) : null}
    </div>

    <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
      <span className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-800">
        {slot.title}
      </span>
      {slot.status === "rejected" && slot.comment ? (
        <AppPopover
          side="top"
          align="center"
          triggerContent={
            <button
              type="button"
              className="tw:cursor-pointer tw:text-red-600"
              aria-label="Rejection reason"
            >
              <Info size={13} />
            </button>
          }
        >
          <div className="tw:max-w-xs tw:text-sm tw:text-gray-700">
            {slot.comment}
          </div>
        </AppPopover>
      ) : null}
    </div>
  </div>
);

export default PhotoSlotCard;
