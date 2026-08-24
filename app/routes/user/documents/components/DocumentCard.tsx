import clsx from "clsx";
import { Download, Eye, Info, Plus } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import { ASSET } from "~/constants";
import type { DocStatus, DocumentItem } from "../helper";

interface DocumentCardProps {
  item: DocumentItem;
  /** Opens the image preview for the card's uploaded files. */
  onView: (item: DocumentItem) => void;
  /** Opens the upload modal (or navigates, for documents handled elsewhere). */
  onAdd: (item: DocumentItem) => void;
}

const statusClassMap: Record<DocStatus, string> = {
  verified: "tw:bg-emerald-100 tw:text-emerald-700",
  pending: "tw:bg-amber-100 tw:text-amber-700",
  rejected: "tw:bg-red-100 tw:text-red-700",
  missing: "tw:bg-red-100 tw:text-red-700",
};

/**
 * One document tile — identity on top, the reference/expiry pair in the
 * middle and the actions pinned to the bottom so a grid of cards lines up.
 */
const DocumentCard: React.FC<DocumentCardProps> = ({
  item,
  onView,
  onAdd,
}) => {
  const isMissing = item.status === "missing";
  const primaryImage = item.images[0];
  // Assets are served as jpg by id — the same url ImgRender resolves.
  const downloadUrl = primaryImage ? `${ASSET}/${primaryImage.id}.jpg` : "";

  const borderClass =
    isMissing || item.status === "rejected"
      ? "tw:border-red-200"
      : item.status === "pending"
        ? "tw:border-amber-200"
        : "tw:border-gray-200";

  return (
    <AppCard
      className={clsx(
        "tw:mb-0 tw:h-full tw:min-w-0 tw:w-full tw:gap-0",
        borderClass,
      )}
      noPadding
      noContentPadding
      noShadow
    >
      <div className="tw:flex tw:h-full tw:flex-col tw:p-4">
        <div className="tw:flex tw:items-start tw:gap-3">
          <span
            className={clsx(
              "tw:flex tw:size-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:text-sm tw:font-bold",
              item.accent,
            )}
          >
            {item.initials}
          </span>
          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
              {item.title}
            </div>
            <div className="tw:truncate tw:text-xs tw:text-gray-500">
              {item.type}
            </div>
          </div>
          <span
            className={clsx(
              "tw:shrink-0 tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
              statusClassMap[item.status],
            )}
          >
            {item.statusLabel}
          </span>
        </div>

        <div className="tw:mt-4 tw:grid tw:min-w-0 tw:grid-cols-2 tw:gap-3">
          <div className="tw:min-w-0">
            <div className="tw:text-xs tw:text-gray-500">Reference</div>
            <div className="tw:truncate tw:text-sm tw:text-gray-800">
              {isMissing ? item.hint || "—" : item.reference}
            </div>
          </div>
          <div className="tw:min-w-0">
            <div className="tw:text-xs tw:text-gray-500">Expires</div>
            <div className="tw:truncate tw:text-sm tw:text-gray-800">
              {item.expires}
            </div>
          </div>
        </div>

        {item.remarks ? (
          <div className="tw:mt-2 tw:text-xs tw:text-amber-700">
            <AppPopover
              triggerContent={
                <span className="tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-1">
                  <Info size={13} /> View remarks
                </span>
              }
            >
              {item.remarks}
            </AppPopover>
          </div>
        ) : null}

        <div className="tw:mt-auto tw:flex tw:items-center tw:gap-2 tw:border-t tw:border-gray-100 tw:pt-3">
          {item.images.length ? (
            <>
              <AppButton
                size="small"
                fill="outline"
                color="medium"
                className="tw:flex-1"
                onClick={() => onView(item)}
              >
                <Eye size={14} />
                View
              </AppButton>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="tw:flex tw:flex-1 tw:items-center tw:justify-center tw:gap-1 tw:rounded-md tw:border tw:border-gray-300 tw:px-3 tw:py-1.5 tw:text-sm tw:text-gray-700 tw:hover:bg-gray-50"
              >
                <Download size={14} />
                Download
              </a>
            </>
          ) : (
            <AppButton
              size="small"
              color="primary"
              className="tw:w-full"
              onClick={() => onAdd(item)}
            >
              <Plus size={14} />
              Upload
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  );
};

export default DocumentCard;
