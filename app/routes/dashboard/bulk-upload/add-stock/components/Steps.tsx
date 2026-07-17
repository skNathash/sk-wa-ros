import AppSteps from "~/components/core/steps/AppSteps";
import type { StepData } from "~/components/core/steps/AppSteps";

interface Props {
  activeKey?: string | number;
  className?: string;
  isCompleted?: boolean;
}

const steps: StepData[] = [
  { key: "upload", title: "Upload", description: "Upload your stock file" },
  {
    key: "preview",
    title: "Preview",
    description: "Preview your uploaded file",
  },
  {
    key: "stock-updated",
    title: "Stock Updated",
    description: "Stock update status",
  },
];

const Steps = ({ activeKey = "upload", className, isCompleted }: Props) => {
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
