import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { CheckCircle2, UserPlus } from "lucide-react";

type Props = {
  show: boolean;
  callback: (a: { action: "close" | "add_other" }) => void;
  hideAddAnother?: boolean;
};

const CustomerCreatedSuccessModal: React.FC<Props> = ({ show, callback, hideAddAnother }) => {
  const onClose = () => callback({ action: "close" });

  return (
    <AppModal show={show} callback={onClose} className="tw:max-w-md">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <span className="tw:inline-flex tw:h-7 tw:w-7 tw:items-center tw:justify-center tw:rounded-full tw:bg-emerald-50 tw:text-emerald-600 tw:ring-1 tw:ring-emerald-100">
            <CheckCircle2 size={16} />
          </span>
          <div className="tw:text-base tw:font-semibold tw:text-slate-900">
            Customer created successfully
          </div>
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:text-sm tw:text-slate-600 tw:leading-relaxed">
          {hideAddAnother
            ? "Customer has been created. You will be redirected back."
            : "You can add another customer now or return to the customer list."}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton fill="outline" onClick={onClose} aria-label="Close dialog">
            Close
          </AppButton>
          {!hideAddAnother && (
            <AppButton onClick={() => callback({ action: "add_other" })}>
              <UserPlus />
              Add another customer
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CustomerCreatedSuccessModal;
