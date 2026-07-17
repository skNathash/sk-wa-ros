import { ArrowRight, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import InventorySubscribeService from "~/services/InventorySubscribeService";

interface CartItemsProps {
  onClose?: () => void;
}

const CartItems = ({ onClose }: CartItemsProps) => {
  const appNav = useAppNav();
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);

  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchCartItems = async () => {
      setLoading(true);
      const response = await InventorySubscribeService.getCart();
      const formattedCartItems =
        InventorySubscribeService.formatCartProductsResponse(
          response.data.data?.products || []
        );
      setCartItems(formattedCartItems);
      setLoading(false);
    };
    fetchCartItems();
  }, []);

  const handleProceed = () => {
    appNav.to("/dashboard/inventory/subscribe/cart");
  };

  const handleRemove = async (itemId: string, index: number) => {
    setRemovingIndex(index);
    const response = await InventorySubscribeService.removeRequestItem(itemId);
    setRemovingIndex(null);
    if (response.statusCode === 200) {
      const newCartItems = cartItems.filter((item) => item.itemId !== itemId);

      InventorySubscribeService.removeLocalCartItem(itemId);

      InventorySubscribeService.triggerItemRemovedEvent({ itemId });

      setCartItems(newCartItems);
      appToast.show({
        msg: response.data?.message || "Item removed from cart",
        color: "success",
      });
    } else {
      appToast.show({
        msg: response.data?.message || "Failed to remove item from cart",
        color: "danger",
      });
    }
  };

  return (
    <div className="tw:rounded-lg tw:shadow-md tw:border tw:border-gray-200 tw:overflow-hidden">
      <div className="tw:flex tw:justify-between tw:items-center tw:mb-4 tw:bg-blue-700 tw:text-white tw:p-4">
        <div className="tw:flex tw:items-center tw:gap-2">
          <ShoppingCart className="tw:text-2xl" size={20} />
          <div className="tw:text-sm tw:font-semibold">Selected Items</div>
          <div className="tw:text-xs tw:text-white tw:bg-blue-400 tw:rounded-full tw:px-2 tw:py-1">
            {cartItems.length}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="tw:text-white tw:hover:text-gray-200 tw:transition-colors tw:p-1 tw:rounded-full tw:hover:bg-blue-600 tw:cursor-pointer"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="tw:px-4 tw:h-[300px] tw:overflow-y-auto">
        {cartItems.length > 0 && (
          <div className="tw:text-xs tw:text-slate-500 tw:mb-4">
            Review your selected products below. Click <strong>Proceed</strong>{" "}
            to add products to your Inventory.
          </div>
        )}
        {loading && (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <AppSpinner className="tw:w-8 tw:h-8" />
          </div>
        )}
        {!loading && cartItems.length === 0 && (
          <div className="tw:flex tw:justify-center tw:items-center tw:h-full">
            <div className="tw:text-center tw:text-gray-500 tw:text-sm">
              No items in cart
            </div>
          </div>
        )}
        {cartItems.map((item, index) => (
          <div
            key={item._id}
            className="tw:flex tw:gap-2 tw:justify-between tw:mb-4 tw:border-b tw:border-gray-200 tw:pb-4"
          >
            <div className="tw:flex tw:items-center tw:gap-2">
              <ImgRender
                assetId={
                  item.images && item.images.length > 0
                    ? item.images[0]
                    : undefined
                }
                alt={item.name}
                className="tw:w-14 tw:h-14 tw:object-contain tw:rounded-md tw:bg-gray-100 tw:border tw:border-gray-200"
              />
              <div className="tw:flex-1">
                <div
                  className="tw:font-semibold tw:mb-1 tw:text-xs tw:line-clamp-2"
                  title={item.name}
                >
                  {item.name}
                </div>
                <div className="tw:flex tw:items-center tw:gap-2">
                  <div
                    className="tw:text-xs tw:text-gray-500"
                    title={item.brand?.name}
                  >
                    {item.brand?.name}
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-1">
                    {/* {item.mrp && item.mrp > item.price && (
                      <div
                        className="tw:text-xs tw:text-gray-400 tw:line-through"
                        title="MRP"
                      >
                        <Amount value={Number(item.mrp)} decimalPlaces={2} />
                      </div>
                    )} */}
                    <div className="tw:text-xs tw:text-gray-500" title="Price">
                      <Amount value={Number(item.mrp)} decimalPlaces={2} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <AppButton
                fill="clear"
                size="small"
                onClick={() => handleRemove(item.itemId, index)}
                isLoading={removingIndex === index}
              >
                {removingIndex !== index ? <X /> : null}
              </AppButton>
            </div>
          </div>
        ))}
      </div>
      {cartItems.length > 0 && (
        <div className="tw:px-10 tw:pb-4">
          <AppButton className="tw:w-full" size="small" onClick={handleProceed}>
            Proceed ({cartItems.length} items)
            <ArrowRight className="tw:ml-2" size={16} />
          </AppButton>
        </div>
      )}
    </div>
  );
};

export default CartItems;
