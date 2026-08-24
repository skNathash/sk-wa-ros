import type { NetworkGroupPrice } from "~/types/CommonTypes";

export const rbacRoles = {
  editPrice: ["CONFIGS.PRICING"],
};

/** Avatar colours, picked per group so the same group keeps the same tone. */
const AVATAR_TONES = [
  "tw:bg-emerald-500",
  "tw:bg-rose-500",
  "tw:bg-orange-500",
  "tw:bg-blue-500",
  "tw:bg-violet-500",
  "tw:bg-fuchsia-500",
];

/** Stable colour for a group name — same name, same swatch on every render. */
export const getAvatarTone = (name: string) => {
  const seed = (name || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_TONES[seed % AVATAR_TONES.length];
};

export const getInitial = (name: string) =>
  (name || "?").trim().charAt(0).toUpperCase();

/**
 * Headline for the block — how many groups carry a price and how many
 * retailers those groups cover.
 */
export const getGroupSummary = (
  groups: NetworkGroupPrice[],
  info?: { totalGroups?: number; totalSellers?: number },
) => {
  const totalGroups = info?.totalGroups || groups.length;
  const totalSellers =
    info?.totalSellers ||
    groups.reduce((sum, group) => sum + (group.sellersCount || 0), 0);

  return { totalGroups, totalSellers };
};

/** Groups with a price first, then alphabetical, so the list reads stably. */
export const sortGroups = (groups: NetworkGroupPrice[]) =>
  [...(groups || [])].sort((a, b) => {
    if (!!a.price !== !!b.price) return a.price ? -1 : 1;
    return (a.name || "").localeCompare(b.name || "");
  });
