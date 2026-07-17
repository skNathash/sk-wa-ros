import clsx from "clsx";
import { DynamicIcon } from "lucide-react/dynamic";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import SearchCustomer from "./SearchCustomer";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import { CustomerService } from "~/services/CustomerService";
import AuthService from "~/services/AuthService";
import LoyaltyPointService from "~/services/LoyaltyPointService";
import { useState } from "react";

interface SelectCustomerProps {
  callback?: (args: { action: string; data?: any }) => void;
  assisted?: boolean;
}

const SelectCustomer = ({ callback, assisted }: SelectCustomerProps) => {
  const { t } = useTranslation(["posbilling"]);

  const options = [
    ...(assisted
      ? []
      : [
          {
            id: 1,
            name: t("checkoutModal.customer.options.walkin"),
            icon: "user",
            key: "walkin",
          },
        ]),
    {
      id: 2,
      name: t("checkoutModal.customer.options.b2c"),
      icon: "users",
      key: "b2c",
    },
  ];

  const { control, setValue, getValues } = useFormContext();

  const appToast = useAppToast();

  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const [option, isNewCustomer, customer, name] = useWatch({
    control,
    name: ["option", "isNewCustomer", "customer", "name"],
  });

  const canShowContinue =
    !customer && (!isNewCustomer || (name || "").trim().length >= 3);

  const handleCreateCustomer = async (): Promise<boolean> => {
    const name = getValues("name") || "";
    const mobile = getValues("mobile") || "";

    if (!name?.trim()) {
      appToast.show({
        msg: t("checkoutModal.customer.validation.enterName"),
        color: "error",
      });
      return false;
    }

    if (!mobile?.trim()) {
      appToast.show({
        msg: t("checkoutModal.customer.validation.enterMobile"),
        color: "error",
      });
      return false;
    }

    if (!CommonService.isValidMobileNo(mobile)) {
      appToast.show({
        msg: t("checkoutModal.customer.validation.validMobile"),
        color: "error",
      });
      return false;
    }

    const retailer = AuthService.getLoggedInUser();

    setIsCreatingCustomer(true);
    const payload = {
      name,
      mobile,
      address: {
        city: retailer?.city,
        state: retailer?.state,
        postcode: retailer?.pincode,
        district: retailer?.district,
        landmark: "",
      },
    };

    const response = await CustomerService.createCustomer(payload);
    setIsCreatingCustomer(false);
    if (response.statusCode === 200) {
      appToast.show({
        msg: t("checkoutModal.customer.messages.customerCreated"),
        color: "success",
      });

      // Update the customer data and set isNewCustomer to false
      const cust = {
        ...response.data?.data,
        _id: response.data?.data?.customerId || "",
      };

      // fetch and attach points if possible
      const holderId = cust?.id || cust?._id || cust?.customerId || null;
      if (holderId) {
        try {
          const pts = await LoyaltyPointService.getHolderPoints(
            "Customer",
            holderId,
          );
          // LoyaltyPointService.getHolderPoints returns { available, totalEarned, totalRedeemed, raw }
          cust.points = pts?.available ?? 0;
        } catch (err) {
          cust.points = null;
        }
      }

      setValue("customer", cust);
      setValue("isNewCustomer", false);
      return true;
    } else {
      appToast.show({
        msg:
          response.data?.message ||
          t("checkoutModal.customer.messages.failedToCreateCustomer"),
        color: "error",
      });
      return false;
    }
  };

  const handleContinue = async () => {
    const option = getValues("option");
    if (option === "b2c") {
      const mobile = getValues("mobile");
      if (!CommonService.isValidMobileNo(mobile)) {
        appToast.show({
          msg: t("checkoutModal.customer.validation.validMobile"),
          color: "error",
        });
        return;
      }

      if (isNewCustomer) {
        const created = await handleCreateCustomer();
        if (!created) {
          return;
        }
        // customer is now created and set in form values
      } else {
        if (!customer?._id) {
          appToast.show({
            msg: t("checkoutModal.customer.validation.customerNotFound"),
            color: "error",
          });
          return;
        }
      }
    } else {
      setValue("customer", null);
      setValue("isNewCustomer", false);
    }

    // If validation passes, call the callback to move to next step
    if (callback) {
      callback({ action: "next" });
    }
  };

  return (
    <div>
      <div className="wa-section-label tw:mb-4">
        {t("checkoutModal.customer.title")}
      </div>

      {options.map((opt) => (
        <div
          className={clsx(
            "tw:border tw:border-border tw:rounded-xl tw:p-4 tw:flex tw:gap-4 tw:items-center tw:cursor-pointer tw:mb-4 tw:transition-all tw:duration-300",
            option === opt.key
              ? "wa-incart tw:border-transparent tw:shadow-sm"
              : "tw:bg-card tw:hover:bg-muted/40 tw:hover:shadow-sm",
          )}
          key={opt.id}
          onClick={() => {
            setValue("option", opt.key);
            setValue("mobile", "");
            setValue("customer", null);
            setValue("isNewCustomer", false);
          }}
        >
          <div>
            <DynamicIcon
              name={opt.icon as any}
              size={16}
              className={clsx(
                option === opt.key
                  ? ""
                  : "tw:text-muted-foreground",
              )}
              style={
                option === opt.key
                  ? { color: "var(--wa-bubble-text)" }
                  : undefined
              }
            />
          </div>
          <div className="tw:text-sm tw:font-semibold">{opt.name}</div>
        </div>
      ))}

      {option === "b2c" && <SearchCustomer callback={callback} />}

      <div className="tw:mt-4">
        {canShowContinue && (
          <button
            type="button"
            onClick={handleContinue}
            className="wa-cta tw:w-full tw:flex tw:items-center tw:justify-center tw:h-10 tw:rounded-xl tw:text-sm tw:font-bold tw:cursor-pointer tw:transition-all"
          >
            {t("checkoutModal.customer.actions.continue")}
          </button>
        )}
      </div>
    </div>
  );
};

export default SelectCustomer;
