import React from "react";

interface StaticGMapProps {
  lat: number;
  lng: number;
  className?: string;
}

const StaticGMap: React.FC<StaticGMapProps> = ({ lat, lng, className }) => {
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  return (
    <div className={className}>
      <iframe
        title="Google Map"
        src={mapUrl}
        allowFullScreen
        className="tw:w-full tw:h-full tw:border-none"
      />
    </div>
  );
};

export default StaticGMap;
