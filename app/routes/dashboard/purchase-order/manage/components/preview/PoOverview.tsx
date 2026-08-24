import AppCard from "~/components/core/card/AppCard";
import AppDateInput from "~/components/core/form/AppDateInput";
import AppTextarea from "~/components/core/form/AppTextarea";
import Amount from "~/components/core/amount/Amount";
import { useFormContext, Controller } from "react-hook-form";
import type { DayPickerProps } from "react-day-picker";
import { addYears, endOfMonth } from "date-fns";
import CommissionDisplay from "./CommissionDisplay";
import { useTranslation } from "react-i18next";

interface PoOverviewProps {
  vendor: Record<string, any>;
  products: Record<string, any>[];
  /** `cartSummary` from the purchase-cart API — displayed as-is. */
  summary?: Record<string, any>;
  expectedDate?: Date;
}

const endDate = new Date(new Date().getFullYear() + 1, 10, 15);

const dateConfig: DayPickerProps = {
  mode: "single",
  defaultMonth: new Date(),
  disabled: {
    before: new Date(),
    after: endDate,
  },
  startMonth: new Date(),
  endMonth: endDate,
};

const PoOverview = ({
  vendor,
  products,
  summary = {},
}: PoOverviewProps) => {
  const { t } = useTranslation(["common"]);
  const { control, register } = useFormContext();

  // Totals come straight from the cart summary — no FE calculation.
  const productCount = summary.totalItems ?? products.length;
  const totalItems = summary.totalQuantity ?? 0;
  const orderValue = Number(summary.totalPurchaseValue) || 0;

  return (
    <AppCard title={t("purchaseOrderOverview")}>
      <div className={`tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4`}>
        {/* Vendor Details Card */}
        <div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
            <h3 className="tw:text-base tw:font-semibold">
              {t("vendorDetails")}
            </h3>
          </div>

          <div className="tw:space-y-2 tw:text-sm">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("name")}
              </span>
              <span>: {vendor.name || "N/A"}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("contact")}
              </span>
              <span>: {vendor.contact?.[0]?.name || "N/A"}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("email")}
              </span>
              <span>: {vendor.contact?.[0]?.email || "N/A"}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("phone")}
              </span>
              <span>: {vendor.contact?.[0]?.mobile || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Order Summary Card */}
        <div>
          <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
            <h3 className="tw:text-base tw:font-semibold">
              {t("orderSummary")}
            </h3>
          </div>

          <div className="tw:space-y-2 tw:text-sm">
            <div className="tw:flex tw:items-center tw:gap-4">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("products")}
              </span>
              <span>: {productCount}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-4">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("totalItems")}
              </span>
              <span>: {totalItems}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-4">
              <span className="tw:font-medium tw:w-1/2 tw:md:w-1/3">
                {t("orderValue")}
              </span>
              <span>
                :
                <Amount value={orderValue} decimalPlaces={2} />
              </span>
            </div>

            <div className="tw:pt-2">
              <Controller
                name="expectedDate"
                control={control}
                render={({ field }) => (
                  <AppDateInput
                    label={t("expectedDate")}
                    value={field.value}
                    callback={field.onChange}
                    placeholder={t("selectExpectedDeliveryDate")}
                    isRequired
                    dateConfig={dateConfig}
                  />
                )}
              />
            </div>
          </div>
        </div>
        {/* Optional Remarks */}
        <div className="tw:col-span-1 tw:md:col-span-2 tw:mt-4">
          <AppTextarea
            label={t("remarks") + " (optional)"}
            name="remarks"
            register={register}
            placeholder={t("addAnyRemarksForThisOrder")}
            rows={3}
            maxLength={500}
            inputClassName="tw:resize-none"
          />
        </div>
      </div>
    </AppCard>
  );
};

export default PoOverview;
