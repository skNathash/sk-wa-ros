import { useCallback, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import useAppToast from "~/hooks/useAppToast";
import FranchiseService from "~/services/FranchiseService";
import UserPaymentConfigForm from "~/shared/configs/components/user-payment-config-form/UserPaymentConfigForm";

type Props = {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
  type?: "B2C" | "B2B";
  userId?: string;
};

const UserPaymentConfigModal = ({
  show,
  callback,
  type = "B2C",
  userId,
}: Props) => {
  const appToast = useAppToast();
  const [keys, setKeys] = useState<Record<string, boolean> | null>(null);

  const handleFormCallback = (params: { action: string; data?: any }) => {
    if (params.action === "switch-change") {
      setKeys(params.data);
    }
  };

  const handleSave = useCallback(async () => {
    if (!userId) {
      appToast.show({ msg: "User not selected", color: "error" });
      return;
    }

    if (!keys?.cod && !keys?.prepaid) {
      appToast.show({
        msg: "At least one payment option must be enabled",
        color: "error",
      });
      return;
    }

    const payload = {
      businessType: type,
      buyerId: userId,
      codEnabled: !!keys?.cod,
      prepaidEnabled: !!keys?.prepaid,
      isActive: true,
      remarks: "COD and Prepaid payment updated",
    } as any;

    const res = await FranchiseService.updateUserPaymentConfig(payload);

    if (res?.statusCode === 200 || res?.statusCode === 201) {
      appToast.show({
        msg: "User payment config updated successfully",
        color: "success",
      });
      callback({ action: "saved", data: { userId } });
    } else {
      appToast.show({
        msg: res?.data?.message || "Failed to update user payment config",
        color: "error",
      });
    }
  }, [userId, keys, type]);

  const onClose = () => callback({ action: "close" });

  return (
    <AppModal show={show} callback={onClose} className="tw:max-w-3xl!">
      <AppModal.Title onClose={onClose}>User Payment Config</AppModal.Title>
      <AppModal.Content>
        {userId ? (
          <UserPaymentConfigForm
            userId={userId}
            type={type}
            callback={handleFormCallback}
          />
        ) : null}
      </AppModal.Content>

      {userId ? (
        <AppModal.Footer>
          <div className="tw:flex tw:gap-2 tw:w-full tw:justify-end">
            <AppButton onClick={onClose} fill="outline" color="light">
              Cancel
            </AppButton>
            <AppButton onClick={handleSave} fill="solid" color="primary">
              Save
            </AppButton>
          </div>
        </AppModal.Footer>
      ) : null}
    </AppModal>
  );
};

export default UserPaymentConfigModal;
