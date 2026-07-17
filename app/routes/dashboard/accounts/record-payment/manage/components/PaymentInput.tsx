import React, { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import AccountService from "~/services/AccountService";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppCard from "~/components/core/card/AppCard";
import Amount from "~/components/core/amount/Amount";
import { AppInput } from "~/components/core/form";
import { IndianRupee } from "lucide-react";

type Props = {
  activeTab?: string;
};

const PaymentInput: React.FC<Props> = ({ activeTab }) => {
  const { register, control, setValue } = useFormContext();

  const entity = useWatch({ control, name: "entity" });

  const entityId = entity?.[0]?.value?.id;

  const [amountValue] = useWatch({
    control,
    name: ["amount"],
  });

  const [overallPayment, setOverallPayment] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(false);

  const isReceive = activeTab === "receivePayment";

  useEffect(() => {
    const fetchAmount = async () => {
      // Clear previous amount immediately when entity changes
      // so the UI doesn't show stale amounts while new data is loading.
      setValue("amount", undefined);
      setOverallPayment(0);
      setLoading(true);
      try {
        const type = isReceive ? "receivables" : "payables";

        let params: Record<string, any> = { type };
        params.partyId = entityId;

        // API expects params - pass type
        const response = await AccountService.getPayablesReceiveables(params);
        const value = response?.data?.data?.reduce(
          (acc: number, curr: any) =>
            acc + Number(curr?.outstandingAmount || 0),
          0
        );
        setOverallPayment(Number(value) || 0);
      } catch (err) {
        setOverallPayment(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAmount();
  }, [entityId, isReceive, setValue]);

  return (
    <AppCard
      title={isReceive ? "2. Apply Payment" : "2. Apply Payout"}
      subtitle={
        isReceive ? "Enter the amount to apply" : "Enter the payout amount"
      }
      className="tw:mb-0"
    >
      <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
        <div className="tw:text-sm tw:text-gray-600">
          {isReceive ? "Total Due Amount" : "Total Payout Amount"}
        </div>
        <div className="tw:text-lg tw:font-semibold tw:text-gray-900">
          {loading ? (
            <AppSpinner size="sm" />
          ) : (
            <Amount value={overallPayment} />
          )}
        </div>
      </div>

      <div>
        <AppInput
          name="amount"
          register={register}
          placeholder={"Enter amount"}
          className="tw:w-full"
          leftIcon={<IndianRupee color="green" />}
          label="Enter amount"
          isRequired={true}
        />
        {Number(amountValue) > Number(overallPayment) && (
          <div className="tw:mt-2 tw:text-xs tw:text-gray-600">
            Any amount greater than the total amount will be recorded as an
            advance.
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default PaymentInput;
