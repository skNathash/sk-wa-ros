import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";

const Permissions = ({ data }: { data: any }) => {
  const { t } = useTranslation(["common"]);
  return (
    <AppCard
      title={`${t("permissions")} (${data?.length})`}
      subtitle={t("permissionsTabDescription")}
      icon="shield"
    >
      {!data?.length && (
        <div className="tw:text-gray-500 tw:text-sm tw:text-center tw:py-4">
          {t("noPermissionsAssigned")}
        </div>
      )}

      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-3">
        {data?.map((item: any, idx: number) => (
          <div
            key={idx}
            className="tw:flex tw:items-start tw:gap-3 tw:px-3 tw:py-2.5 tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white hover:tw:border-green-300 hover:tw:bg-green-50/40 tw:transition-colors"
          >
            <CheckCircle2 className="tw:w-4 tw:h-4 tw:text-green-600 tw:shrink-0 tw:mt-0.5" />
            <div className="tw:flex tw:flex-col tw:min-w-0">
              <div className="tw:text-sm tw:font-medium tw:text-gray-800 tw:truncate">
                {item.name || item.code}
              </div>
              {item.description && (
                <div className="tw:text-xs tw:text-gray-500 tw:mt-0.5">
                  {item.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppCard>
  );
};

export default Permissions;
