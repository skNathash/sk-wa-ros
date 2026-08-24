import clsx from "clsx";
import { Camera, ExternalLink, Store } from "lucide-react";
import React from "react";
import ImgRender from "~/components/core/img/ImgRender";
import type { ProfileOverviewModel } from "./helper";

interface StoreIdentityCardProps {
  model: ProfileOverviewModel;
  onEdit?: () => void;
  onEditPhotos: () => void;
}

/**
 * Who the store is — the card the profile page leads with in theme-2: its
 * photo and membership, the actions it takes on itself, and the identity
 * fields support asks for first.
 */
const StoreIdentityCard: React.FC<StoreIdentityCardProps> = ({
  model,
  onEditPhotos,
}) => (
  <div className="tw:flex tw:h-full tw:flex-col tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-5">
    {/* The mobile hero already carries the photo, name, membership and ID,
        so this header is desktop-only. */}
    <div className="tw:hidden tw:items-start tw:gap-4 tw:lg:flex">
      <div className="tw:relative tw:h-20 tw:w-20 tw:shrink-0">
        <div className="tw:h-full tw:w-full tw:overflow-hidden tw:rounded-2xl tw:bg-orange-100">
          {model.storeImage ? (
            <ImgRender
              assetId={model.storeImage}
              alt={model.storeName}
              className="tw:h-full tw:w-full tw:object-cover"
            />
          ) : (
            <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:text-orange-500">
              <Store className="tw:h-8 tw:w-8" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onEditPhotos}
          aria-label="Manage store photos"
          className="tw:absolute tw:-bottom-1 tw:-right-1 tw:flex tw:size-7 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:text-gray-600 tw:shadow-sm tw:hover:bg-gray-50"
        >
          <Camera className="tw:h-3.5 tw:w-3.5" />
        </button>
      </div>

      <div className="tw:min-w-0 tw:flex-1">
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-2 tw:gap-y-1">
          <h2 className="tw:truncate tw:text-xl tw:font-bold tw:text-gray-900">
            {model.storeName}
          </h2>
          <span className="tw:inline-flex tw:shrink-0 tw:rounded-md tw:bg-blue-50 tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-bold tw:tracking-wider tw:text-blue-700">
            {model.membership}
          </span>
        </div>
        <div className="tw:mt-1.5 tw:text-xs tw:text-gray-500">
          {model.fid && <span>ID {model.fid}</span>}
          {model.fid && model.registeredOn && <span> · </span>}
          {model.registeredOn && <span>Registered {model.registeredOn}</span>}
          {model.tenure && (
            <>
              <span> · </span>
              <span className="tw:font-semibold tw:text-gray-700">
                {model.tenure}
              </span>
            </>
          )}
        </div>
      </div>
    </div>

    {/* Mobile keeps only what the hero leaves out — photos and the public
        store link are reached from the quick actions and the branding
        section instead. */}
    {model.registeredOn && (
      <span className="tw:text-xs tw:text-gray-500 tw:lg:hidden">
        Registered {model.registeredOn}
      </span>
    )}

    <div className="tw:mt-4 tw:hidden tw:flex-wrap tw:gap-2 tw:lg:flex">
      {model.clubUrl && (
        <a
          href={model.clubUrl}
          target="_blank"
          rel="noreferrer"
          className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-lg tw:border tw:border-gray-300 tw:bg-white tw:px-3.5 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-700 tw:hover:bg-gray-50"
        >
          <ExternalLink className="tw:h-4 tw:w-4" />
          View public store
        </a>
      )}
    </div>

    {/* Label column is a fixed width so every value starts on the same
        vertical line, in both columns of the grid. */}
    <div className="tw:mt-5 tw:flex-1 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50 tw:p-4">
      <div className="tw:grid tw:grid-cols-1 tw:gap-x-6 tw:gap-y-3 tw:sm:grid-cols-2">
        {model.fields.map((field) => (
          <div key={field.key} className="tw:flex tw:items-start tw:gap-3">
            <span className="tw:w-24 tw:shrink-0 tw:text-sm/6 tw:text-gray-500">
              {field.label}
            </span>
            {/* Values wrap rather than truncate — a clipped GSTIN or category
                is worse than a two-line row. */}
            <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-wrap tw:items-center tw:gap-x-1.5 tw:gap-y-1">
              <span className="tw:min-w-0 tw:wrap-break-word tw:text-sm/6 tw:font-semibold tw:text-gray-900">
                {field.value}
              </span>
              {field.badge && (
                <span
                  className={clsx(
                    "tw:shrink-0 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold",
                    field.badge.tone === "ok"
                      ? "tw:bg-emerald-100 tw:text-emerald-700"
                      : "tw:bg-amber-100 tw:text-amber-800",
                  )}
                >
                  {field.badge.label}
                </span>
              )}
            </span>
          </div>
        ))}

        {model.address && (
          <div className="tw:flex tw:items-start tw:gap-3 tw:sm:col-span-2">
            <span className="tw:w-24 tw:shrink-0 tw:text-sm/6 tw:text-gray-500">
              Address
            </span>
            <span className="tw:min-w-0 tw:flex-1 tw:text-sm/6 tw:font-semibold tw:text-gray-900">
              {model.address}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default StoreIdentityCard;
