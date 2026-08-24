import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  FilePenLine,
  LockOpen,
  Repeat2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import type { UserItem, UserType } from "../helper";
import { getUserStats, QUICK_LIMITS, MAX_LIMIT } from "../helper";

interface Props {
  user: UserItem;
  type: UserType;
  onUpdateKyc: () => void;
  onChangeUser: () => void;
  onUnlock: (limit: number) => void;
  loading?: boolean;
  /** KYC has already been captured in this session (data-mode KYC modal). */
  kycCaptured?: boolean;
}

const UnlockView = ({
  user,
  type,
  onUpdateKyc,
  onChangeUser,
  onUnlock,
  loading,
  kycCaptured,
}: Props) => {
  const stats = useMemo(() => getUserStats(user), [user]);
  const [limit, setLimit] = useState<number>(stats.suggestedLimit || 500);
  const [customMode, setCustomMode] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLimit(Number(e.target.value));
    setCustomMode(false);
  };

  const handleQuickLimit = (value: number) => {
    setLimit(value);
    setCustomMode(false);
  };

  const handleCustom = () => {
    setCustomMode(true);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setLimit(value);
    }
  };

  const initials = user.initials || user.name?.trim()?.charAt(0)?.toUpperCase() || "?";

  // Identity meta reads as one sentence under the name — anything the user
  // doesn't have (a new customer with no bills yet) drops out of the line
  // instead of showing an empty "· 0 bills ·" gap.
  const metaLine = [
    user.mobile,
    stats.bills ? `${stats.bills} bills` : "",
    type === "b2c" ? "loyal customer" : "retailer",
  ]
    .filter(Boolean)
    .join(" · ");

  // How far the chosen limit stretches past what they usually spend.
  const avgBillMultiple = (limit / (stats.avgBill || 1) || 0).toFixed(1);

  // Progress color from green via yellow to orange.
  const progressStyle = {
    background: `linear-gradient(90deg, #10b981 ${stats.creditScore}%, #f59e0b 100%)`,
  };

  return (
    // The whole unlock decision is one sheet: who it is, what their record
    // says, how much to grant, and the commit. Each step was its own bordered
    // card before, which broke a single flow into six floating blocks — they
    // are now sections of one card, separated by hairlines and inset panels.
    <AppCard noPadding bodyClassName="tw:p-0">
      {/* Title row */}
      <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-4 tw:py-3.5 tw:border-b tw:border-gray-100">
        <h1 className="tw:text-base tw:font-bold tw:text-gray-900 tw:min-w-0 tw:truncate">
          {user.name || "-"} · unlock Paylater
        </h1>
        <span className="tw:inline-flex tw:items-center tw:gap-1 tw:bg-emerald-50 tw:text-emerald-700 tw:text-[11px] tw:font-bold tw:tracking-wide tw:px-2.5 tw:py-1 tw:rounded-full tw:border tw:border-emerald-200 tw:shrink-0">
          <BadgeCheck size={12} />
          ELIGIBLE
        </span>
      </div>

      <div className="tw:p-4 tw:space-y-4">
        {/* Customer block */}
        <div className="tw:flex tw:items-center tw:gap-3.5">
          <div className="tw:w-12 tw:h-12 tw:rounded-full tw:bg-emerald-700 tw:text-white tw:flex tw:items-center tw:justify-center tw:text-lg tw:font-semibold tw:shrink-0">
            {initials}
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <h2 className="tw:text-[15px] tw:font-bold tw:text-gray-900 tw:truncate">
              {user.name || "-"}
            </h2>
            <div className="tw:text-sm tw:text-gray-500 tw:truncate">
              {metaLine}
            </div>
          </div>

          {/* Switching the user belongs with the user, not floating above the
              page — keep it on the identity block itself, quiet enough that it
              doesn't compete with the unlock CTA below. */}
          <AppButton
            color="secondary"
            fill="clear"
            size="small"
            onClick={onChangeUser}
            className="tw:shrink-0 tw:justify-center"
          >
            <Repeat2 size={14} className="tw:mr-1.5" />
            Change
          </AppButton>
        </div>

        {/* Credit score — an inset panel rather than its own card, so the
            evidence reads as part of the same decision. */}
        <div className="tw:rounded-xl tw:bg-gray-50 tw:border tw:border-gray-100 tw:p-4">
          <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
            <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-500">
              Credit Score · from their bills
            </div>
            <div className="tw:text-2xl tw:font-bold tw:text-emerald-600">
              {stats.creditScore}
            </div>
          </div>

          <div className="tw:h-2.5 tw:w-full tw:rounded-full tw:bg-gray-200 tw:overflow-hidden tw:mb-5">
            <div
              className="tw:h-full tw:rounded-full tw:transition-all tw:duration-500"
              style={{ ...progressStyle, width: `${Math.min(stats.creditScore, 100)}%` }}
            />
          </div>

          <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
            <div>
              <div className="tw:text-xl tw:font-bold tw:text-gray-900">
                {stats.bills}
              </div>
              <div className="tw:text-xs tw:text-gray-500">Bills · 6mo</div>
            </div>
            <div>
              <div className="tw:text-xl tw:font-bold tw:text-gray-900">
                <Amount value={stats.avgBill} decimalPlaces={0} />
              </div>
              <div className="tw:text-xs tw:text-gray-500">Avg bill</div>
            </div>
            <div>
              <div className="tw:text-xl tw:font-bold tw:text-emerald-600">
                {stats.onTime}%
              </div>
              <div className="tw:text-xs tw:text-gray-500">On-time</div>
            </div>
            <div>
              <div className="tw:text-xl tw:font-bold tw:text-gray-900">
                {stats.silentDays}
              </div>
              <div className="tw:text-xs tw:text-gray-500">Silent days</div>
            </div>
          </div>
        </div>

        {/* Auto-suggested limit */}
        <div className="tw:rounded-xl tw:bg-linear-to-br tw:from-violet-600 tw:to-violet-500 tw:p-5 tw:text-white">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <Sparkles size={14} />
            <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/80">
              Auto-suggested limit
            </span>
          </div>

          <div className="tw:flex tw:items-baseline tw:gap-2 tw:mb-4">
            <span className="tw:text-4xl tw:font-bold">
              <Amount value={limit} decimalPlaces={0} showSymbol />
            </span>
            <span className="tw:text-sm tw:text-white/70">
              ≈ {avgBillMultiple}x avg bill
            </span>
          </div>

          <div className="tw:mb-2">
            <input
              type="range"
              min={0}
              max={MAX_LIMIT}
              step={50}
              value={limit}
              onChange={handleSliderChange}
              className="tw:w-full tw:h-2 tw:rounded-lg tw:appearance-none tw:bg-white/20 tw:accent-amber-400 tw:cursor-pointer"
            />
          </div>

          <div className="tw:flex tw:justify-between tw:text-xs tw:text-white/70 tw:mb-4">
            <span>
              <Amount value={0} decimalPlaces={0} showSymbol />
            </span>
            <span>
              <Amount value={MAX_LIMIT} decimalPlaces={0} showSymbol />
            </span>
          </div>

          <div className="tw:grid tw:grid-cols-3 tw:md:grid-cols-5 tw:gap-2">
            {QUICK_LIMITS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickLimit(value)}
                className={`tw:py-2 tw:px-3 tw:rounded-lg tw:text-sm tw:font-semibold tw:transition-colors ${
                  !customMode && limit === value
                    ? "tw:bg-amber-400 tw:text-violet-900"
                    : "tw:bg-white/10 tw:text-white hover:tw:bg-white/20"
                }`}
              >
                <Amount value={value} decimalPlaces={0} showSymbol />
              </button>
            ))}
            <button
              type="button"
              onClick={handleCustom}
              className={`tw:py-2 tw:px-3 tw:rounded-lg tw:text-sm tw:font-semibold tw:transition-colors ${
                customMode
                  ? "tw:bg-amber-400 tw:text-violet-900"
                  : "tw:bg-white/10 tw:text-white hover:tw:bg-white/20"
              }`}
            >
              Custom
            </button>
          </div>

          {customMode && (
            <div className="tw:mt-3">
              <label
                htmlFor="custom-limit"
                className="tw:block tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-white/80 tw:mb-1"
              >
                Custom limit
              </label>
              <input
                id="custom-limit"
                type="number"
                value={limit}
                onChange={handleCustomChange}
                placeholder="Enter custom limit"
                autoFocus
                className="tw:w-full tw:bg-white tw:px-3 tw:py-2 tw:rounded-lg tw:text-violet-900 tw:font-semibold tw:outline-none tw:border tw:border-white tw:placeholder:text-violet-300 tw:focus:ring-2 tw:focus:ring-amber-300"
              />
            </div>
          )}
        </div>

        {/* Auto-tier ladder — a dashed inset note attached to the limit above,
            not a card of its own. */}
        <div className="tw:rounded-xl tw:border tw:border-dashed tw:border-violet-200 tw:bg-violet-50/40 tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
            <TrendingUp size={14} className="tw:text-violet-600" />
            <span className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wider tw:text-violet-600">
              Auto-tier ladder
            </span>
          </div>
          <p className="tw:text-sm tw:text-gray-600 tw:leading-relaxed">
            Each on-time bill = +₹100 limit. They&apos;ll hit ₹1,000 in ~5
            bills. No paperwork ever needed. Consent captured via WhatsApp OTP
            tap.
          </p>
        </div>
      </div>

      {/* Commit row — the card's footer: what is about to be granted on the
          left, KYC (optional) then the unlock CTA on the right, with the CTA
          carrying the weight. */}
      <div className="tw:border-t tw:border-gray-100 tw:bg-gray-50/60 tw:px-4 tw:py-3 tw:flex tw:flex-col tw:md:flex-row tw:md:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:md:justify-start">
          <div>
            <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-gray-500">
              Unlocking limit
            </div>
            <div className="tw:text-xl tw:font-bold tw:text-gray-900">
              <Amount value={limit} decimalPlaces={0} showSymbol />
            </div>
          </div>
          {kycCaptured && (
            <span className="tw:inline-flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-semibold tw:text-emerald-700 tw:bg-emerald-50 tw:border tw:border-emerald-200 tw:rounded-full tw:px-2 tw:py-1">
              <CheckCircle2 size={12} />
              KYC captured
            </span>
          )}
        </div>

        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-stretch tw:gap-2 tw:sm:items-center">
          <AppButton
            color="secondary"
            fill="outline"
            onClick={onUpdateKyc}
            className="tw:justify-center"
          >
            <FilePenLine size={16} className="tw:mr-2" />
            {kycCaptured ? "Edit KYC" : "Update KYC"}
          </AppButton>
          <AppButton
            color="primary"
            onClick={() => onUnlock(limit)}
            isLoading={loading}
            disabled={loading || limit <= 0}
            className="tw:justify-center tw:font-bold tw:px-6"
          >
            <LockOpen size={16} className="tw:mr-2" />
            Unlock Paylater
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
};

export default UnlockView;
