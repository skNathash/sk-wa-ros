import { PlusCircle } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import type { CartAction, Deal } from "~/types/CommonTypes";

type Props = {
  deal: Deal;
  callback: (a: CartAction) => void;
};

const AddToBasket = ({ deal, callback }: Props) => {
  return (
    <>
      <AppButton
        onClick={() => {
          callback({ action: "add-to-basket", data: deal });
        }}
        size="small"
        color="secondary"
        noShadow={true}
        type="button"
        className="add-to-basket-btn"
      >
        <PlusCircle />
        Purchase Basket
      </AppButton>
    </>
  );
};

export default AddToBasket;
