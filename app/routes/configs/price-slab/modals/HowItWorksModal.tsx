import React, { useCallback } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
};

const HowItWorksModal = ({ show = false, callback }: Props) => {
  const handleClose = useCallback(
    () => callback({ action: "close" }),
    [callback],
  );

  const handleCreate = useCallback(
    () => callback({ action: "create" }),
    [callback],
  );

  return (
    <AppModal show={show} callback={callback} className="tw:md:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:text-base">How It Works</div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[80vh] tw:overflow-auto">
        <div className="tw:space-y-3">
          {/* Key Benefit */}
          <div className="tw:bg-blue-50 tw:border tw:border-blue-200 tw:rounded tw:p-2.5">
            <div className="tw:text-sm tw:font-medium tw:text-blue-900 tw:mb-0.5">
              More Quantity = More Discount
            </div>
            <div className="tw:text-xs tw:text-blue-700">
              Customers save more when they buy more items
            </div>
          </div>

          {/* Steps */}
          <div className="tw:space-y-2.5">
            <Step
              num={1}
              title="Pick Product or Category"
              description="Choose what items to apply discounts on"
            />
            <Step
              num={2}
              title="Set Quantity Tiers"
              description="Define ranges like 1-2, 3-5, 6+ items"
            />
            <Step
              num={3}
              title="Add Discount per Tier"
              description="Higher tiers get bigger discounts"
            />
          </div>

          {/* Example */}
          <div className="tw:border tw:border-gray-200 tw:rounded tw:overflow-hidden tw:text-xs">
            <div className="tw:bg-gray-100 tw:px-2.5 tw:py-1.5 tw:font-medium tw:text-gray-700">
              Example
            </div>
            <div className="tw:bg-white tw:divide-y tw:divide-gray-100">
              {/* <div className="tw:flex tw:justify-between tw:items-center tw:px-2.5 tw:py-1.5">
                <span className="tw:text-gray-700">Buy 1-2 items</span>
                <span className="tw:text-gray-500">No discount</span>
              </div> */}
              <div className="tw:flex tw:justify-between tw:items-center tw:px-2.5 tw:py-1.5">
                <span className="tw:text-gray-900 tw:font-medium">
                  Buy 3-5 units
                </span>
                <span className="tw:bg-green-100 tw:text-green-700 tw:font-medium tw:px-1.5 tw:py-0.5 tw:rounded">
                  5% OFF
                </span>
              </div>
              <div className="tw:flex tw:justify-between tw:items-center tw:px-2.5 tw:py-1.5">
                <span className="tw:text-gray-900 tw:font-medium">
                  Buy 6+ units
                </span>
                <span className="tw:bg-green-100 tw:text-green-700 tw:font-medium tw:px-1.5 tw:py-0.5 tw:rounded">
                  10% OFF
                </span>
              </div>
            </div>
          </div>

          {/* Auto-apply note */}
          <div className="tw:text-xs tw:text-gray-600 tw:bg-gray-50 tw:rounded tw:px-2.5 tw:py-2">
            💡 Discount applies automatically at checkout
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:border-t tw:border-gray-200">
        <div className="tw:w-full">
          <AppButton
            onClick={handleClose}
            color="primary"
            className="tw:w-full"
          >
            Got it
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

const Step = ({
  num,
  title,
  description,
}: {
  num: number;
  title: string;
  description: string;
}) => {
  return (
    <div className="tw:flex tw:items-start tw:gap-2">
      <div className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-blue-600 tw:flex tw:items-center tw:justify-center tw:text-white tw:text-xs tw:font-semibold tw:shrink-0 tw:mt-0.5">
        {num}
      </div>
      <div className="tw:flex-1">
        <div className="tw:text-sm tw:font-medium tw:text-gray-900 tw:mb-0.5">
          {title}
        </div>
        <div className="tw:text-xs tw:text-gray-600">{description}</div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
