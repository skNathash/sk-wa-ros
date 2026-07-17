import { CheckCircle, Package, Plus } from "lucide-react";
import React, { useEffect } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";

interface SubscriptionSuccessModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  productName?: string;
  productId?: string;
  dealRefId?: string;
  importId?: string;
  mrp?: number;
  qty?: number;
  purchasePrice?: number;
}

const SubscriptionSuccessModal: React.FC<SubscriptionSuccessModalProps> = ({
  show,
  callback,
  productName,
  productId,
  dealRefId,
  importId,
  mrp,
  qty,
  purchasePrice,
}) => {
  const isMasterLogin = AuthService.isMasterLogin();

  const handleClose = () => {
    callback({ action: "close" });
  };

  useEffect(() => {
    if (show) {
      // Update local analytics count and notify app
      try {
        const user = AuthService.getLoggedInUser();
        if (user) {
          if (!user.analytics) {
            user.analytics = { totalSubscribedDeals: 0 };
          }
          const increment = Number(qty) && Number(qty) > 0 ? Number(qty) : 1;
          user.analytics.totalSubscribedDeals =
            (user.analytics.totalSubscribedDeals || 0) + increment;
          AuthService.setloggedInUser(user);
        }
      } catch (e) {
        // ignore storage errors
      }

      try {
        InventorySubscribeService.triggerSubscribeSuccessEvent({
          bulk: false,
          count: Number(qty) && Number(qty) > 0 ? Number(qty) : 1,
        });
      } catch (e) {
        // ignore event errors
      }
    }
  }, [show]);

  const handleAddStockNow = () => {
    callback({
      action: "add-stock-now",
      data: {
        productId,
        productName,
        dealRefId,
        importId,
        mrp,
        qty,
        purchasePrice,
      },
    });
  };

  const handleAddStockLater = () => {
    // Update local analytics count and notify app
    try {
      const user = AuthService.getLoggedInUser();
      if (user) {
        if (!user.analytics) {
          user.analytics = { totalSubscribedDeals: 0 };
        }
        const increment = Number(qty) && Number(qty) > 0 ? Number(qty) : 1;
        user.analytics.totalSubscribedDeals =
          (user.analytics.totalSubscribedDeals || 0) + increment;
        AuthService.setloggedInUser(user);
      }
    } catch (e) {
      // ignore storage errors
    }

    try {
      InventorySubscribeService.triggerSubscribeSuccessEvent({
        bulk: false,
        count: Number(qty) && Number(qty) > 0 ? Number(qty) : 1,
      });
    } catch (e) {
      // ignore event errors
    }

    callback({ action: "add-stock-later" });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:max-w-md">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <div className="tw:flex-shrink-0">
            <CheckCircle className="tw:text-green-500" size={24} />
          </div>
          <div className="tw:flex-1">
            <h2 className="tw:text-lg tw:font-bold tw:text-gray-900">
              Successfully Subscribed!
            </h2>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:text-center tw:py-4">
          <div className="tw:flex tw:justify-center tw:mb-4">
            <div className="tw:bg-green-100 tw:rounded-full tw:p-3">
              <Package className="tw:text-green-600" size={32} />
            </div>
          </div>

          <div className="tw:space-y-2">
            <p className="tw:text-gray-700 tw:text-base">
              {productName ? (
                <>
                  You have successfully subscribed to{" "}
                  <span className="tw:font-medium">"{productName}"</span>.
                </>
              ) : (
                "You have successfully subscribed to the item."
              )}
            </p>

            <p className="tw:text-gray-600 tw:md:text-xs tw:text-sm">
              Would you like to add stock to your inventory now or later?
            </p>
          </div>
        </div>
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:flex-col tw:gap-3 tw:w-full">
          {!isMasterLogin && (
            <AppButton
              onClick={handleAddStockNow}
              color="primary"
              size="default"
              className="tw:w-full"
            >
              <Plus size={16} className="tw:mr-2" />
              Add Stock Now
            </AppButton>
          )}
          {!isMasterLogin && (
            <AppButton
              onClick={handleAddStockLater}
              fill="outline"
              color="secondary"
              size="default"
              className="tw:w-full"
            >
              Add Stock Later
            </AppButton>
          )}
          {isMasterLogin && (
            <AppButton
              onClick={handleAddStockLater}
              fill="outline"
              color="secondary"
              size="default"
              className="tw:w-full"
            >
              Close
            </AppButton>
          )}
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default SubscriptionSuccessModal;
