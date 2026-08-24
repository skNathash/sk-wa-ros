import clsx from "clsx";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import {
  currentStage,
  emptyJourney,
  getJourney,
  type JourneyData,
  type JourneyStage,
} from "./helper";

/** Pin + label for one stage on the rail. */
const StageMarker = ({ stage }: { stage: JourneyStage }) => {
  const isComplete = stage.status === "complete";
  const isCurrent = stage.status === "current";

  return (
    <div className="tw:flex tw:shrink-0 tw:flex-col tw:items-center tw:gap-1 tw:text-center">
      <span
        className={clsx(
          "app-home-journey-pin tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:text-sm tw:font-bold",
          isComplete && "app-home-pin-complete",
          isCurrent && "app-home-pin-current",
          !isComplete && !isCurrent && "app-home-pin-locked",
        )}
      >
        {isComplete ? <Check size={16} strokeWidth={3} /> : stage.step}
      </span>

      <span className="tw:text-sm tw:leading-none">{stage.emoji}</span>

      <span
        className={clsx(
          "tw:text-[10px] tw:font-semibold tw:leading-tight",
          stage.status === "locked" ? "tw:text-white/45" : "tw:text-white",
        )}
      >
        {stage.label}
      </span>

      <AppBadge
        size="xs"
        variant={isCurrent ? "success" : "light"}
        className={clsx(
          "tw:uppercase",
          stage.status === "locked" && "tw:bg-white/10! tw:text-white/50!",
          isComplete && "tw:bg-white/15! tw:text-white/80!",
        )}
      >
        {isComplete
          ? "Complete"
          : isCurrent
            ? "You are here"
            : `Stage ${stage.step}`}
      </AppBadge>
    </div>
  );
};

/**
 * The onboarding hero: a seven-stage rail across the top and the next action
 * spelled out underneath, so the shop always has exactly one thing to do next.
 */
const BrightStoreJourney = () => {
  const appNav = useAppNav();
  const [data, setData] = useState<JourneyData>(emptyJourney);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: JourneyData;
      try {
        result = await getJourney();
      } catch (e) {
        result = emptyJourney();
      }
      if (cancelled) return;
      setData(result);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const active = currentStage(data);

  return (
    <div className="app-home-journey-card tw:mb-4 tw:rounded-2xl tw:p-4 tw:shadow-sm">
      {loading ? (
        <div className="tw:flex tw:justify-center tw:py-4">
          <AppSpinner />
        </div>
      ) : (
        <>
          <div className="tw:flex tw:flex-col tw:gap-3 tw:lg:flex-row tw:lg:items-start tw:lg:justify-between">
            <div className="tw:min-w-0">
              <span className="tw:inline-block tw:rounded-full tw:bg-white/12 tw:px-2.5 tw:py-0.5 tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/80">
                {data.eyebrow}
              </span>
              <h2 className="tw:mt-2 tw:text-base tw:font-bold tw:text-white tw:md:text-lg">
                {data.headline}
              </h2>
              <p className="tw:mt-1 tw:max-w-xl tw:text-[11px] tw:leading-snug tw:text-white/70">
                {data.description}
              </p>
            </div>

            <div className="tw:flex tw:shrink-0 tw:items-center tw:gap-4">
              <div className="tw:text-center">
                <div className="tw:text-lg tw:font-bold tw:text-white">
                  {data.stagesDone}/{data.totalStages}
                </div>
                <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/60">
                  Stages done
                </div>
              </div>

              <div className="tw:text-center">
                <div className="tw:text-lg tw:font-bold tw:text-amber-300">
                  {data.kingCoins.toLocaleString("en-IN")}
                </div>
                <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-white/60">
                  👑 King coins
                </div>
              </div>

              <AppButton
                fill="outline"
                color="light"
                size="small"
                onClick={() => appNav.to("/dashboard/journey")}
                className="tw:rounded-full tw:border-white/30! tw:text-white! tw:hover:bg-white/10!"
              >
                Full map
                <ArrowUpRight size={14} />
              </AppButton>
            </div>
          </div>

          {/* Stage rail — scrolls sideways rather than wrapping, so the
              sequence always reads left to right. */}
          <div className="tw:mt-4 tw:overflow-x-auto">
            <div className="tw:flex tw:min-w-max tw:items-start tw:gap-2">
              {data.stages.map((stage, index) => (
                <div key={stage.key} className="tw:flex tw:items-start">
                  {index > 0 && (
                    <span
                      className={clsx(
                        "tw:mt-4 tw:h-0.5 tw:w-6 tw:md:w-10",
                        stage.status === "locked"
                          ? "tw:bg-white/15"
                          : "tw:bg-amber-400/60",
                      )}
                    />
                  )}
                  <StageMarker stage={stage} />
                </div>
              ))}
            </div>
          </div>

          {/* Next action */}
          <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-2 tw:rounded-xl tw:border tw:border-emerald-400/25 tw:bg-white/8 tw:p-3 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
              <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-400/25 tw:text-lg">
                {data.cta.emoji}
              </span>
              <div className="tw:min-w-0">
                {active && (
                  <div className="tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-emerald-300">
                    You are here · Stage {active.step} of {data.totalStages}
                  </div>
                )}
                <div className="tw:mt-0.5 tw:text-sm tw:font-bold tw:text-white">
                  {data.cta.title}
                </div>
                <div className="tw:mt-0.5 tw:text-[11px] tw:text-white/65">
                  {data.cta.meta} ·{" "}
                  <span className="tw:font-semibold tw:text-amber-300">
                    +{data.cta.coins.toLocaleString("en-IN")} 👑 King Coins
                  </span>
                </div>
              </div>
            </div>

            <AppButton
              color="light"
              size="small"
              className="tw:shrink-0 tw:rounded-full tw:border-transparent! tw:bg-emerald-500! tw:text-white! tw:hover:bg-emerald-600!"
            >
              {data.cta.actionLabel}
              <ArrowRight size={14} />
            </AppButton>
          </div>
        </>
      )}
    </div>
  );
};

export default BrightStoreJourney;
