import "animate.css";
import { CheckCircle2, X } from "lucide-react";
import React from "react";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";

interface UpgradeConfirmProps {
  callback: (data: { action: string; data?: any }) => void;
}

const UpgradeConfirm: React.FC<UpgradeConfirmProps> = ({ callback }) => {
  const handleConfirm = () => {
    callback({ action: "confirm" });
  };

  const features = [
    "Enable Online Ordering",
    "Manage Deliveries",
    "Expand Product Catalog",
  ];

  return (
    <>
      {/* Header removed as requested */}

      <AppModal.Content>
        <div className="tw:p-8 tw:relative">
          <button
            type="button"
            aria-label="Close"
            className="tw:absolute tw:top-4 tw:right-4 tw:text-gray-500 hover:tw:text-gray-700 tw:transition"
            onClick={() => callback({ action: "dismiss" })}
          >
            <X className="tw:w-5 tw:h-5" />
          </button>
          <div className="tw:flex tw:justify-center tw:mb-6">
            <ImgRender
              src="upgrade/banner.png"
              className="tw:w-52 tw:inline-block"
            />
          </div>
          {/* Animated Icon (with color + animate.css) */}
          {/* <div className="tw:flex tw:justify-center">
            <div className="tw:w-24 tw:h-24 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:from-green-500 tw:to-emerald-600 tw:shadow-lg animate__animated animate__bounceIn">
              <ShoppingBag className="tw:w-12 tw:h-12 tw:text-white" />
            </div>
          </div> */}

          {/* Main Message */}
          <div className="tw:space-y-2 tw:mb-6">
            <h3 className="tw:text-2xl tw:font-bold tw:text-blue-950">
              Upgrade Your Existing Kirana Store
            </h3>
            <p className="tw:text-sm tw:text-gray-600">
              to an Online Supermarket, Built for Small-Town India.
            </p>
          </div>

          {/* Key Benefits (aligned neatly) */}
          <div className="tw:space-y-3 tw:max-w-md tw:mx-auto tw:text-left">
            {features.map((feature, index) => (
              <div
                key={index}
                className="tw:flex tw:items-start tw:gap-3 tw:w-full"
              >
                <CheckCircle2 className="tw:mt-0.5 tw:w-5 tw:h-5 tw:text-orange-500 tw:flex-shrink-0" />
                <span className="tw:text-gray-600 tw:font-medium">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:gap-3 tw:w-full tw:px-4">
          <AppButton
            fill="outline"
            onClick={() => {
              callback({ action: "close" });
            }}
            className="tw:flex-1"
          >
            No, thanks
          </AppButton>
          <AppButton onClick={handleConfirm} className="tw:flex-1">
            Proceed
          </AppButton>
        </div>
      </AppModal.Footer>
    </>
  );
};

export default UpgradeConfirm;
