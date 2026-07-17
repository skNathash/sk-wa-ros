import { CheckCircle, Circle, IndianRupee, Plus } from "lucide-react";
import React from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import useAppNav from "~/hooks/useAppNav";

interface PaymentCardProps {
  title: string;
  description: string | React.ReactNode;
  balanceLabel: string;
  balance: number;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  insufficientBalanceMessage?: string;
  showBalance: boolean;
  children?: React.ReactNode;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  title,
  description,
  balanceLabel,
  balance,
  isSelected,
  isDisabled,
  onClick,
  insufficientBalanceMessage,
  showBalance,
  children,
}) => {
  const appNav = useAppNav();

  const handleAddMoney = (e: React.MouseEvent) => {
    e.stopPropagation();
    appNav.replace("/dashboard/deposit-money/options");
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled) {
      return;
    }
    onClick();
  };

  return (
    <div
      className={`tw:bg-white tw:p-4 tw:rounded-md tw:border tw:border-gray-300 tw:cursor-pointer ${
        isSelected ? "tw:ring-2 tw:ring-green-500" : ""
      }`}
      onClick={handleClick}
    >
      <div
        className={`tw:flex tw:space-x-4 ${isDisabled ? "tw:opacity-50 tw:pointer-events-none" : ""}`}
      >
        {isSelected ? (
          <CheckCircle
            aria-hidden
            className={`tw:text-2xl tw:mt-6 tw:text-green-500`}
          />
        ) : (
          <Circle
            aria-hidden
            className={`tw:text-2xl tw:mt-6 tw:text-gray-500`}
          />
        )}
        <div className="tw:flex-1">
          <h3 className="tw:!text-lg tw:font-bold tw:!mb-1">{title}</h3>
          <p className="tw:text-gray-600 tw:mb-2 tw:text-sm">{description}</p>
          {showBalance && (
            <p className="tw:text-gray-800 tw:font-semibold">
              {balanceLabel}: <Amount value={balance} decimalPlaces={2} />
            </p>
          )}
          {insufficientBalanceMessage && (
            <p className="tw:text-red-500 tw:font-medium tw:text-sm">
              {insufficientBalanceMessage}
            </p>
          )}
          {children}
        </div>
      </div>

      {/* Compact Add Money helper with icon, header and subtitle */}
      {insufficientBalanceMessage && (
        <InfoBlock variant="info" size="sm" bordered className="tw:mt-2">
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-3 tw:flex-1">
              <div className="tw:flex tw:items-center tw:justify-center tw:w-8 tw:h-8 tw:rounded-full tw:bg-blue-100">
                <Plus className="tw:w-4 tw:h-4 tw:text-blue-600" />
              </div>
              <div>
                <div className="tw:font-semibold tw:text-gray-900">
                  Low Balance? Add Money to your wallet
                </div>
                <div className="tw:text-sm tw:text-gray-600">
                  Add money to your wallet quickly using Express Deposit.
                </div>
              </div>
            </div>

            <div className="tw:ml-2">
              <AppButton
                onClick={handleAddMoney}
                size="small"
                color="primary"
                fill="solid"
                className="tw:flex tw:items-center tw:gap-2"
              >
                <IndianRupee />
                Add Money
              </AppButton>
            </div>
          </div>
        </InfoBlock>
      )}
    </div>
  );
};

export default PaymentCard;
