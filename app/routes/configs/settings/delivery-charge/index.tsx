import orderBy from "lodash/orderBy";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import AppHeader from "~/components/core/header/AppHeader";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useAppAlert from "~/hooks/useAlert";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import MobileView from "./components/MobileView";
import ManageDeliveryChargeModal from "./modals/ManageDeliveryChargeModal";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["CONFIGS.DELIVERY-CHARGE"]);
}

// Define a type for delivery charge data
interface DeliverySlab {
  fromOrderValue: number;
  toOrderValue: number;
  isFree: boolean;
  chargeSlabKiloMeter?: Array<{
    from: number;
    to: number;
    charge: number;
  }>;
}
// data is an array of DeliverySlab items

const getBreadcrumbs = (t: any): BreadcrumbItem[] => [
  { label: t("dashboard"), redirect: { path: "/dashboard" } },
  { label: t("configs"), redirect: { path: "/configs/settings" } },
  { label: t("deliveryCharge.title") },
];

const DeliveryCharge = () => {
  const { t } = useTranslation(["common"]);
  const { isMobile } = useScreenView();
  const appToast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [busyloader, setBusyloader] = useState(false);
  const [data, setData] = useState<DeliverySlab[]>([]);
  const [manageModal, setManageModal] = useState<{ show: boolean; data?: any }>(
    { show: false },
  );
  const { confirm } = useAppAlert();

  const [existingConfig, setExistingConfig] = useState<any>(null);

  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use the same configs API as payment-config to fetch franchise configs
        const res = await FranchiseService.getConfigs({});
        const configData = res?.data?.data?.[0] || null;

        if (configData) {
          setExistingConfig(configData);
          const slabs = orderBy(
            configData?.shippingChargesConfig?.slab || [],
            ["fromOrderValue"],
            ["asc"],
          );
          setData(slabs);
        } else {
          setExistingConfig(null);
          setData([]);
        }
      } catch (error) {
        setExistingConfig(null);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAdd = () => {
    setManageModal({ show: true, data: undefined });
  };

  const handleModalCallback = (result: { action: string; data?: any }) => {
    if (result.action === "save") {
      // Refresh configs after save
      (async () => {
        setManageModal({ show: false, data: undefined });
        setBusyloader(true);
        try {
          const res = await FranchiseService.getConfigs({});

          const configData = res?.data?.data?.[0] || null;

          if (configData) {
            setExistingConfig(configData);
            setData(
              orderBy(
                configData?.shippingChargesConfig?.slab || [],
                ["fromOrderValue"],
                ["asc"],
              ),
            );
          } else {
            setExistingConfig(null);
            setData([]);
          }
        } catch (err) {
          console.error("Failed to refresh configs after save", err);
        } finally {
          setBusyloader(false);
        }
      })();
    } else if (result.action === "close") {
      setManageModal({ show: false, data: undefined });
    }
  };

  const handleEdit = (slabIndex: number = 0) => {
    const d = data[slabIndex];
    setManageModal({
      show: true,
      data: {
        fromOrderValue: d.fromOrderValue,
        toOrderValue: d.toOrderValue,
        freeDelivery: d.isFree,
        slabs: Array.isArray(d.chargeSlabKiloMeter)
          ? d.chargeSlabKiloMeter.map((slab: any) => ({
              fromKm: slab.from,
              toKm: slab.to,
              charges: slab.charge,
            }))
          : [],
        editIndex: slabIndex,
      },
    });
  };

  // Remove slab function with confirmation
  const handleRemoveSlab = async (mainSlabIndex: number) => {
    const d = data[mainSlabIndex];
    setAppAlertDialog({
      show: true,
      title: t("deliveryCharge.removeDeliveryCharge"),
      description: t(
        "deliveryCharge.areYouSureYouWantToRemoveThisDeliveryCharge",
      ),
      successCb: async () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));

        await new Promise((resolve) => setTimeout(resolve, 300));

        setBusyloader(true);

        try {
          const res = await FranchiseService.getConfigs({});
          const slabs = res?.data?.data?.[0]?.shippingChargesConfig?.slab || [];
          const newSlabs = slabs.filter(
            (slab: any, index: number) => index !== mainSlabIndex,
          );
          const updateRes = await FranchiseService.updateConfigs(
            res?.data?.data?.[0]._id,
            {
              shippingChargesConfig: {
                slab: newSlabs,
              },
            },
          );

          if (updateRes.statusCode == 200 || updateRes.statusCode == 201) {
            setBusyloader(false);

            appToast.show({
              msg: t("deliveryCharge.deliveryChargeRemovedSuccessfully"),
              color: "success",
              duration: 3000,
            });

            setData([...newSlabs]);
          } else {
            appToast.show({
              msg:
                updateRes.data?.message ||
                t("deliveryCharge.failedToRemoveDeliveryCharge"),
              color: "danger",
              duration: 3000,
            });
          }
        } catch (err) {
          console.error("Failed to remove slab", err);
        } finally {
          setBusyloader(false);
        }
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const handleCallback = (action: string, data?: any) => {
    if (action === "edit") {
      handleEdit(data.index);
    } else if (action === "remove") {
      handleRemoveSlab(data.index);
    }
  };

  return (
    <>
      <AppHeader
        title={t("deliveryCharge.title")}
        sectionKey="profile"
        activeTab="settings"
        mobileLead="menu"
      />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container ">
          <div className="tw:md:max-w-4xl tw:mx-auto">
            <div className="tw:flex tw:md:flex-row tw:flex-col tw:md:justify-between tw:md:items-center tw:mb-4 tw:gap-4">
              <div>
                <AppBreadcrumbs data={getBreadcrumbs(t)} />
                <div className="tw:text-gray-500 tw:text-xs">
                  {t("deliveryCharge.description")}
                </div>
              </div>
              <AppButton
                onClick={handleAdd}
                size="small"
                color="primary"
                noShadow={true}
              >
                <PlusIcon size={16} />
                {t("deliveryCharge.addCharge")}
              </AppButton>
            </div>

            <AppCard
              title={t("deliveryCharge.deliveryChargeSlabs")}
              icon="truck"
            >
              {loading ? (
                <div className="tw:flex tw:items-center tw:justify-center tw:h-full">
                  <AppSpinner />
                </div>
              ) : (
                <>
                  {isMobile ? (
                    <MobileView data={data} callback={handleCallback} />
                  ) : (
                    <DesktopView data={data} callback={handleCallback} />
                  )}
                </>
              )}
            </AppCard>
          </div>
        </div>
      </div>

      <ManageDeliveryChargeModal
        show={manageModal.show}
        callback={handleModalCallback}
        data={manageModal.data}
      />

      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />

      <BusyLoader show={busyloader} />
    </>
  );
};

export default DeliveryCharge;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Delivery Charge Configuration",
      ),
    },
  ];
}
