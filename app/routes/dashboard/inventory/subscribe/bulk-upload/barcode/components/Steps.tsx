import AppSteps from "~/components/core/steps/AppSteps";
import type { StepData } from "~/components/core/steps/AppSteps";
import useTheme from "~/hooks/useTheme";

interface Props {
  activeKey?: string | number;
  className?: string;
  isCompleted?: boolean;
}

const steps: StepData[] = [
  { key: "upload", title: "Upload", description: "Upload your barcode file" },
  {
    key: "preview",
    title: "Preview",
    description: "Preview your uploaded file",
  },
  {
    key: "subscribe",
    title: "Subscribe",
    description: "Subscribe items from file",
  },
];

const Steps = ({ activeKey = "upload", className, isCompleted }: Props) => {
  // theme-2's rail is a full-bleed band under the sticky sub-nav, so it skips
  // the centering wrapper the other themes use to shrink-wrap the stepper.
  const isTheme2 = useTheme() === "theme-2";

  if (isTheme2) {
    return (
      <AppSteps
        steps={steps}
        activeKey={activeKey}
        isCompleted={isCompleted}
        className={`app-steps-band ${className || ""}`}
      />
    );
  }

  return (
    <div className={`tw:md:flex tw:md:justify-center ${className || ""}`}>
      <div className="tw:md:w-auto tw:md:inline-block">
        <AppSteps
          steps={steps}
          activeKey={activeKey}
          isCompleted={isCompleted}
        />
      </div>
    </div>
  );
};

export default Steps;
