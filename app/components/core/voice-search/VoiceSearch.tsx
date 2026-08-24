import { Mic } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import VoiceSearchModal from "./modals/VoiceSearchModal";
import MiscService from "~/services/MiscService";
import useAppToast from "~/hooks/useAppToast";

type Props = {
  children?: ReactNode;
  callback?: (arg: { action: string; data?: any }) => void;
  className?: string;
  /** See {@link VoiceSearchModal} — `raw` skips the catalog keyword lookup. */
  mode?: "product" | "raw";
};

declare const window: any;

const VoiceSearch = ({ children, callback, className, mode }: Props) => {
  const [show, setShow] = useState(false);

  const appToast = useAppToast();

  const cb = (e: any) => {
    setShow(false);
    try {
      if (typeof callback === "function") {
        callback(e);
      }
    } catch (err) {
      // ignore
    }
  };

  const openVoiceDailog = () => {
    if (MiscService.hasCordova()) {
      const speech = window.parent?.plugins?.speechRecognition;
      if (
        typeof speech !== "undefined" &&
        typeof speech.requestPermission === "function"
      ) {
        // request permission and open modal on success
        speech.requestPermission(
          () => {
            setShow(true);
          },
          () => {
            // permission denied - show a toast and do not open the modal
            try {
              appToast.show({
                msg: "Voice recognition permission denied",
                color: "danger",
              });
            } catch (e) {
              // ignore toast errors
            }
          }
        );
        return;
      }
    } else {
      setShow(true);
    }
  };

  return (
    <>
      <button type="button" onClick={openVoiceDailog} className={className}>
        {children ? children : <Mic size={16} />}
      </button>
      <VoiceSearchModal show={show} callback={cb} mode={mode} />
    </>
  );
};

export default VoiceSearch;
