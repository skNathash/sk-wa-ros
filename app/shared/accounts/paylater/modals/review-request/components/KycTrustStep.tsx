import clsx from "clsx";
import { AlertTriangle, Check } from "lucide-react";
import { useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import DateFormat from "~/components/core/date/DateFormat";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import { getKycFields, type ReviewDocument } from "../helper";

type Props = {
  request: any;
  documents: ReviewDocument[];
};

/**
 * Step 2 — the onboarding record behind the request. Every field was captured
 * and checked when the shop joined the network, so this reads as a record the
 * seller confirms rather than a form they fill: the values are shown as they
 * stand and each proof carries the state SK verified it in.
 */
const KycTrustStep = ({ request, documents }: Props) => {
  const [preview, setPreview] = useState<{
    show: boolean;
    images: { id: string }[];
    initialImageId: string;
  }>({ show: false, images: [], initialImageId: "" });

  const fields = getKycFields(request);
  const isVerified = request?.kycStatus === "Approved";
  const verifiedOn = request?.kycVerifiedAt || request?.updatedAt;

  const openDocument = (doc: ReviewDocument) => {
    const images = [doc.front, doc.back].filter(Boolean).map((id) => ({ id }));
    if (!images.length) return;
    setPreview({ show: true, images, initialImageId: images[0].id });
  };

  return (
    <div className="tw:space-y-5">
      <section>
        <h3 className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
          THEIR KYC{isVerified ? " · VERIFIED BY SK" : ""}
        </h3>
        <p className="tw:mb-3 tw:text-xs tw:text-gray-500">
          These documents were verified during shop onboarding.
        </p>

        <div className="tw:grid tw:grid-cols-1 tw:gap-x-4 tw:gap-y-3 tw:sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className={clsx(field.full && "tw:sm:col-span-2")}
            >
              <div className="tw:mb-1 tw:text-[10px] tw:font-bold tw:tracking-wide tw:text-gray-500">
                {field.label}
              </div>
              <div className="tw:rounded-md tw:border tw:border-gray-300 tw:bg-white tw:px-3 tw:py-2 tw:text-sm tw:text-gray-900">
                {field.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="tw:text-[10px] tw:font-bold tw:tracking-wider tw:text-gray-400">
          DOCUMENTS
        </h3>
        <p className="tw:mb-2 tw:text-xs tw:text-gray-500">
          Everything the seller sees for their credit decision
        </p>

        {documents.length ? (
          <ul className="tw:space-y-2">
            {documents.map((doc) => {
              const hasImages = !!(doc.front || doc.back);

              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    onClick={() => openDocument(doc)}
                    disabled={!hasImages}
                    className={clsx(
                      "tw:flex tw:w-full tw:items-center tw:gap-3 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:p-3 tw:text-left",
                      hasImages
                        ? "tw:cursor-pointer tw:hover:border-gray-300"
                        : "tw:cursor-default",
                    )}
                  >
                    <span
                      className={clsx(
                        "tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md",
                        isVerified
                          ? "tw:bg-emerald-50 tw:text-emerald-600"
                          : "tw:bg-amber-50 tw:text-amber-600",
                      )}
                    >
                      {isVerified ? (
                        <Check size={16} />
                      ) : (
                        <AlertTriangle size={16} />
                      )}
                    </span>

                    <div className="tw:min-w-0 tw:flex-1">
                      <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                        {doc.title}
                      </div>
                      <div className="tw:truncate tw:text-[11px] tw:text-gray-500">
                        {isVerified ? "SK verified" : "Awaiting verification"}
                        {verifiedOn && isVerified ? (
                          <>
                            {" · "}
                            <DateFormat
                              value={verifiedOn}
                              formatStr="MMM yyyy"
                            />
                          </>
                        ) : null}
                      </div>
                    </div>

                    <AppBadge
                      variant={isVerified ? "success" : "warning"}
                      size="sm"
                    >
                      {isVerified ? "VERIFIED" : "PENDING"}
                    </AppBadge>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:border tw:border-dashed tw:border-amber-300 tw:bg-amber-50 tw:p-3">
            <AlertTriangle size={16} className="tw:mt-0.5 tw:text-amber-500" />
            <p className="tw:text-xs tw:text-amber-800">
              No documents were attached to this request. Approving without
              proof puts the full limit at risk — consider asking the buyer to
              upload KYC first.
            </p>
          </div>
        )}
      </section>

      <ImgPreviewModal
        show={preview.show}
        callback={() =>
          setPreview({ show: false, images: [], initialImageId: "" })
        }
        images={preview.images}
        initialImageId={preview.initialImageId}
      />
    </div>
  );
};

export default KycTrustStep;
