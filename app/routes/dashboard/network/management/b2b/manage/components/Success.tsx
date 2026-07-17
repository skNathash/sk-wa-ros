import { CheckCircle, Store, User, Phone, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";

type RetailerData = {
  name?: string;
  mobile?: string;
  storeName?: string;
  ownerName?: string;
  displayType?: { name: string; type: string } | null;
};

const Success = ({
  retailerData,
  onDone,
  displayTypeLabel,
}: {
  retailerData: RetailerData;
  onDone: () => void;
  displayTypeLabel?: string | null;
}) => {
  const { t } = useTranslation(["common"]);

  return (
    <div className="tw:w-full">
      <AppCard className="tw:border-emerald-100 tw:bg-linear-to-br tw:from-emerald-50/50 tw:to-white">
        {/* Success Header - Compact */}
        <div className="tw:flex tw:items-center tw:gap-3 tw:sm:gap-4 tw:mb-4 tw:sm:mb-5">
          <div className="tw:relative tw:shrink-0">
            <div className="tw:absolute tw:inset-0 tw:bg-emerald-500/20 tw:rounded-full tw:animate-ping" />
            <div className="tw:relative tw:bg-emerald-500 tw:rounded-full tw:p-2 tw:sm:p-3 tw:shadow-lg tw:shadow-emerald-500/30">
              <CheckCircle className="tw:w-6 tw:h-6 tw:sm:w-8 tw:sm:h-8 tw:text-white" />
            </div>
          </div>

          <div className="tw:flex-1 tw:min-w-0">
            <h2 className="tw:text-lg tw:sm:text-xl tw:font-bold tw:text-gray-900 tw:mb-0.5">
              {t("b2bRetailerCreatedSuccessfully", { type: displayTypeLabel })}
            </h2>
            <p className="tw:text-xs tw:sm:text-sm tw:text-gray-600 tw:line-clamp-2">
              Retailer added successfully
            </p>
          </div>
        </div>

        {/* Retailer Details - Grid Layout */}
        <div className="tw:bg-white tw:rounded-lg tw:border tw:border-gray-200 tw:p-3 tw:sm:p-4 tw:mb-4 tw:sm:mb-5">
          <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-3 tw:sm:gap-4">
            {/* Store Name */}
            {(retailerData?.storeName || retailerData?.name) && (
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:gap-3">
                <div className="tw:bg-emerald-100 tw:rounded-md tw:p-1.5 tw:sm:p-2 tw:shrink-0">
                  <Store className="tw:w-3.5 tw:h-3.5 tw:sm:w-4 tw:sm:h-4 tw:text-emerald-600" />
                </div>
                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:text-[10px] tw:sm:text-xs tw:text-gray-500 tw:leading-tight">
                    Store Name
                  </div>
                  <div className="tw:text-sm tw:sm:text-base tw:font-semibold tw:text-gray-900 tw:truncate">
                    {retailerData?.storeName || retailerData?.name}
                  </div>
                </div>
              </div>
            )}

            {/* Owner Name */}
            {retailerData?.ownerName && (
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:gap-3">
                <div className="tw:bg-blue-100 tw:rounded-md tw:p-1.5 tw:sm:p-2 tw:shrink-0">
                  <User className="tw:w-3.5 tw:h-3.5 tw:sm:w-4 tw:sm:h-4 tw:text-blue-600" />
                </div>
                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:text-[10px] tw:sm:text-xs tw:text-gray-500 tw:leading-tight">
                    {t("owner")}
                  </div>
                  <div className="tw:text-sm tw:sm:text-base tw:font-medium tw:text-gray-900 tw:truncate">
                    {retailerData.ownerName}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile */}
            {retailerData?.mobile && (
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:gap-3">
                <div className="tw:bg-purple-100 tw:rounded-md tw:p-1.5 tw:sm:p-2 tw:shrink-0">
                  <Phone className="tw:w-3.5 tw:h-3.5 tw:sm:w-4 tw:sm:h-4 tw:text-purple-600" />
                </div>
                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:text-[10px] tw:sm:text-xs tw:text-gray-500 tw:leading-tight">
                    {t("mobile")}
                  </div>
                  <div className="tw:text-sm tw:sm:text-base tw:font-medium tw:text-gray-900 tw:truncate">
                    {retailerData.mobile}
                  </div>
                </div>
              </div>
            )}

            {/* Type */}
            {retailerData?.displayType?.name && (
              <div className="tw:flex tw:items-center tw:gap-2.5 tw:sm:gap-3">
                <div className="tw:bg-amber-100 tw:rounded-md tw:p-1.5 tw:sm:p-2 tw:shrink-0">
                  <Tag className="tw:w-3.5 tw:h-3.5 tw:sm:w-4 tw:sm:h-4 tw:text-amber-600" />
                </div>
                <div className="tw:flex-1 tw:min-w-0">
                  <div className="tw:text-[10px] tw:sm:text-xs tw:text-gray-500 tw:leading-tight">
                    {t("type")}
                  </div>
                  <div className="tw:text-sm tw:sm:text-base tw:font-medium tw:text-gray-900 tw:truncate">
                    {retailerData.displayType.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button - Full width on mobile, auto on desktop */}
        <div className="tw:flex tw:justify-start tw:sm:justify-end">
          <AppButton
            onClick={onDone}
            color="success"
            className="tw:w-full tw:sm:w-auto tw:shadow-md tw:shadow-emerald-500/20"
          >
            {t("done")}
          </AppButton>
        </div>
      </AppCard>
    </div>
  );
};

export default Success;
