import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import { InitialsAvatar } from "../directory-bits/DirectoryBits";

/** Pill beside the name — segment, tier, status. */
export interface PartyHeroChip {
  key: string;
  label: string;
  icon?: LucideIcon;
  /** Solid amber (segment), outlined gold (tier), or a plain on-dark pill. */
  tone?: "amber" | "gold" | "muted";
}

/** One of the headline numbers under the identity row. */
export interface PartyHeroStat {
  key: string;
  label: string;
  value: React.ReactNode;
  /** Lifts the tile out of the strip — the number the seller acts on. */
  highlight?: boolean;
}

/** One tile in the action row under the band. */
export interface PartyHeroAction {
  key: string;
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "amber" | "violet" | "emerald" | "slate";
}

export interface PartyHeroProps {
  name?: string;
  /** Line under the name — mobile, code, or both joined by the caller. */
  subtitle?: React.ReactNode;
  /** Photo (shop image etc.); falls back to initials when absent. */
  avatar?: React.ReactNode;
  chips?: PartyHeroChip[];
  stats?: PartyHeroStat[];
  actions?: PartyHeroAction[];
  /** Fired with the tapped action key — the page owns what each one does. */
  onAction?: (action: string) => void;
  className?: string;
}

/* Chip fills. Each tone carries the on-dark treatment for the phone band and
   an `lg:` counterpart for the light band the desktop page uses. */
const CHIP_TONES: Record<NonNullable<PartyHeroChip["tone"]>, string> = {
  amber: "tw:bg-amber-400 tw:text-amber-950",
  gold: "tw:bg-amber-200/25 tw:text-amber-100 tw:ring-1 tw:ring-amber-200/50 tw:lg:bg-amber-100 tw:lg:text-amber-800 tw:lg:ring-amber-300",
  muted: "tw:bg-white/15 tw:text-white tw:lg:bg-primary/10 tw:lg:text-primary",
};

const ACTION_TONES: Record<NonNullable<PartyHeroAction["tone"]>, string> = {
  primary: "tw:bg-primary tw:text-white tw:hover:bg-primary/90",
  amber:
    "tw:bg-amber-100 tw:text-amber-700 tw:ring-1 tw:ring-amber-200 tw:hover:bg-amber-200",
  violet:
    "tw:bg-violet-100 tw:text-violet-700 tw:ring-1 tw:ring-violet-200 tw:hover:bg-violet-200",
  emerald:
    "tw:bg-emerald-100 tw:text-emerald-700 tw:ring-1 tw:ring-emerald-200 tw:hover:bg-emerald-200",
  slate:
    "tw:bg-slate-100 tw:text-slate-700 tw:ring-1 tw:ring-slate-200 tw:hover:bg-slate-200",
};

/**
 * Identity hero for a network party (B2C customer / B2B retailer): who they
 * are on a dark band, the numbers that decide what happens next as one strip
 * under it, and the actions the seller takes on them as a row below.
 *
 * Purely presentational — every page passes its own chips, stats and actions
 * and handles taps through {@link PartyHeroProps.onAction}.
 */
const PartyHero = ({
  name,
  subtitle,
  avatar,
  chips = [],
  stats = [],
  actions = [],
  onAction,
  className,
}: PartyHeroProps) => (
  <div
    className={clsx(
      "tw:overflow-clip tw:rounded-2xl tw:bg-white tw:ring-1 tw:ring-slate-200",
      className,
    )}
  >
    {/* Identity band. On a phone it's the only dark surface on the page, so the
        name and the headline numbers read first; the deeper top inset keeps the
        name off the app header once the band is bled flush against it. On
        desktop the same band goes to a light brand tint — a full-width slab of
        deep green is far heavier there than it is inside a phone frame. */}
    <div className="tw:bg-linear-to-br tw:from-primary tw:to-primary/85 tw:px-4 tw:pt-6 tw:pb-4 tw:lg:border-b tw:lg:border-primary/15 tw:lg:bg-primary-soft tw:lg:bg-none tw:lg:pt-4">
      <div className="tw:flex tw:items-center tw:gap-3">
        {avatar ?? <InitialsAvatar name={name} size={56} />}

        <div className="tw:min-w-0 tw:flex-1">
          <p className="tw:truncate tw:text-xl tw:font-bold tw:text-white tw:lg:text-primary-dark">
            {name || "Unknown"}
          </p>
          {subtitle ? (
            <p className="tw:mt-0.5 tw:truncate tw:text-xs tw:text-white/75 tw:lg:text-slate-600">
              {subtitle}
            </p>
          ) : null}

          {chips.length ? (
            <div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-1.5">
              {chips.map((chip) => {
                const Icon = chip.icon;
                return (
                  <span
                    key={chip.key}
                    className={clsx(
                      "tw:inline-flex tw:items-center tw:gap-1 tw:rounded-md tw:px-2 tw:py-0.5 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wide",
                      CHIP_TONES[chip.tone || "muted"],
                    )}
                  >
                    {Icon ? <Icon size={11} className="tw:shrink-0" /> : null}
                    {chip.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {stats.length ? (
        <div className="tw:mt-3 tw:flex tw:items-stretch tw:gap-2">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className={clsx(
                "tw:min-w-0 tw:flex-1 tw:rounded-lg tw:px-3 tw:py-2 tw:ring-1 tw:ring-inset",
                stat.highlight
                  ? "tw:bg-white/20 tw:ring-white/50 tw:lg:bg-white tw:lg:ring-primary/35"
                  : "tw:bg-white/10 tw:ring-white/15 tw:lg:bg-white/70 tw:lg:ring-primary/15",
              )}
            >
              <p className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-white/60 tw:lg:text-slate-500">
                {stat.label}
              </p>
              <p className="tw:mt-0.5 tw:truncate tw:text-lg tw:font-bold tw:text-white tw:lg:text-primary-dark">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>

    {actions.length ? (
      /* Action row sits on the card's white foot — stacked icon over label so
         four of them still fit a phone width. */
      <div className="tw:grid tw:grid-cols-4 tw:gap-2 tw:p-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => onAction?.(action.key)}
              className={clsx(
                "tw:flex tw:cursor-pointer tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:rounded-xl tw:px-2 tw:py-3 tw:text-xs tw:font-semibold tw:transition-colors",
                ACTION_TONES[action.tone || "slate"],
              )}
            >
              <Icon size={18} className="tw:shrink-0" />
              <span className="tw:max-w-full tw:truncate">{action.label}</span>
            </button>
          );
        })}
      </div>
    ) : null}
  </div>
);

export default PartyHero;
