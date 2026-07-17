import { DownloadIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  callback: (action: "add" | "import") => void;
  isDefaultEnabled?: boolean;
};

const Actions = ({ callback, isDefaultEnabled = false }: Props) => {
  const { t } = useTranslation(["common"]);

  if (1) {
    return null;
  }

  return (
    <div className="tw:flex tw:gap-2">
      {!isDefaultEnabled && (
        <AppButton
          noShadow={true}
          size="small"
          onClick={() => callback("import")}
          color="light"
          fill="outline"
        >
          <DownloadIcon size={16} />
          {t("importSlot")}
        </AppButton>
      )}
    </div>
  );
};

export default Actions;
