import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import AppLangChangeModal from "~/shared/others/modals/app-lang-change/AppLangChangeModal";

const Signup = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["signup"]);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    // Open language selection modal on initial page load
    setShowLangModal(true);
  }, []);

  const handleRegister = () => {
    appNav.replace("/auth/signup/register");
  };

  return (
    <>
      <AppSimpleHeader title={t("intro.pageTitle")} />
      <div className="tw:md:p-4">
        <div className="tw:bg-blue-900 tw:md:rounded-lg tw:py-10 app-container">
          <div>
            {/* First Block - Hero Section */}
            <div className="tw:bg-blue-900 tw:rounded-lg tw:overflow-hidden tw:mb-8">
              <div className="tw:flex tw:flex-col tw:md:flex-row tw:items-center tw:gap-8 tw:px-6 tw:md:px-12 tw:mt-4">
                {/* First Column - Text Content */}
                <div className="tw:flex-1 tw:text-center tw:md:text-left">
                  <h1 className="tw:text-3xl tw:md:text-4xl tw:font-bold tw:text-white tw:mb-4">
                    {t("intro.heroTitle")}
                  </h1>
                  <p className="tw:text-lg tw:text-white tw:mb-6 tw:opacity-90 tw:font-semibold">
                    {t("intro.heroSubtitle")}
                  </p>
                  <AppButton
                    className="tw:bg-white tw:text-blue-900 tw:border-2 tw:border-white tw:font-semibold tw:px-8 tw:py-3 tw:rounded-md hover:tw:bg-gray-100 tw:transition-colors"
                    onClick={handleRegister}
                  >
                    {t("intro.ctaRegister")}
                  </AppButton>
                </div>

                {/* Second Column - Image */}
                <div className="tw:flex-1 tw:flex tw:justify-center tw:md:justify-end">
                  <ImgRender
                    src="retailer/banner-1.png"
                    className="tw:max-w-full tw:h-auto tw:rounded-lg tw:md:max-w-[400px] tw:md:mr-10"
                  />
                </div>
              </div>
            </div>

            {/* Second Block - Benefits Grid */}
            <div className="tw:bg-blue-900 tw:rounded-lg tw:overflow-hidden">
              <div className="tw:px-6 tw:md:px-12">
                <h2 className="tw:text-2xl tw:md:text-3xl tw:font-bold tw:text-white tw:mb-8">
                  {t("intro.whyRegisterTitle")}
                </h2>

                <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-4 tw:gap-2">
                  {grids.map((grid, index) => (
                    <div
                      key={index}
                      className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2 tw:p-2 tw:items-center"
                    >
                      {/* Image Column - Left on desktop */}
                      <div className="tw:flex tw:justify-center tw:md:justify-start">
                        <ImgRender
                          src={grid.img}
                          className="tw:w-16 tw:h-16 tw:md:w-20 tw:md:h-20"
                        />
                      </div>

                      {/* Text Content Column - Right on desktop */}
                      <div className="tw:order-1 tw:md:order-2 tw:text-center tw:md:text-left tw:flex-1">
                        <h3 className="tw:text-base tw:font-bold tw:text-white tw:mb-2">
                          {t(`intro.grids.${grid.key}.title`)}
                        </h3>
                        <p className="tw:text-sm tw:text-white tw:opacity-90">
                          {t(`intro.grids.${grid.key}.description`)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppLangChangeModal
        show={showLangModal}
        callback={() => setShowLangModal(false)}
      />
    </>
  );
};

const grids = [
  {
    key: "expandBusiness",
    img: "retailer/expand-business.png",
    bgGray: true,
  },
  {
    key: "betterMargins",
    img: "retailer/better-margin.png",
    bgGray: false,
  },
  {
    key: "easyManagement",
    img: "retailer/easy-management.png",
    bgGray: false,
  },
  {
    key: "dedicatedSupport",
    img: "retailer/dedicated-support.png",
    bgGray: true,
  },
];

export default Signup;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Signup"),
    },
  ];
}
