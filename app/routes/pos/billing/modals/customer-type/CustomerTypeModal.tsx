import React from "react";
import { Users, Building2, Zap, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";

interface CustomerTypeModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  showClose?: boolean;
  hideQuickCheckout?: boolean;
}

interface CustomerTypeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  /** Soft tinted classes for the leading icon badge. */
  iconClass: string;
}

const CustomerTypeModal: React.FC<CustomerTypeModalProps> = ({
  show,
  callback,
  showClose = false,
  hideQuickCheckout = false,
}) => {
  const { t } = useTranslation(["posbilling"]);
  const customerTypes: CustomerTypeOption[] = [
    {
      id: "b2c",
      title: t("customerTypeModal.options.b2c.title"),
      description: t("customerTypeModal.options.b2c.description"),
      icon: <Users className="tw:w-5 tw:h-5" />,
      iconClass: "tw:bg-blue-50 tw:text-blue-600",
    },
    {
      id: "b2b",
      title: t("customerTypeModal.options.b2b.title"),
      description: t("customerTypeModal.options.b2b.description"),
      icon: <Building2 className="tw:w-5 tw:h-5" />,
      iconClass: "tw:bg-emerald-50 tw:text-emerald-600",
    },
    {
      id: "b2b-quick",
      title: t("customerTypeModal.options.b2bQuick.title"),
      description: t("customerTypeModal.options.b2bQuick.description"),
      icon: <Zap className="tw:w-5 tw:h-5" />,
      iconClass: "tw:bg-amber-50 tw:text-amber-600",
    },
  ].filter((option) => !(hideQuickCheckout && option.id === "b2b-quick"));

  const handleCustomerTypeSelect = (customerType: CustomerTypeOption) => {
    callback({
      action: "select",
      data: customerType,
    });
  };

  const handleClose = () => {
    callback({
      action: "close",
    });
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-lg"
      backdropDismiss={false}
    >
      {/* showClose controls whether the close icon/button is visible */}
      <AppModal.Title onClose={handleClose} hideCloseBtns={!showClose}>
        <div className="tw:text-center">
          <h2 className="tw:text-xl tw:font-bold tw:text-foreground tw:mb-2">
            {t("customerTypeModal.title")}
          </h2>
          <p className="tw:text-muted-foreground tw:text-sm">
            {t("customerTypeModal.subtitle")}
          </p>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-3 tw:mb-6 tw:p-1">
          {customerTypes.map((customerType) => (
            <button
              key={customerType.id}
              onClick={() => handleCustomerTypeSelect(customerType)}
              className="tw:group tw:w-full tw:cursor-pointer tw:flex tw:items-center tw:gap-4 tw:p-4 tw:rounded-xl tw:border tw:border-border tw:bg-card tw:text-left tw:transition-all tw:duration-200 tw:hover:border-primary/40 tw:hover:shadow-sm tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary/30"
            >
              <span
                className={`tw:flex tw:h-11 tw:w-11 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full ${customerType.iconClass}`}
              >
                {customerType.icon}
              </span>
              <div className="tw:flex-1 tw:min-w-0">
                <h3 className="tw:font-semibold tw:text-sm tw:text-foreground">
                  {customerType.title}
                </h3>
                <p className="tw:text-xs tw:text-muted-foreground tw:mt-0.5">
                  {customerType.description}
                </p>
              </div>
              <ChevronRight className="tw:w-5 tw:h-5 tw:shrink-0 tw:text-muted-foreground tw:transition-transform tw:group-hover:translate-x-0.5 tw:group-hover:text-primary" />
            </button>
          ))}
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default CustomerTypeModal;
