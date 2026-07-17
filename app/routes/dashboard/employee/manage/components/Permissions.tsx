import React from "react";
import { Key } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import { Checkbox } from "~/components/ui/checkbox";
import { useTranslation } from "react-i18next";

interface PermissionItem {
  _id: string | number;
  name: string;
  description?: string;
  checked?: boolean;
  permissions?: any[];
}

interface PermissionChangeData {
  type: "permission" | "feature";
  featureIndex: number;
  permissionIndex?: number;
  checked: boolean;
  action: "check" | "uncheck";
}

interface PermissionsProps {
  data: PermissionItem[];
  callback: (changeData: PermissionChangeData) => void;
}

const PermissionPopoverContent: React.FC<{
  permissions: any[];
  featureIndex: number;
  callback: (changeData: PermissionChangeData) => void;
}> = ({ permissions, featureIndex, callback }) => {
  const { t } = useTranslation(["common"]);
  return (
    <div className="tw:p-3 tw:max-w-xs">
      <div className="tw:font-medium tw:mb-2 tw:text-sm">
        {t("permissions")}
      </div>
      <AppScrollArea className="tw:h-44">
        <div className="tw:space-y-2">
          {permissions?.map((perm: any, pIdx: number) => (
            <div key={pIdx} className="tw:flex tw:items-center tw:gap-2">
              <Checkbox
                checked={!!perm.selected}
                onCheckedChange={(checked: boolean) =>
                  callback({
                    type: "permission",
                    featureIndex,
                    permissionIndex: pIdx,
                    checked,
                    action: checked ? "check" : "uncheck",
                  })
                }
                className="tw:border tw:border-gray-400"
              />
              <span className="tw:text-xs tw:text-gray-700">{perm.name}</span>
            </div>
          ))}
        </div>
      </AppScrollArea>
    </div>
  );
};

const Permissions: React.FC<PermissionsProps> = ({ data, callback }) => {
  const { t } = useTranslation(["common"]);
  return (
    <AppCard
      title={t("systemPermissions")}
      className="tw:mb-6"
      subtitle={t("grantAccessToSpecificModulesAndFeatures")}
      icon="key"
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
        {data.map((item, featureIndex) => {
          const permissions = item.permissions || [];
          const totalPermissions = permissions.length || 0;
          const selectedPermissions =
            permissions.filter((p: any) => p.selected).length || 0;

          return (
            <div
              key={item._id}
              className="tw:flex tw:items-start tw:gap-3 tw:py-2"
            >
              <input
                type="checkbox"
                className="tw:mt-1 tw:accent-blue-600"
                checked={!!item.checked}
                onChange={(e) =>
                  callback({
                    type: "feature",
                    featureIndex,
                    checked: e.target.checked,
                    action: e.target.checked ? "check" : "uncheck",
                  })
                }
              />
              <div>
                <span className="tw:text-gray-800 tw:font-medium tw:text-sm">
                  {item._id}
                </span>
                <div className="tw:flex tw:items-center tw:gap-2 tw:mt-1">
                  <AppPopover
                    modal={true}
                    triggerContent={
                      <span className="tw:text-xs tw:text-gray-600 tw:underline tw:cursor-pointer">
                        {t("permissionsCount", {
                          selected: selectedPermissions,
                          total: totalPermissions,
                        })}
                      </span>
                    }
                    side="top"
                    align="start"
                  >
                    <PermissionPopoverContent
                      permissions={permissions}
                      featureIndex={featureIndex}
                      callback={callback}
                    />
                  </AppPopover>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppCard>
  );
};

export default Permissions;
