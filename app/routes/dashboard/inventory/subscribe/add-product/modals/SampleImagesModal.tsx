import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import ImgRender from "~/components/core/img/ImgRender";
import AppButton from "~/components/core/button/AppButton";

interface SampleImagesModalProps {
  show: boolean;
  onClose: () => void;
}

const SampleImagesModal: React.FC<SampleImagesModalProps> = ({
  show,
  onClose,
}) => {
  return (
    <AppModal show={show} callback={onClose}>
      <AppModal.Title onClose={onClose}>
        <div className="tw:font-semibold">Product Image Guidelines</div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[70vh]">
        {/* Introduction */}
        <div className="tw:mb-4">
          <p className="tw:text-gray-600 tw:text-sm">
            Follow these guidelines to ensure your product images are accepted
          </p>
        </div>

        {/* Main comparison grid */}
        <div className="tw:grid tw:grid-cols-1 md:tw:grid-cols-2 tw:gap-6 tw:mb-6">
          {/* Good Example */}
          <div className="tw:bg-green-50 tw:rounded-lg tw:p-4 tw:border-2 tw:border-green-200">
            <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:mb-3">
              <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-green-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:font-bold">
                ✓
              </div>
              <h3 className="tw:text-xl tw:font-bold tw:text-green-700">
                Good Example
              </h3>
            </div>

            <div className="tw:bg-white tw:rounded-lg tw:p-2 tw:mb-3 tw:border tw:border-green-200">
              <ImgRender
                assetId="00025645153332516730"
                className="tw:w-full tw:h-48 tw:object-contain tw:rounded"
              />
            </div>

            <ul className="tw:space-y-2 tw:text-sm tw:text-gray-700">
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-green-600 tw:font-bold tw:mt-0.5">
                  ✓
                </span>
                <span>Clear and sharp image quality</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-green-600 tw:font-bold tw:mt-0.5">
                  ✓
                </span>
                <span>Product fully visible and centered</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-green-600 tw:font-bold tw:mt-0.5">
                  ✓
                </span>
                <span>Clean white or plain background</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-green-600 tw:font-bold tw:mt-0.5">
                  ✓
                </span>
                <span>Bright and well-lit</span>
              </li>
            </ul>
          </div>

          {/* Bad Example */}
          <div className="tw:bg-red-50 tw:rounded-lg tw:p-4 tw:border-2 tw:border-red-200">
            <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:mb-3">
              <div className="tw:w-8 tw:h-8 tw:rounded-full tw:bg-red-500 tw:flex tw:items-center tw:justify-center tw:text-white tw:font-bold">
                ✗
              </div>
              <h3 className="tw:text-xl tw:font-bold tw:text-red-700">
                Avoid These
              </h3>
            </div>

            <div className="tw:bg-white tw:rounded-lg tw:p-2 tw:mb-3 tw:border tw:border-red-200">
              <ImgRender
                assetId="00025645153332516730"
                className="tw:w-full tw:h-48 tw:object-contain tw:rounded tw:blur-xs tw:opacity-70"
              />
            </div>

            <ul className="tw:space-y-2 tw:text-sm tw:text-gray-700">
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-red-600 tw:font-bold tw:mt-0.5">
                  ✗
                </span>
                <span>Blurry or out of focus</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-red-600 tw:font-bold tw:mt-0.5">
                  ✗
                </span>
                <span>Product partially visible or cut off</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-red-600 tw:font-bold tw:mt-0.5">
                  ✗
                </span>
                <span>Cluttered or busy background</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-red-600 tw:font-bold tw:mt-0.5">
                  ✗
                </span>
                <span>Dark or poor lighting</span>
              </li>
              <li className="tw:flex tw:items-start tw:gap-2">
                <span className="tw:text-red-600 tw:font-bold tw:mt-0.5">
                  ✗
                </span>
                <span>Watermarks or overlaid text</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="tw:bg-blue-50 tw:rounded-lg tw:p-4 tw:border tw:border-blue-200">
          <h4 className="tw:font-semibold tw:text-blue-900 tw:mb-2 tw:flex tw:items-center tw:gap-2">
            <span className="tw:text-lg">💡</span>
            Quick Tips
          </h4>
          <ul className="tw:text-sm tw:text-gray-700 tw:space-y-1.5 tw:pl-6">
            <li className="tw:list-disc">
              Use natural daylight or bright white light
            </li>
            <li className="tw:list-disc">Place product on a plain surface</li>
            <li className="tw:list-disc">
              Take photo from eye level with product
            </li>
            <li className="tw:list-disc">Fill the frame with the product</li>
          </ul>
        </div>
      </AppModal.Content>
      <AppModal.Footer className="tw:flex tw:justify-end tw:gap-3">
        <AppButton onClick={onClose}>Got It</AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SampleImagesModal;
