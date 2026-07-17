import React from "react";
import { Wallet } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppBadge from "~/components/core/badge/AppBadge";
import Amount from "~/components/core/amount/Amount";

interface Props {
  franchise: any;
}

export default function Paylater({ franchise }: Props) {
  if (!franchise) return null;

  const paylater = franchise.paylater || {};

  // Extract data from paylater object or use defaults
  const status = paylater.status || "stopped";
  const creditLimit = paylater.limit || 50000;
  const outstandingBalance = paylater.outstanding || 0;
  const availableCredit = creditLimit - outstandingBalance;

  return (
    <AppCard
      title="Pay Later Wallet"
      icon={<Wallet className="tw:w-5 tw:h-5 tw:text-gray-600" />}
      className="tw:bg-white tw:rounded-xl tw:shadow-sm"
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        {/* Status */}
        <div className="tw:flex tw:justify-between tw:items-center">
          <span className="tw:text-sm tw:text-gray-600 tw:font-medium">
            Status
          </span>
          <AppBadge
            variant={status === "active" ? "success" : "danger"}
            className="tw:px-3 tw:py-1 tw:rounded-full tw:text-xs tw:font-medium"
          >
            {status}
          </AppBadge>
        </div>

        {/* Credit Limit */}
        <div className="tw:flex tw:justify-between tw:items-center">
          <span className="tw:text-sm tw:text-gray-600 tw:font-medium">
            Credit Limit
          </span>
          <Amount
            value={creditLimit}
            className="tw:text-sm tw:font-semibold tw:text-gray-900"
          />
        </div>

        {/* Outstanding Balance */}
        <div className="tw:flex tw:justify-between tw:items-center">
          <span className="tw:text-sm tw:text-gray-600 tw:font-medium">
            Outstanding Balance
          </span>
          <Amount
            value={outstandingBalance}
            className="tw:text-sm tw:font-semibold tw:text-red-600"
          />
        </div>

        {/* Available Credit */}
        <div className="tw:flex tw:justify-between tw:items-center">
          <span className="tw:text-sm tw:text-gray-600 tw:font-medium">
            Available Credit
          </span>
          <Amount
            value={availableCredit}
            className="tw:text-sm tw:font-semibold tw:text-green-600"
          />
        </div>
      </div>
    </AppCard>
  );
}
