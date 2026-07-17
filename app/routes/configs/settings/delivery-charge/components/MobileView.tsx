import { Edit3Icon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import ChargeSlabPopup from "./ChargeSlabPopup";

const MobileView = ({ data, loading, busyloader, callback }: any) => {
  const { t } = useTranslation(["common"]);

  if (loading)
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
        {t("loading")}...
      </div>
    );

  return (
    <>
      <BusyLoader show={busyloader} />
      <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 tw:gap-4 tw:mx-4">
        {Array.isArray(data) && data.length > 0 ? (
          data.map((slabItem: any, index: number) => (
            <div key={index} className="tw:border tw:rounded-lg tw:p-3">
              <div className="tw:flex tw:justify-between tw:items-start">
                <div>
                  <div className="tw:text-sm tw:font-semibold">
                    <div className="tw:text-xs tw:text-gray-500 tw:mb-1">
                      {t("deliveryCharge.orderValue")}
                    </div>
                    <Amount
                      value={slabItem.fromOrderValue}
                      decimalPlaces={2}
                      className="tw:text-primary"
                    />{" "}
                    -{" "}
                    <Amount
                      value={slabItem.toOrderValue}
                      decimalPlaces={2}
                      className="tw:text-primary"
                    />
                  </div>
                  <div className="tw:mt-1">
                    <AppBadge variant={slabItem.isFree ? "success" : "danger"}>
                      {slabItem.isFree
                        ? t("deliveryCharge.freeDelivery")
                        : t("deliveryCharge.chargesApply")}
                    </AppBadge>
                    {!slabItem.isFree && (
                      <div className="tw:mt-1">
                        <ChargeSlabPopup
                          slabs={slabItem.chargeSlabKiloMeter || []}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="tw:flex tw:flex-col tw:gap-2">
                  <AppButton
                    size="small"
                    color="primary"
                    fill="clear"
                    noPadding={true}
                    onClick={() => callback("edit", { index })}
                  >
                    <Edit3Icon size={16} />
                  </AppButton>
                  <AppButton
                    size="small"
                    color="danger"
                    fill="clear"
                    noPadding={true}
                    onClick={() => callback("remove", { index })}
                  >
                    <Trash2Icon size={16} className="tw:text-red-500" />
                  </AppButton>
                </div>
              </div>
            </div>
          ))
        ) : (
          <AppCard className="tw:text-center tw:text-gray-500 tw:py-8">
            {t("deliveryCharge.noDeliveryChargeConfigurationFound")}
          </AppCard>
        )}
      </div>
    </>
  );
};

export default MobileView;
