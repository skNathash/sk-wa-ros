import {
  Bike,
  Footprints,
  MapPin,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { InitialsAvatar } from "~/shared/network/components/directory-bits/DirectoryBits";
import clsx from "clsx";
import type { MarketplaceRunner } from "../../helper";

interface RunnerCardProps {
  runner: MarketplaceRunner;
  /** Hiring only makes sense against an order — the page passes it through. */
  canHire?: boolean;
  /** Fired with `view` / `hire` so the page decides what the action does. */
  callback: (payload: { action: string; data: MarketplaceRunner }) => void;
}

/** Vehicle glyph beside the type caption. */
const VEHICLE_ICONS: Record<string, ReactNode> = {
  scooter: <Bike size={13} />,
  bike: <Bike size={13} />,
  truck: <Truck size={13} />,
  walk: <Footprints size={13} />,
};

/** A single tight stat cell (label over value). */
function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <span className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider tw:text-slate-400">
        {label}
      </span>
      <p
        className={clsx(
          "tw:mt-0.5 tw:text-sm tw:font-bold tw:tabular-nums tw:text-slate-900",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * One runner in the marketplace grid — who they are, how they score, when
 * they are free and what they charge, with the two calls to action the desk
 * needs.
 */
export default function RunnerCard({
  runner,
  canHire = false,
  callback,
}: RunnerCardProps) {
  return (
    <AppCard noPadding className="tw:mb-0 tw:h-full">
      <div className="tw:flex tw:h-full tw:flex-col tw:gap-2 tw:p-2.5">
        <div className="tw:flex tw:items-center tw:gap-2.5">
          <InitialsAvatar
            initials={runner._initials}
            name={runner.name}
            size={36}
          />

          <div className="tw:min-w-0 tw:flex-1">
            <h3 className="tw:truncate tw:text-[13px] tw:font-bold tw:text-slate-900">
              {runner.name}
            </h3>

            <p className="tw:mt-0.5 tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:text-slate-500">
              <span className="tw:flex tw:min-w-0 tw:items-center tw:gap-1 tw:capitalize">
                <span className="tw:shrink-0 tw:text-slate-400">
                  {VEHICLE_ICONS[runner.vehicleDetails?.type]}
                </span>
                <span className="tw:truncate">
                  {runner.vehicleDetails?.type}
                </span>
              </span>
              <span className="tw:text-slate-300">·</span>
              <span className="tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:font-semibold tw:text-slate-700">
                <Star
                  size={11}
                  className="tw:fill-amber-400 tw:text-amber-400"
                />
                {runner._ratingLbl}
              </span>
            </p>
          </div>
        </div>

        {/* Headline figures in a single row with divider — reads as numbers,
            keeps the card short. */}
        <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-lg tw:bg-slate-50 tw:px-2.5 tw:py-1.5">
          <Stat label="Deliveries" value={runner._dropsLbl} />
          <span className="tw:h-8 tw:w-px tw:shrink-0 tw:bg-slate-200" />
          <Stat
            label="Available"
            value={runner._availableLbl}
            valueClassName={
              runner.isAvailable
                ? "tw:text-emerald-600"
                : "tw:text-slate-500"
            }
          />
          <span className="tw:h-8 tw:w-px tw:shrink-0 tw:bg-slate-200" />
          <Stat
            label="Rate"
            value={`${runner._baseChargeLbl} + ${runner._perKmLbl}`}
            valueClassName="tw:text-[12px] tw:truncate"
          />
        </div>

        <p className="tw:flex tw:items-center tw:gap-1 tw:truncate tw:text-[11px] tw:text-slate-500">
          <MapPin size={12} className="tw:shrink-0 tw:text-slate-400" />
          <span className="tw:truncate">{runner._locationLbl}</span>
        </p>

        <div
          className={clsx("tw:mt-auto tw:grid tw:gap-1.5", {
            "tw:grid-cols-2": canHire,
            "tw:grid-cols-1": !canHire,
          })}
        >
          <AppButton
            fill="outline"
            color="light"
            size="small"
            onClick={() => callback({ action: "view", data: runner })}
          >
            View Profile
          </AppButton>
          {canHire && (
            <AppButton
              color="primary"
              size="small"
              onClick={() => callback({ action: "hire", data: runner })}
            >
              <Zap size={12} className="tw:fill-current" />
              Hire Now
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  );
}
