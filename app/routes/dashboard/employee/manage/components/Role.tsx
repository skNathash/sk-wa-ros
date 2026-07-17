import clsx from "clsx";
import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import AppPopover from "~/components/core/popover/AppPopover";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import RbacService from "~/services/RbacService";

type FeatureItem = {
  code: string;
  _id: string | number;
};

type RoleItem = {
  _id: string | number;
  roleName: string;
  checked?: boolean;
  features?: FeatureItem[];
};

type Props = {
  callback: (
    id: string | number,
    name: string,
    features: FeatureItem[],
  ) => void;
  selectedRole?: string | number;
  position?: string | null;
  autoSelectFirst?: boolean;
};

const Role = ({ callback, selectedRole, position, autoSelectFirst }: Props) => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await RbacService.getRoles({
          roleName: position || "",
        });
        const list: RoleItem[] = response.data?.data || [];
        setRoles(list);
        if (autoSelectFirst && list.length > 0) {
          const first = list[0];
          callback(first._id, first.roleName, first.features || []);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [position]);

  return (
    <AppCard
      title={
        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
          Staff Roles <span className="tw:text-xs tw:text-red-500">*</span>{" "}
        </div>
      }
      className="tw:mb-6"
      subtitle="Manage staff roles and permissions"
      icon="shield"
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-4">
        {roles.map((role, index) => (
          <div
            key={role._id}
            className={clsx(
              "tw:border tw:rounded tw:p-4 tw:mb-4 tw:cursor-pointer",
              selectedRole === role._id
                ? "tw:border-blue-500 tw:bg-blue-50"
                : "tw:border-gray-200 tw:bg-white",
            )}
            onClick={(e) => {
              // Prevent role selection if clicking on popover trigger
              if ((e.target as HTMLElement).closest("[data-popover-trigger]")) {
                return;
              }
              callback(role._id, role.roleName, role.features || []);
            }}
          >
            <div className="tw:font-semibold tw:text-lg tw:mb-1">
              {role.roleName}
            </div>
            <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
              {role.features?.length || 0} permissions
            </div>
            <ul className="tw:list-disc tw:pl-4 tw:mb-2 ">
              {(role.features || [])
                .sort((a, b) => a.code.localeCompare(b.code))
                .slice(0, 3)
                .map((perm: FeatureItem, i: number) => (
                  <li key={i} className="tw:text-xs tw:text-gray-700 tw:mb-1">
                    {perm.code}
                  </li>
                ))}
              {role.features && role.features.length > 3 && (
                <li className="tw:text-sm tw:text-gray-600">
                  <AppPopover
                    triggerContent={
                      <span
                        data-popover-trigger
                        className="tw:text-blue-600 tw:hover:text-blue-800 tw:transition-colors tw:cursor-pointer tw:text-xs"
                      >
                        +{role.features.length - 3} more...
                      </span>
                    }
                    side="top"
                    align="start"
                  >
                    <div className="tw:p-3 tw:max-w-xs">
                      <div className="tw:font-medium tw:mb-2 tw:text-sm">
                        More permissions
                      </div>
                      <AppScrollArea className="tw:h-53">
                        <div className="tw:space-y-1">
                          {role.features
                            .sort((a, b) => a.code.localeCompare(b.code))
                            .slice(3)
                            .map((perm: FeatureItem, i: number) => (
                              <div
                                key={i}
                                className="tw:text-xs tw:text-gray-700 tw:flex tw:items-center tw:gap-2"
                              >
                                <span className="tw:text-gray-500 tw:font-mono tw:min-w-[20px]">
                                  {i + 1}.
                                </span>
                                <span>{perm.code}</span>
                              </div>
                            ))}
                        </div>
                      </AppScrollArea>
                    </div>
                  </AppPopover>
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default Role;
