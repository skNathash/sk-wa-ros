import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { AlertTriangle, CreditCard } from "lucide-react";
import CommonService from "~/services/CommonService";
import Amount from "~/components/core/amount/Amount";

interface InsufficientBalanceModalProps {
  show: boolean;
  commissionData: {
    commissionAmount: number;
    commissionPercentage: number;
    planName?: string;
    planType?: string;
    availableAmount?: number;
  };
  poTotal: number;
  callback: (action: string) => void;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  show,
  commissionData,
  poTotal,
  callback,
}) => {
  const requiredAmount = commissionData.commissionAmount;
  const availableAmount = commissionData.availableAmount || 0;
  const shortfall = requiredAmount - availableAmount;
  const isTopUp =
    commissionData.planType === "Percentage" &&
    commissionData.commissionPercentage > 0;

  return (
    <AppModal show={show} callback={() => callback("close")}>
      <AppModal.Title onClose={() => callback("close")}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <AlertTriangle className="tw:w-5 tw:h-5 tw:text-orange-500" />
          <span className="tw:text-lg tw:font-semibold">
            Platform Fee Balance Low
          </span>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:space-y-3">
          {/* Alert Message */}
          <div className="tw:bg-orange-50 tw:rounded-lg tw:p-3 tw:border tw:border-orange-200">
            <p className="tw:text-sm tw:text-orange-800 tw:leading-snug">
              You don't have enough balance to pay the platform fee for this
              order. Please {isTopUp ? "top up" : "buy"} a plan to continue.
            </p>
          </div>

          {/* Shortfall Highlight - Most Important */}
          <div className="tw:bg-red-50 tw:rounded-lg tw:p-3 tw:border-2 tw:border-red-300">
            <div className="tw:flex tw:justify-between tw:items-center">
              <div>
                <span className="tw:text-xs tw:text-red-600 tw:font-medium tw:uppercase tw:tracking-wide">
                  Fee Needed
                </span>
                <p className="tw:text-2xl tw:font-bold tw:text-red-700 tw:mt-0.5">
                  <Amount value={shortfall} />
                </p>
              </div>
              <AlertTriangle className="tw:w-8 tw:h-8 tw:text-red-400" />
            </div>
          </div>

          {/* Balance Comparison - Compact Grid */}
          <div className="tw:grid tw:grid-cols-2 tw:gap-2">
            <div className="tw:bg-gray-50 tw:rounded tw:p-2.5 tw:border tw:border-gray-200">
              <span className="tw:text-xs tw:text-gray-600 tw:block tw:mb-1">
                Your Balance
              </span>
              <span className="tw:text-base tw:font-semibold tw:text-green-600">
                <Amount value={availableAmount} />
              </span>
            </div>
            <div className="tw:bg-gray-50 tw:rounded tw:p-2.5 tw:border tw:border-gray-200">
              <span className="tw:text-xs tw:text-gray-600 tw:block tw:mb-1">
                Total Fee
              </span>
              <span className="tw:text-base tw:font-semibold tw:text-red-600">
                <Amount value={requiredAmount} />
              </span>
            </div>
          </div>

          {/* Additional Details - Condensed */}
          <div className="tw:space-y-1.5 tw:pt-2 tw:border-t">
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-gray-600">Plan</span>
              <span className="tw:text-xs tw:font-medium">
                {commissionData.planName || "N/A"}{" "}
                {commissionData.planType ? `(${commissionData.planType})` : ""}
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-gray-600">Order Total</span>
              <span className="tw:text-xs tw:font-medium">
                <Amount value={poTotal} />
              </span>
            </div>
            <div className="tw:flex tw:justify-between tw:items-center">
              <span className="tw:text-xs tw:text-gray-600">
                Fee Amount ({commissionData.commissionPercentage}%)
              </span>
              <span className="tw:text-xs tw:font-medium">
                <Amount value={requiredAmount} />
              </span>
            </div>
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:gap-2 tw:w-full">
          <AppButton
            size="small"
            fill="outline"
            color="light"
            onClick={() => callback("close")}
            expand="block"
            className="tw:flex-1"
          >
            Cancel
          </AppButton>
          <AppButton
            color="primary"
            onClick={() => callback("buy_plan")}
            size="small"
            expand="block"
            className="tw:flex-1"
          >
            <CreditCard className="tw:w-4 tw:h-4 tw:mr-2" />
            {isTopUp ? "Top Up Plan" : "Buy Plan"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default InsufficientBalanceModal;
