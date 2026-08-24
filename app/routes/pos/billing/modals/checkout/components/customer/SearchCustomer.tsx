import { debounce } from "lodash";
import { Award, Check, Edit, Phone, User, X } from "lucide-react";
import CustomerPoints from "./CustomerPoints";
import { useCallback, useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput } from "~/components/core/form";
import CommonService from "~/services/CommonService";
import { CustomerService } from "~/services/CustomerService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";

const showEditButton = (name: string) => {
  return name && /Guest/.test(name);
};

interface SearchCustomerProps {
  callback?: (args: { action: string; data?: any }) => void;
}

const SearchCustomer = ({ callback }: SearchCustomerProps) => {
  const appToast = useAppToast();
  const { t } = useTranslation(["posbilling"]);
  const { register, getValues, setValue, control } = useFormContext();

  const [searching, setSearching] = useState(false);

  const [saving, setSaving] = useState(false);

  const [showEditInput, setShowEditInput] = useState(false);

  const [customer, isNewCustomer] = useWatch({
    control,
    name: ["customer", "isNewCustomer"],
  });

  const handleSearch = useCallback(
    debounce(async () => {
      const search = getValues("mobile");
      setValue("customer", null);
      setValue("isNewCustomer", false);

      // Filter out non-digit characters and limit to 10 digits
      const cleanMobile = search.replace(/[^0-9]/g, "").slice(0, 10);
      if (search !== cleanMobile) {
        setValue("mobile", cleanMobile);
      }

      if (CommonService.isValidMobileNo(cleanMobile)) {
        // Block when the customer number matches the logged-in store's number.
        // For a manpower login, `_f` holds the parent franchise (set at login
        // from franchiseInfo.id), so its `mobile` is the parent franchise number.
        const storeMobile = ("" + (AuthService.getLoggedInUser()?.mobile ?? ""))
          .trim();
        if (storeMobile && storeMobile === cleanMobile) {
          appToast.show({
            msg: t("checkoutModal.customer.validation.sameAsRetailer"),
            color: "error",
          });
          setValue("mobile", "");
          setValue("customer", null);
          setValue("isNewCustomer", false);
          return;
        }

        setSearching(true);
        const response = await CustomerService.getCustomers({
          filter: { mobile: cleanMobile },
          limit: 5,
        });
        const data = response.data?.data || [];
        if (data.length > 0) {
          const cust = data[0];
          // determine holder id from common fields
          const holderId = cust?.id || cust?._id || cust?.customerId || null;
          if (holderId) {
            try {
              const pointsResp = await LoyaltyPointService.getHolderPoints(
                "Customer",
                holderId,
              );
              // LoyaltyPointService.getHolderPoints returns an object with `available`
              // use that key (falls back to 0)
              cust.points = pointsResp?.available ?? 0;
            } catch (err) {
              // ignore point fetch error, keep customer object
              cust.points = null;
            }
          }
          setValue("customer", cust);
          setValue("isNewCustomer", false);
        } else {
          setValue("isNewCustomer", true);
        }
        setSearching(false);
      }
    }, 500),
    [getValues, setValue],
  );

  const handleClear = () => {
    setValue("mobile", "");
    setValue("customer", null);
    setValue("isNewCustomer", false);
  };

  const handleEdit = () => {
    setValue("tempName", customer?.name || "");
    setShowEditInput(true);
  };

  const handleCancel = () => {
    setShowEditInput(false);
  };

  const handleSave = async () => {
    setSaving(true);

    const name = getValues("tempName");

    if (!name?.trim()) {
      appToast.show({
        msg: "Please enter a valid name",
        color: "error",
      });
      setSaving(false);
      return;
    }

    const customer = getValues("customer");
    const customerId = customer?._id;

    if (!customerId) {
      appToast.show({
        msg: "Customer ID is required",
        color: "error",
      });
      setSaving(false);
      return;
    }

    const payload = {
      name,
    };

    const response = await CustomerService.updateCustomer(customerId, payload);
    setSaving(false);
    if (response.statusCode === 200) {
      appToast.show({
        msg: "Customer updated successfully",
        color: "success",
      });
      setValue("customer", {
        ...customer,
        name,
      });
      setShowEditInput(false);
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to update customer",
        color: "error",
      });
    }
  };

  const handleTempNameChange = () => {
    const name = getValues("tempName");
    setValue("tempName", name?.replace(/[^\sA-z\-]/g, ""));
  };

  return (
    <div className="tw:px-0.5">
      <AppInput
        placeholder={t("checkoutModal.customer.search.placeholder")}
        register={register}
        name="mobile"
        onChange={handleSearch}
        size="lg"
        autoFocus={true}
        maxLength={10}
        type="tel"
        leftIcon={<Phone size={16} />}
      />

      {searching && (
        <div className="tw:text-sm tw:text-gray-500 tw:mt-2">
          {t("checkoutModal.customer.search.searching")}
        </div>
      )}

      {isNewCustomer && (
        <div className="tw:border tw:rounded-md tw:p-3 tw:mt-3 tw:bg-blue-50 tw:border-blue-200">
          <div className="tw:text-xs tw:text-blue-700 tw:font-medium tw:mb-2">
            {t("checkoutModal.customer.search.noCustomerFound")}
          </div>
          <AppInput
            placeholder={t("checkoutModal.customer.search.namePlaceholder")}
            register={register}
            name="name"
            size="lg"
            inputClassName="tw:bg-white"
          />
        </div>
      )}

      {customer && (
        <div className="tw:rounded-lg tw:p-4 tw:mt-4 tw:bg-linear-to-br tw:from-green-50 tw:to-emerald-50 tw:border tw:border-green-200 tw:shadow-sm">
          <div className="tw:flex tw:justify-between tw:items-start tw:gap-3 tw:mb-3">
            {/* Customer Info */}
            <div className="tw:flex-1 tw:min-w-0">
              <div className="tw:flex tw:justify-between tw:items-center">
                <div className="tw:flex tw:items-center tw:gap-2 tw:justify-between tw:flex-1">
                  {showEditInput ? (
                    <AppInput
                      placeholder={customer?.name}
                      register={register}
                      name="tempName"
                      size="sm"
                      inputClassName="tw:bg-white tw:text-gray-900"
                      autoFocus={true}
                      maxLength={100}
                      className="tw:w-full tw:flex-1"
                      leftIcon={<User size={16} className="tw:text-gray-600" />}
                      disabled={saving}
                      onChange={handleTempNameChange}
                    />
                  ) : (
                    <div className="tw:font-semibold tw:text-green-900">
                      {customer?.name}
                    </div>
                  )}
                  {showEditButton(customer?.name) && (
                    <>
                      {!showEditInput ? (
                        <AppButton
                          size="small"
                          fill="clear"
                          onClick={handleEdit}
                        >
                          <Edit size={16} />
                          Edit
                        </AppButton>
                      ) : (
                        <div className="tw:flex tw:items-center tw:gap-2">
                          <AppButton
                            size="small"
                            fill="clear"
                            onClick={handleCancel}
                            disabled={saving}
                          >
                            <X size={16} />
                            Cancel
                          </AppButton>
                          <AppButton
                            size="small"
                            fill="clear"
                            onClick={handleSave}
                            isLoading={saving}
                          >
                            <Check size={16} />
                            Save
                          </AppButton>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {!showEditInput && (
                <div className="tw:flex tw:flex-col tw:gap-1.5 tw:mt-2">
                  <div className="tw:text-xs tw:flex tw:gap-2 tw:items-center tw:text-green-700">
                    <Phone size={14} className="tw:shrink-0" />
                    <span className="tw:font-mono tw:tracking-wide">
                      {customer?.mobile}
                    </span>
                  </div>
                  <div className="tw:text-xs tw:flex tw:gap-1.5 tw:items-center">
                    <CustomerPoints points={customer?.points ?? null} />
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            {!showEditInput && (
              <AppButton
                size="small"
                fill="clear"
                onClick={handleClear}
                className="tw:p-1.5 tw:text-gray-400 hover:tw:text-red-600 hover:tw:bg-red-100 tw:rounded-md tw:transition-colors tw:duration-200 tw:flex-shrink-0"
                title="Remove selection"
              >
                <X size={16} />
              </AppButton>
            )}
          </div>

          {/* Select Button - Full Width Below */}
          {!showEditInput && (
            <AppButton
              size="small"
              color="success"
              onClick={() => {
                if (callback) {
                  callback({ action: "next" });
                }
              }}
              className="tw:w-full tw:px-4 tw:py-2.5 tw:font-semibold tw:text-sm tw:rounded-md tw:shadow-sm hover:tw:shadow-md tw:transition-all tw:duration-200 tw:whitespace-nowrap"
            >
              {t("checkoutModal.customer.actions.select")}
            </AppButton>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchCustomer;
