import { CheckCircle, Send, ShieldCheck, LayoutDashboard } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  onClose: () => void;
};

const steps = [
  {
    icon: Send,
    label: "Banner Submitted",
    description: "Your banner has been created and sent for review",
    iconBg: "tw:bg-green-100",
    iconColor: "tw:text-green-600",
    done: true,
  },
  {
    icon: ShieldCheck,
    label: "StoreKing Review",
    description: "StoreKing team will review and approve your banner",
    iconBg: "tw:bg-amber-50",
    iconColor: "tw:text-amber-500",
    done: false,
  },
  {
    icon: LayoutDashboard,
    label: "Live on App",
    description: "Once approved, your banner will be displayed to users",
    iconBg: "tw:bg-blue-50",
    iconColor: "tw:text-blue-500",
    done: false,
  },
];

const SuccessModal = ({ show, onClose }: Props) => {
  return (
    <AppModal show={show} backdropDismiss={false} isAutoHeight>
      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:items-center tw:text-center tw:pt-5 tw:px-4 tw:pb-2">
          <div className="tw:w-14 tw:h-14 tw:rounded-full tw:bg-green-100 tw:flex tw:items-center tw:justify-center tw:mb-3">
            <CheckCircle size={32} className="tw:text-green-600" />
          </div>
          <h3 className="tw:text-lg tw:font-semibold tw:text-slate-800">
            Banner Created Successfully!
          </h3>
        </div>

        {/* Approval Flow Steps */}
        <div className="tw:mx-4 tw:my-4 tw:rounded-lg tw:bg-slate-50 tw:border tw:border-slate-200 tw:p-4">
          <p className="tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mb-3">
            What happens next?
          </p>
          <div className="tw:space-y-0">
            {steps.map((step, idx) => (
              <div key={idx} className="tw:flex tw:items-start tw:gap-3">
                {/* Icon + Connector */}
                <div className="tw:flex tw:flex-col tw:items-center">
                  <div
                    className={`tw:w-8 tw:h-8 tw:rounded-full ${step.iconBg} tw:flex tw:items-center tw:justify-center tw:shrink-0`}
                  >
                    <step.icon size={16} className={step.iconColor} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="tw:w-px tw:h-6 tw:bg-slate-200" />
                  )}
                </div>

                {/* Text */}
                <div className="tw:pt-1">
                  <p
                    className={`tw:text-sm tw:font-medium ${step.done ? "tw:text-green-700" : "tw:text-slate-700"}`}
                  >
                    {step.label}
                    {step.done && (
                      <span className="tw:ml-1.5 tw:text-[10px] tw:font-medium tw:bg-green-100 tw:text-green-700 tw:px-1.5 tw:py-0.5 tw:rounded-full">
                        Done
                      </span>
                    )}
                  </p>
                  <p className="tw:text-xs tw:text-slate-500 tw:mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer className="tw:justify-center">
        <AppButton color="primary" onClick={onClose}>
          OK
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SuccessModal;
