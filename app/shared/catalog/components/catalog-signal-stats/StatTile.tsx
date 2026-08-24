/** Accent per tile — a left rule, so the numbers stay the loud part. */
const TILE_ACCENTS = {
  blue: { rule: "tw:border-l-blue-500", value: "tw:text-blue-600" },
  violet: { rule: "tw:border-l-violet-500", value: "tw:text-violet-600" },
  amber: { rule: "tw:border-l-amber-500", value: "tw:text-amber-600" },
} as const;

export type TileAccent = keyof typeof TILE_ACCENTS;

interface StatTileProps {
  label: string;
  value: string;
  subtitle: string;
  accent: TileAccent;
}

/** One count in the headline strip — label, big number, supporting line. */
const StatTile = ({ label, value, subtitle, accent }: StatTileProps) => {
  const styles = TILE_ACCENTS[accent];

  return (
    <div
      className={`tw:rounded-2xl tw:border tw:border-slate-200 tw:border-l-4 tw:bg-white tw:p-3 tw:shadow-sm tw:md:p-4 ${styles.rule}`}
    >
      <div className="tw:text-[10px] tw:font-semibold tw:tracking-wide tw:text-slate-500 tw:uppercase tw:md:text-[11px]">
        {label}
      </div>
      <div
        className={`app-amount tw:mt-1 tw:text-xl tw:font-bold tw:leading-none tw:md:text-3xl ${styles.value}`}
      >
        {value}
      </div>
      {subtitle && (
        <div className="tw:mt-2 tw:text-[11px] tw:text-slate-500 tw:md:text-xs">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatTile;
