import clsx from "clsx";
import { useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import PaylaterManageWalletModal from "~/shared/accounts/modals/paylater/manage-wallet/PaylaterManageWalletModal";
import type { PaylaterWallet } from "../../helper";

type WalletTermsProps = {
  wallet: PaylaterWallet;
  sellerName?: string;
  className?: string;
};

/** The terms the seller approved this wallet on — status, KYC and validity. */
const WalletTerms = ({ wallet, sellerName, className }: WalletTermsProps) => {
  const [showManage, setShowManage] = useState(false);

  const userId = wallet.raw?.userInfo?.id || "";

  return (
    <AppCard className={clsx("tw:h-full", className)} noOverflow>
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <h3 className="tw:text-base tw:font-bold tw:text-slate-900">
            Wallet details
          </h3>
          <div className="tw:mt-0.5 tw:text-xs tw:text-slate-500">
            Issued by {sellerName || wallet.sellerName || "-"}
          </div>
        </div>

        <AppButton size="small" fill="outline" onClick={() => setShowManage(true)}>
          Manage
        </AppButton>
      </div>

      <div className="tw:mt-4 tw:grid tw:grid-cols-2 tw:gap-4">
        <KeyValue label="Status" size="sm">
          <AppBadge variant={wallet.statusColor}>{wallet.statusLabel}</AppBadge>
        </KeyValue>

        <KeyValue label="KYC" size="sm">
          <AppBadge variant={wallet.kycStatusColor}>
            {wallet.kycStatus || "-"}
          </AppBadge>
        </KeyValue>

        <KeyValue label="Tenure" size="sm">
          {wallet.validityPeriod || "-"}
        </KeyValue>

        <KeyValue label="Valid till" size="sm">
          {wallet.validityEndDate ? (
            <DateFormat value={wallet.validityEndDate} formatStr="dd MMM yyyy" />
          ) : (
            "-"
          )}
        </KeyValue>

        <KeyValue label="Valid from" size="sm">
          {wallet.validityStartDate ? (
            <DateFormat
              value={wallet.validityStartDate}
              formatStr="dd MMM yyyy"
            />
          ) : (
            "-"
          )}
        </KeyValue>

        <KeyValue label="Requested on" size="sm">
          {wallet.requestedOn ? (
            <DateFormat value={wallet.requestedOn} formatStr="dd MMM yyyy" />
          ) : (
            "-"
          )}
        </KeyValue>
      </div>

      <PaylaterManageWalletModal
        show={showManage}
        userId={userId}
        callback={() => setShowManage(false)}
      />
    </AppCard>
  );
};

export default WalletTerms;
