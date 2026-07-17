import AppSteps from "~/components/core/steps/AppSteps";
import type { StepData } from "~/components/core/steps/AppSteps";

interface Props {
  activeKey?: string | number;
  className?: string;
  isCompleted?: boolean;
  hideLimit?: boolean;
}

const allSteps: StepData[] = [
  { key: "customer", title: "Customer", description: "Select customer" },
  { key: "kyc", title: "KYC", description: "KYC verification" },
  { key: "documents", title: "Documents", description: "Upload documents" },
  { key: "nominee", title: "Nominee", description: "Nominee details" },
  { key: "limit", title: "Limit", description: "Set credit limit" },
];

const Steps = ({
  activeKey = "customer",
  className,
  isCompleted,
  hideLimit,
}: Props) => {
  const steps = hideLimit ? allSteps.filter((s) => s.key !== "limit") : allSteps;
  return (
    <div className={`tw:md:flex tw:md:justify-center ${className || ""}`}>
      <div className="tw:md:w-auto tw:md:inline-block">
        <AppSteps
          steps={steps}
          activeKey={activeKey}
          isCompleted={isCompleted}
          borderMinWidth={30}
        />
      </div>
    </div>
  );
};

export default Steps;
