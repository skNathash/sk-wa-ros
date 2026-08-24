import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import KeyValue from "~/components/core/key-value/KeyValue";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";
import AuthService from "~/services/AuthService";

type Props = {
  orderId: string;
  invoices: any[];
};

const Payment = ({ orderId, invoices }: Props) => {
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const details = await AccountService.getAdvanceBalanceStatement(
        AuthService.getLoggedInUserId() || "",
        AuthService.getUserAccountId() || "",
        {
          filter: {
            $or: [
              { entityId: { $in: [orderId, ...invoices] } },
              { invoiceId: { $in: [orderId, ...invoices] } },
            ],
          },
        },
      );
      setDetails(details.data);
      setLoading(false);
    };
    fetchDetails();
  }, [orderId, invoices]);

  if (loading) {
    return (
      <div className="tw:p-4 tw:text-center">
        <AppSpinner />
      </div>
    );
  }

  return (
    <>
      {details && details.length > 0 ? (
        <>
          {details.map((detail: any) => (
            <div key={detail._id}>
              <AppCard>
                <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-4">
                  <KeyValue label={t("reference")} size="sm">
                    {detail.referenceId || detail.transferID}
                  </KeyValue>
                  <KeyValue label={t("date")} size="sm">
                    <DateFormat value={detail.date} formatStr="dd MMM yyyy" />
                    <div className="tw:text-xs tw:text-gray-500">
                      <DateFormat value={detail.date} formatStr="hh:mm a" />
                    </div>
                  </KeyValue>

                  <KeyValue label={t("creditDebit")} size="sm">
                    <AppBadge
                      variant={
                        detail.payoutType === "Credit" ? "success" : "danger"
                      }
                    >
                      {detail.payoutType}
                    </AppBadge>
                  </KeyValue>

                  <KeyValue label={t("amount")} size="sm">
                    <AppBadge
                      variant={
                        detail.payoutType === "Credit" ? "success" : "danger"
                      }
                    >
                      <Amount value={detail.amount} decimalPlaces={2} />
                    </AppBadge>
                  </KeyValue>
                </div>

                <div className="tw:mt-4">
                  <KeyValue label={t("remarks")} size="sm">
                    {detail.remarks}
                  </KeyValue>
                </div>
              </AppCard>
            </div>
          ))}
        </>
      ) : (
        <AppCard>
          <NoData />
        </AppCard>
      )}
    </>
  );
};

export default Payment;
