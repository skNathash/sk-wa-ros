import React, { useMemo, useState } from "react";
import { Phone, Mail, MapPin, Calendar, User } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";

const ContactInfo: React.FC<{ data: any }> = ({ data }) => {
  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const ownerPhoto = useMemo(() => data?.ownerDetails?.photoUrl, [data]);

  const openImagePreview = () => {
    if (ownerPhoto)
      setImgPreviewModal({ show: true, images: [{ id: ownerPhoto }] });
  };

  const handleImgPreviewModalCallback = ({ action }: { action: string }) => {
    if (action === "close") setImgPreviewModal({ show: false, images: [] });
  };

  const formatAddress = () => {
    const source = data.ownerDetails || {};
    const { addressLine1, addressLine2, city, district, state, pincode } =
      source ?? {};
    const parts = [
      addressLine1,
      addressLine2,
      city,
      district,
      state,
      pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <>
      <AppCard title="Buyer Contact Information">
        <div className="tw:flex tw:items-start tw:gap-4">
          {/* Image */}
          <div className="tw:flex-shrink-0">
            <div
              className="tw:w-12 tw:h-12 tw:md:h-16 tw:md:w-16 tw:rounded-lg tw:overflow-hidden tw:bg-gray-100 tw:cursor-pointer"
              onClick={openImagePreview}
            >
              {data.ownerDetails?.photoUrl ? (
                <ImgRender
                  assetId={data.ownerDetails?.photoUrl}
                  alt={data.ownerDetails?.name || data.name}
                  className="tw:w-full tw:h-full tw:object-cover"
                />
              ) : (
                <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:bg-gray-200 tw:text-gray-500 tw:text-lg tw:font-medium">
                  {data.ownerDetails?.name?.charAt(0)?.toUpperCase() ||
                    data.name?.charAt(0)?.toUpperCase() ||
                    "?"}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:flex-col tw:gap-2">
              <KeyValue label="Contact Person" size="sm" icon={User}>
                <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:truncate">
                  {data.ownerDetails?.name || data.name}
                </h2>
              </KeyValue>

              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                {data.mobile && (
                  <KeyValue label="Mobile" size="sm" icon={Phone}>
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <span className="tw:text-sm tw:text-gray-700 tw:font-medium">
                        {data.mobile}
                      </span>
                      <AppLink href={`tel:${data.mobile}`} asLink>
                        <AppButton
                          size="small"
                          color="primary"
                          className="tw:h-6 tw:text-xs"
                        >
                          <Phone size={10} />
                          Call
                        </AppButton>
                      </AppLink>
                    </div>
                  </KeyValue>
                )}

                {data.email && (
                  <KeyValue label="Email" size="sm" icon={Mail}>
                    <span className="tw:text-sm tw:text-gray-700 tw:font-medium">
                      {data.email}
                    </span>
                  </KeyValue>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="tw:mt-2">
          <KeyValue label="Address" size="sm" icon={MapPin} className="tw:mb-4">
            <p className="tw:text-sm tw:text-gray-700">
              {formatAddress() || "Address not available"}
            </p>
          </KeyValue>

          <KeyValue label="Registered on" size="sm" icon={Calendar}>
            <div className="tw:text-sm tw:text-gray-700">
              <span className="tw:font-medium tw:text-gray-900">
                <DateFormat value={data.createdAt} formatStr="dd MMM yyyy" />
              </span>
            </div>
          </KeyValue>
        </div>
      </AppCard>

      {imgPreviewModal.show && (
        <ImgPreviewModal
          show={imgPreviewModal.show}
          callback={handleImgPreviewModalCallback}
          images={imgPreviewModal.images}
        />
      )}
    </>
  );
};

export default ContactInfo;
