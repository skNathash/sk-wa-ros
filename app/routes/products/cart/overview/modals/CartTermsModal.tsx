import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppModal from "~/components/core/modal/AppModal";

type Props = {
  show: boolean;
  callback: (a: { action: string }) => void;
};

const CartTermsModal = ({ show, callback }: Props) => {
  const onClose = () => {
    callback({ action: "close" });
  };

  return (
    <AppModal show={show} callback={onClose} className="offcanvas-modal">
      <AppModal.Title onClose={onClose}>Terms and Conditions</AppModal.Title>
      <AppModal.Content className="tw:p-4 tw:bg-white">
        <AppCard>
          <div className="tw:flex tw:gap-2 tw:text-sm  tw:mb-4">
            <div>1.</div>
            <div>
              StoreKing tries its best to honor the price which was shown during
              checkout, but sometimes due to availability of latest product with
              better brand offers or change in packaging, the price of the
              product might increase or decrease.
            </div>
          </div>

          <div className="tw:flex tw:gap-2 tw:text-sm  tw:mb-4">
            <div>2.</div>
            <div>
              Incase Price decreases StoreKing will happily refund retailer
              difference of price, same way incase Price increases due to Change
              in MRP by brand, proportionate amount will be debited from
              Retailer.
            </div>
          </div>

          <div className="tw:flex tw:gap-2 tw:text-sm  tw:mb-4">
            <div>3.</div>
            <div>
              This is done to ensure Retailer gets Product with Best Offers,
              Recently Manufactured at Competitive Price.
            </div>
          </div>

          <div className="tw:flex tw:gap-2 tw:text-sm  tw:mb-4">
            <div>4.</div>
            <div>
              You would receive a Notification whenever account is debited due
              to increase in Price.
            </div>
          </div>
        </AppCard>
      </AppModal.Content>
      <AppModal.Footer>
        <div>
          <div className="tw:text-end tw:px-4">
            <AppButton onClick={onClose}>I Understand</AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default CartTermsModal;
