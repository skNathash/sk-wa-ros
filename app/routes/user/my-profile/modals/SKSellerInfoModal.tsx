import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import ImgRender from "~/components/core/img/ImgRender";
import AppModal from "~/components/core/modal/AppModal";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import { useTranslation } from "react-i18next";

type SKSellerInfoModalProps = {
  show: boolean;
  onClose: (r: { action: "close" | "submit" }) => void;
};

const SKSellerInfoModal: React.FC<SKSellerInfoModalProps> = ({
  show,
  onClose,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState("");
  const toast = useAppToast();
  const { t } = useTranslation(["common"]);

  const handleSendRequest = () => {
    setShowRemarks(true);
  };

  const handleBack = () => {
    setShowRemarks(false);
    setRemarks("");
  };

  const handleClose = () => {
    setShowRemarks(false);
    setRemarks("");
    setSubmitting(false);
    onClose({ action: "close" });
  };

  const handleSubmit = async () => {
    try {
      // Remarks are mandatory - show toast and abort if empty
      if (!remarks || remarks.trim().length === 0) {
        toast.show({
          msg: t("pleaseAddRemarksBeforeSubmitting"),
          color: "danger",
        });
        return;
      }

      setSubmitting(true);
      const skSellerId = AuthService.getLoggedInUserId();
      const resp = await FranchiseService.createSkSellerJoinRequest({
        sfSellerId: skSellerId,
        requestMessage: remarks,
      });
      if (resp.statusCode === 200) {
        toast.show({
          msg: t("upgradeRequestSentSuccessfully"),
          color: "success",
        });
        onClose({ action: "submit" });
      } else {
        toast.show({
          msg: resp.data?.message || t("failedToSendRequest"),
          color: "danger",
        });
      }
    } catch (e: any) {
      toast.show({
        msg: e?.message || t("failedToSendRequest"),
        color: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AppModal
      show={show}
      callback={(e) => e.action === "close" && handleClose()}
      className="tw:max-w-md tw:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold">{t("upgradeThisAccount")}</div>
      </AppModal.Title>

      <AppModal.Content className="tw:p-0 tw:max-h-[90vh]">
        {!showRemarks ? (
          <>
            <div className="tw:text-center">
              <div className="tw:inline-block tw:w-48">
                <ImgRender src="upgrade/sk-seller/main.png" />
              </div>
            </div>

            {/* Feature Sections */}
            <div className="tw:px-6 tw:py-4 tw:space-y-4">
              <div className="tw:flex tw:items-start tw:gap-4">
                <div className="tw:flex-shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center">
                    <ImgRender
                      src="upgrade/sk-seller/reach.png"
                      alt="Reach More"
                      className="tw:object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="tw:font-semibold tw:text-gray-900 tw:mb-1">
                    {t("reachMoreCustomers")}
                  </h3>
                  <p className="tw:text-sm tw:text-gray-600">
                    {t("reachMoreCustomersDesc")}
                  </p>
                </div>
              </div>

              <div className="tw:flex tw:items-start tw:gap-4">
                <div className="tw:flex-shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center">
                    <ImgRender
                      src="upgrade/sk-seller/verified.png"
                      alt="Verified Seller"
                      className="tw:object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="tw:font-semibold tw:text-gray-900 tw:mb-1">
                    {t("verifiedSellerBadge")}
                  </h3>
                  <p className="tw:text-sm tw:text-gray-600">
                    {t("verifiedSellerBadgeDesc")}
                  </p>
                </div>
              </div>

              <div className="tw:flex tw:items-start tw:gap-4">
                <div className="tw:flex-shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center">
                    <ImgRender
                      src="upgrade/sk-seller/network.png"
                      alt="Manage Network"
                      className="tw:object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="tw:font-semibold tw:text-gray-900 tw:mb-1">
                    {t("manageBuyerNetwork")}
                  </h3>
                  <p className="tw:text-sm tw:text-gray-600">
                    {t("manageBuyerNetworkDesc")}
                  </p>
                </div>
              </div>

              <div className="tw:flex tw:items-start tw:gap-4">
                <div className="tw:flex-shrink-0 tw:w-10 tw:h-10 tw:rounded-lg tw:flex tw:items-center tw:justify-center">
                  <div className="tw:w-10 tw:h-10 tw:flex tw:items-center tw:justify-center">
                    <ImgRender
                      src="upgrade/sk-seller/need.png"
                      alt="What you need"
                      className="tw:object-contain"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="tw:font-semibold tw:text-gray-900 tw:mb-1">
                    {t("whatYouNeed")}
                  </h3>
                  <p className="tw:text-sm tw:text-gray-600">
                    {t("whatYouNeedDesc")}
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Remarks Input Section */
          <div className="tw:px-1 tw:py-6">
            <div className="tw:mb-4">
              <h3 className="tw:font-semibold tw:text-gray-900 tw:mb-2">
                {t("addRemarksTitle")}{" "}
                <span className="tw:text-red-500">*</span>
              </h3>
              <p className="tw:text-sm tw:text-gray-600 tw:mb-4">
                {t("addRemarksHelp")}
              </p>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={t("addRemarksPlaceholder")}
                className="tw:w-full tw:h-32 tw:px-3 tw:py-2 tw:border tw:border-gray-300 tw:rounded-lg tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-blue-500 tw:focus:border-transparent tw:resize-none"
                rows={4}
              />
            </div>
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer className="tw:px-6">
        {!showRemarks ? (
          <AppButton
            className="tw:w-full"
            onClick={handleSendRequest}
            disabled={submitting}
          >
            {t("sendUpgradeRequest")}
          </AppButton>
        ) : (
          <div className="tw:flex tw:gap-3 tw:w-full">
            <AppButton
              fill="outline"
              color="light"
              className="tw:flex-1"
              onClick={handleBack}
              disabled={submitting}
            >
              <ArrowLeft />
              {t("back")}
            </AppButton>
            <AppButton
              className="tw:flex-1"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? t("sending") : t("submit")}
            </AppButton>
          </div>
        )}
      </AppModal.Footer>
    </AppModal>
  );
};

export default SKSellerInfoModal;
