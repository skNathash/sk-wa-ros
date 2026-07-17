import { useTranslation } from "react-i18next";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Checkbox } from "~/components/ui/checkbox";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";

type Props = {
  permissions: any[];
  rowIndex: number;
  feature: any;
  rowId: string;
  featureIndex?: number;
  callback: (a: { action: string; data: any }) => void;
};

const FeaturePermissionsPopover = ({
  permissions,
  rowIndex,
  feature,
  featureIndex,
  rowId,
  callback,
}: Props) => {
  const { t } = useTranslation();
  const appToast = useAppToast();

  return (
    <div className="tw:p-3 tw:md:max-w-xs">
      <div className="tw:font-medium tw:mb-2 tw:text-sm">
        {t("permissions")} ({permissions.length})
      </div>
      <AppScrollArea className="tw:h-44">
        <div className="tw:space-y-2">
          {permissions.map((perm: any, pIdx: number) => {
            const permSelected = !!(perm && perm.selected);

            return (
              <div key={pIdx} className="tw:flex tw:items-center tw:gap-2">
                <Checkbox
                  checked={permSelected}
                  onCheckedChange={(checked: boolean) => {
                    if (AuthService.isMasterLogin()) {
                      appToast.show({
                        msg: "You are not authorized to update permissions",
                        color: "error",
                      });
                      return;
                    }
                    callback({
                      action: "updatePermission",
                      data: {
                        index: rowIndex,
                        featureIndex: featureIndex,
                        permissionIndex: pIdx,
                        featureId: perm._id,
                        permissionKey: perm.code,
                        checked,
                        _id: rowId,
                      },
                    });
                  }}
                  className="tw:border tw:border-gray-400"
                />
                <span className="tw:text-sm tw:text-gray-700">{perm.name}</span>
              </div>
            );
          })}
        </div>
      </AppScrollArea>
    </div>
  );
};

export default FeaturePermissionsPopover;
