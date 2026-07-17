import {
  ChevronRight,
  Clock,
  CreditCard,
  Image,
  Phone,
  Printer,
  Settings,
  Truck,
  Upload,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import PageDescription from "~/components/core/page-description/PageDescription";
import Rbac from "~/components/core/rbac/Rbac";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import PageAccessService from "~/services/PageAccessService";
import UserService from "~/services/UserService";

export async function clientLoader() {
  return PageAccessService.canAccessPage([
    "CONFIGS.DELIVERY-SLOT",
    "CONFIGS.PAYMENT-CONFIG",
    "CONFIGS.DELIVERY-CHARGE",
    "CONFIGS.ADVANCE-SETTINGS",
    "CONFIGS.PRICE-LABEL-PRINT",
  ]);
}

interface ConfigCard {
  id: string;
  label: string;
  description: string;
  labelLangKey: string;
  descriptionLangKey: string;
  icon: React.ReactNode;
  route: string;
  rbac: string[];
}

const configCards: ConfigCard[] = [
  {
    id: "delivery-slot",
    label: "Delivery Slot Config",
    description: "Configure delivery time slots and availability settings",
    labelLangKey: "settings.deliverySlotConfig",
    descriptionLangKey: "settings.deliverySlotConfigDescription",
    icon: <Clock className="tw:w-6 tw:h-6 tw:text-blue-600" />,
    route: "/configs/settings/delivery-slot",
    rbac: ["CONFIGS.DELIVERY-SLOT"],
  },
  {
    id: "prepaid-payment",
    label: "Prepaid Payment",
    description: "Manage prepaid payment configuration",
    labelLangKey: "settings.prepaidPayment",
    descriptionLangKey: "settings.prepaidPaymentDescription",
    icon: <CreditCard className="tw:w-6 tw:h-6 tw:text-pink-600" />,
    route: "/configs/settings/prepaid-payment",
    rbac: ["CONFIGS.PAYMENT-CONFIG"],
  },
  {
    id: "payment-config",
    label: "Payment Config",
    description: "Manage payment methods and transaction settings",
    labelLangKey: "settings.paymentConfig",
    descriptionLangKey: "settings.paymentConfigDescription",
    icon: <CreditCard className="tw:w-6 tw:h-6 tw:text-green-600" />,
    route: "/configs/settings/payment-config",
    rbac: ["CONFIGS.PAYMENT-CONFIG"],
  },
  // {
  //   id: "delivery-charge",
  //   label: "Delivery Charge Config",
  //   description: "Set up delivery charges and pricing rules",
  //   labelLangKey: "settings.deliveryChargeConfig",
  //   descriptionLangKey: "settings.deliveryChargeConfigDescription",
  //   icon: <Truck className="tw:w-6 tw:h-6 tw:text-orange-600" />,
  //   route: "/configs/settings/delivery-charge",
  //   rbac: ["CONFIGS.DELIVERY-CHARGE"],
  // },
  //bulk upload
  {
    id: "bulk-upload",
    label: "Bulk Upload",
    description: "Upload products in bulk",
    labelLangKey: "settings.bulkUpload",
    descriptionLangKey: "settings.bulkUploadDescription",
    icon: <Upload className="tw:w-6 tw:h-6 tw:text-purple-600" />,
    route: "/dashboard/bulk-upload/add-stock",
    rbac: ["CONFIGS.BULK-UPLOAD"],
  },
  {
    id: "advanced-setting",
    label: "Advanced Setting",
    description: "Configure advanced settings and preferences",
    labelLangKey: "settings.advancedSetting",
    descriptionLangKey: "settings.advancedSettingDescription",
    icon: <Settings className="tw:w-6 tw:h-6 tw:text-indigo-600" />,
    route: "/configs/settings/others",
    rbac: ["CONFIGS.ADVANCE-SETTINGS"],
  },
  {
    id: "price-label-print",
    label: "Price Label Print",
    description: "Configure price label printing settings",
    labelLangKey: "settings.priceLabelPrint",
    descriptionLangKey: "settings.priceLabelPrintDescription",
    icon: <Printer className="tw:w-6 tw:h-6 tw:text-cyan-600" />,
    route: "/configs/settings/price-labels",
    rbac: ["CONFIGS.PRICE-LABEL-PRINT"],
  },
];

const defaultBreadcrumbs = [
  { label: "Dashboard", url: "/dashboard", langKey: "dashboard" },
  { label: "Configs", langKey: "configs" },
  { label: "Settings", langKey: "settings.title" },
];

const SettingsIndex = () => {
  const appNav = useAppNav();
  const { t } = useTranslation(["common"]);
  const appToast = useAppToast();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (AuthService.isManpowerLoggedIn()) {
        const resp = await UserService.getUser(AuthService.getLoggedInUserId());
        const d = resp?.data?.data || {};
        setUser({
          image: d.profileImages?.[0],
          name: d.name,
          mobile: d.mobile,
          email: d.email,
          id: d.referenceId,
        });
      } else {
        const resp = await AuthService.getLoggedInFranchiseDetails();
        const d = FranchiseService.formatFranchise(resp?.data?.data || {});
        setUser({
          image: d?.approvedShopImage,
          name: d?.name,
          mobile: d?.mobile,
          email: d?.email,
          id: d?.franchiseId,
        });
      }
    };
    fetchUser();
  }, []);

  const masterLoginAllowedCards = ["bulk-upload", "price-label-print"];

  const handleCardClick = (route: string, key: string) => {
    if (AuthService.isMasterLogin()) {
      if (!AuthService.isMasterLoginWithFullAccess() && !masterLoginAllowedCards.includes(key)) {
        appToast.show({
          msg: t("youAreNotAuthorizedToDoThisAction"),
          color: "danger",
        });
        return;
      }
    }
    appNav.to(route);
  };

  const handleViewProfile = () => {
    if (AuthService.isManpowerLoggedIn()) {
      appNav.to("/user/emp-profile");
      return;
    }
    appNav.to("/user/my-profile");
  };

  return (
    <>
      <AppHeader title={t("settings.title")} />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={defaultBreadcrumbs} />
          </div>
          <PageDescription description="settings" className="tw:mb-4" />

          <AppCard>
            <div className="tw:flex tw:gap-4">
              <div className="tw:w-16 tw:h-16 tw:overflow-hidden tw:bg-gray-100 tw:p-2 tw:rounded-full tw:flex tw:items-center tw:justify-center">
                {user?.image ? (
                  <ImgRender
                    assetId={user?.image}
                    alt="Shop"
                    className="tw:w-full tw:h-full tw:object-cover"
                  />
                ) : (
                  <Image size={16} color="#9CA3AF" />
                )}
              </div>
              <div className="tw:flex-1 tw:flex tw:flex-col tw:md:flex-row tw:md:justify-between tw:gap-4 tw:md:items-center">
                <div>
                  <div className="tw:text-xl tw:font-bold tw:line-clamp-2 tw:mb-2">
                    {user?.name}
                  </div>
                  <div className="tw:flex tw:gap-2">
                    <span className="tw:text-sm tw:md:text-xs tw:text-gray-500">
                      ID: {user?.id}
                    </span>

                    {user?.mobile && (
                      <span className="tw:text-sm tw:md:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                        <Phone size={12} />
                        {user?.mobile}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <AppButton
                    onClick={handleViewProfile}
                    size="small"
                    color="primary"
                    className="tw:w-full tw:sm:w-auto"
                  >
                    View Profile
                  </AppButton>
                </div>
              </div>
            </div>
          </AppCard>

          <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
            {configCards.map((card) => (
              <Rbac roles={card.rbac} key={card.id} forceDisplay={AuthService.isMasterLogin()}>
                <div
                  className="tw:cursor-pointer tw:transition-all tw:duration-200 hover:tw:shadow-md hover:tw:scale-105"
                  onClick={() => handleCardClick(card.route, card.id)}
                >
                  <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-4 tw:bg-white">
                    <div className="tw:flex tw:items-start tw:gap-4">
                      <div className="tw:flex-shrink-0">{card.icon}</div>
                      <div className="tw:flex-1">
                        <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:mb-2">
                          {t(card.labelLangKey)}
                        </h3>
                        <p className="tw:text-sm tw:text-gray-600 tw:mb-3">
                          {t(card.descriptionLangKey)}
                        </p>
                        <div className="tw:flex tw:items-center tw:text-blue-600 tw:text-sm tw:font-medium">
                          {t("settings.configureSettings")}
                          <ChevronRight className="tw:ml-1 tw:w-4 tw:h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Rbac>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsIndex;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("Settings"),
    },
  ];
}
