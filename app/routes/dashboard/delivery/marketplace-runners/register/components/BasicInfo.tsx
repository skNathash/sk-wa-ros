import { BadgeCheck, Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useOnlyNumber from "~/hooks/useOnlyNumbers";

interface BasicInfoProps {
  /** True once the mobile has cleared the OTP — the identity then locks. */
  verified: boolean;
  /** Whether the entered mobile is available for a new runner. */
  mobileStatus?: "idle" | "checking" | "valid" | "invalid";
  /** Fired on every mobile keystroke so the parent can debounce a check. */
  onMobileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Step one — the identity the runner document is opened with. Both fields go
 * read-only after the OTP clears, since the runner already exists against them.
 */
const BasicInfo = ({
  verified,
  mobileStatus = "idle",
  onMobileChange,
}: BasicInfoProps) => {
  const { register, setValue } = useFormContext();
  const { onOnlyNumberType } = useOnlyNumber();

  /** Keep the runner's name to letters, spaces and dots only. */
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue("name", event.target.value.replace(/[^a-zA-Z .]/g, ""));
  };

  return (
    <AppCard
      title="Runner details"
      subtitle="We send a one-time code to this mobile to confirm the runner."
      icon="user-round"
      headerClassName="tw:hidden tw:md:block"
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        <AppInput
          label="Runner name"
          name="name"
          register={register}
          placeholder="Enter the runner's full name"
          isRequired
          size="sm"
          readOnly={verified}
          onChange={handleNameChange}
        />

        <AppInput
          label="Mobile number"
          name="mobile"
          type="tel"
          register={register}
          placeholder="10-digit mobile number"
          isRequired
          size="sm"
          maxLength={10}
          readOnly={verified}
          disabled={mobileStatus === "checking"}
          onKeyDown={onOnlyNumberType}
          onChange={onMobileChange}
          rightIcon={
            mobileStatus === "checking" ? (
              <AppSpinner size="xs" />
            ) : undefined
          }
        />

        {mobileStatus === "invalid" && !verified && (
          <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-red-600 tw:md:col-start-2">
            <Info size={14} className="tw:shrink-0" />
            <span>
              This mobile number is already registered. Try a different one.
            </span>
          </div>
        )}

        {/* OTP hint — sits directly under the mobile number on every screen. */}
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:rounded tw:bg-slate-50 tw:px-3 tw:py-2 tw:text-xs tw:text-slate-600 tw:md:col-start-2">
          <Info size={14} className="tw:shrink-0 tw:text-slate-400" />
          <span>
            An OTP will be sent to the entered mobile number to verify the
            runner.
          </span>
        </div>
      </div>

      {verified && (
        <div className="tw:mt-3 tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-medium tw:text-emerald-600">
          <BadgeCheck size={15} />
          <span>Mobile verified — the runner is registered.</span>
        </div>
      )}
    </AppCard>
  );
};

export default BasicInfo;
