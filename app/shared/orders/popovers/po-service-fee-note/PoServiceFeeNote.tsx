import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppPopover from "~/components/core/popover/AppPopover";

interface PoServiceFeeNoteProps {
  isFromPlan?: boolean;
}

const PoServiceFeeNote = ({ isFromPlan }: PoServiceFeeNoteProps) => {
  const { t } = useTranslation(["common"]);

  return (
    <AppPopover triggerContent={<Info size={14} />}>
      <div className="tw:text-xs tw:text-gray-500">
        {isFromPlan ? "Fee will be debited from your current plan." : null}

        <div>{t("feeSupportDescription")}</div>
      </div>
    </AppPopover>
  );
};

export default PoServiceFeeNote;
