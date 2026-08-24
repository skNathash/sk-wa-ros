import { useEffect, useState } from "react";

import type { ScanResultRow } from "./helper";

/**
 * Per-row cart state shared by the desktop row and the mobile card, so
 * subscribing one product never re-renders the rest of the list and both views
 * react to a fresh scan the same way.
 */
const useResultCart = (row: ScanResultRow) => {
  const { deal } = row;
  const [qty, setQty] = useState(0);
  const [inCart, setInCart] = useState(!!deal?.isInCart);
  const [addedQty, setAddedQty] = useState(deal?.cartQuantity || 0);

  useEffect(() => {
    setQty(0);
    setInCart(!!deal?.isInCart);
    setAddedQty(deal?.cartQuantity || 0);
  }, [row.key, deal?.isInCart, deal?.cartQuantity]);

  /** Called from SubscribeBtn once the deal actually lands in the cart. */
  const onSubscribed = () => {
    setAddedQty(qty);
    setInCart(true);
  };

  return { qty, setQty, inCart, addedQty, onSubscribed };
};

export default useResultCart;
