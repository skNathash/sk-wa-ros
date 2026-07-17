import { debounce, find } from "lodash";
import React, { useCallback, useState, useEffect } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import { AppInput, AppSelect } from "~/components/core/form";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AuthService from "~/services/AuthService";
import CommissionService from "~/services/CommissionService";

type Props = {
  callback: (a: { data: CardPaymentData }) => void;
  amount: number;
};

type CardPaymentData = {
  amount: number;
  charge: number;
  displayCharge: number;
  total: number;
  paymentType: string;
  cardNumber: string;
  cardHolderName: string;
};

const defaultValues: CardPaymentData = {
  amount: 0,
  charge: 0,
  displayCharge: 0,
  total: 0,
  paymentType: "Credit",
  cardNumber: "",
  cardHolderName: "",
};

const CardPayment: React.FC<Props> = ({ callback, amount }) => {
  const { register, setValue, getValues, control } = useForm({
    defaultValues: { ...defaultValues },
  });

  const [loadingCommission, setLoadingCommission] = useState(false);

  const handleChange = useCallback(
    debounce(() => {
      callback({
        data: getValues(),
      });
    }, 500),
    [getValues]
  );

  const handleCardholderNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setValue("cardHolderName", (value || "").replace(/[^A-z\s]/gi, "").trim());
    handleChange();
  };

  const onTypeChange = async () => {
    const formData = getValues();

    setValue("charge", 0);
    setValue("total", getTotal());
    setValue("displayCharge", 0);

    if (!formData.paymentType) {
      handleChange();
      return;
    }

    setLoadingCommission(true);
    let params = getCommParams(formData.paymentType + " Card");
    const r = await CommissionService.getDigitalCommission(params);
    setLoadingCommission(false);
    setValue("charge", r.data.amount);
    setValue("total", getTotal());
    setValue("displayCharge", calculateCharge());

    handleChange();
  };

  // Calculate commission on initial mount for default payment type
  useEffect(() => {
    // call onTypeChange to compute charge for default 'Credit' selection
    onTypeChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [charge, total, displayCharge] = useWatch({
    control: control,
    name: ["charge", "total", "displayCharge"],
  });

  const getTotal = () => {
    const formData = getValues();
    let amt = 1 * getDiscountedAmt();
    if (formData.charge > 0) {
      amt = amt + 1 * formData.charge;
    }
    return 1 * amt;
  };

  const calculateCharge = () => {
    const formData = getValues();
    let amt = 1 * getDiscountedAmt();
    let charge = (1 * formData.charge * 100) / (1 * amt);
    return Number(charge.toFixed(2));
  };

  const getCommParams = (op: any) => {
    let fran = AuthService.getLoggedInUser();
    let partner;
    if (op == "Credit Card") {
      partner = find(fran.services.paymentGatewayCredit || [], {
        active: true,
      });
    } else if (op == "Debit Card") {
      partner = find(fran.services.paymentGatewayDebit || [], {
        active: true,
      });
    } else if (op == "NetBanking Card") {
      partner = find(fran.services.paymentGatewayNetBanking || [], {
        active: true,
      });
      op = "NetBanking";
    } else if (op == "UPI Card") {
      let services = AuthService.getLoggedInUser().services || {};
      partner = find(services.paymentGatewayUPI || [], {
        active: true,
      });
      op = "UPI";
    } else if (op == "Cug Card") {
      partner = find(fran.services.paymentGatewayCUG || [], {
        active: true,
      });
      op = "CUG Card";
    }

    if (!partner || !partner.partnerId) {
      // NO partner enabled
      return {};
    }

    let params = {
      partnerId: partner.partnerId,
      type: "Payment Gateway",
      operation: op,
      franchise: fran._id,
      amount: 1 * getDiscountedAmt(),
    };

    return params;
  };

  const getDiscountedAmt = () => {
    let amt = 1 * amount;
    return amt;
  };

  return (
    <>
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-3 tw:gap-4">
        <Controller
          control={control}
          name="paymentType"
          render={({ field }) => (
            <AppSelect
              label="Payment Type"
              options={paymentTypeOptions}
              value={field.value}
              onChange={async (val: any) => {
                field.onChange(val);
                // ensure commission recalculation after value set
                await onTypeChange();
              }}
            />
          )}
        />

        <AppInput
          type="number"
          name="cardNumber"
          label="Card Number"
          placeholder="Enter your card number"
          register={register}
          onChange={handleChange}
          maxLength={16}
        />

        <AppInput
          name="cardHolderName"
          label="Card Holder Name"
          placeholder="Enter your card holder name"
          register={register}
          onChange={handleCardholderNameChange}
        />
      </div>

      {loadingCommission && (
        <div className="tw:text-red-500 tw:flex tw:items-center tw:gap-2">
          Please wait <AppSpinner />
        </div>
      )}

      {charge > 0 && (
        <>
          <div className="tw:border-b tw:border-gray-300 tw:py-2 tw:mb-2"></div>
          <div className="tw:flex tw:flex-col tw:md:flex-row tw:gap-x-4 tw:gap-y-2">
            <div className="tw:text-red-500">
              <KeyValue label="Charges" horizontal size="sm">
                : <Amount value={charge} decimalPlaces={2} /> ({displayCharge}%)
              </KeyValue>
            </div>
            <div className="tw:text-red-500">
              <KeyValue label="Final Amount" horizontal size="sm">
                : <Amount value={total} decimalPlaces={2} />
              </KeyValue>
            </div>
          </div>
        </>
      )}
    </>
  );
};

const paymentTypeOptions = [
  { label: "Credit Card", value: "Credit" },
  { label: "Debit Card", value: "Debit" },
];

export default CardPayment;
