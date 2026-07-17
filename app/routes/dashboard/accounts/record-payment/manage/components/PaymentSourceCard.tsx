import { useEffect, useMemo, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import SearchModal from "../modals/search/SearchModal";
import { Phone, Trash2 } from "lucide-react";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import AppButton from "~/components/core/button/AppButton";
import AppLink from "~/components/core/link/AppLink";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";

type Props = {
  activeTab?: string;
};

const PaymentSourceCard: React.FC<Props> = ({ activeTab }) => {
  const { t } = useTranslation(["common"]);
  const { control, setValue, register } = useFormContext();

  const [showSearchModal, setShowSearchModal] = useState(false);

  // watch the paymentFromType and entity from react-hook-form (new keys)
  const [paymentFromType, entity] = useWatch({
    control,
    name: ["paymentFromType", "entity"],
  });

  const paymentSourceOptions = useMemo(() => {
    if (activeTab === "receivePayment") {
      const t = [
        { label: "B2B Retailer", value: "franchise" },
        { label: "B2C Customer", value: "customer" },
        { label: "Vendor", value: "vendor" },
      ];
      return t;
    } else {
      return [{ label: "Vendor", value: "vendor" }];
    }
  }, [activeTab]);

  // When paymentFromType changes, reset entity
  useEffect(() => {
    setValue("entity", []);
  }, [paymentFromType]);

  const handleSearchCallback = (item: any, action: "add" | "remove") => {
    if (action === "add") {
      setValue("entity", [item]);
    } else {
      setValue("entity", []);
    }
  };

  const isReceive = activeTab === "receivePayment";

  const openSearchModal = () => {
    setShowSearchModal(true);
  };

  const handleSearchModalCallback = (data: { action: string; data?: any }) => {
    // close modal by default
    setShowSearchModal(false);

    // when modal sends an 'add' action, update the entity form value
    if (data?.action === "add" && data?.data) {
      // set entity to the selected item array (form expects array)
      setValue("entity", [data.data]);
    } else if (data?.action === "remove") {
      setValue("entity", []);
    }
  };

  return (
    <>
      <AppCard
        title={`1. ${isReceive ? t("paymentSource") : t("paymentDestination")}`}
        subtitle={
          isReceive
            ? t("selectPaymentSourceDescription")
            : t("selectPaymentDestinationDescription")
        }
      >
        <div className="tw:mt-4">
          <div className="tw:flex tw:gap-4">
            <Controller
              control={control}
              name="paymentFromType"
              render={({ field }) => (
                <AppSelect
                  options={paymentSourceOptions}
                  onChange={(value) => field.onChange(value)}
                  placeholder="Choose"
                  label={
                    activeTab === "receivePayment"
                      ? "Payment From"
                      : "Payment To"
                  }
                  value={field.value}
                  isRequired={true}
                  size="sm"
                />
              )}
            />

            <AppInput
              name="paymentSourceEntity"
              register={register}
              placeholder={t("searchAndSelect")}
              label={t("selectEntity")}
              disabled={!paymentFromType}
              size="sm"
              className="tw:w-full"
              isRequired={true}
              readOnly={true}
              onClick={openSearchModal}
            />

            {/* <Search
            entityType={paymentFromType}
            source={activeTab || ""}
            callback={handleSearchCallback}
            placeholder={t("searchAndSelect")}
            label={t("selectEntity")}
            disabled={!paymentFromType}
            values={entity}
            size="sm"
            className="tw:w-full"
            isRequired={true}
          /> */}
          </div>
          {/* Block to show selected entity with remove feature */}
          {Array.isArray(entity) && entity.length > 0 && (
            <div className="tw:bg-gray-100 tw:p-2 tw:rounded tw:mt-2">
              <div className="tw:flex tw:items-start tw:justify-between">
                <div className="tw:flex-1">
                  <div className="tw:text-sm tw:font-semibold tw:mb-1">
                    {/* If we have an entity and it maps to a known party type, wrap label in AppLink */}
                    {entity[0] ? (
                      <AppLink
                        asLink={true}
                        href={AccountService.preparePartyTypeRedirectionUrl(
                          entity[0]?.value?.type,
                          entity[0]?.value?.id || ""
                        )}
                        className="tw:text-gray-800 hover:tw:text-blue-600"
                      >
                        {entity[0]?.label}
                      </AppLink>
                    ) : null}
                  </div>

                  <div className="tw:text-xs tw:text-gray-500 tw:mb-1 tw:flex tw:items-center tw:gap-4">
                    <span>
                      <span className="tw:font-medium">ID:</span>{" "}
                      <span>{entity[0]?.value?.refId}</span>
                    </span>

                    {entity[0]?.value?.mobile ? (
                      <span className="tw:flex tw:items-center tw:text-xs tw:text-gray-500 tw:flex-row tw:gap-2">
                        <span className="tw:flex tw:items-center">
                          <Phone
                            size={12}
                            className="tw:mr-1 tw:text-gray-400"
                          />
                          <span>{entity[0].value.mobile}</span>
                        </span>
                        {entity[0]?.value?._vendorType ? (
                          <VendorTypeBadge
                            type={entity[0].value._vendorType}
                            color={entity[0].value._vendorTypeColor}
                            description={entity[0].value._vendorTypeInfo}
                            className="tw:ml-2 tw:text-[10px]"
                          />
                        ) : null}
                      </span>
                    ) : null}
                  </div>

                  <div className="tw:text-xs tw:text-gray-500">
                    {entity[0]?.value?.formattedAddress}
                  </div>
                </div>

                <div className="tw:ml-4 tw:flex-shrink-0 tw:flex tw:flex-col tw:justify-start">
                  <AppButton
                    type="button"
                    onClick={() => setValue("entity", [])}
                    color="danger"
                    fill="clear"
                    size="small"
                    className="tw:text-red-500"
                  >
                    <Trash2 size={12} />
                    {t("common:remove")}
                  </AppButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppCard>

      <SearchModal
        show={showSearchModal}
        callback={handleSearchModalCallback}
        entityType={paymentFromType}
      />
    </>
  );
};

export default PaymentSourceCard;
