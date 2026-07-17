import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
// AppCard removed per redesign: using InfoBlock as the top-level container
import AppButton from "~/components/core/button/AppButton";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AuthService from "~/services/AuthService";
import { Package } from "lucide-react";
import SubscribeToSellerDealProgressModal from "./modals/SubscribeToSellerDealProgressModal";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";

type SummaryResponse = {
  totalProducts?: number;
};

const SubscribeToSellerDealCard: React.FC = () => {
  const { t } = useTranslation("inventorySubscribe");

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [summary, setSummary] = useState<SummaryResponse>({});
  const { show: showToast } = useAppToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [sellerName, setSellerName] = useState<string>("");
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const totalProducts = summary?.totalProducts || 0;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await InventorySubscribeService.getParentSubscribeSummary({});
      const data = res?.data?.data || {};
      const count = data?.subscribePendingDeals ?? 0;
      // Prefer seller name from logged-in user's linked franchise
      const loggedIn = AuthService.getLoggedInUser?.() || {};
      const linkedName = loggedIn?.linkedFranchise?.name || "";
      const fallbackName = data?.sellerName || data?.seller?.name || "";
      setSummary({ totalProducts: count });
      setSellerName(linkedName || fallbackName);
    } catch (_e) {
      setSummary({ totalProducts: 0 });
      setSellerName("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleOpenConfirm = useCallback(() => {
    setConfirmDialogOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmDialogOpen(false);
  }, []);

  const appNav = useAppNav();

  const handleProgressCallback = useCallback(
    async (e: { action: string; data?: any }) => {
      if (e.action === "done" || e.action === "close") {
        setShowProgressModal(false);
        await fetchSummary();
      } else if (e.action === "view_inventory") {
        // close modal and navigate to inventory list
        setShowProgressModal(false);
        await new Promise((resolve) => setTimeout(resolve, 800));
        appNav.to(`/dashboard/inventory/products/list`);
      }
    },
    [fetchSummary, appNav]
  );

  const onConfirmSubscribe = async () => {
    setSubmitting(true);
    // clear any previous toasts if applicable (sonner handles stacking); no-op here
    try {
      const res = await InventorySubscribeService.subscribeParentDeals({});
      if (res?.statusCode === 200) {
        setConfirmDialogOpen(false);

        await new Promise((resolve) => setTimeout(resolve, 800));

        setShowProgressModal(true);
      } else {
        showToast({
          msg: "Failed to subscribe. Please try again.",
          color: "error",
        });
        setShowProgressModal(false);
      }
    } catch (_e) {
      showToast({
        msg: "Failed to subscribe. Please try again.",
        color: "error",
      });
      setShowProgressModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Show only for buyer users and when there are pending deals
  const isBuyer = AuthService.isBuyerUser?.() === true;
  if (!isBuyer || totalProducts <= 0) {
    return null;
  }

  return (
    <>
      <InfoBlock bordered size="sm" className="tw:mb-4">
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:md:items-center tw:md:justify-between tw:gap-4">
          <div className="tw:flex tw:flex-1 tw:items-start tw:gap-2">
            <Package
              size={20}
              className="tw:text-blue-600 tw:mt-1 animate__animated animate__heartBeat animate__infinite"
            />
            <div className="tw:flex-1">
              <div>
                <span className="tw:font-semibold">{totalProducts}</span>{" "}
                {t("sellerSubscribe.availableProductsText", {
                  sellerName,
                })}
              </div>
              <div className="tw:text-xs tw:text-slate-500">
                {t("sellerSubscribe.subscribeHint")}
              </div>
            </div>
          </div>
          <div className="">
            <AppButton
              onClick={handleOpenConfirm}
              disabled={loading || submitting}
              size="small"
              className="tw:w-full"
            >
              {submitting
                ? t("sellerSubscribe.subscribing")
                : t("sellerSubscribe.subscribeAll")}
            </AppButton>
          </div>
        </div>
      </InfoBlock>

      {/* Errors are shown via toast notifications using `useAppToast` */}

      <AppAlertDialog
        show={confirmDialogOpen}
        title={t("sellerSubscribe.confirmTitle")}
        description={t("sellerSubscribe.confirmDescription")}
        onConfirm={onConfirmSubscribe}
        onCancel={handleCancelConfirm}
        type="confirm"
        okText={
          submitting
            ? t("sellerSubscribe.working")
            : t("sellerSubscribe.confirm")
        }
        cancelText={t("sellerSubscribe.cancel")}
      />

      <SubscribeToSellerDealProgressModal
        show={showProgressModal}
        callback={handleProgressCallback}
      />
    </>
  );
};

export default SubscribeToSellerDealCard;
