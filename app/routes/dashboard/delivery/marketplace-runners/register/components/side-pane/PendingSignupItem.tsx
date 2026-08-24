import AppButton from "~/components/core/button/AppButton";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import type { PaneRunner } from "./helper";

interface PendingSignupItemProps {
  runner: PaneRunner;
  /** Fired with the runner whose half-finished registration is resumed. */
  onContinue: (runner: PaneRunner) => void;
}

/**
 * A registration that was opened but never finished — how far it got, and the
 * one button that picks it back up where it stopped.
 */
export default function PendingSignupItem({
  runner,
  onContinue,
}: PendingSignupItemProps) {
  return (
    <div className="tw:flex tw:items-center tw:gap-3 tw:px-1 tw:py-3">
      <InitialsAvatar
        initials={runner._initials}
        name={runner.name}
        size={40}
      />

      <div className="tw:min-w-0 tw:flex-1">
        <h3 className="tw:truncate tw:text-sm tw:font-bold tw:text-slate-900">
          {runner.name}
        </h3>
        <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-slate-500">
          {runner._pendingLbl}
        </p>
      </div>

      <AppButton
        size="small"
        fill="outline"
        color="light"
        onClick={() => onContinue(runner)}
      >
        Continue
      </AppButton>
    </div>
  );
}
