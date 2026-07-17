import AppModal from "~/components/core/modal/AppModal";
import ProductVariants from "../../variants/ProductVariants";
import { AuthService } from "~/services/AuthService";

type Props = {
  show: boolean;
  dealId: string;
  callback: (a: { action: string; moduleData?: any }) => void;
  sellerId?: string;
};

const DealFeatureModal = ({ dealId, show, callback, sellerId }: Props) => {
  const onClose = () => {
    callback({ action: "close" });
  };

  const finalCartType = sellerId
    ? "buy-from-other-retailer"
    : AuthService.isBuyerUser()
      ? "buyer"
      : "normal";

  return (
    <AppModal callback={callback} show={show} className="tw:h-[80vh]">
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:justify-between tw:w-full">
          <div className="tw:text-lg tw:font-medium">Variants</div>
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh]">
        <ProductVariants
          dealId={dealId}
          cartType={finalCartType}
          sellerId={sellerId}
        />
      </AppModal.Content>
    </AppModal>
  );
};

export default DealFeatureModal;
