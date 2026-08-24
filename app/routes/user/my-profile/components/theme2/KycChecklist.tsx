import clsx from "clsx";
import { AlertTriangle, Check, Clock, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import type { KycCheck, KycStatus, ProfileOverviewModel } from "./helper";

interface KycChecklistProps {
  model: ProfileOverviewModel;
  onAction: (check: KycCheck) => void;
}

type Filter = "all" | "missing";

const STATUS_STYLE: Record<
  KycStatus,
  { icon: React.ComponentType<{ className?: string }>; className: string }
> = {
  verified: {
    icon: Check,
    className: "tw:bg-emerald-100 tw:text-emerald-700",
  },
  pending: { icon: Clock, className: "tw:bg-amber-100 tw:text-amber-700" },
  missing: {
    icon: AlertTriangle,
    className: "tw:bg-rose-100 tw:text-rose-700",
  },
};

/**
 * Every verification the store owes, in one list — what is done, what is in
 * review and what still needs an upload, each row carrying the action that
 * clears it.
 */
const KycChecklist: React.FC<KycChecklistProps> = ({ model, onAction }) => {
  const [filter, setFilter] = useState<Filter>("all");

  const checks = model.checks.filter(
    (check) => filter === "all" || check.status !== "verified",
  );

  const chips: Array<{ key: Filter; label: string; className: string }> = [
    {
      key: "all",
      label: `All ${model.counts.all}`,
      className: "tw:bg-emerald-600 tw:text-white",
    },
    {
      key: "missing",
      label: `Missing · ${model.counts.pending + model.counts.missing}`,
      className: "tw:bg-rose-100 tw:text-rose-700",
    },
  ];

  return (
    <div className="tw:flex tw:h-full tw:flex-col tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-5">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:flex tw:min-w-0 tw:items-start tw:gap-3">
          <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-xl tw:bg-emerald-50 tw:text-emerald-600">
            <ShieldCheck className="tw:h-5 tw:w-5" />
          </span>
          <div className="tw:min-w-0">
            <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
              KYC checklist
            </h2>
            <p className="tw:mt-0.5 tw:text-xs tw:text-gray-500">
              {model.countsLabel}
            </p>
          </div>
        </div>
        <div className="tw:flex tw:shrink-0 tw:gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={clsx(
                "tw:cursor-pointer tw:rounded-full tw:px-3 tw:py-1 tw:text-xs tw:font-semibold tw:transition-opacity",
                chip.className,
                filter === chip.key ? "tw:opacity-100" : "tw:opacity-60",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress reads left to right: done, in review, then still owed. */}
      <div className="tw:mt-3 tw:flex tw:h-2 tw:overflow-hidden tw:rounded-full tw:bg-gray-100">
        <span
          className="tw:bg-emerald-600"
          style={{ width: `${model.progress.verified}%` }}
        />
        <span
          className="tw:bg-amber-400"
          style={{ width: `${model.progress.pending}%` }}
        />
        <span
          className="tw:bg-rose-500"
          style={{ width: `${model.progress.missing}%` }}
        />
      </div>

      <div className="tw:mt-3 tw:flex-1 tw:divide-y tw:divide-gray-200/70 tw:rounded-xl tw:border tw:border-gray-100 tw:bg-gray-50 tw:px-4">
        {checks.map((check) => {
          const style = STATUS_STYLE[check.status];
          const Icon = style.icon;
          return (
            <div
              key={check.key}
              className="tw:flex tw:items-center tw:gap-3 tw:py-3"
            >
              <span
                className={clsx(
                  "tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg",
                  style.className,
                )}
              >
                <Icon className="tw:h-4 tw:w-4" />
              </span>
              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-sm tw:font-bold tw:text-gray-900">
                  {check.title}
                </div>
                <div className="tw:truncate tw:text-xs tw:text-gray-500">
                  {check.detail}
                </div>
              </div>
              {check.actionLabel && (
                <button
                  type="button"
                  onClick={() => onAction(check)}
                  className={clsx(
                    "tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:px-3 tw:py-1.5 tw:text-xs tw:font-bold",
                    check.status === "verified"
                      ? "tw:border tw:border-gray-300 tw:bg-white tw:text-gray-700 tw:hover:bg-gray-100"
                      : check.status === "pending"
                        ? "tw:bg-amber-500 tw:text-white tw:hover:bg-amber-600"
                        : "tw:bg-rose-500 tw:text-white tw:hover:bg-rose-600",
                  )}
                >
                  {check.actionLabel}
                </button>
              )}
            </div>
          );
        })}
        {!checks.length && (
          <div className="tw:py-6 tw:text-center tw:text-sm tw:text-gray-500">
            Every check is verified.
          </div>
        )}
      </div>
    </div>
  );
};

export default KycChecklist;
