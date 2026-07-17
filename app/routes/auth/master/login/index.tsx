import { useEffect, useState } from "react";
import AppCard from "~/components/core/card/AppCard";
import ImgRender from "~/components/core/img/ImgRender";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import AuthService from "~/services/AuthService";
import { StorageService } from "~/services/StorageService";
import useAppNav from "~/hooks/useAppNav";

const styleObj = {
  background:
    "linear-gradient(90deg,#4285F4 0%,#34A853 33%,#FBBC05 66%,#EA4335 100%)",
};
const MasterLogin = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const nav = useAppNav();

  useEffect(() => {
    try {
      if (StorageService.has("_et")) {
        nav.replace("/auth/master/stores");
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const error = params.get("error");

      if (error) {
        setErrorMsg(error);
      }

      if (token) {
        StorageService.set("_et", token);

        nav.replace("/auth/master/stores");
        return;
      }
    } catch (e) {}
  }, []);

  return (
    <>
      <div className="tw:max-w-xl tw:mx-auto tw:h-full">
        <div className="tw:flex tw:gap-4 tw:items-center tw:justify-center tw:h-full tw:mx-4">
          <AppCard
            className="tw:w-full tw:border-2 tw-border-transparent tw:overflow-hidden tw:relative"
            bodyClassName="tw:py-6 tw:px-6"
          >
            <div
              className="tw:h-1 tw:w-full tw:absolute tw:top-0 tw:left-0 tw:right-0"
              style={styleObj}
            ></div>
            <div className="tw:flex tw:flex-col tw:gap-3 tw:items-center tw:justify-center tw:mb-4">
              <ImgRender src="logo/logo.png" className="tw:h-10" />
              <div className="tw:font-bold tw:text-lg tw:uppercase tw:text-blue-800">
                Master Login
              </div>
            </div>
            {errorMsg ? (
              <InfoBlock size="sm" className="tw:mb-4" variant="danger">
                <div className="tw:text-xs">{errorMsg}</div>
              </InfoBlock>
            ) : null}
            <div className="tw:mb-6">
              <div className="tw:font-semibold tw:text-center tw:text-base">
                Sign in to continue
              </div>
              <div className="tw:text-xs tw:text-gray-500 tw:text-center tw:mt-2">
                Use your Google account to access the admin dashboard
              </div>
            </div>

            <div className="tw:flex tw:justify-center tw:mt-2">
              <button
                onClick={() => AuthService.masterLogin()}
                className="tw:shadow-md tw:text-sm tw:font-semibold tw:px-4 tw:py-2 tw:rounded-md tw:cursor-pointer tw:flex tw:items-center tw:gap-2"
              >
                {/* Inline Google 'G' logo */}
                <svg
                  xmlns="https://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 40 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
                  ></path>
                  <path
                    fill="#FABB05"
                    d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
                  ></path>
                  <path
                    fill="#E94235"
                    d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
                  ></path>
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>
          </AppCard>
        </div>
      </div>
    </>
  );
};

export default MasterLogin;
