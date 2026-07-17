import SearchRetailer from "./SearchRetailer";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";

interface SelectRetailerProps {
  callback?: (args: { action: string; data?: any }) => void;
}

const SelectRetailer = ({ callback }: SelectRetailerProps) => {
  const { t } = useTranslation(["posbilling"]);
  const { getValues } = useFormContext();
  const { show: showToast } = useAppToast();

  const handleContinue = () => {
    const retailer = getValues("retailer");
    if (!retailer?._id) {
      showToast({
        msg: t("checkoutModal.retailer.validation.selectRetailer"),
        color: "error",
      });
      return;
    }
    if (callback) callback({ action: "next" });
  };

  return (
    <div>
      <div className="tw:text-sm tw:font-semibold tw:mb-4">
        {t("checkoutModal.retailer.title")}
      </div>
      <SearchRetailer />
      <div className="tw:mt-4">
        <AppButton
          className="tw:w-full"
          color="success"
          onClick={handleContinue}
        >
          {t("checkoutModal.retailer.actions.continue")}
        </AppButton>
      </div>
    </div>
  );
};

export default SelectRetailer;
