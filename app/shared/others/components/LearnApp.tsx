import { Play, PlayCircleIcon } from "lucide-react";
import React, { useState } from "react";
import LearnAppModal from "~/shared/others/modals/LearnAppModal";

const LearnApp: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [showModal, setShowModal] = useState(false);

  const open = () => setShowModal(true);
  const close = () => setShowModal(false);

  return (
    <>
      {!children ? (
        <div
          onClick={open}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") open();
          }}
          className="tw:px-4 tw:py-2 tw:flex tw:gap-2 tw:border tw:border-gray-300 tw:rounded-md tw:hover:bg-white tw:cursor-pointer"
        >
          <div>
            <PlayCircleIcon size={28} className="tw:text-blue-500" />
          </div>
          <div className="tw:flex-1">
            <div className="tw:text-xs tw:font-medium">Listen App Overview</div>
            <div className="tw:text-[10px] tw:text-gray-500">
              Tap to play the audio
            </div>
          </div>
          <div>
            <button className="tw:text-xs tw:text-blue-500">Play</button>
          </div>
        </div>
      ) : (
        <button type="button" className="tw:cursor-pointer" onClick={open}>
          {children}
        </button>
      )}

      <LearnAppModal
        show={showModal}
        callback={({ action }) => action === "close" && close()}
      />
    </>
  );
};

export default LearnApp;
