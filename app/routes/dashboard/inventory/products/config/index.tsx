import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppHeader from "~/components/core/header/AppHeader";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import ClubDealSetting from "./components/settings/ClubDealSetting";
import ReserveSetting from "./components/settings/ReserveSetting";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-INVENTORY"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    langKey: "dashboard",
    redirect: { path: "/dashboard" },
  },
  {
    label: "All Items",
    langKey: "allItems",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  {
    label: "Item Settings",
    langKey: "itemSettings",
  },
];

const ConfigPage = () => {
  const { t } = useTranslation(["common"]);
  return (
    <>
      <AppHeader
        title={t("itemSettings")}
        showAudioNote={true}
        audioNoteTitle="Item Settings"
        audioFeature="manageInventory"
      />

      <div className="page-bg app-page tw:p-4">
        <div className="app-container tw:max-w-2xl">
          <AppBreadcrumbs data={breadcrumbs} className="tw:mb-3" />

          <div className="tw:flex tw:flex-col tw:gap-3">
            <ReserveSetting />
            <ClubDealSetting />
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfigPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Item Settings"),
    },
  ];
}
