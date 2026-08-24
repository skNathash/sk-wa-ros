import { Plus } from "lucide-react";
import { useCallback } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useTheme from "~/hooks/useTheme";
import CommonService from "~/services/CommonService";
import {
  ACCOUNTS_SUB_TAB_PARAM,
  getAccountsSubTabKey,
} from "~/shared/accounts/components/accounts-tabs/helper";
import Aging from "./components/aging/Aging";
import Filter from "./components/Filter";
import PayableStats from "./components/payable-stats/PayableStats";
import RecentPayments from "./components/recent-payments/RecentPayments";
import VendorsYouOwe from "./components/vendors-you-owe/VendorsYouOwe";
import type { PaymentToolbarForm } from "./helper";

/**
 * Money out — the payables side of accounts, read top-down: what is still owed
 * and what has already gone out, the controls the page is searched through,
 * which vendors are waiting on money, and finally the feed of what has just
 * been paid.
 *
 * Every block owns its own data through its `helper.ts`; the page only carries
 * the filter form and the actions the rows raise.
 */
const MoneyOut = () => {
  const { t } = useTranslation(["common"]);
  const appNav = useAppNav();
  const appToast = useAppToast();
  const isTheme2 = useTheme() === "theme-2";
  const [searchParams] = useSearchParams();

  /* Theme-2 splits the page across the accounts tab tray the layout renders
     above it (vendors / aging / credit-debit notes); everywhere else the page
     is the vendors view on its own. */
  const subTab = getAccountsSubTabKey(
    "/dashboard/accounts/money-out",
    searchParams.get(ACCOUNTS_SUB_TAB_PARAM),
  );
  const view = isTheme2 ? subTab : "vendors";

  /* What each tray tab shows, block by block:
     - vendors — who is waiting on money, and the feed of what has gone out
     - aging   — the same payable cut by how old it is
     - notes   — credit / debit notes, still to land */
  const isAgingView = view === "aging";
  const showVendors = view === "vendors";

  const form = useForm<PaymentToolbarForm>({
    defaultValues: { search: "", dateRange: [] },
  });

  const handleFilterCallback = useCallback(
    (_payload: { action: string; data: PaymentToolbarForm }) => {
      /* The lists below read the form themselves once the payables endpoint
         lands; nothing to do with the change yet. */
    },
    [],
  );

  const handleVendorsCallback = useCallback(
    (payload: { action: string; data?: any }) => {
      if (payload.action === "pay" || payload.action === "payAll") {
        appNav.to("/dashboard/accounts/record-payment");
        return;
      }
      if (payload.action === "chat") {
        appToast.show({
          msg: `Message queued for ${payload.data?.name}`,
          color: "success",
        });
      }
    },
    [appNav, appToast],
  );

  return (
    <>
      <PayableStats />

      {/* The one row of controls the whole page is read through — find a bill,
          narrow the window, or jump straight into recording a payment. */}
      <div className="tw:mb-3 tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        {/* <FormProvider {...form}>
          <Filter callback={handleFilterCallback} />
        </FormProvider> */}

        {/* <AppButton
          className="tw:shrink-0"
          onClick={() => appNav.to("/dashboard/accounts/record-payment")}
        >
          <Plus size={16} />
          {t("recordPayment")}
        </AppButton> */}
      </div>

      {isAgingView && <Aging />}

      {showVendors && (
        <>
          <VendorsYouOwe callback={handleVendorsCallback} />

          <RecentPayments />
        </>
      )}
    </>
  );
};

export default MoneyOut;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Money Out"),
    },
  ];
}
