import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import PageDescription from "~/components/core/page-description/PageDescription";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import AcceptPreOrderConfig from "../AcceptPreOrderConfig";
import ShowUnsubscribedDealsConfig from "../ShowUnsubscribedDealsConfig";
import MinCart from "./components/min-cart/MinCart";
import OtpConfig from "./components/otp-config/OtpConfig";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.ADVANCE-SETTINGS"]);
}

const defaultBreadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: {
      path: "/dashboard",
    },
    langKey: "dashboard",
  },
  {
    label: "Configs",
    langKey: "configs",
    redirect: {
      path: "/configs/settings",
    },
  },
  { label: "Others", langKey: "settings.others" },
];

const OthersSettings = () => {
  const { t } = useTranslation(["common"]);

  return (
    <>
      <AppHeader title={t("settings.title")} />

      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <AppBreadcrumbs data={defaultBreadcrumbs} />
          <PageDescription description="settings.others" className="tw:mb-4" />
          <MinCart />

          <OtpConfig />

          <AcceptPreOrderConfig />
          <ShowUnsubscribedDealsConfig />
        </div>
      </div>
    </>
  );
};

export default OthersSettings;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Other Settings"),
    },
  ];
}
