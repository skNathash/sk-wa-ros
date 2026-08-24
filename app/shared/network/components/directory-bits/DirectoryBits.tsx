import clsx from "clsx";
import NoData from "~/components/core/no-data/NoData";

/** Palette for the initials avatar — picked by name so it stays stable. */
const AVATAR_COLORS = [
  "tw:bg-emerald-700",
  "tw:bg-sky-600",
  "tw:bg-rose-700",
  "tw:bg-amber-700",
  "tw:bg-indigo-600",
  "tw:bg-teal-700",
];

export const InitialsAvatar = ({
  name,
  initials,
  size = 40,
  className,
}: {
  name?: string;
  initials?: string;
  size?: number;
  className?: string;
}) => {
  const label =
    initials ||
    (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const color =
    AVATAR_COLORS[(name || "").length % AVATAR_COLORS.length] ||
    AVATAR_COLORS[0];

  return (
    <div
      className={clsx(
        "tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:font-semibold tw:text-white",
        color,
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {label || "?"}
    </div>
  );
};

/** LOYAL / HOT pill beside the customer name. */
export const TagChip = ({ tag }: { tag?: string }) => {
  if (!tag) return null;
  const isHot = tag === "HOT";
  return (
    <span
      className={clsx(
        "tw:inline-flex tw:items-center tw:gap-0.5 tw:rounded tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-wide",
        isHot
          ? "tw:bg-red-100 tw:text-red-700"
          : "tw:bg-amber-100 tw:text-amber-800",
      )}
    >
      {isHot ? null : "★"} {tag}
    </span>
  );
};

/* Buyer state and account state — both unused. The directory rows render the
   status through `CustomerService.getCustomerStatusBadge`, which folds the
   buyer flag and the Disabled account state into one badge. Kept here in case
   the row ever needs the inline treatment back.

/**
 * Buyer state — "Active" / "Inactive" from the API flag, with the order
 * recency trailing it as the supporting detail.
 *
export const StatusLine = ({
  isActive,
  daysSinceOrder,
}: {
  isActive?: boolean;
  daysSinceOrder?: number;
}) => (
  <span
    className={clsx(
      "tw:inline-flex tw:items-center tw:gap-1 tw:text-xs tw:font-medium",
      isActive ? "tw:text-emerald-600" : "tw:text-gray-500",
    )}
  >
    <span
      className={clsx(
        "tw:h-1.5 tw:w-1.5 tw:shrink-0 tw:rounded-full",
        isActive ? "tw:bg-emerald-500" : "tw:bg-gray-400",
      )}
    />
    {isActive ? "Active" : "Inactive"}
    <span className="tw:font-normal tw:text-gray-400">
      {daysSinceOrder === undefined
        ? "· no orders yet"
        : `· last ${daysSinceOrder}d`}
    </span>
  </span>
);

/**
 * Account state beside the buyer status — only rendered when the account
 * itself is switched off.
 *
export const AccountStateChip = ({
  isEnabled = true,
}: {
  isEnabled?: boolean;
}) => {
  if (isEnabled) return null;
  return (
    <span className="tw:inline-flex tw:items-center tw:rounded tw:bg-gray-100 tw:px-1.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-600">
      Disabled
    </span>
  );
};

*/

/**
 * Paylater utilisation meter. The fill turns red once the customer is past
 * three-quarters of the sanctioned limit, amber past half.
 */
export const PaylaterBar = ({
  used = 0,
  limit = 0,
  className,
}: {
  used?: number;
  limit?: number;
  className?: string;
}) => {
  const pct =
    limit > 0
      ? Math.max(0, Math.min(100, Math.round((used / limit) * 100)))
      : 0;
  const fill =
    pct >= 75
      ? "tw:bg-red-500"
      : pct >= 50
        ? "tw:bg-amber-500"
        : "tw:bg-primary";

  return (
    <div
      className={clsx("tw:h-1.5 tw:w-full tw:rounded-full tw:bg-gray-200", className)}
    >
      <div
        className={clsx("tw:h-full tw:rounded-full", fill)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

/** "₹1,872 / ₹10,000" — used against the sanctioned limit. */
export const paylaterLabel = (used?: number, limit?: number) =>
  `₹${(used || 0).toLocaleString("en-IN")} / ₹${(limit || 0).toLocaleString("en-IN")}`;

/**
 * Empty state for the directory list surfaces. `bleed` matches the mobile
 * edge-to-edge white list block; `inset` sits under the desktop card toolbar
 * with a hairline so it doesn't float inside the AppCard.
 */
export const DirectoryEmpty = ({
  title,
  description,
  variant = "inset",
}: {
  title: string;
  description?: string;
  variant?: "bleed" | "inset";
}) => (
  <div
    className={clsx(
      variant === "bleed"
        ? "app-bleed-x tw:bg-white tw:md:rounded-xl tw:md:border tw:md:border-border"
        : "tw:border-t tw:border-border",
    )}
  >
    <NoData title={title} description={description} className="tw:py-16" />
  </div>
);
