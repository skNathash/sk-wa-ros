import AppSteps from "~/components/core/steps/AppSteps";
import type { StepData } from "~/components/core/steps/AppSteps";

interface Props {
  activeKey?: string | number;
  className?: string;
  isCompleted?: boolean;
  mode?: "detailed" | "dealId";
}

const detailedSteps: StepData[] = [
  { key: "upload", title: "Upload", description: "Upload your item file" },
  {
    key: "preview",
    title: "Preview",
    description: "Review before sending for approval",
  },
  {
    key: "send",
    title: "Send for approval",
    description: "Submit items for approval",
  },
];

const dealIdSteps: StepData[] = [
  { key: "upload", title: "Upload", description: "Upload deal ID file" },
  {
    key: "preview",
    title: "Preview",
    description: "Review deal IDs before subscribing",
  },
  {
    key: "send",
    title: "Subscribe",
    description: "Add valid deals to cart",
  },
];

const Steps = ({
  activeKey = "upload",
  className,
  isCompleted,
  mode = "detailed",
}: Props) => {
  const steps = mode === "dealId" ? dealIdSteps : detailedSteps;
  // Wrap AppSteps in a flex container so the stepper is centered horizontally
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
