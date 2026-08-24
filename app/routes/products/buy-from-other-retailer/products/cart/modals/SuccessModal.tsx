import AppModal from "~/components/core/modal/AppModal";
import { ShoppingCart } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";
import Amount from "~/components/core/amount/Amount";
import AppLink from "~/components/core/link/AppLink";

interface Props {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  orders: Array<{
    orderId: string | number;
    orderRefNo: string;
    orderAmount: number;
    paymentMethod: string;
    seller: { franchiseName: string };
  }>;
}

const SuccessModal = ({ show, callback, orders }: Props) => {
  const onClose = () => {
    callback({ action: "close", data: null });
  };

  const handleViewOrder = () => {
    callback({ action: "view-order", data: { orders } });
  };

  const hasMultipleOrders = orders.length > 1;

  return (
    <AppModal show={show} callback={onClose} className="tw:max-w-md">
      <AppModal.Title onClose={onClose}>&nbsp;</AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:items-center tw:mt-2">
          <div className="tw:w-16 tw:h-16 tw:bg-green-100 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mb-4">
            <ShoppingCart size={32} className="tw:text-green-600" />
          </div>

          <div className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mb-1">
            {hasMultipleOrders
              ? "Orders Placed Successfully!"
              : "Order Placed Successfully!"}
          </div>
          <p className="tw:text-sm tw:text-gray-500 tw:text-center tw:mb-6">
            {hasMultipleOrders
              ? `Your ${orders.length} orders have been submitted for processing`
              : "Your order has been submitted for processing"}
          </p>

          <div className="tw:w-full tw:bg-gray-50 tw:rounded-xl tw:border tw:border-gray-100 tw:overflow-hidden">
            {orders.map((order, index) => (
              <div
                key={index}
                className={`tw:p-4 ${index !== orders.length - 1 ? "tw:border-b tw:border-gray-100" : ""}`}
              >
                <div className="tw:flex tw:justify-between tw:items-start tw:mb-2">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                      Order Reference
                    </span>
                    <AppLink
                      href={`/dashboard/orders/view/${order.orderId}`}
                      asLink
                      className="tw:text-sm tw:font-bold tw:text-primary hover:tw:underline"
                    >
                      #{order.orderRefNo}
                    </AppLink>
                  </div>
                  <div className="tw:text-right">
                    <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                      Amount Paid
                    </span>
                    <div className="tw:flex tw:items-baseline tw:justify-end">
                      <Amount
                        value={order.orderAmount}
                        className="tw:text-base tw:font-bold tw:text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="tw:flex tw:justify-between tw:items-center">
                  <div className="tw:flex tw:flex-col">
                    <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                      Seller
                    </span>
                    <span className="tw:text-xs tw:font-medium tw:text-gray-700">
                      {order.seller.franchiseName}
                    </span>
                  </div>
                  <div className="tw:text-right">
                    <span className="tw:text-[10px] tw:font-bold tw:text-gray-400 tw:uppercase tw:tracking-wider">
                      Payment Mode
                    </span>
                    <div className="tw:flex tw:items-center tw:justify-end tw:mt-0.5">
                      <span className="tw:px-1.5 tw:py-0.5 tw:bg-primary/10 tw:text-primary tw:text-[10px] tw:font-bold tw:rounded">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer className="tw:border-t-0 tw:pt-2">
        <div className="tw:w-full tw:px-6 tw:pb-6">
          <AppButton
            color="primary"
            onClick={handleViewOrder}
            className="tw:w-full !tw:rounded-xl tw:h-11 tw:text-sm tw:font-semibold"
          >
            {hasMultipleOrders ? "View All Orders" : "View Order Details"}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SuccessModal;
