import { useEffect, useState } from "react";
import DealFeatureModal from "../modals/deal-feature/DealFeatureModal";
import ProductSlabModal from "~/shared/catalog/modals/product-slab/ProductSlabModal";

type Props = {
  deal: any;
  sellerId?: string;
  dealId?: string;
  action: "group-deal" | "price-slab" | string;
  callback: (a: {
    action: string;
    deal: any;
    dealAction?: string;
    moduleData?: any;
  }) => void;
};

const AddToCartActionHandler = ({
  deal,
  action,
  callback,
  sellerId,
  dealId,
}: Props) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = deal?._id || dealId;
    setShow(id ? true : false);
  }, [deal?._id, dealId, sellerId]);

  const cb = (e: any) => {
    setShow(false);
    callback({
      action: e.action,
      deal,
      dealAction: action,
      moduleData: e.moduleData,
    });
  };

  return (
    <>
      {action == "group-deal" ? (
        <DealFeatureModal
          dealId={deal._id}
          show={show}
          callback={cb}
          sellerId={deal.buyFromOtherRetailer?.retailerId}
        />
      ) : null}

      {action == "price-slab" ? (
        <ProductSlabModal
          dealId={dealId || ""}
          show={show}
          callback={cb}
          sellerId={sellerId || ""}
        />
      ) : null}
    </>
  );
};

export default AddToCartActionHandler;
