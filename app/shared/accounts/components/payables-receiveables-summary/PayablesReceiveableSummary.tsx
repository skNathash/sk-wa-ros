import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AccountService from "~/services/AccountService";

const fetchAmount = async (
  type: "receivables" | "payables",
  id: string,
  isMyView?: boolean,
) => {
  try {
    let params: Record<string, any> = { type, partyId: id };

    // if (type === "receivables") {
    //   params.filter = {
    //     "toParty.id": id,
    //   };
    // } else {
    //   params.filter = {
    //     "fromParty.id": id,
    //   };
    // }

    // API expects params - pass type
    const response = await AccountService.getPayablesReceiveables(params);

    const value = response?.data?.data?.reduce(
      (acc: number, curr: any) => acc + Number(curr?.outstandingAmount),
      0,
    );
    return Number(value) || 0;
  } catch (err) {
    return 0;
  }
};

const PayablesReceiveableSummary = ({
  entityId,
  isMyView = false,
}: {
  entityId: string;
  isMyView?: boolean;
}) => {
  const { t } = useTranslation(["common"]);

  const [receivables, setReceivables] = useState(0);
  const [payables, setPayables] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entityId) {
      fetchSummaryData();
    } else {
      setLoading(false);
      setReceivables(0);
      setPayables(0);
    }
  }, [entityId]);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const receivables = await fetchAmount("receivables", entityId, isMyView);
      const payables = await fetchAmount("payables", entityId, isMyView);
      setReceivables(receivables);
      setPayables(payables);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-4">
      <div className="tw:bg-green-50 tw:p-4 tw:rounded-lg">
        <div className="tw:text-sm tw:font-medium tw:text-green-800">
          Receivables
        </div>
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[40px]">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        ) : (
          <Amount
            value={receivables}
            className="tw:text-2xl tw:font-bold tw:text-green-800"
            decimalPlaces={0}
          />
        )}
      </div>

      <div className="tw:bg-red-50 tw:p-4 tw:rounded-lg">
        <div className="tw:text-sm tw:font-medium tw:text-red-700">
          Payables
        </div>
        {loading ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[40px]">
            <AppSpinner className="tw:w-6 tw:h-6" />
          </div>
        ) : (
          <Amount
            value={payables}
            className="tw:text-2xl tw:font-bold tw:text-red-900"
            decimalPlaces={0}
          />
        )}
      </div>
    </div>
  );
};

export default PayablesReceiveableSummary;
