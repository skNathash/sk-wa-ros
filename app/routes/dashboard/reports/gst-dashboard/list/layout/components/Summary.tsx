import React from "react";
import { Info } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import AppPopover from "~/components/core/popover/AppPopover";

const InfoTip = ({
  info,
  light,
}: {
  info: React.ReactNode;
  light?: boolean;
}) => (
  <AppPopover
    triggerContent={
      <button
        className={
          light
            ? "tw:text-white/70 tw:cursor-pointer tw:shrink-0"
            : "tw:text-gray-400 tw:cursor-pointer tw:shrink-0"
        }
      >
        <Info size={12} />
      </button>
    }
  >
    <div className="tw:text-xs">{info}</div>
  </AppPopover>
);

interface Props {
  summary: any[];
  dateLabel?: string;
  onFileGstr1?: () => void;
}

const Summary = ({ summary, dateLabel, onFileGstr1 }: Props) => {
  const hero = summary.find((item) => item.hero);
  const tiles = summary.filter((item) => !item.hero);

  return (
    <div className="tw:mb-4">
      {hero && (
        <div className="tw:rounded-2xl tw:p-5 tw:mb-3 tw:text-white tw:bg-linear-to-br tw:from-[#5b2a9e] tw:to-[#8b5cf6]">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-[0.12em] tw:text-white/70">
              Net GST · to pay
              {hero.info && <InfoTip info={hero.info} light />}
            </div>
            {onFileGstr1 && (
              <AppButton
                size="small"
                fill="outline"
                color="light"
                onClick={onFileGstr1}
                className="tw:rounded-full tw:bg-white tw:text-[#5b2a9e] tw:border-white tw:hover:bg-white tw:hover:text-[#5b2a9e] tw:font-semibold"
              >
                File GSTR-1
              </AppButton>
            )}
          </div>

          <div className="tw:text-3xl tw:md:text-4xl tw:font-extrabold tw:mt-2 tw:tabular-nums">
            <Amount value={hero.value} />
          </div>

          {dateLabel && (
            <div className="tw:text-xs tw:text-white/70 tw:mt-1">
              {dateLabel}
            </div>
          )}
        </div>
      )}

      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-2 tw:md:gap-3">
        {tiles.map((item) => (
          <div
            key={item.key}
            className="tw:bg-white tw:rounded-xl tw:border tw:border-gray-200 tw:border-t-[3px] tw:p-3"
            style={{ borderTopColor: item.accent }}
          >
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-gray-500">
              <span className="tw:line-clamp-1">{item.label}</span>
              {item.info && <InfoTip info={item.info} />}
            </div>

            <div
              className="tw:text-lg tw:font-bold tw:mt-1 tw:tabular-nums"
              style={{ color: item.accent }}
            >
              {item.isCount ? item.value : <Amount value={item.value} />}
            </div>

            {item.caption && (
              <div className="tw:text-[11px] tw:text-gray-400 tw:mt-0.5">
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;
