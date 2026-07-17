import { Globe } from "lucide-react";
import { useCallback, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppLangChangeModal from "~/shared/others/modals/app-lang-change/AppLangChangeModal";
import ImgRender from "~/components/core/img/ImgRender";

const AppSimpleHeader = ({ title }: { title: string }) => {
  const [showLangModal, setShowLangModal] = useState(false);

  const handleLangCallback = useCallback(
    (a: { action: string; data?: any }) => {
      if (!a || !a.action) return;
      if (a.action === "close") setShowLangModal(false);
      if (a.action === "changed") setShowLangModal(false);
    },
    []
  );

  return (
    <header className="tw:bg-white tw:border-b tw:border-gray-200 tw:sticky tw:top-0 tw:z-50 tw:left-0 tw:right-0">
      <div className="app-container">
        <div className="tw:flex tw:justify-between tw:items-center tw:h-15">
          <div className="tw:flex tw:items-center tw:gap-3">
            <ImgRender
              src="logo.svg"
              alt="Logo"
              className="tw:w-8 tw:h-8 tw:ml-4 tw:md:ml-0"
            />
            <h1 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:line-clamp-1">
              {title}
            </h1>
          </div>

          <div className="tw:flex tw:items-center tw:gap-3">
            <AppButton
              size="icon"
              fill="clear"
              className="tw:p-2 tw:rounded tw:text-slate-700 hover:tw:bg-slate-100 tw:transition"
              onClick={() => setShowLangModal(true)}
              aria-label="Change language"
              type="button"
            >
              <Globe className="tw:w-5 tw:h-5" />
            </AppButton>
          </div>
        </div>
      </div>

      <AppLangChangeModal show={showLangModal} callback={handleLangCallback} />
    </header>
  );
};

export default AppSimpleHeader;
