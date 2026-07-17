import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import AppHeader from "~/components/core/header/AppHeader";
import useAppNav from "~/hooks/useAppNav";
import CommonService from "~/services/CommonService";

export async function clientLoader() {
  return true; // Allow access to manual page
}

const ManualPage = () => {
  const { t } = useTranslation(["common"]);
  const { to } = useAppNav();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the origin for security
      if (event.origin !== "https://app.storeking.in") {
        return;
      }

      // Handle redirection messages from iframe
      if (event.data && typeof event.data === "object") {
        const { type, path, params } = event.data;

        if (type === "redirect" && path) {
          to(path, params);
        }
      }
    };

    // Add event listener when component mounts
    window.addEventListener("message", handleMessage);

    // Cleanup: remove event listener when component unmounts
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [to]);

  return (
    <>
      <AppHeader title={t("userManual")} showCart={true} />
      <div className="app-page tw:!overflow-hidden">
        <div className="app-container tw:!overflow-hidden">
          <div className="tw:h-[calc(100vh-70px)]">
            <iframe
              src="https://app.storeking.in/manual"
              className="tw:w-full tw:h-full tw:border-0 tw:rounded-lg"
              title="User Manual"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ManualPage;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle("User Manual"),
    },
  ];
}
