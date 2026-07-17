import React, { useState } from "react";
import { ASSET, API } from "~/constants";

interface ImgRenderProps {
  assetId?: string;
  className?: string;
  alt?: string;
  size?: string;
  width?: number;
  height?: number;
  src?: string;
  isAbsolute?: boolean;
  ignoreSize?: boolean;
  useProxy?: boolean;
  fallback?: React.ReactNode;
}

const ImgRender: React.FC<ImgRenderProps> = ({
  assetId,
  className = "",
  alt = "",
  size = "500",
  width,
  height,
  src,
  isAbsolute,
  ignoreSize = false,
  useProxy = false,
  fallback,
}) => {
  const [imageError, setImageError] = useState(false);

  const buildQuery = () => {
    if (width || height) {
      const params = new URLSearchParams();
      if (width) params.set("width", String(width));
      if (height) params.set("height", String(height));
      return `?${params.toString()}`;
    }
    return size ? `?size=${size}` : "";
  };
  const sizeQuery = buildQuery();
  let imageUrl = isAbsolute
    ? src
    : src
      ? `/assets/images/${src}`
      : `${ASSET}/${assetId}.jpg${buildQuery()}`;

  if (useProxy && imageUrl) {
    imageUrl = `${API}catalog/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  }

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div
        className={`tw:flex tw:items-center tw:justify-center tw:bg-gray-200 tw:text-gray-500 tw:text-[9px] tw:p-1 tw:text-center ${className}`}
      >
        <span>No Image</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`tw:inline-block ${className}`}
      onError={handleImageError}
    />
  );
};

export default ImgRender;
