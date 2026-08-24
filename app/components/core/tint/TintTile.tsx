import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { tintAt } from "~/components/core/tint/tints";

type TintTileProps = {
  /** Which background design to wear — wraps round `TINT_DESIGNS`. `-1` = theme tint. */
  index?: number;
  children?: ReactNode;
  className?: string;
};

/**
 * A tinted block. Picks a background design by index and paints it behind
 * whatever it wraps — an image, an initial, an icon, a stat.
 *
 * Layout is the caller's: size, radius and padding come in through `className`,
 * so the same component serves a 40px avatar and a full-width plate.
 *
 * The design's ink colour is published as `--tint-ink`, so children can pick it
 * up without knowing which tone landed:
 *
 *   <TintTile index={1} className="tw:h-10 tw:w-10 tw:rounded-xl">
 *     <span className="tw:text-[color:var(--tint-ink)]">{initial}</span>
 *   </TintTile>
 */
const TintTile = ({ index = 0, children, className }: TintTileProps) => {
  const tint = tintAt(index);

  return (
    <div
      className={cn(
        "tw:relative tw:flex tw:items-center tw:justify-center tw:overflow-hidden",
        className,
      )}
      style={{
        background: tint.background,
        boxShadow: `inset 0 0 0 1px ${tint.ring}`,
        ["--tint-ink" as string]: tint.ink,
        color: tint.ink,
      }}
    >
      {children}
    </div>
  );
};

export default TintTile;
