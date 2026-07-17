import React, { useEffect, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { useSearchParams } from "react-router";
import { SaveIcon } from "lucide-react";
import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { AppInput } from "~/components/core/form/AppInput";
import { AppSelect } from "~/components/core/form/AppSelect";
import { AppCheckbox } from "~/components/core/form/AppCheckbox";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppDateInput from "~/components/core/form/AppDateInput";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import {
  applicableForOptions,
  defaultValues,
  discountKindOptions,
  getCouponForm,
  saveCoupon,
  scopeTypeOptions,
  validateForm,
  type CouponFormFields,
} from "./helper";
import ScopeSearchInput from "./components/ScopeSearchInput";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import RemarksModal from "~/modals/feature/remarks/RemarksModal";

// Small always-visible helper text shown under a field. We keep the wording
// simple and free of jargon because most of our users are rural store owners
// who may not be familiar with terms like "scope", "MRP" or "B2C/B2B".
const FieldHint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="tw:mt-1 tw:text-[11px] tw:leading-snug tw:text-gray-500">
    {children}
  </p>
);

const ManageCoupon: React.FC = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const isEdit = !!id;
  const appNav = useAppNav();
  const appToast = useAppToast();

  const methods = useForm<CouponFormFields>({ defaultValues });
  const { register, control, handleSubmit, reset, setValue } = methods;

  const [loading, setLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Holds the validated form data while the confirm dialog is open. We only
  // hit the API once the user confirms, so the actual create/update is
  // deferred until then.
  const [pendingForm, setPendingForm] = useState<CouponFormFields | null>(null);

  const {
    code,
    scopeType = defaultValues.scopeType,
    validFrom,
    validTill,
    discountKind = defaultValues.discountKind,
    description = "",
  } = useWatch<CouponFormFields>({ control });

  // Coupons cannot start in the past, so block every date before today.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // The calendar uses a dropdown caption (month + year). In react-day-picker
  // the dropdown only lists years between startMonth and endMonth, and without
  // an explicit endMonth it stops at the current year — so future validity
  // dates can't be selected. Allow picking up to 10 years ahead.
  const maxDate = new Date(today);
  maxDate.setFullYear(maxDate.getFullYear() + 10);

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Dashboard", redirect: { path: "/dashboard" } },
    {
      label: "Coupons List",
      redirect: { path: "/configs/coupon" },
    },
    { label: isEdit ? "Edit Coupon" : "Create Coupon" },
  ];

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const form = await getCouponForm(id);
        if (form) {
          reset(form);
        }
      } catch (error) {
        console.error("Error loading coupon:", error);
        appToast.show({ msg: "Failed to load coupon", color: "danger" });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Validate first, then ask the user to confirm before touching the API.
  const onSubmit = (form: CouponFormFields) => {
    const error = validateForm(form);
    if (error) {
      appToast.show({ msg: error, color: "danger" });
      return;
    }
    setPendingForm(form);
  };

  const handleConfirm = async (remarks?: string) => {
    if (!pendingForm) return;
    const form = pendingForm;
    setPendingForm(null);
    setIsSubmitting(true);
    try {
      const response = await saveCoupon(isEdit, id as string, form, remarks);

      if (response?.statusCode === 200 || response?.statusCode === 201) {
        appToast.show({
          msg: `Coupon ${isEdit ? "updated" : "created"} successfully`,
          color: "success",
        });
        appNav.to("/configs/coupon");
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to save coupon",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      appToast.show({ msg: "Failed to save coupon", color: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="tw:flex tw:justify-center tw:items-center tw:h-64">
        <AppSpinner />
      </div>
    );
  }

  return (
    <div>
      <AppHeader title={isEdit ? "Edit Coupon" : "Create Coupon"} />
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="tw:p-3">
          <div className="tw:mb-3">
            <AppBreadcrumbs data={breadcrumbs} />
          </div>

          <div className="tw:flex tw:flex-col tw:gap-3">
            {/* Basic details */}
            <AppCard className="tw:mb-0">
              <div className="tw:font-semibold tw:text-sm tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
                Basic Details
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-x-3 tw:gap-y-2.5">
                <div>
                  <AppInput
                    name="title"
                    label="Title"
                    placeholder="e.g. Diwali Offer"
                    register={register}
                    isRequired
                    size="sm"
                  />
                  <FieldHint>
                    A short name for this offer, for your reference.
                  </FieldHint>
                </div>
                <div>
                  {isEdit ? (
                    <>
                      {/* The coupon code is the permanent identifier customers
                          type at billing, so it's locked once the coupon
                          exists — shown as read-only text, not an input. */}
                      <div className="tw:block tw:mb-2 tw:font-medium tw:text-gray-800 tw:text-xs">
                        Coupon Code
                      </div>
                      <div className="tw:flex tw:items-center tw:h-9 tw:rounded-md tw:bg-gray-50 tw:px-3 tw:text-sm tw:font-medium tw:text-gray-800">
                        {code}
                      </div>
                      <FieldHint>
                        The coupon code cannot be changed after the coupon is
                        created.
                      </FieldHint>
                    </>
                  ) : (
                    <>
                      <AppInput
                        name="code"
                        label="Coupon Code"
                        placeholder="e.g. DIWALI11"
                        register={register}
                        isRequired
                        size="sm"
                        onChange={(e) => {
                          // Coupon codes are uppercase and may contain only
                          // letters/numbers — no spaces or symbols.
                          const sanitized = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          setValue("code", sanitized, { shouldValidate: true });
                        }}
                      />
                      <FieldHint>
                        The code the customer types at billing to get this
                        discount.
                      </FieldHint>
                    </>
                  )}
                </div>

                <div>
                  <div className="tw:block tw:mb-2 tw:font-medium tw:text-gray-800 tw:text-xs">
                    Applicable For
                    <span className="tw:text-xs tw:text-red-500">*</span>
                  </div>
                  <Controller
                    control={control}
                    name="applicableFor"
                    render={({ field }) => (
                      <div className="tw:flex tw:items-center tw:gap-6 tw:h-9 tw:rounded-md tw:border tw:border-gray-200 tw:px-3">
                        {applicableForOptions.map((opt) => (
                          <AppCheckbox
                            key={opt}
                            name={`applicableFor.${opt}`}
                            label={opt}
                            value={field.value?.includes(opt)}
                            onChange={(checked) => {
                              const set = new Set(field.value || []);
                              if (checked) set.add(opt);
                              else set.delete(opt);
                              field.onChange(Array.from(set));
                            }}
                          />
                        ))}
                      </div>
                    )}
                  />
                  <FieldHint>
                    Who can use this coupon — B2C is for retail customers, B2B
                    is for shop/business buyers. Tick one or both.
                  </FieldHint>
                </div>
                <div className="tw:sm:col-span-2 tw:lg:col-span-3">
                  <AppTextarea
                    name="description"
                    label="Description"
                    placeholder="Short description of the offer"
                    register={register}
                    rows={2}
                    maxLength={500}
                  />
                  <div className="tw:flex tw:justify-between tw:gap-2">
                    <FieldHint>
                      Optional. A few words about the offer for your own
                      reference.
                    </FieldHint>
                    <FieldHint>{description.length}/500</FieldHint>
                  </div>
                </div>
              </div>
            </AppCard>

            {/* Validity & scope */}
            <AppCard className="tw:mb-0">
              <div className="tw:font-semibold tw:text-sm tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
                Validity &amp; Scope
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-x-3 tw:gap-y-2.5">
                <div>
                  <Controller
                    control={control}
                    name="validFrom"
                    render={({ field }) => (
                      <AppDateInput
                        label="Valid From"
                        placeholder="Select start date"
                        size="sm"
                        isRequired
                        value={field.value}
                        dateConfig={{
                          disabled: { before: today },
                          startMonth: today,
                          endMonth: maxDate,
                        }}
                        callback={(dt) => {
                          const next = Array.isArray(dt) ? dt[0] : dt;
                          field.onChange(next);
                          // The end date depends on the start date — clear it if
                          // it now falls before the newly picked start date.
                          if (validTill && next && validTill < next) {
                            setValue("validTill", undefined);
                          }
                        }}
                      />
                    )}
                  />
                  <FieldHint>
                    The first day the coupon can be used. Past dates are not
                    allowed.
                  </FieldHint>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="validTill"
                    render={({ field }) => (
                      <AppDateInput
                        label="Valid Till"
                        placeholder={
                          validFrom
                            ? "Select end date"
                            : "Select start date first"
                        }
                        size="sm"
                        isRequired
                        // End date can't be picked until a start date is set,
                        // and it can never be earlier than the start date.
                        disabled={!validFrom}
                        value={field.value}
                        dateConfig={
                          validFrom
                            ? {
                                disabled: { before: validFrom },
                                startMonth: validFrom,
                                endMonth: maxDate,
                              }
                            : undefined
                        }
                        callback={(dt) =>
                          field.onChange(Array.isArray(dt) ? dt[0] : dt)
                        }
                      />
                    )}
                  />
                  <FieldHint>The last day the coupon can be used.</FieldHint>
                </div>
                {/* "Applies To" (scope type) picker hidden for now — coupons
                    default to CART scope (see defaultValues in helper). Restore
                    this block to let users pick Category / Brand / Menu scopes. */}
                {/* <div>
                  <Controller
                    control={control}
                    name="scopeType"
                    render={({ field }) => (
                      <AppSelect
                        label="Applies To"
                        size="sm"
                        options={scopeTypeOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          // Selected items of one type aren't valid for another
                          setValue("scopeIds", []);
                        }}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                  <FieldHint>
                    Where the discount works — the whole Cart, or only a chosen
                    Category, Brand or Menu.
                  </FieldHint>
                </div> */}
                {scopeType !== "CART" && (
                  <div>
                    <div className="tw:block tw:mb-2 tw:font-medium tw:text-gray-800 tw:text-xs">
                      {scopeTypeOptions.find((o) => o.value === scopeType)
                        ?.label || scopeType}
                      <span className="tw:text-xs tw:text-red-500">*</span>
                    </div>
                    <Controller
                      control={control}
                      name="scopeIds"
                      render={({ field }) => (
                        <ScopeSearchInput
                          scopeType={scopeType}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    <FieldHint>
                      {scopeType === "BRAND"
                        ? "Search and pick the brands this coupon applies to."
                        : scopeType === "MENU"
                          ? "Search and pick the menus this coupon applies to."
                          : "Search and pick the categories this coupon applies to."}
                    </FieldHint>
                  </div>
                )}
              </div>
            </AppCard>

            {/* Discount & conditions */}
            <AppCard className="tw:mb-0">
              <div className="tw:font-semibold tw:text-sm tw:mb-3 tw:pb-2 tw:border-b tw:border-gray-100">
                Discount &amp; Conditions
              </div>
              <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-x-3 tw:gap-y-2.5">
                <div>
                  <Controller
                    control={control}
                    name="discountKind"
                    render={({ field }) => (
                      <AppSelect
                        label="Discount Type"
                        size="sm"
                        options={discountKindOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val);
                          // Changing the type changes what the value means
                          // (% vs ₹), so clear the old value to avoid carrying
                          // over a now-meaningless number.
                          setValue("discountValue", "");
                        }}
                        inputClassName="tw:w-full"
                        isRequired
                      />
                    )}
                  />
                  <FieldHint>
                    Percentage = % off the amount. Fixed = a flat rupee amount
                    off.
                  </FieldHint>
                </div>
                <div>
                  <AppInput
                    name="discountValue"
                    label={`Discount Value (${
                      discountKind === "PERCENT" ? "%" : "Rs"
                    })`}
                    type="number"
                    placeholder="e.g. 10"
                    register={register}
                    isRequired
                    size="sm"
                    onChange={(e) => {
                      // Discounts can never be negative.
                      const sanitized = e.target.value.replace(/-/g, "");
                      setValue("discountValue", sanitized, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  <FieldHint>
                    How much to take off. For Percentage, 10 means 10% off; for
                    Fixed, 10 means ₹10 off.
                  </FieldHint>
                </div>
                {/* "Apply On" picker hidden for now — coupons default to PRICE
                    (see defaultValues in helper) which is still sent in the
                    payload. Restore this block to let users pick Price / MRP. */}
                {/* <div>
                  <Controller
                    control={control}
                    name="applyOn"
                    render={({ field }) => (
                      <AppSelect
                        label="Apply On"
                        size="sm"
                        options={applyOnOptions}
                        value={field.value}
                        onChange={field.onChange}
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                  <FieldHint>
                    Calculate the discount on the selling Price or on the MRP
                    (printed price).
                  </FieldHint>
                </div> */}
                {/* Max Discount Per Use: an upper cap (in ₹) on how much a
                single use of this coupon can discount. Only meaningful for
                Percentage coupons — e.g. "10% off, but never more than ₹200".
                For Fixed coupons the cap always equals the discount value, so we
                hide the input and mirror discountValue in preparePayload. */}
                {discountKind === "PERCENT" && (
                  <div>
                    <AppInput
                      name="maxDiscountPerUse"
                      label="Max Discount Per Use"
                      type="number"
                      placeholder="e.g. 200"
                      register={register}
                      isRequired
                      size="sm"
                    />
                    <FieldHint>
                      The most a customer can save in one use. Example: 10% off
                      but never more than ₹200.
                    </FieldHint>
                  </div>
                )}
                <div>
                  <AppInput
                    name="minCartValue"
                    label="Min Cart Value"
                    type="number"
                    placeholder="e.g. 500"
                    register={register}
                    isRequired
                    size="sm"
                    onChange={(e) => {
                      // Cart value can never be negative.
                      const sanitized = e.target.value.replace(/-/g, "");
                      setValue("minCartValue", sanitized, {
                        shouldValidate: true,
                      });
                    }}
                  />
                  <FieldHint>
                    The smallest bill amount needed before this coupon can be
                    used.
                  </FieldHint>
                </div>
              </div>
            </AppCard>

            {/* Usage policy - hidden for now, default values passed in payload
                (applyFrequency: SINGLE, maxUsesPerCustomer: 1, maxGlobalUses: 1000) */}
          </div>

          {/* Action bar */}
          <div className="tw:mt-3 tw:flex tw:items-center tw:justify-end tw:gap-2">
            <AppButton
              type="button"
              fill="outline"
              color="light"
              onClick={() => appNav.to("/configs/coupon")}
            >
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              isLoading={isSubmitting}
              className="tw:flex tw:items-center tw:gap-2"
            >
              <SaveIcon className="tw:w-4 tw:h-4" />
              {isEdit ? "Update" : "Create"} Coupon
            </AppButton>
          </div>
        </form>
      </FormProvider>

      {isEdit ? (
        // On update we ask for a remarks note (audit trail) instead of a plain
        // yes/no confirm.
        <RemarksModal
          show={!!pendingForm}
          title="Update Coupon"
          callback={({ action, remarks }) => {
            if (action === "submit") {
              handleConfirm(remarks);
            } else {
              setPendingForm(null);
            }
          }}
        />
      ) : (
        <AppAlertDialog
          show={!!pendingForm}
          title="Create Coupon"
          description="Are you sure you want to create this coupon?"
          okText="Create"
          onConfirm={() => handleConfirm()}
          onCancel={() => setPendingForm(null)}
        />
      )}
    </div>
  );
};

export default ManageCoupon;

export function meta() {
  return [{ title: "Manage Coupon" }];
}
