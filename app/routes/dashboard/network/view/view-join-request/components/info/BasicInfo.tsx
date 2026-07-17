import { Building2, MapPin, Navigation, Store } from "lucide-react";
import React, { useMemo, useState } from "react";
import { differenceInYears, differenceInMonths } from "date-fns";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import CommonService from "~/services/CommonService";
import KeyValue from "~/components/core/key-value/KeyValue";

interface BasicInfoProps {
  data: any;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ data }) => {
  const [imgPreviewModal, setImgPreviewModal] = useState({
    show: false,
    images: [] as { id: string }[],
  });

  const allStoreImages = useMemo(() => {
    const list = data?.shopPhotosDetails || [];
    return list
      .map((it: any) => it?.id || it?.fileUrl)
      .filter(Boolean)
      .map((assetId: string) => ({ id: assetId }));
  }, [data]);

  const calculateInBusiness = useMemo(() => {
    if (!data?.createdAt) return "N/A";

    const createdAt = new Date(data.createdAt);
    const now = new Date();

    const years = differenceInYears(now, createdAt);
    const months = differenceInMonths(now, createdAt);

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""}`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""}`;
    } else {
      return "Less than 1 month";
    }
  }, [data?.createdAt]);

  const openImagePreview = () => {
    if (allStoreImages.length > 0) {
      setImgPreviewModal({ show: true, images: allStoreImages });
    }
  };

  const handleImgPreviewModalCallback = ({ action }: { action: string }) => {
    if (action === "close") {
      setImgPreviewModal({ show: false, images: [] });
    }
  };

  const formatAddress = () => {
    const { addressLine1, addressLine2, city, state, pincode } = data;
    const parts = [addressLine1, addressLine2, city, state, pincode].filter(
      Boolean
    );
    return parts.join(", ");
  };

  return (
    <>
      <AppCard title="Buyer Store Information">
        <div className="tw:flex tw:items-start tw:gap-4">
          {/* Image */}
          <div className="tw:flex-shrink-0">
            <div
              className="tw:w-12 tw:h-12 tw:md:h-16 tw:md:w-16 tw:rounded-lg tw:overflow-hidden tw:bg-gray-100 tw:cursor-pointer"
              onClick={openImagePreview}
            >
              {data.shopPhotosDetails?.[0]?.fileUrl ? (
                <ImgRender
                  assetId={data.shopPhotosDetails?.[0]?.fileUrl}
                  alt={data.name}
                  className="tw:w-full tw:h-full tw:object-cover"
                />
              ) : (
                <div className="tw:w-full tw:h-full tw:flex tw:items-center tw:justify-center tw:bg-gray-200 tw:text-gray-500 tw:text-lg tw:font-medium">
                  {data.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="tw:flex-1 tw:min-w-0">
            <div className="tw:flex tw:flex-col">
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:truncate">
                  {data.name}
                </h2>
              </div>

              <div className="tw:flex tw:items-center tw:gap-3 tw:mt-1">
                <div className="tw:flex tw:items-center tw:gap-2">
                  <Navigation size={14} className="tw:text-blue-600" />
                  <span className="tw:text-sm tw:text-blue-700 tw:font-medium">
                    {CommonService.roundedByDecimalPlace(data.distanceKm, 2)} km
                    away
                  </span>
                </div>

                <span className="tw:text-gray-300">•</span>

                <div className="tw:flex tw:items-center tw:gap-1">
                  <Building2 size={14} className="tw:text-gray-500" />
                  <span className="tw:text-sm tw:text-gray-700">
                    {calculateInBusiness}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="tw:flex tw:items-start tw:gap-2 tw:mt-2">
          <MapPin
            size={14}
            className="tw:text-gray-400 tw:shrink-0 tw:mt-0.5"
          />
          <p className="tw:text-sm tw:text-gray-700">
            {formatAddress() || "Address not available"}
          </p>
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

export default BasicInfo;
