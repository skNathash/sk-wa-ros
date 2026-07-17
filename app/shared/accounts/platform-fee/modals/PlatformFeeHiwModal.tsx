import { CheckCircle, CreditCard, HelpCircle, Percent } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import AppModal from "~/components/core/modal/AppModal";

const SmallStep: React.FC<{
  icon?: React.ReactNode;
  title: string;
  desc: string;
}> = ({ icon, title, desc }) => {
  return (
    <div className="tw:flex tw:items-start tw:gap-3">
      <div className="tw:flex-shrink-0">
        <div className="tw:h-10 tw:w-10 tw:rounded-full tw:bg-gray-100 tw:flex tw:items-center tw:justify-center">
          {icon}
        </div>
      </div>
      <div>
        <div className="tw:text-sm tw:font-medium tw:text-gray-800">
          {title}
        </div>
        <div className="tw:text-xs tw:text-gray-600">{desc}</div>
      </div>
    </div>
  );
};

const PlatformFeeHiwModal = ({
  show,
  callback,
}: {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
}) => {
  const { t } = useTranslation(["platformFee"]);

  const handleClose = () => callback({ action: "close" });

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:flex tw:items-center tw:gap-3">
          <HelpCircle />
          <div>
            <div className="tw:text-lg tw:font-bold">{t("hiw.title")}</div>
            <div className="tw:text-xs tw:text-gray-600">
              {t("hiw.subtitle")}
            </div>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:space-y-4">
          <SmallStep
            icon={<CreditCard className="tw:h-5 tw:w-5 tw:text-gray-700" />}
            title={t("hiw.choosePlan.title")}
            desc={t("hiw.choosePlan.desc")}
          />

          <SmallStep
            icon={<Percent className="tw:h-5 tw:w-5 tw:text-gray-700" />}
            title={t("hiw.knowFee.title")}
            desc={t("hiw.knowFee.desc")}
          />

          <SmallStep
            icon={<CheckCircle className="tw:h-5 tw:w-5 tw:text-green-600" />}
            title={t("hiw.payWhenAgree.title")}
            desc={t("hiw.payWhenAgree.desc")}
          />

          <div className="tw:bg-yellow-50 tw:border tw:border-yellow-200 tw:rounded-lg tw:p-3">
            <div className="tw:text-sm tw:font-medium tw:mb-2">
              {t("hiw.quickExample.title")}
            </div>
            <div className="tw:text-xs tw:text-gray-700">
              <div>{t("hiw.quickExample.example1")}</div>
              <div className="tw:mt-1">{t("hiw.quickExample.example2")}</div>
            </div>
            <div className="tw:text-xs tw:text-gray-600 tw:pt-2">
              <div className="tw:font-medium tw:text-[13px]">
                {t("hiw.moreThings.title")}
              </div>
              <ul className="tw:list-disc tw:ml-4 tw:space-y-1 tw:mt-2">
                <li>{t("hiw.moreThings.item1")}</li>
                <li>{t("hiw.moreThings.item2")}</li>
                <li>{t("hiw.moreThings.item3")}</li>
              </ul>
            </div>
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default PlatformFeeHiwModal;
