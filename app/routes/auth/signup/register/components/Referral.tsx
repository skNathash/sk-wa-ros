import { debounce } from "lodash";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { AppInput } from "~/components/core/form";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import InpBlock from "./InpBlock";
import { User, Users } from "lucide-react";

const Referral = () => {
  const appToast = useAppToast();
  const { register, control, setValue, getValues } = useFormContext();

  const [verifying, setVerifying] = useState(false);

  const [franchiseDetails] = useWatch({
    control,
    name: ["franchiseDetails"],
  });

  const verifyReferralCode = debounce(() => {
    const code = getValues("referralCode");

    if (!code) {
      setValue("franchiseDetails", null);
      setValue("verifiedReferralCode", "");
      return;
    }

    setVerifying(true);

    FranchiseService.searchFranchise({
      referenceCode: code,
    })
      .then((response) => {
        if (
          response.statusCode === 200 &&
          Array.isArray(response.data?.data) &&
          response.data?.data.length > 0
        ) {
          const franchiseData = response.data?.data[0];

          if (franchiseData.OwnerMobileNo === parseInt(getValues("mobile"))) {
            appToast.show({
              msg: "You cannot use your own mobile number as referral code",
              color: "danger",
            });
            setValue("franchiseDetails", null);
            setValue("verifiedReferralCode", "");
            setValue("referralCode", "");
            return;
          }

          setValue("franchiseDetails", franchiseData);
          setValue("verifiedReferralCode", franchiseData.referralCode || "");
          appToast.show({
            msg: "Referral code verified successfully",
            color: "success",
          });
        } else {
          setValue("franchiseDetails", null);
          setValue("verifiedReferralCode", "");
          appToast.show({
            msg: "Invalid referral code",
            color: "danger",
          });
          setValue("referralCode", "");
        }
      })
      .catch(() => {
        setValue("franchiseDetails", null);
        setValue("verifiedReferralCode", "");
        appToast.show({
          msg: "Failed to verify referral code",
          color: "danger",
        });
      })
      .finally(() => {
        setVerifying(false);
      });
  }, 1000);

  return (
    <>
      <InpBlock title="Referral" icon={<Users size={20} />}>
        <div>
          <AppInput
            name="referralCode"
            register={register}
            label="Referral Code"
            placeholder="Enter your referral code"
            className="tw:mb-4"
            onChange={verifyReferralCode}
          />

          {verifying && <span>Verifying...</span>}

          {franchiseDetails && franchiseDetails.name && (
            <div className="tw:mt-4 tw:bg-gray-50 tw:rounded-lg tw:border tw:border-gray-200">
              <div className="tw:p-4 tw:border-b tw:border-gray-200">
                <div className="tw:flex tw:items-center">
                  <User
                    className="tw:text-xl tw:text-app-primary tw:mr-2"
                    size={18}
                  />
                  <div className="tw:font-medium tw:text-gray-700">
                    Referrer Details
                  </div>
                </div>
              </div>
              <div className="tw:p-4">
                <div className="tw:space-y-3">
                  <div className="tw:flex tw:items-start">
                    <div className="tw:w-20 tw:text-gray-500 tw:text-sm">
                      Name
                    </div>
                    <div className="tw:flex-1 tw:text-sm tw:font-medium tw:text-gray-700">
                      {franchiseDetails.name}
                    </div>
                  </div>
                  <div className="tw:flex tw:items-start">
                    <div className="tw:w-20 tw:text-gray-500 tw:text-sm">
                      Location
                    </div>
                    <div className="tw:flex-1 tw:text-sm tw:text-gray-700">
                      {franchiseDetails.town}, {franchiseDetails.district},{" "}
                      {franchiseDetails.state}
                    </div>
                  </div>
                  <div className="tw:flex tw:items-start">
                    <div className="tw:w-20 tw:text-gray-500 tw:text-sm">
                      Pincode
                    </div>
                    <div className="tw:flex-1 tw:text-sm tw:text-gray-700">
                      {franchiseDetails.pincode}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </InpBlock>
    </>
  );
};

export default Referral;
