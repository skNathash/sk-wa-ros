import AppButton from "~/components/core/button/AppButton";
import AppSimpleHeader from "~/components/core/header/AppSimpleHeader";
import ImgRender from "~/components/core/img/ImgRender";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";
import { FileSearch, Bell, Store } from "lucide-react";
import { useTranslation } from "react-i18next";

const Success = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["signup"]);

  const goToHome = () => {
    appNav.replace("/auth/init");
  };

  return (
    <>
      <AppSimpleHeader title={t("thankyou.headerTitle")} />

      <div className="app-page tw:min-h-screen signup-bg-2">
        <div className="tw:max-w-md tw:mx-auto">
          <div className="tw:z-10 tw:px-6 tw:pt-2 tw:md:px-0 tw:pb-10">
            <div
              className="tw:rounded-md tw:shadow-sm tw:p-4 tw:pt-1 tw:text-primary"
              style={{
                background: "linear-gradient(180deg, #fef8fa 0%, #ffffff 100%)",
              }}
            >
              <div className="tw:text-center tw:-mt-4">
                <ImgRender
                  src="signup/thankyou.jpg"
                  className="signup-page-img tw:mx-auto tw:inline-block tw:object-cover tw:mix-blend-multiply"
                />
              </div>

              <div className="tw:text-center">
                <h2 className="tw:text-2xl md:tw:text-3xl tw:font-semibold tw:mb-3 tw:text-primary">
                  {t("thankyou.heroTitle")}
                </h2>
                <p className="tw:text-muted-foreground tw:text-sm md:tw:text-base tw:leading-6 tw:max-w-md tw:mx-auto">
                  {t("thankyou.heroSubtitle")}
                </p>
              </div>
            </div>

            <div className="tw:mt-4">
              <div className="tw:grid tw:gap-3">
                <div className="tw:flex tw:items-center tw:gap-4 tw:rounded-xl tw:bg-white tw:shadow-sm tw:p-4 tw:border tw:border-gray-100">
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-primary/10 tw:text-primary tw:shrink-0">
                    <FileSearch size={22} />
                  </div>
                  <div>
                    <p className="tw:text-sm tw:text-foreground tw:font-semibold tw:mb-0.5">
                      {t("thankyou.steps.review.title")}
                    </p>
                    <p className="tw:text-xs tw:text-muted-foreground tw:leading-5">
                      {t("thankyou.steps.review.description")}
                    </p>
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:gap-4 tw:rounded-xl tw:bg-white tw:shadow-sm tw:p-4 tw:border tw:border-gray-100">
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-primary/10 tw:text-primary tw:shrink-0">
                    <Bell size={22} />
                  </div>
                  <div>
                    <p className="tw:text-sm tw:text-foreground tw:font-semibold tw:mb-0.5">
                      {t("thankyou.steps.approval.title")}
                    </p>
                    <p className="tw:text-xs tw:text-muted-foreground tw:leading-5">
                      {t("thankyou.steps.approval.description")}
                    </p>
                  </div>
                </div>

                <div className="tw:flex tw:items-center tw:gap-4 tw:rounded-xl tw:bg-white tw:shadow-sm tw:p-4 tw:border tw:border-gray-100">
                  <div className="tw:flex tw:items-center tw:justify-center tw:w-12 tw:h-12 tw:rounded-full tw:bg-primary/10 tw:text-primary tw:shrink-0">
                    <Store size={22} />
                  </div>
                  <div>
                    <p className="tw:text-sm tw:text-foreground tw:font-semibold tw:mb-0.5">
                      {t("thankyou.steps.getStarted.title")}
                    </p>
                    <p className="tw:text-xs tw:text-muted-foreground tw:leading-5">
                      {t("thankyou.steps.getStarted.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="tw:mt-6 tw:text-right">
              <AppButton
                expand="block"
                className="tw:h-12 tw:w-full tw:max-w-md"
                onClick={goToHome}
                noShadow={true}
              >
                {t("thankyou.buttonBackToHome")}
              </AppButton>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Success;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Success"),
    },
  ];
}
