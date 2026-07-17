import React, { useState } from "react";
import {
  Eye,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";
import AppBadge from "~/components/core/badge/AppBadge";
import UserPic from "~/shared/users/components/UserPic";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import FeaturePermissionsPopover from "./FeaturePermissionsPopover";
import { Checkbox } from "~/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import Rbac from "~/components/core/rbac/Rbac";

interface MobileViewProps {
  loading?: boolean;
  data: any[];
  callback: (a: { action: string; data: any }) => void;
}

const rbacRoles = {
  toggleAllPermissions: ["USER-MANAGEMENT.UPDATE-PERMISSIONS"],
};

const MobileView: React.FC<MobileViewProps> = ({ loading, data, callback }) => {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const onEnableAllChange = (
    checked: boolean,
    rowIndex: number,
    featureId: string | number,
    featureIndex: number,
    rowId: string
  ) => {
    callback({
      action: "toggleAllPermissions",
      data: {
        index: rowIndex,
        featureId,
        featureIndex,
        checked,
        _id: rowId,
      },
    });
  };

  if (loading) {
    return (
      <div className="tw:p-4 tw:space-y-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="tw:animate-pulse tw:bg-gray-100 tw:rounded-lg tw:h-24 tw:w-full"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="tw:text-center tw:py-8 tw:text-gray-500">
        No data found
      </div>
    );
  }

  return (
    <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-3 tw:md:mx-4">
      {data.map((row, idx) => (
        <div
          key={row._id || idx}
          className="tw:bg-white tw:rounded-lg tw:shadow-sm tw:p-4 tw:space-y-4"
        >
          {/* Avatar and Name/Email */}
          <div className="tw:flex tw:items-center tw:gap-4">
            <div>
              <UserPic
                assetId={row.profileImages?.[0]}
                gender={row.gender}
                type={row._userPicType}
                className="tw:w-14 tw:h-14 tw:rounded-full tw:border tw:border-gray-200"
              />
            </div>
            <div className="tw:flex-1">
              <div className="tw:font-semibold tw:text-base tw:mb-0.5">
                {row.name}
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
                {row.email || "--"}
              </div>
              <div className="tw:flex tw:gap-2 tw:mb-2">
                <AppBadge variant={row.isActive ? "success" : "danger"}>
                  {row.isActive ? t("active") : t("inactive")}
                </AppBadge>
                <AppBadge variant="light">{row.role || "--"}</AppBadge>
              </div>
            </div>
          </div>

          {/* Department and Permissions */}
          <div className="tw:flex tw:justify-between tw:mb-2 tw:gap-4">
            <div>
              <div className="tw:text-xs tw:text-gray-400">
                {t("department")}
              </div>
              <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                {row.department || "Operations"}
              </div>
            </div>
            <div>
              <div className="tw:text-xs tw:text-gray-400">
                {t("permissions")}
              </div>
              <div className="tw:text-sm tw:font-medium tw:text-gray-700">
                {row._features?.filter((f: any) => f.selected).length || 0}{" "}
                {t("granted")}
              </div>
            </div>
          </div>

          {/* Position Display (as text, similar to Department) */}
          <div className="tw:mb-2">
            <div className="tw:text-xs tw:text-gray-400">{t("position")}</div>
            <div className="tw:text-sm tw:font-medium tw:text-gray-700">
              <AppBadge variant={row._positionBadgeColor}>
                {row._position}
              </AppBadge>
            </div>
          </div>

          {/* Manage Permissions - Collapsible */}
          <div className="tw:mb-2">
            <button
              className="tw:text-blue-600 tw:text-sm tw:font-medium tw:flex tw:items-center tw:gap-1 hover:tw:underline tw:mb-2"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              aria-expanded={expandedIdx === idx}
            >
              {t("managePermissions")}
              <span className="tw:ml-1 tw:inline-block">
                {expandedIdx === idx ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </span>
            </button>
            {expandedIdx === idx && (
              <div className="tw:grid tw:grid-cols-1 tw:gap-4">
                {row._features.map((feature: any, fIdx: number) => {
                  const permissions = feature.permissions || [];
                  const totalPermissions = permissions.length || 0;

                  return (
                    <div
                      key={feature.key}
                      className="tw:border tw:border-gray-200 tw:rounded-md tw:p-2"
                    >
                      <div className="tw:text-xs tw:text-gray-500 tw:uppercase tw:font-bold tw:mb-1">
                        {feature.label}
                      </div>
                      <div className="tw:flex tw:items-center tw:gap-5">
                        <div className="tw:flex tw:items-center tw:gap-1">
                          <Rbac roles={rbacRoles.toggleAllPermissions}>
                            <Checkbox
                              checked={!!feature.selected}
                              onCheckedChange={(checked: boolean) =>
                                onEnableAllChange(
                                  checked,
                                  idx,
                                  feature.id,
                                  fIdx,
                                  row._id
                                )
                              }
                              className="tw:border-2 tw:border-gray-300"
                            />
                            <span className="tw:text-sm tw:text-gray-500">
                              {t("enableAll")} ({totalPermissions})
                            </span>
                          </Rbac>
                        </div>

                        <div className="tw:flex tw:items-center tw:gap-2">
                          <AppPopover
                            modal={true}
                            triggerContent={
                              <span className="tw:text-sm tw:text-gray-600 tw:underline tw:cursor-pointer">
                                {
                                  permissions.filter((p: any) => p.selected)
                                    .length
                                }
                                /{totalPermissions} {t("permission")}
                                {totalPermissions !== 1 ? t("s") : ""}
                              </span>
                            }
                            side="top"
                            align="start"
                          >
                            <FeaturePermissionsPopover
                              permissions={permissions}
                              rowIndex={idx}
                              feature={feature}
                              featureIndex={fIdx}
                              rowId={row._id}
                              callback={callback}
                            />
                          </AppPopover>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Details Button */}
          <div className="tw:pt-2">
            <AppLink
              asLink
              href={`/dashboard/employee/view/${row._id}`}
              className="tw:w-full tw:flex tw:items-center tw:justify-center tw:gap-2 tw:py-2 tw:rounded tw:bg-gray-100 tw:text-gray-700 tw:font-medium hover:tw:bg-gray-200"
            >
              <span className="tw:inline-block">
                <Eye size={16} />
              </span>
              {t("viewDetails")}
            </AppLink>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
