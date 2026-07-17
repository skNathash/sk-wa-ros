import { ArrowDownCircle, ArrowUpCircle, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import AppTab from "~/components/core/tab/AppTab";
import AppButton from "~/components/core/button/AppButton";
import CommonService from "~/services/CommonService";
import useAppToast from "~/hooks/useAppToast";
import useAppNav from "~/hooks/useAppNav";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AccountService from "~/services/AccountService";
import { preparePaymentPayload, validateFormData } from "./helper";
import type { BreadcrumbItem, TabItem } from "~/types/CommonTypes";
import PaymentInput from "./components/PaymentInput";
import PaymentSourceCard from "./components/PaymentSourceCard";
import TransactionDetails from "./components/TransactionDetails";
import RecentTransactions from "./components/recent-transaction/RecentTransactions";
import RecordPaymentSuccessModal from "~/shared/accounts/modals/record-payment/success/RecordPaymentSuccessModal";
import ManageExpense from "./components/expenses/manage/ManageExpense";
import RecentExpenses from "./components/expenses/recent-expenses/RecentExpenses";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "Accounts",
    langKey: "accounts",
    redirect: {
      path: "/dashboard/accounts/payables",
      params: {
        tab: "payables",
      },
    },
  },
  { label: "Record Payment", langKey: "recordPayment" },
];

const tabs: TabItem[] = [
  {
    name: "Receive Payment",
    key: "receivePayment",
    icon: <ArrowUpCircle color="green" />,
  },
  {
    name: "Make Payout",
    key: "makePayout",
    icon: <ArrowDownCircle color="red" />,
  },
  {
    name: "Expenses",
    key: "expense",
    icon: <ArrowDownCircle color="red" />,
  },
];

type RecordPaymentFormValues = {
  paymentFromType: string;
  paymentToType: string;
  entity: any[] | null;
  amount?: number;
  paymentMethod: string;
  referenceId: string;
  notes: string;
};

const defaultFormValues: RecordPaymentFormValues = {
  paymentFromType: "",
  paymentToType: "",
  entity: null,
  amount: undefined,
  paymentMethod: "",
  referenceId: "",
  notes: "",
};

const RecordPayment = () => {
  const { t } = useTranslation(["common"]);

  const appToast = useAppToast();

  const methods = useForm({
    defaultValues: defaultFormValues,
  });

  const entity = useWatch({ control: methods.control, name: "entity" });

  const appNav = useAppNav();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("receivePayment");

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    counterpartyName?: string;
    isPayout?: boolean;
    amount?: number | string;
  }>({});
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [expenseRefreshSignal, setExpenseRefreshSignal] = useState(0);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabs.some((t) => t.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabItem) => {
    methods.reset(defaultFormValues);
    setActiveTab(tab.key);
    appNav.to(location.pathname, { tab: tab.key });
  };

  const onSubmit = (data: any) => {
    // Validate form data before proceeding; pass activeTab from component state
    const { msg, status } = validateFormData(data, activeTab);
    if (!status) {
      // show toast with error message
      appToast.show({ msg: msg || "Invalid input.", color: "error" });
      return;
    }

    // Open confirmation dialog; actual API call will be done in onConfirm
    setAppAlertDialog({
      show: true,
      title: "Confirm",
      description:
        activeTab === "receivePayment"
          ? "Are you sure you want to record this payment?"
          : "Are you sure you want to make this payout?",
      onConfirm: async () => {
        // close dialog immediately
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        // small delay to allow dialog close animation
        await new Promise((r) => setTimeout(r, 200));
        await doSubmit(data);
      },
      onCancel: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const doSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      // Prepare payload - include activeTab so backend can distinguish if needed
      const payload = preparePaymentPayload(formData, activeTab);

      const resp = await AccountService.submitPayment(payload);

      if (resp?.statusCode === 200) {
        appToast.show({
          msg: "Payment recorded successfully.",
          color: "success",
        });
        // Optionally reset the form
        methods.reset(defaultFormValues);
        // trigger recent transactions refresh
        setRefreshSignal((s) => s + 1);
        // show success modal with details
        setSuccessModalData({
          counterpartyName: formData.entity?.[0]?.value?.name,
          isPayout: activeTab !== "receivePayment",
          amount: Number(formData.amount) || 0,
        });
        setShowSuccessModal(true);
      } else {
        appToast.show({
          msg: resp?.data?.message || "Failed to record payment.",
          color: "error",
        });
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Error submitting payment:", error);
      appToast.show({ msg: "Error recording payment.", color: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AppHeader title={t("recordPayment")} />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container">
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:items-start tw:md:items-center tw:mb-4 tw:gap-4">
            <div className="tw:flex-1">
              <AppBreadcrumbs data={breadcrumbs} />
              <PageDescription description="recordPayment" />
            </div>
          </div>

          <AppTab
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            className="tw:mb-4"
          />

          {/* Tab specific description */}
          <div className="tw:mb-4">
            <div className="tw:md:text-sm tw:text-xs tw:text-gray-500">
              {activeTab === "receivePayment"
                ? "Record incoming payments from customers. Attach reference and notes for each transaction."
                : activeTab === "makePayout"
                ? "Make payouts to vendors or partners. Ensure amounts and references are correct before confirming."
                : "Create and manage expenses. Categorize and review recent expense transactions."}
            </div>
          </div>

          {activeTab === "expense" ? (
            // Expense tab: show expense form and recent expenses side-by-side
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
              <div>
                <ManageExpense
                  onSaved={() => setExpenseRefreshSignal((s) => s + 1)}
                />
              </div>
              <div>
                <RecentExpenses refreshSignal={expenseRefreshSignal} />
              </div>
            </div>
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)}>
                <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4">
                  <div>
                    <PaymentSourceCard activeTab={activeTab} />

                    {Array.isArray(entity) && entity.length > 0 ? (
                      <>
                        <PaymentInput activeTab={activeTab} />
                        <div className="tw:mt-4">
                          <TransactionDetails />
                        </div>
                        <div className="tw:mt-4 tw:flex tw:justify-end">
                          <AppButton
                            type="submit"
                            color="success"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                          >
                            <CheckCheck />{" "}
                            {isSubmitting
                              ? activeTab === "receivePayment"
                                ? t("receiving")
                                : t("processing")
                              : activeTab === "receivePayment"
                              ? t("receive")
                              : t("payout")}
                          </AppButton>
                        </div>
                      </>
                    ) : null}
                  </div>

                  <div>
                    <RecentTransactions
                      activeTab={activeTab}
                      refreshSignal={refreshSignal}
                    />
                  </div>
                </div>
              </form>
            </FormProvider>
          )}
        </div>
      </div>
      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
      <RecordPaymentSuccessModal
        show={showSuccessModal}
        callback={() => setShowSuccessModal(false)}
        counterpartyName={successModalData.counterpartyName}
        isPayout={successModalData.isPayout}
        amount={successModalData.amount || 0}
      />
    </>
  );
};

export default RecordPayment;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Record Payment"),
    },
  ];
}
