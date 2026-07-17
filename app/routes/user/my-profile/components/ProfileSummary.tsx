import { Phone, Edit, Camera } from "lucide-react";
import React from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import FileUpload from "~/components/core/file-upload/FileUpload";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";

interface ProfileSummaryProps {
  name: string;
  town: string;
  district: string;
  pincode: string;
  image: string;
  id: string;
  referralCode: string;
  mobile: string;
  onEdit?: () => void;
  onChangePassword?: () => void;
  onImageChange?: (imageId: string) => void; // Added callback for image change
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({
  name,
  town,
  district,
  pincode,
  image,
  id,
  referralCode,
  mobile,
  onEdit,
  onImageChange, // Destructure new prop
}) => {
  return (
    <div className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-0 tw:overflow-hidden tw:relative tw:mb-4">
      {/* Header Section */}
      <div className="tw:bg-gradient-to-bl tw:from-primary tw:to-secondary tw:py-6 tw:px-2 tw:text-center tw:relative">
        {/* Logout/Edit button */}
        <div className="tw:absolute tw:top-3 tw:right-4 tw:z-10">
          {onEdit && (
            <button
              className="tw:text-red-600 tw:text-sm tw:font-semibold tw:flex tw:items-center tw:gap-1"
              onClick={onEdit}
            >
              Logout <Edit className="tw:text-base" size={16} />
            </button>
          )}
        </div>
        <div className="tw:font-bold tw:text-2xl tw:mb-1 tw:tracking-wide tw:text-white">
          {name}
        </div>
        <div className="tw:text-base tw:mb-2 tw:text-white">
          {town}, {district}, Karnataka-{pincode}
        </div>
        {/* Profile Image with Camera Icon and FileUpload */}
        <div className="tw:flex tw:justify-center tw:items-center tw:mt-2">
          <div className="tw:relative">
            <FileUpload
              allowedExtensions={["jpg", "jpeg", "png"]}
              onFileUpload={(data) => {
                if (data && data._id && onImageChange) {
                  onImageChange(data._id);
                }
              }}
              label={undefined}
            >
              <div>
                <ImgRender
                  assetId={image}
                  alt={name}
                  className="tw:w-32 tw:h-32 tw:rounded-full tw:object-cover tw:border-4 tw:border-white tw:shadow-md"
                />
                <div className="tw:absolute tw:bottom-2 tw:right-2 tw:bg-white tw:rounded-full tw:p-1 tw:shadow tw:border tw:border-gray-200">
                  <Camera className="tw:text-xl tw:text-gray-700" size={18} />
                </div>
              </div>
            </FileUpload>
          </div>
        </div>
      </div>
      {/* Details Section */}
      <div className="tw:flex tw:flex-col tw:items-center tw:py-6 tw:gap-3">
        <div className="tw:flex tw:gap-6 tw:w-full tw:px-4 tw:justify-center">
          <KeyValue label="ID" horizontal>
            : {id}
          </KeyValue>
          <KeyValue label="Referral Code" horizontal>
            : {referralCode}
          </KeyValue>
        </div>
        {/* Call Button */}
        <AppBadge variant="primary">
          <div className="tw:flex tw:items-center tw:gap-2">
            <Phone className="tw:text-lg" size={18} />
            {mobile}
          </div>
        </AppBadge>
      </div>
    </div>
  );
};

export default ProfileSummary;
