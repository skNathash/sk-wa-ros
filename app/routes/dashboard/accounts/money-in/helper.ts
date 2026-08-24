import { tintAt, tintIndexFor } from "~/components/core/tint/tints";

/** Lane a row belongs to — the badge printed beside the party name. */
export type PartyLane = "B2C" | "B2B";

/**
 * Tone for the small B2C / B2B badge that sits beside a party name. The two
 * lanes keep the same colours here as on the lane cards at the top of the page.
 */
export const laneBadgeClass = (lane: PartyLane) =>
  lane === "B2B"
    ? "tw:bg-blue-50 tw:text-blue-700"
    : "tw:bg-emerald-50 tw:text-emerald-700";

/**
 * Avatar decoration for a party row.
 *
 * The money-in lists print two-letter initials rather than the single glyph
 * `tileDecor` gives, so the decoration is resolved here; the tint slot still
 * follows the name, so a party keeps the same colour across all the blocks on
 * the page.
 */
export type PartyDecor = {
  _initials: string;
  _tintIndex: number;
  _ink: string;
};

export const partyDecor = (name = ""): PartyDecor => {
  const index = tintIndexFor(name);
  const initials = name
    .trim()
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return {
    _initials: initials || "#",
    _tintIndex: index,
    _ink: tintAt(index).ink,
  };
};
