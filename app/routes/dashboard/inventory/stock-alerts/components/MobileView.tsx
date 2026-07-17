import React from "react";
import MobileViewItem from "./MobileViewItem";

interface MobileViewProps {
  data: any[];
  callback: (a: { action: string; data: any }) => void;
}

const MobileView: React.FC<MobileViewProps> = ({ data, callback }) => {
  return (
    <div className="tw-space-y-4">
      {data.map((item, idx) => (
        <div className="tw:border-b tw:border-gray-200">
          <MobileViewItem
            key={item._id || idx}
            data={item}
            callback={callback}
          />
        </div>
      ))}
    </div>
  );
};

export default MobileView;
