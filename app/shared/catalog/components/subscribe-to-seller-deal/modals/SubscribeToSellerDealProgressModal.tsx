import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppProgress from "~/components/core/progress/AppProgress";
import InventorySubscribeService from "~/services/InventorySubscribeService";

type Props = {
  show: boolean;
  callback?: (a: { action: string; data?: any }) => void;
};

const POLL_INTERVAL_MS = 2000; // 2 seconds
const MAX_POLL_COUNT = 20; // 20 * 2s = 40s

const SubscribeToSellerDealProgressModal: React.FC<Props> = ({
  show,
  callback,
}) => {
  const { t } = useTranslation("inventorySubscribe");
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [finished, setFinished] = useState<boolean>(false);
  const initialPendingRef = useRef<number | null>(null);
  const iterationRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleFinished = useCallback(
    (action: string = "done") => {
      setFinished(true);
      clearTimer();
      // let parent decide what to do (they call fetchSummary on 'done')
      // callback?.({ action });
    },
    [callback]
  );

  const fetchSummary = useCallback(async () => {
    try {
      const res = await InventorySubscribeService.getParentSubscribeSummary({});
      const data = res?.data?.data || {};
      const count = data?.subscribePendingDeals ?? 0;
      setPendingCount(count);

      // store the initial pending count on first successful response
      if (initialPendingRef.current === null) {
        initialPendingRef.current = count;
      }

      iterationRef.current = iterationRef.current + 1;

      // Stop if no pending deals left or reached max iterations
      if (count === 0 || iterationRef.current >= MAX_POLL_COUNT) {
        handleFinished("done");
      }
    } catch (_e) {
      // On error, still increment and stop when max reached
      iterationRef.current = iterationRef.current + 1;
      if (iterationRef.current >= MAX_POLL_COUNT) {
        handleFinished("done");
      }
    }
  }, [handleFinished]);

  useEffect(() => {
    // Start polling when modal is shown
    if (show) {
      // reset state
      iterationRef.current = 0;
      setPendingCount(null);
      setFinished(false);

      // fetch immediately, then start interval
      fetchSummary();
      timerRef.current = window.setInterval(() => {
        fetchSummary();
      }, POLL_INTERVAL_MS) as unknown as number;
    } else {
      // modal hidden - cleanup
      clearTimer();
    }

    return () => {
      clearTimer();
    };
  }, [show, fetchSummary]);

  // compute progress percent without using a self-invoking function
  let _progress = 0;
  if (finished) {
    _progress = 100;
  } else {
    const initial = initialPendingRef.current;
    const current = pendingCount;
    if (initial && initial > 0 && current !== null) {
      const processed = Math.max(0, initial - current);
      _progress = Math.round((processed / initial) * 100);
    } else {
      _progress = Math.round((iterationRef.current / MAX_POLL_COUNT) * 100);
    }
  }

  const progressPercent = Math.min(100, _progress);

  const onViewInventory = useCallback(() => {
    // notify parent to navigate
    clearTimer();
    callback?.({ action: "view_inventory" });
  }, [callback]);

  const handleClose = () => {
    callback?.({ action: "close" });
  };

  return (
    <AppModal show={show} backdropDismiss={false} callback={handleClose}>
      <AppModal.Title noShadow onClose={handleClose}>
        <div className="tw:text-base tw:font-semibold">
          {t("sellerSubscribe.modalTitle")}
        </div>
      </AppModal.Title>
      <AppModal.Content className="tw:p-4 tw:space-y-4">
        <div className="tw:flex tw:flex-col tw:gap-3">
          {/* When finished, hide the progress bar and show a success tick + message */}
          {finished ? (
            <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:py-4">
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:w-full">
                <div className="tw:inline-flex tw:items-center tw:justify-center tw:bg-gradient-to-br tw:from-green-50 tw:to-green-100 tw:rounded-full tw:p-4 tw:ring-1 tw:ring-green-100">
                  <CheckCircle
                    className="tw:h-10 tw:w-10 tw:text-green-700"
                    aria-hidden="true"
                  />
                </div>

                <div className="tw:text-base tw:font-semibold tw:text-center">
                  {t("sellerSubscribe.subscriptionsComplete")}
                </div>

                <div className="tw:text-sm tw:text-slate-600 tw:text-center">
                  {t("sellerSubscribe.subscriptionsCompleteDescription")}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="tw:text-sm tw:font-medium">
                {t("sellerSubscribe.progressLabel")}
              </div>
              <AppProgress value={progressPercent} className="tw:mb-2" />

              <div className="tw:text-xs tw:text-slate-600">
                {t("sellerSubscribe.subscribingPleaseWait")}
              </div>
            </>
          )}

          <div className="tw:flex tw:justify-end tw:gap-2 tw:mt-4">
            {finished ? (
              <>
                <AppButton onClick={handleClose} color="primary" fill="outline">
                  {t("sellerSubscribe.close")}
                </AppButton>

                <AppButton onClick={onViewInventory} color="primary">
                  {t("sellerSubscribe.viewInventory")}
                </AppButton>
              </>
            ) : null}
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default SubscribeToSellerDealProgressModal;
