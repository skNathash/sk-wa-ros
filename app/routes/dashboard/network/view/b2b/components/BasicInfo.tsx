import React from "react";
import AppCard from "~/components/core/card/AppCard";
import { Mail, Phone, MapPin, FileText, User, Send } from "lucide-react";
import FranchiseService from "~/services/FranchiseService";
import CustomerService from "~/services/CustomerService";
import useAppNav from "~/hooks/useAppNav";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";
import KeyValue from "~/components/core/key-value/KeyValue";
import { useTranslation } from "react-i18next";
import ImgRender from "~/components/core/img/ImgRender";
import DateFormat from "~/components/core/date/DateFormat";
import Divider from "~/components/core/divider/Divider";
import AppButton from "~/components/core/button/AppButton";
import WhatsappTemplateModal from "~/shared/notifications/whatsapp-template/WhatsappTemplateModal";
import AuthService from "~/services/AuthService";

interface Props {
  franchise: any;
}

export default function BasicInfo({ franchise }: Props) {
  const { t } = useTranslation();
  const appNav = useAppNav();

  const [routeInfo, setRouteInfo] = React.useState<any>(null);

  React.useEffect(() => {
    if (!franchise) return;
    loadRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [franchise]);

  const loadRoute = async () => {
    try {
      const params: Record<string, any> = {
        page: 1,
        limit: 1,
        // filter: { _id: franchise._id },
        franchiseId: franchise._id,
        includeRoutes: true,
      };

      const resp = await FranchiseService.getFranchiseNetwork(params);
      const data = resp?.data?.data || [];
      if (Array.isArray(data) && data.length) {
        const customer = data[0];
        const route =
          Array.isArray(customer?.routes) && customer.routes.length
            ? customer.routes[0]
            : undefined;
        setRouteInfo(route);
      } else {
        setRouteInfo(null);
      }
    } catch (err) {
      console.error("Error loading route info:", err);
      setRouteInfo(null);
    }
  };

  if (!franchise) return null;

  const contactName = franchise.name;
  const subType = franchise?.subType || "";
  const contactRole = FranchiseService.getDisplaySubType(
    subType,
    franchise.networkType,
  );
  const email = franchise.email || "";
  const phone = franchise.mobile || "";
  const address = [
    franchise.addressLine1 || "",
    franchise.addressLine2 || "",
    franchise.city || "",
    franchise.state || "",
    franchise.pincode || "",
  ]
    .filter(Boolean)
    .join(", ");
  const { gst, pan, fssai } =
    FranchiseService.getFranchiseDocumentInfo(franchise);

  // Whatsapp modal
  const [whatsappModal, setWhatsappModal] = React.useState<{
    show: boolean;
    data?: any;
    users?: { name?: string; mobile?: string }[];
    categories?: string[];
    ignoreCategories?: string[];
    templateFor?: string[];
  }>({
    show: false,
    data: undefined,
    users: [],
    categories: undefined,
    ignoreCategories: undefined,
    templateFor: undefined,
  });

  const handleWhatsappCallback = (a: { action: string; data?: any }) => {
    setWhatsappModal((s) => ({ ...s, show: false, category: undefined }));
  };

  const handleWhatsappClick = () => {
    setWhatsappModal({
      show: true,
      data: {
        dynamicData: {
          customerName: contactName,
          orderId: "-",
          franchiseName: AuthService.getLoggedInUser()?.name || "",
          franchiseId: AuthService.getLoggedInUserId(),
          customerId: franchise._id,
        },
      },
      users: [{ name: contactName, mobile: phone }],
      categories: [],
      ignoreCategories: ["Invite", "payLater"],
      templateFor: ["B2B"],
    });
  };

  return (
    <>
      <AppCard noPadding>
        <div className="tw:flex tw:gap-2 tw:px-4 tw:py-3 tw:items-center">
          <div>
            <ImgRender
              assetId={franchise?.approvedShopImage}
              className="tw:rounded-full tw:w-16 tw:h-16"
            />
          </div>
          <div>
            <div className="tw:flex tw:justify-between tw:gap-2 tw:mb-1">
              <div>
                <KeyValue label={t("storeName")} size="sm">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    {contactName}
                    <UserBadgeType type={franchise.displayType?.name} />
                  </div>
                </KeyValue>
              </div>
              <div></div>
            </div>

            <div className="tw:flex tw:gap-2">
              <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                <span>{t("id")}: </span>
                <span>{franchise.franchiseId}</span>
              </div>

              <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-1">
                <span>{t("registeredOn")}: </span>
                <span>
                  <DateFormat
                    value={franchise.createdAt}
                    formatStr="dd MMM yyyy"
                  />
                </span>
              </div>
            </div>

            <div className="tw:flex tw:gap-4 tw:flex-wrap tw:mt-2">
              <div className="tw:flex tw:gap-1">
                <div className="tw:text-xs tw:text-gray-500">
                  Primary Business:
                </div>
                <div className="tw:text-xs tw:font-medium tw:mb-1">
                  {franchise.primaryBusiness || "--"}
                </div>
              </div>

              <div className="tw:flex tw:gap-1">
                <div className="tw:text-xs tw:text-gray-500">
                  Secondary Business:
                </div>
                <div className="tw:text-xs tw:font-medium tw:mb-1">
                  {franchise.secondaryBusiness || "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Divider className="tw:!my-0" />

        <div className="tw:px-4 tw:py-3 tw:text-xs">
          <div className="tw:flex tw:flex-wrap tw:justify-between tw:items-center tw:gap-2 tw:mb-2">
            <div className="tw:flex tw:items-center tw:gap-1 tw:text-gray-600">
              <Phone size={14} />
              {phone}
            </div>
            {/* Whatsapp button */}
            <div>
              <AppButton
                onClick={handleWhatsappClick}
                size="small"
                className="tw:flex tw:items-center tw:gap-2 tw:bg-green-500 tw:text-white hover:tw:bg-green-600 tw:shadow-sm tw:px-4 tw:whitespace-nowrap"
              >
                <ImgRender
                  src="whatsapp-logo.png"
                  className="tw:w-5 tw:h-5 tw:object-cover tw:brightness-0 tw:invert"
                />
                <span className="tw:text-sm tw:font-semibold">
                  Promote via WhatsApp
                </span>
                <Send size={14} />
              </AppButton>
            </div>
          </div>

          <div className="tw:flex tw:gap-1 tw:text-gray-600">
            <MapPin size={14} className="tw:mt-1" />
            <span className="tw:flex-1">{address}</span>
          </div>

          <div className="tw:flex tw:flex-wrap tw:gap-x-6 tw:gap-y-2 tw:mt-3">
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-gray-500">GST:</span>
              <span className="tw:font-medium">{gst || "--"}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-gray-500">PAN:</span>
              <span className="tw:font-medium">{pan || "--"}</span>
            </div>
            <div className="tw:flex tw:items-center tw:gap-1">
              <span className="tw:text-gray-500">FSSAI:</span>
              <span className="tw:font-medium">{fssai || "--"}</span>
            </div>
          </div>
        </div>
      </AppCard>

      <WhatsappTemplateModal
        show={whatsappModal.show}
        callback={handleWhatsappCallback}
        data={whatsappModal.data}
        users={whatsappModal.users}
        categories={whatsappModal.categories}
        ignoreCategories={whatsappModal.ignoreCategories}
        templateFor={whatsappModal.templateFor}
      />
    </>
  );
}
