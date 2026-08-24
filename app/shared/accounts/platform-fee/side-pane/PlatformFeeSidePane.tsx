import clsx from "clsx";
import { useEffect, useState } from "react";
import { ArrowRight, Bot } from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import AuthService from "~/services/AuthService";
import FranchiseService, {
  type PlanShapeSummaries,
} from "~/services/FranchiseService";
import PlatformFeePaneChips from "./PlatformFeePaneChips";
import { planReasons, planShapes, type PlanShape } from "./helper";

interface PlatformFeeSidePaneProps {
  className?: string;
}

const PlatformFeeSidePane = ({ className }: PlatformFeeSidePaneProps) => {
  const appNav = useAppNav();
  const userName = AuthService.getLoggedInUser()?.name || "Sridhar";
  const [shapeSummaries, setShapeSummaries] =
    useState<PlanShapeSummaries | null>(null);

  useEffect(() => {
    let active = true;

    FranchiseService.getPlanShapeSummaries().then((data) => {
      if (active) setShapeSummaries(data);
    });

    return () => {
      active = false;
    };
  }, []);

  const navigateToCompare = () => {
    appNav.to("/dashboard/accounts/platform-fee/compare");
  };

  const navigateToTiers = () => {
    appNav.to("/dashboard/accounts/platform-fee/tiers");
  };

  const handleOpenChat = () => {
    appNav.to("/dashboard");
  };

  return (
    <div className={clsx("tw:flex tw:flex-col tw:gap-4.5", className)}>
      {/* Header */}
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-0.5">
        <h2 className="tw:font-serif tw:text-2xl tw:font-bold tw:tracking-tight tw:text-[#183B47]">
          Discover
        </h2>
        <span className="tw:text-xs tw:font-normal tw:text-[#527987]">
          Two plans · one bill · one Swa
        </span>
      </div>

      {/* Quick-nav across the three platform-fee screens. */}
      <PlatformFeePaneChips />

      {/* Mascot Card */}
      <div className="tw:rounded-2xl tw:border tw:border-slate-200/80 tw:bg-white tw:p-3.5 tw:shadow-xs">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex tw:h-12 tw:w-12 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#EEF4FB] tw:overflow-hidden">
            <ImgRender
              src="ai/swa-buddy.png"
              alt="Swa"
              className="tw:h-11 tw:w-11 tw:object-contain"
              fallback={
                <div className="tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:bg-sky-100 tw:text-[#2A3B56]">
                  <Bot size={22} />
                </div>
              }
            />
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <p className="tw:text-[10px] tw:font-bold tw:uppercase tw:tracking-widest tw:text-[#506E86]">
              YOUR PLANS BUDDY
            </p>
            <p className="tw:font-serif tw:italic tw:text-sm tw:text-[#2D4756] tw:mt-0.5">
              &ldquo;Point me at the sliders, {userName}.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Open chat with Swa button */}
      <AppButton
        onClick={handleOpenChat}
        className="tw:w-full tw:bg-[#2A3B56] hover:tw:bg-[#1E2D42]"
      >
        Open chat with Swa
        <ArrowRight className="tw:w-4 tw:h-4" />
      </AppButton>

      {/* The Two Shapes */}
      <div className="tw:space-y-2.5">
        <div className="tw:px-0.5">
          <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#527987]">
            THE TWO SHAPES
          </span>
        </div>

        <div className="tw:space-y-2.5">
          {planShapes.map((shape: PlanShape) => (
            <div
              key={shape.key}
              className={clsx(
                "tw:rounded-2xl tw:p-3.5 tw:shadow-xs tw:transition-all",
                shape.tone.card,
              )}
            >
              <div className="tw:flex tw:items-center tw:justify-between tw:mb-1">
                {shape.badgeVariant ? (
                  <AppBadge
                    variant={shape.badgeVariant}
                    size="sm"
                    className="tw:font-bold tw:uppercase tw:tracking-wider"
                  >
                    {shape.eyebrow}
                  </AppBadge>
                ) : (
                  <span
                    className={clsx(
                      "tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider",
                      shape.tone.eyebrow,
                    )}
                  >
                    {shape.eyebrow}
                  </span>
                )}
                <span
                  className={clsx(
                    "tw:text-xs tw:font-medium",
                    shape.tone.tiers,
                  )}
                >
                  {shapeSummaries?.[shape.key].countDisplay || "—"}
                </span>
              </div>
              <h4
                className={clsx(
                  "tw:text-[15px] tw:font-serif tw:font-bold tw:leading-snug tw:mb-1",
                  shape.tone.title,
                )}
              >
                {shape.title}
              </h4>
              <p
                className={clsx(
                  "tw:text-xs tw:leading-relaxed",
                  shape.tone.detail,
                )}
              >
                {shape.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Why This Shape Works */}
      <div className="tw:space-y-2.5">
        <div className="tw:px-0.5">
          <span className="tw:text-[11px] tw:font-bold tw:uppercase tw:tracking-wider tw:text-[#527987]">
            WHY THIS SHAPE WORKS
          </span>
        </div>

        <div className="tw:space-y-2">
          {planReasons.map((reason) => (
            <div
              key={reason.key}
              className="tw:rounded-2xl tw:border tw:border-slate-200/80 tw:bg-white tw:p-3.5 tw:shadow-xs"
            >
              <h4 className="tw:text-xs tw:font-bold tw:text-slate-800 tw:leading-snug">
                {reason.title}
              </h4>
              <p className="tw:text-xs tw:text-slate-500 tw:leading-normal tw:mt-0.5">
                {reason.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Actions - Sticky to bottom */}
      <div className="tw:sticky tw:bottom-0 tw:z-20 tw:bg-white/95 tw:backdrop-blur-xs tw:pt-2.5 tw:pb-1 tw:border-t tw:border-slate-100 tw:grid tw:grid-cols-2 tw:gap-2.5">
        <AppButton
          fill="outline"
          color="light"
          onClick={navigateToCompare}
          className="tw:w-full"
        >
          Compare all
        </AppButton>
        <AppButton
          onClick={navigateToTiers}
          className="tw:w-full tw:bg-[#2A3B56] hover:tw:bg-[#1E2D42]"
        >
          See tiers
        </AppButton>
      </div>
    </div>
  );
};

export default PlatformFeeSidePane;
