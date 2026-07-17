import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import { Input } from "~/components/ui/input";
import InpLabel from "~/components/core/form/InpLabel";
import { Info } from "lucide-react";

interface Props {
  show: boolean;
  deals: any[];
  callback: (a: { action: string; data?: any }) => void;
  type: "case" | "inner-case";
}

const UnitConfigModal = ({ show, deals, callback, type }: Props) => {
  const { t } = useTranslation(["common"]);
  const [qty, setQty] = useState<string>("");

  const title = type === "case" ? t("caseQty") : t("innerCaseQty");
  const note = type === "case" 
    ? "Configuring case quantity will update the unit of measurement to Case for selected deals."
    : "Configuring inner case quantity will update the unit of measurement to Inner Case for selected deals.";

  const handleSubmit = () => {
    if (!qty || isNaN(Number(qty)) || Number(qty) <= 0) return;
    callback({ action: "submit", data: { qty: Number(qty), deals, type } });
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        {title}
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-1 tw:py-4">
          <InpLabel>{title}</InpLabel>
          <Input
            placeholder={t("enterQty")}
            value={qty}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(e.target.value)}
            type="number"
          />
          <div className="tw:flex tw:gap-2 tw:p-3 tw:bg-blue-50 tw:rounded-lg tw:text-sm tw:text-blue-700 tw:border tw:border-blue-100">
            <Info size={16} className="tw:shrink-0 tw:mt-0.5" />
            <p>{note}</p>
          </div>
        </div>
      </AppModal.Content>
      <AppModal.Footer className="tw:gap-2">
        <AppButton
          fill="outline"
          color="light"
          onClick={() => callback({ action: "close" })}
          className="tw:flex-1"
        >
          {t("cancel")}
        </AppButton>
        <AppButton
          color="primary"
          onClick={handleSubmit}
          disabled={!qty || isNaN(Number(qty)) || Number(qty) <= 0}
          className="tw:flex-1"
        >
          {t("submit")}
        </AppButton>
      </AppModal.Footer>
    </AppModal>
  );
};

export default UnitConfigModal;
