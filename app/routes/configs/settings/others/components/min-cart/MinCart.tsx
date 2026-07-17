import React, { useEffect, useState } from "react";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import FranchiseService from "~/services/FranchiseService";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import { Info } from "lucide-react";
import MinCartOption from "./MinCartOption";
import ConfigLogModal from "../../modals/logs/ConfigLogModal";

const MinCart: React.FC = () => {
  const toast = useAppToast();

  const [showLogModal, setShowLogModal] = useState(false);

  const [b2cValue, setB2cValue] = useState<number | undefined>(undefined);
  const [b2bValue, setB2bValue] = useState<number | undefined>(undefined);
  const [b2cAutoApprove, setB2cAutoApprove] = useState<boolean | undefined>(
    undefined
  );
  const [b2bAutoApprove, setB2bAutoApprove] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    const load = async () => {
      try {
        const extractMin = (data: any) => {
          if (!data)
            return { minOrderAmount: undefined, autoApprove: undefined };
          return {
            minOrderAmount: data?.configValue?.minOrderAmount,
            autoApprove: data?.configValue?.autoApprove,
          };
        };

        const rB2c = await FranchiseService.getFranchiseSettings({
          configType: "B2C_ORDER_CONFIG",
        });
        const { minOrderAmount: minB2c, autoApprove: autoApproveB2c } =
          extractMin(rB2c?.data?.data);
        if (typeof minB2c !== "undefined") setB2cValue(minB2c);
        if (typeof autoApproveB2c !== "undefined")
          setB2cAutoApprove(autoApproveB2c);
        // store audit logs per config type
        // audit logs are handled via modal data when requested

        if (AuthService.canHandleB2B()) {
          const rB2b = await FranchiseService.getFranchiseSettings({
            configType: "B2B_ORDER_CONFIG",
          });
          const { minOrderAmount: minB2b, autoApprove: autoApproveB2b } =
            extractMin(rB2b?.data?.data);
          if (typeof minB2b !== "undefined") setB2bValue(minB2b);
          if (typeof autoApproveB2b !== "undefined")
            setB2bAutoApprove(autoApproveB2b);
          // audit logs are handled via modal data when requested
        }
      } catch (e: any) {
        toast.show({
          msg: e?.message || "Failed to load settings",
          color: "error",
        });
      }
    };

    load();
  }, []);

  const handleOptionAction = ({ action }: { action: string; data?: any }) => {
    if (action === "openLogs") {
      setShowLogModal(true);
    }
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <InfoBlock variant="info" size="sm">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Info size={16} className="tw:flex-shrink-0" />
          <span className="tw:font-medium">
            The Minimum Cart configuration will be applied only in the Club and
            StoreKing App.
          </span>
        </div>
      </InfoBlock>

      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
        {AuthService.canHandleB2B() && (
          <MinCartOption
            configType="B2B_ORDER_CONFIG"
            title="Minimum Cart - B2B"
            subtitle="Configure minimum cart value for network retailers"
            initialValue={b2bValue}
            initialAutoApprove={b2bAutoApprove}
            onAction={handleOptionAction}
          />
        )}

        <MinCartOption
          configType="B2C_ORDER_CONFIG"
          title="Minimum Cart - B2C"
          subtitle="Configure minimum cart value for consumer customers"
          initialValue={b2cValue}
          initialAutoApprove={b2cAutoApprove}
          onAction={handleOptionAction}
        />

        <ConfigLogModal
          show={showLogModal}
          type="minOrderAmount"
          callback={({ action }) => {
            if (action === "close") {
              setShowLogModal(false);
            }
          }}
        />
      </div>
    </div>
  );
};

export default MinCart;
