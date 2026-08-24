import clsx from "clsx";
import { ArrowRight, Check, Crown, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useTheme from "~/hooks/useTheme";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import {
  emptyJourneyMap,
  formatCoins,
  getJourneyMap,
  stageStatusLabel,
  type JourneyMap,
  type JourneyStage,
  type JourneyTask,
} from "./helper";

/** King-coin chip in a card's top-right corner. */
const CoinBadge = ({ coins }: { coins: number }) => (
  <AppBadge size="sm" variant="light" className="app-journey-coin">
    <Crown size={11} />
    {formatCoins(coins)}
  </AppBadge>
);

/** Checklist row — a tick for done work, the step number for pending work. */
const TaskRow = ({ task, index }: { task: JourneyTask; index: number }) => (
  <li
    className={clsx(
      "app-journey-task tw:flex tw:items-center tw:gap-2.5 tw:rounded-lg tw:px-3 tw:py-2.5",
      task.done && "is-done",
    )}
  >
    <span className="app-journey-task-mark tw:flex tw:h-5 tw:w-5 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:text-[10px] tw:font-bold">
      {task.done ? <Check size={12} strokeWidth={3.5} /> : index + 1}
    </span>
    <span className="tw:text-[13px] tw:leading-snug">{task.label}</span>
  </li>
);

/** One stage: its pin on the rail plus the card that hangs off it. */
const StageRow = ({ stage }: { stage: JourneyStage }) => {
  const isComplete = stage.status === "complete";
  const isCurrent = stage.status === "current";

  return (
    <li
      className={clsx(
        "app-journey-row",
        isComplete && "is-complete",
        isCurrent && "is-current",
        stage.status === "locked" && "is-locked",
      )}
    >
      <div className="app-journey-pin-col">
        <span className="app-journey-pin">
          {isComplete ? <Check size={18} strokeWidth={3.5} /> : stage.step}
        </span>
      </div>

      <article className="app-journey-card tw:rounded-2xl tw:p-5 tw:md:p-6">
        <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
          <span className="app-journey-status tw:flex tw:items-center tw:gap-1.5 tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-widest">
            {isComplete && <Check size={12} strokeWidth={3.5} />}
            {isCurrent && <span className="app-journey-status-dot" />}
            {stageStatusLabel(stage)}
          </span>
          <CoinBadge coins={stage.coins} />
        </div>

        <h2 className="app-journey-display tw:mt-2 tw:text-xl tw:font-bold tw:leading-snug tw:md:text-2xl">
          {stage.title}
        </h2>

        <dl className="tw:mt-2 tw:space-y-0.5 tw:text-[13px] tw:leading-relaxed">
          <div className="tw:flex tw:flex-wrap tw:gap-x-1.5">
            <dt className="tw:font-bold">Outcome:</dt>
            <dd className="app-journey-muted">{stage.outcome}</dd>
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-x-1.5">
            <dt className="tw:font-bold">Time:</dt>
            <dd className="app-journey-muted">{stage.time}</dd>
          </div>
        </dl>

        {/* Two-up on desktop so a four-task stage stays two lines tall; the
            odd task out simply keeps the left column. */}
        <ul className="tw:mt-4 tw:grid tw:grid-cols-1 tw:gap-2.5 tw:md:grid-cols-2">
          {stage.tasks.map((task, index) => (
            <TaskRow key={task.key} task={task} index={index} />
          ))}
        </ul>

        {stage.badge && (
          <div className="tw:mt-4 tw:flex tw:items-center tw:gap-2 tw:text-[13px]">
            <span className="tw:text-base tw:leading-none">
              {stage.badge.emoji}
            </span>
            <span className="app-journey-muted">Badge earned ·</span>
            <span className="tw:font-bold">{stage.badge.label}</span>
          </div>
        )}

        {isCurrent && (
          <div className="app-journey-cta tw:mt-4 tw:flex tw:flex-col tw:gap-3 tw:pt-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
            {stage.unlocks && (
              <AppBadge
                size="sm"
                variant="light"
                className="app-journey-unlocks"
              >
                <Lock size={11} />
                {stage.unlocks}
              </AppBadge>
            )}

            <AppButton
              color="success"
              size="small"
              className="app-journey-action tw:shrink-0 tw:rounded-full"
            >
              {stage.actionLabel}
              <ArrowRight size={14} />
            </AppButton>
          </div>
        )}
      </article>
    </li>
  );
};

/**
 * The full Bright Store journey map — the "Full map" destination behind the
 * home page's journey hero. Seven stages down a single rail: what each one
 * gives the shop, what it costs in time, the tasks inside it, and the King
 * Coins it pays out.
 *
 * theme-2 only. The other themes have no design for this screen, so they are
 * sent back to the dashboard rather than shown an unstyled version.
 */
const DashboardJourney = () => {
  const theme = useTheme();
  const [data, setData] = useState<JourneyMap>(emptyJourneyMap);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let result: JourneyMap;
      try {
        result = await getJourneyMap();
      } catch {
        result = emptyJourneyMap();
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

  if (theme !== "theme-2") return <Navigate to="/dashboard/main" replace />;

  return (
    <>
      {/* Same section as Home with Journey lit, so the mobile section switcher
          in the header and the desktop rail both know where we are. */}
      <AppHeader
        title="Bright Store Journey"
        sectionKey="home"
        activeTab="journey"
        mobileLead="menu"
      />

      {/* `app-journey` scopes every rule in dashboard-journey.css. */}
      <div className="app-journey">
        <div className="app-page tw:p-4">
          <div className="app-container">
            <div className="section-layout">
              {/* Desktop-only left rail — the same Home section menu the
                  dashboard carries, so the shell doesn't change under the user
                  when they open the map. No `onSelect` override: every other
                  entry is a `/dashboard/main` view, and the default redirect
                  navigation is exactly right for them. */}
              <aside className="section-menu-aside">
                <div className="tw:sticky tw:top-20">
                  <SectionMenu
                    sectionKey="home"
                    activeTab="journey"
                    title="Home"
                  />
                </div>
              </aside>

              <div className="section-content">
                {loading ? (
                  <div className="tw:flex tw:justify-center tw:py-16">
                    <AppSpinner size="lg" />
                  </div>
                ) : (
                  <>
                    <header className="tw:pb-8 tw:pt-2">
                      <AppBadge
                        size="sm"
                        variant="light"
                        className="app-journey-eyebrow"
                      >
                        {data.eyebrow}
                      </AppBadge>

                      {/* Headline and the progress readout share one row on
                      desktop — the promise on the left, the proof on the
                      right — and stack on mobile. */}
                      <div className="tw:mt-5 tw:flex tw:flex-col tw:gap-6 tw:lg:flex-row tw:lg:items-end tw:lg:justify-between">
                        <div className="tw:min-w-0 tw:max-w-xl">
                          <h1 className="app-journey-display tw:text-3xl tw:font-bold tw:leading-tight tw:md:text-5xl">
                            {data.headlineLead}
                            <span className="app-journey-accent tw:mt-1 tw:block tw:italic">
                              {data.headlineAccent}
                            </span>
                          </h1>

                          <p className="app-journey-muted tw:mt-5 tw:text-sm tw:leading-relaxed">
                            {data.description.map((segment, index) =>
                              segment.strong ? (
                                <strong
                                  key={index}
                                  className="app-journey-accent tw:font-bold"
                                >
                                  {segment.text}
                                </strong>
                              ) : (
                                <span key={index}>{segment.text}</span>
                              ),
                            )}
                          </p>
                        </div>

                        <div className="app-journey-stats tw:flex tw:shrink-0 tw:items-center">
                          <div className="tw:pr-8 tw:text-center">
                            <div className="app-journey-display tw:text-4xl tw:font-bold tw:md:text-5xl">
                              {data.stagesComplete}
                              <span className="app-journey-dim tw:text-2xl tw:md:text-3xl">
                                /{data.totalStages}
                              </span>
                            </div>
                            <div className="app-journey-stat-label">
                              Stages complete
                            </div>
                          </div>

                          <div className="tw:pl-8 tw:text-center">
                            <div className="app-journey-display app-journey-accent tw:text-4xl tw:font-bold tw:md:text-5xl">
                              {data.coinsEarned.toLocaleString("en-IN")}
                            </div>
                            <div className="app-journey-stat-label tw:flex tw:items-center tw:justify-center tw:gap-1">
                              <Crown size={11} />
                              Coins earned
                            </div>
                          </div>
                        </div>
                      </div>
                    </header>

                    <ol className="app-journey-rail">
                      {data.stages.map((stage) => (
                        <StageRow key={stage.key} stage={stage} />
                      ))}

                      {/* The destination is the rail's last stop, not a stage —
                      crown pin, no coins, nothing to tick off. */}
                      <li className="app-journey-row is-destination is-last">
                        <div className="app-journey-pin-col">
                          <span className="app-journey-pin">👑</span>
                        </div>

                        <article className="app-journey-card app-journey-destination tw:rounded-2xl tw:p-5 tw:md:p-8">
                          <span className="app-journey-status tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-widest">
                            {data.destination.eyebrow}
                          </span>
                          <h2 className="app-journey-display tw:mt-2 tw:max-w-lg tw:text-2xl tw:font-bold tw:leading-tight tw:md:text-4xl">
                            {data.destination.headline}
                          </h2>
                          <p className="app-journey-muted tw:mt-4 tw:max-w-xl tw:text-sm tw:leading-relaxed">
                            {data.destination.description}
                          </p>
                        </article>
                      </li>
                    </ol>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardJourney;
