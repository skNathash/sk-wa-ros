import { CheckCircle } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import AppModal from "~/components/core/modal/AppModal";
import KeyValue from "~/components/core/key-value/KeyValue";
import ImgRender from "~/components/core/img/ImgRender";
import AppButton from "~/components/core/button/AppButton";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  hostData: any;
};

const HostToHostModal = ({ show, callback, hostData }: Props) => {
  const handleClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={handleClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={handleClose} noShadow>
        Express Deposit
      </AppModal.Title>
      <AppModal.Content className="tw:h-max-[90vh] modal-bg">
        <AppCard className="tw:mt-4">
          <ImgRender
            src="/deposit-money/host-to-host.jpg"
            className="tw:mb-4"
            alt="Host to Host"
          />
          <div className="tw:text-lg tw:font-bold tw:mb-2 tw:text-center tw:pb-4">
            Exclusive Bank Account Number for You!
          </div>

          {hostData?.map((item: any) => (
            <div
              key={item.id}
              className="tw:grid tw:gap-2 tw:mb-4 tw:border-b tw:border-gray-200 tw:pb-4 tw:last:border-b-0"
            >
              <div className="tw:text-base tw:font-bold">{item.name}</div>
              <div className="tw:grid tw:gap-2 tw:grid-cols-2">
                <KeyValue label="Deposit Account Number" size="sm">
                  {item.accountNumber}
                </KeyValue>
                <KeyValue label="IFSC Code" size="sm">
                  {item.ifscCode}
                </KeyValue>
              </div>
            </div>
          ))}
        </AppCard>

        <AppCard title="Express Deposits">
          {points1.map((point, index) => (
            <div key={index} className="tw:flex tw:gap-2 tw:mb-4">
              <CheckCircle className="tw:text-green-500 tw:mt-1 tw-w-4 tw-h-4" />
              <span className="tw:text-sm tw:font-medium tw:flex-1">
                {point}
              </span>
            </div>
          ))}
        </AppCard>

        <AppCard title="Time Taken for Amount to Reflect in your Account">
          {points2.map((point, index) => (
            <div key={index} className="tw:flex tw:gap-2 tw:mb-4">
              <CheckCircle className="tw:text-green-500 tw:mt-1 tw-w-4 tw:h-4" />
              <span className="tw:text-sm tw:font-medium tw:flex-1">
                {point}
              </span>
            </div>
          ))}
        </AppCard>

        <AppCard title="IMPORTANT NOTE">
          {points3.map((point, index) => (
            <div key={index} className="tw:flex tw:gap-2 tw:mb-4">
              <CheckCircle className="tw:text-green-500 tw:mt-1 tw-w-4 tw:h-4" />
              <span className="tw:text-sm tw:font-medium tw:flex-1">
                {point}
              </span>
            </div>
          ))}
        </AppCard>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-2">
          <AppButton color="light" fill="outline" onClick={handleClose}>
            Close
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

const points1 = [
  "StoreKing Launches Express Deposit, Get Instant Credit into your StoreKing Account.",
  "Transfer Money to above Exclusive Bank Account and Get your Balance Updated Immediately.",
  "No more waiting for long hours to get your Money into your Storeking Balance.",
  "Transfers Money through IMPS and get Instant Credit even on Bank Holidays.",
  "Do an IMPS / NEFT / RTGS from your Bank and Get Instant Credit. ",
  "No Need to 'Make Deposit' in StoreKing App if Amount transferred to Above Exclusive Bank Accounts.",
];

const points2 = [
  "IMPS Transfers: Approximate Time 10 minutes.",
  "NEFT Transfers: Approximate Time 2 hours.",
  "RTGS Transfers: Approximate Time 2 hours",
];

const points3 = [
  "CASH Deposit is not accepted to this account, Only IMPS / NEFT / RTGS is allowed.",
  "Every Retailer has a Different Account Number, Do not Transfer Money to Account Number given by other Retailer or Sales Team.",
];

export default HostToHostModal;
