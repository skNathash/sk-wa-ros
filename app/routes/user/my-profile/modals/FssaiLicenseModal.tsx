import React from "react";
import AppModal from "~/components/core/modal/AppModal";
import FssaiLicense from "../components/FssaiLicense";

type Props = {
  show: boolean;
  profileRequestLogs?: any[];
  callback: (a: { action: string; data?: any }) => void;
};

/**
 * The FSSAI licence editor in a modal. Theme-2 has no card stack to host the
 * inline editor, so the same component is reused here behind the business
 * card's "FSSAI" action.
 */
const FssaiLicenseModal: React.FC<Props> = ({
  show,
  profileRequestLogs,
  callback,
}) => (
  <AppModal show={show} callback={callback} className="tw:h-[90vh]">
    <AppModal.Title onClose={() => callback({ action: "close" })}>
      <div className="tw:text-lg tw:font-semibold">FSSAI license</div>
    </AppModal.Title>
    <AppModal.Content>
      <FssaiLicense
        profileRequestLogs={profileRequestLogs}
        callback={() => callback({ action: "submit" })}
      />
    </AppModal.Content>
  </AppModal>
);

export default FssaiLicenseModal;
