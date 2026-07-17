import React from "react";
import { User } from "lucide-react";
import ImgRender from "~/components/core/img/ImgRender";

type UserPicType = "b2c" | "digital-raja" | "digital-rani";

interface UserPicProps {
  assetId?: string;
  gender?: string | null;
  type?: UserPicType;
  className?: string;
  alt?: string;
  size?: string;
}

const UserPic: React.FC<UserPicProps> = ({
  assetId,
  gender,
  type,
  className = "",
  alt = "",
  size,
}) => {
  if (assetId) {
    return (
      <ImgRender
        assetId={assetId}
        className={className}
        alt={alt}
        size={size}
      />
    );
  }

  if (!type) {
    return (
      <div
        className={`tw:flex tw:items-center tw:justify-center tw:bg-gray-100 tw:text-gray-400 ${className}`}
      >
        <User className="tw:w-1/2 tw:h-1/2" />
      </div>
    );
  }

  const g = (gender || "male").toLowerCase() === "female" ? "female" : "male";

  return (
    <ImgRender
      src={`users/${type}-${g}.png`}
      className={className}
      alt={alt}
    />
  );
};

export default UserPic;
