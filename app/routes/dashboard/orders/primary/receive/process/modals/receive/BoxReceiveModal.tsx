import React, { useEffect, useState } from "react";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./components/products/DesktopView";
import MobileView from "./components/products/MobileView";
import { useForm } from "react-hook-form";
import { Package, PackageCheck } from "lucide-react";
import AppModal from "~/components/core/modal/AppModal";
import AppTab from "~/components/core/tab/AppTab";
import AppTextarea from "~/components/core/form/AppTextarea";
import AppButton from "~/components/core/button/AppButton";
import type { TabItem } from "~/types/CommonTypes";
import BoxOverview from "./components/BoxOverview";
import ReceiveSummary from "./components/ReceiveSummary";
import { produce } from "immer";
import LogisticsService from "~/services/LogisticsService";
import AuthService from "~/services/AuthService";
import useAppToast from "~/hooks/useAppToast";
import { useTranslation } from "react-i18next";

interface BoxReceiveModalProps {
  show: boolean;
  onClose: () => void;
  selectedBox?: any;
  onReceive?: (data: any) => void;
}

interface FormData {
  notes: string;
}

const tabs: TabItem[] = [
  {
    key: "box-level",
    name: "Box Level Receiving",
    icon: "Package",
    langKey: "boxLevelReceiving",
  },
  {
    key: "item-level",
    name: "Item Level Receiving",
    icon: "PackageCheck",
    langKey: "itemLevelReceiving",
  },
];

const BoxReceiveModal: React.FC<BoxReceiveModalProps> = ({
  show,
  onClose,
  selectedBox,
  onReceive,
}) => {
  const { t } = useTranslation();

  const { isMobile } = useScreenView();

  const appToast = useAppToast();

  const {
    register,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    defaultValues: {
      notes: "",
    },
  });

  const [activeTab, setActiveTab] = useState("box-level");

  const [products, setProducts] = useState<any[]>([]);

  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    if (show) {
      setProducts(
        (selectedBox?.items || []).map((e: any) => {
          return {
            ...e,
            receivedQty: e.receivedQty || 0,
            damagedQty: e.damagedQty || 0,
            notes: e.notes || "",
          };
        })
      );
    }
  }, [show]);

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
  };

  const onSubmit = (data: FormData) => {
    if (onReceive) {
      onReceive({
        type: activeTab,
        boxes: selectedBox ? [selectedBox] : [],
        notes: data.notes.trim(),
      });
    }
  };

  const handleModalCallback = ({ action }: { action: string; data: any }) => {
    if (action === "close") {
      onClose();
    }
  };

  const productCallback = (a: { action: string; data?: any }) => {
    if (a.action === "update") {
      setProducts(
        produce((draft) => {
          if (a.data.field === "notes") {
            draft[a.data.index].notes = a.data.value;
            return;
          }

          const product = draft[a.data.index];

          const value = Number(a.data.value);

          const receivedQty = product.receivedQty || 0;
          const damagedQty = product.damagedQty || 0;
          const orderedQty = product.qty || 0;

          if (receivedQty + damagedQty > orderedQty || value > orderedQty) {
            return;
          }

          if (a.data.field === "received") {
            product.receivedQty = value;
            product.damagedQty = orderedQty - value;
          }

          if (a.data.field === "damaged") {
            product.receivedQty = orderedQty - value;
            product.damagedQty = value;
          }
        })
      );
    }
  };

  const receiveBox = async () => {
    let items: any[] = [];

    products.forEach((e) => {
      (e.snapshots || []).forEach((s: any) => {
        items.push({
          id: s.id,
          dealId: e.dealId,
          quantity: s.quantity,
          remarks: getValues("notes"),
          location: "L1-R1-B1",
        });
      });
    });

    setReceiving(true);
    const res = await LogisticsService.receiveBox(selectedBox?._id, {
      franchiseId: AuthService.getLoggedInUserId(),
      items,
    });
    setReceiving(false);

    if (res.statusCode === 200) {
      appToast.show({
        msg: t("boxReceivedSuccessfully"),
        color: "success",
      });
      onReceive?.({
        type: activeTab,
        boxes: selectedBox ? [selectedBox] : [],
        notes: getValues("notes").trim(),
      });
    } else {
      appToast.show({
        msg: res?.data?.message || t("boxReceivingFailed"),
        color: "danger",
      });
    }
  };

  return (
    <AppModal
      show={show}
      callback={handleModalCallback}
      className="tw:!max-w-4xl tw:h-[90vh]"
    >
      <AppModal.Title onClose={onClose}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <Package className="tw:w-5 tw:h-5 tw:text-primary" />
          <h2 className="tw:text-lg tw:font-semibold tw:text-gray-900">
            {t("receiveShipmentBoxes")}
          </h2>
        </div>
        <div className="tw:text-xs tw:text-gray-500 tw:mb-2">
          {t("youCanReceiveAtBoxLevelOrItemLevel")}
        </div>
      </AppModal.Title>

      <AppModal.Content>
        {/* Tabs */}
        <AppTab
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          variant="tabs"
          className="tw:mb-4"
        />

        {/* Tab Content */}
        <div className="tw:flex-1 tw:overflow-hidden">
          {activeTab === "box-level" && (
            <div className="tw:h-full tw:flex tw:flex-col">
              <BoxOverview box={selectedBox} />
            </div>
          )}

          {activeTab === "item-level" && (
            <>
              {isMobile ? (
                <MobileView products={selectedBox?.items} />
              ) : (
                <DesktopView products={products} callback={productCallback} />
              )}
            </>
          )}
        </div>

        {/* Notes Section */}
        <div className="tw:border-t tw:border-gray-200 tw:pt-4">
          <AppTextarea
            name="notes"
            register={register}
            label={t("notes")}
            placeholder={t("enterAnyAdditionalNotesForThisReceiveOperation")}
            rows={3}
            maxLength={500}
            error={errors.notes?.message}
          />
        </div>

        {/* Summary Component - Moved after textarea */}
        <ReceiveSummary
          mode={activeTab as "box-level" | "item-level"}
          selectedBoxes={selectedBox ? 1 : 0}
          status="Ready to Receive"
        />
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:gap-3">
          <AppButton
            onClick={onClose}
            fill="outline"
            color="secondary"
            size="default"
          >
            {t("cancel")}
          </AppButton>
          <AppButton
            type="submit"
            color="primary"
            size="default"
            onClick={receiveBox}
            isLoading={receiving}
          >
            {t("receive")} {activeTab === "box-level" ? t("box") : t("items")}
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default BoxReceiveModal;
