import {
  ClipboardCheck,
  FileSearch,
  PackageCheck,
  ScanText,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Actor = "you" | "ai";

type Step = { icon: LucideIcon; labelKey: string; actor: Actor };

/**
 * Five-beat invoice-to-sale journey. Two node styles carry the whole story:
 * a filled violet→fuchsia node means SK AI does it automatically, an outlined
 * node means it's the user's action. Read as: you scan → AI builds everything
 * → you sell.
 */
const STEPS: Step[] = [
  { icon: ScanText, labelKey: "flowScanInvoice", actor: "you" },
  { icon: FileSearch, labelKey: "flowMatchCatalogue", actor: "ai" },
  { icon: ClipboardCheck, labelKey: "flowVendorPo", actor: "ai" },
  { icon: PackageCheck, labelKey: "flowGrnInward", actor: "ai" },
  { icon: ShoppingBag, labelKey: "flowReadyToSell", actor: "you" },
];

const nodeClass = (actor: Actor) =>
  [
    "tw:flex tw:h-9 tw:w-9 tw:items-center tw:justify-center tw:rounded-full tw:shrink-0 tw:shadow-sm",
    actor === "ai"
      ? "tw:bg-linear-to-br tw:from-fuchsia-500 tw:to-violet-600 tw:text-white"
      : "tw:bg-white tw:border tw:border-violet-300 tw:text-violet-700",
  ].join(" ");

const tagClass = (actor: Actor) =>
  [
    "tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wide",
    actor === "ai" ? "tw:text-fuchsia-600" : "tw:text-gray-400",
  ].join(" ");

type Props = {
  className?: string;
  showHeader?: boolean;
};

const AiFlowSteps = ({ className, showHeader = true }: Props) => {
  const { t } = useTranslation();

  const container =
    className ??
    "tw:rounded-lg tw:border tw:border-violet-200 tw:bg-linear-to-r tw:from-fuchsia-50 tw:to-violet-50 tw:p-3";

  return (
    <div className={container}>
      {showHeader && (
        <div className="tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2">
          <div className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-xs tw:font-semibold tw:text-violet-800">
            <Sparkles size={14} className="tw:text-fuchsia-500" aria-hidden />
            {t("howSkAiWorks")}
          </div>
          <div className="tw:text-[10px] tw:font-medium tw:text-violet-600">
            {t("inSeconds")}
          </div>
        </div>
      )}

      {/* Desktop: horizontal connected stepper */}
      <div className="tw:hidden tw:md:flex">
        {STEPS.map((step, i) => (
          <div
            key={step.labelKey}
            className="tw:relative tw:flex tw:flex-1 tw:flex-col tw:items-center tw:text-center"
          >
            {i < STEPS.length - 1 && (
              <div className="tw:absolute tw:top-[17px] tw:left-1/2 tw:h-0.5 tw:w-full tw:bg-violet-200" />
            )}
            <div className={`tw:relative tw:z-10 ${nodeClass(step.actor)}`}>
              <step.icon size={16} aria-hidden />
            </div>
            <div className="tw:mt-2 tw:text-xs tw:font-medium tw:text-gray-800">
              {t(step.labelKey)}
            </div>
            <div className={tagClass(step.actor)}>
              {t(step.actor === "ai" ? "flowActorAuto" : "flowActorYou")}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: vertical timeline */}
      <div className="tw:flex tw:flex-col tw:md:hidden">
        {STEPS.map((step, i) => (
          <div
            key={step.labelKey}
            className="tw:relative tw:flex tw:gap-3 tw:pb-3 tw:last:pb-0"
          >
            {i < STEPS.length - 1 && (
              <div className="tw:absolute tw:left-[17px] tw:top-9 tw:bottom-0 tw:w-0.5 tw:bg-violet-200" />
            )}
            <div className={`tw:relative tw:z-10 ${nodeClass(step.actor)}`}>
              <step.icon size={16} aria-hidden />
            </div>
            <div className="tw:flex tw:items-center tw:gap-2 tw:pt-1.5">
              <span className="tw:text-sm tw:font-medium tw:text-gray-800">
                {t(step.labelKey)}
              </span>
              <span className={tagClass(step.actor)}>
                {t(step.actor === "ai" ? "flowActorAuto" : "flowActorYou")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiFlowSteps;
