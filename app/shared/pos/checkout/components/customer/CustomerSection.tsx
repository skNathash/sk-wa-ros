import { useCallback, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { Award, Check, Loader2, Phone, User, Users, X } from "lucide-react";
import clsx from "clsx";
import { AppInput } from "~/components/core/form";
import { Button } from "~/components/ui/button";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import { CustomerService } from "~/services/CustomerService";
import LoyaltyPointService from "~/services/LoyaltyPointService";

/**
 * First step of the checkout flow — who the bill is for.
 *
 * Walk-in settles straight away; B2C looks the customer up by mobile and offers
 * to create one when the number is new. Continuing is owned by the modal footer,
 * so the primary action stays in one place across both steps.
 */
const CustomerSection = () => {
  const { t } = useTranslation(["posbilling"]);
  const appToast = useAppToast();
  const { control, register, setValue, getValues } = useFormContext();

  const [option, customer, isNewCustomer] = useWatch({
    control,
    name: ["option", "customer", "isNewCustomer"],
  });

  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const customerOptions = [
    {
      id: "walkin",
      name: t("checkoutModal.customer.options.walkin", {
        defaultValue: "Walk-in",
      }),
      hint: "No details needed",
      icon: User,
    },
    {
      id: "b2c",
      name: t("checkoutModal.customer.options.b2c", {
        defaultValue: "B2C Customer",
      }),
      hint: "Earns loyalty points",
      icon: Users,
    },
  ];

  const handleSearch = useCallback(
    debounce(async () => {
      const search = getValues("mobile") || "";
      setValue("customer", null);
      setValue("isNewCustomer", false);

      const cleanMobile = search.replace(/[^0-9]/g, "").slice(0, 10);
      if (search !== cleanMobile) {
        setValue("mobile", cleanMobile);
      }

      if (!CommonService.isValidMobileNo(cleanMobile)) {
        return;
      }

      const storeMobile = (
        "" + (AuthService.getLoggedInUser()?.mobile ?? "")
      ).trim();
      if (storeMobile && storeMobile === cleanMobile) {
        appToast.show({
          msg: t("checkoutModal.customer.validation.sameAsRetailer", {
            defaultValue: "Mobile number cannot be same as retailer",
          }),
          color: "error",
        });
        setValue("mobile", "");
        setValue("customer", null);
        return;
      }

      setSearching(true);
      try {
        const response = await CustomerService.getCustomers({
          filter: { mobile: cleanMobile },
          limit: 5,
        });
        const data = response.data?.data || [];

        if (data.length > 0) {
          const cust = data[0];
          const holderId = cust?.id || cust?._id || cust?.customerId || null;
          if (holderId) {
            try {
              const pointsResp = await LoyaltyPointService.getHolderPoints(
                "Customer",
                holderId,
              );
              cust.points = pointsResp?.available ?? null;
            } catch (err) {
              cust.points = null;
            }
          }
          setValue("customer", cust);
          setValue("isNewCustomer", false);
        } else {
          setValue("isNewCustomer", true);
        }
      } finally {
        setSearching(false);
      }
    }, 500),
    [getValues, setValue, appToast, t],
  );

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleanName = event.target.value.replace(/[^A-Za-z ]/g, "");
    if (event.target.value !== cleanName) {
      setValue("name", cleanName);
    }
  };

  const handleCreateCustomer = async () => {
    const name = getValues("name") || "";
    const customerMobile = getValues("mobile") || "";

    if (!name?.trim()) {
      appToast.show({
        msg: t("checkoutModal.customer.validation.enterName", {
          defaultValue: "Please enter name",
        }),
        color: "error",
      });
      return;
    }

    if (!CommonService.isValidMobileNo(customerMobile)) {
      appToast.show({
        msg: t("checkoutModal.customer.validation.validMobile", {
          defaultValue: "Please enter a valid mobile number",
        }),
        color: "error",
      });
      return;
    }

    const retailer = AuthService.getLoggedInUser();
    const payload = {
      name,
      mobile: customerMobile,
      address: {
        city: retailer?.city,
        state: retailer?.state,
        postcode: retailer?.pincode,
        district: retailer?.district,
        landmark: "",
      },
    };

    setCreating(true);
    try {
      const response = await CustomerService.createCustomer(payload);
      if (response.statusCode === 200) {
        appToast.show({
          msg: t("checkoutModal.customer.messages.customerCreated", {
            defaultValue: "Customer created successfully",
          }),
          color: "success",
        });

        const cust = {
          ...response.data?.data,
          _id: response.data?.data?.customerId || "",
        };
        const holderId = cust?.id || cust?._id || cust?.customerId || null;
        if (holderId) {
          try {
            const pointsResp = await LoyaltyPointService.getHolderPoints(
              "Customer",
              holderId,
            );
            cust.points = pointsResp?.available ?? null;
          } catch (err) {
            cust.points = null;
          }
        }

        setValue("customer", cust);
        setValue("isNewCustomer", false);
      } else {
        appToast.show({
          msg:
            response.data?.message ||
            t("checkoutModal.customer.messages.failedToCreateCustomer", {
              defaultValue: "Failed to create customer",
            }),
          color: "error",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleClearCustomer = () => {
    setValue("mobile", "");
    setValue("name", "");
    setValue("customer", null);
    setValue("isNewCustomer", false);
  };

  return (
    <div className="tw:space-y-3">
      <div className="tw:grid tw:grid-cols-2 tw:gap-2 tw:sm:gap-3">
        {customerOptions.map((opt) => {
          const Icon = opt.icon;
          const active = option === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setValue("option", opt.id);
                setValue("mobile", "");
                setValue("name", "");
                setValue("customer", null);
                setValue("isNewCustomer", false);
              }}
              className={clsx(
                "tw:flex tw:cursor-pointer tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:px-3 tw:py-2.5 tw:text-left tw:transition-colors",
                active
                  ? "tw:border-emerald-600 tw:bg-emerald-50 tw:shadow-sm"
                  : "tw:border-slate-200 tw:bg-white tw:hover:border-slate-300 tw:hover:bg-slate-50",
              )}
            >
              <span
                className={clsx(
                  "tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:transition-colors",
                  active
                    ? "tw:bg-emerald-700 tw:text-white"
                    : "tw:bg-slate-100 tw:text-slate-500",
                )}
              >
                <Icon className="tw:size-4" strokeWidth={1.75} />
              </span>
              <span className="tw:min-w-0">
                <span
                  className={clsx(
                    "tw:block tw:truncate tw:text-sm tw:font-semibold",
                    active ? "tw:text-emerald-900" : "tw:text-slate-700",
                  )}
                >
                  {opt.name}
                </span>
                <span
                  className={clsx(
                    "tw:block tw:truncate tw:text-xs",
                    active ? "tw:text-emerald-700" : "tw:text-slate-500",
                  )}
                >
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {option === "b2c" && !customer && (
        <div className="tw:space-y-2 tw:rounded-xl tw:bg-slate-50 tw:p-2.5">
          <AppInput
            label="Customer mobile"
            labelClassName="tw:text-xs tw:text-slate-600"
            placeholder={t("checkoutModal.customer.search.placeholder", {
              defaultValue: "Enter customer mobile number",
            })}
            register={register}
            name="mobile"
            onChange={handleSearch}
            size="lg"
            autoFocus={true}
            maxLength={10}
            type="tel"
            inputClassName="tw:bg-white tw:tracking-wide tw:tabular-nums"
            leftIcon={<Phone size={16} />}
            rightIcon={
              searching ? (
                <Loader2 className="tw:size-4 tw:animate-spin tw:text-slate-400" />
              ) : undefined
            }
          />

          {isNewCustomer && !searching && (
            <div className="tw:space-y-2 tw:border-t tw:border-slate-200 tw:pt-2">
              <div className="tw:text-xs tw:text-slate-600">
                {t("checkoutModal.customer.search.noCustomerFound", {
                  defaultValue: "No customer found. Enter name to create.",
                })}
              </div>
              <AppInput
                placeholder={t(
                  "checkoutModal.customer.search.namePlaceholder",
                  {
                    defaultValue: "Enter customer name",
                  },
                )}
                register={register}
                name="name"
                onChange={handleNameChange}
                size="lg"
                inputClassName="tw:bg-white"
                leftIcon={<User size={16} />}
              />
              <Button
                type="button"
                variant="outline"
                className="tw:h-9 tw:w-full tw:bg-white tw:text-xs"
                disabled={creating}
                onClick={handleCreateCustomer}
              >
                {creating
                  ? t("checkoutModal.customer.actions.creating", {
                      defaultValue: "Creating...",
                    })
                  : t("checkoutModal.customer.actions.createCustomer", {
                      defaultValue: "Create Customer",
                    })}
              </Button>
            </div>
          )}
        </div>
      )}

      {option === "b2c" && customer && (
        <div className="tw:flex tw:items-center tw:gap-2.5 tw:rounded-xl tw:border tw:border-emerald-600 tw:bg-emerald-50 tw:p-2.5">
          <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-emerald-700 tw:text-white">
            <Check className="tw:size-4" strokeWidth={2.25} />
          </span>

          <div className="tw:min-w-0 tw:flex-1">
            <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-emerald-900">
              {customer.name}
            </div>
            <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-0.5 tw:text-xs tw:text-emerald-700">
              <span className="tw:flex tw:items-center tw:gap-1.5">
                <Phone size={12} className="tw:shrink-0" />
                <span className="tw:tabular-nums tw:tracking-wide">
                  {customer.mobile}
                </span>
              </span>
              {(customer.points ?? null) !== null && (
                <span className="tw:flex tw:items-center tw:gap-1.5">
                  <Award size={12} className="tw:shrink-0" />
                  <span>
                    {t("checkoutModal.customer.customerCard.pointsCount", {
                      count: customer.points,
                      defaultValue: `${customer.points} points`,
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearCustomer}
            title="Remove selection"
            className="tw:shrink-0 tw:cursor-pointer tw:rounded-lg tw:p-1.5 tw:text-emerald-700 tw:transition-colors hover:tw:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerSection;
