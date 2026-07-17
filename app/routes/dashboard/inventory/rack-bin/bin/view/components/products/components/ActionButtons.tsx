import { Eye, Move, PencilLine, Plus } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import Rbac from "~/components/core/rbac/Rbac";
import { useTranslation } from "react-i18next";
import AuthService from "~/services/AuthService";

const rbacRoles = {
  adjust: ["INVENTORY.ADJUST-STOCK"],
  move: ["INVENTORY.MOVE-STOCK"],
  createVariation: ["INVENTORY.CREATE-VARIATION"],
};

const ActionButtons = ({
  callback,
  item,
}: {
  callback: (a: { action: string; data?: any }) => void;
  item?: any;
}) => {
  const { t } = useTranslation(["common"]);
  return (
    <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4 tw:mt-4">
      <AppButton
        color="light"
        fill="outline"
        className="tw:w-full"
        size="small"
        onClick={() => callback({ action: "view-deal" })}
      >
        <Eye />
        {t("viewDetails")}
      </AppButton>

      <Rbac roles={rbacRoles.adjust} forceDisplay={AuthService.isMasterLogin()}>
        <AppButton
          color="light"
          fill="outline"
          className="tw:w-full"
          size="small"
          onClick={() => callback({ action: "adjust" })}
        >
          <PencilLine />
          {t("adjustStock")}
        </AppButton>
      </Rbac>

      <Rbac roles={rbacRoles.move} forceDisplay={AuthService.isMasterLogin()}>
        {(!item || item.qty > 0) && (
          <AppButton
            color="light"
            fill="outline"
            className="tw:w-full"
            size="small"
            onClick={() => callback({ action: "move" })}
          >
            <Move />
            {t("moveStock")}
          </AppButton>
        )}
      </Rbac>

      <Rbac
        roles={rbacRoles.createVariation}
        forceDisplay={AuthService.isMasterLogin()}
      >
        <AppButton
          color="light"
          fill="outline"
          className="tw:w-full"
          size="small"
          onClick={() => callback({ action: "create-variation" })}
        >
          <Plus />
          {t("createVariation")}
        </AppButton>
      </Rbac>
    </div>
  );
};

export default ActionButtons;
