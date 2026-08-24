import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { useEffect, useState } from "react";
import StorageService from "./services/StorageService";
import { APP_VERSION } from "./constants";
import {
  DEFAULT_THEME,
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
} from "./hooks/useTheme";
import { Megaphone, RefreshCw } from "lucide-react";

import type { Route } from "./+types/root";

import "./app.css";
import "./styles/font.scss";
import { Toaster } from "./components/ui/sonner";

declare global {
  interface Window {
    google: {
      maps: {
        __ib__: (value: unknown) => void;
      };
    };
    cordova?: any;
    Camera?: {
      DestinationType: {
        FILE_URI: number;
      };
      PictureSourceType: {
        CAMERA: number;
        PHOTOLIBRARY: number;
      };
    };
    resolveLocalFileSystemURL?: (
      url: string,
      successCallback: (fileEntry: any) => void,
      errorCallback?: (error: any) => void,
    ) => void;
  }

  interface Navigator {
    camera?: {
      getPicture: (
        successCallback: (imageData: string) => void,
        errorCallback: (error: string) => void,
        options: any,
      ) => void;
    };
  }
}

function CordovaInject() {
  useEffect(() => {
    const href = location.href || "";

    const urlHasCordova = href.indexOf("inj_cordova=1") !== -1;

    // If URL explicitly requests cordova injection, persist this choice
    if (urlHasCordova) {
      try {
        StorageService.set("cdva", 1);
      } catch (err) {
        // swallow storage errors silently
        console.error("Failed to persist cordova flag:", err);
      }
    }

    // Also allow injection when previously persisted in localStorage
    const stored = StorageService.get<string | number>("cdva");
    const storedFlag = stored === 1 || stored === "1";

    if (!urlHasCordova && !storedFlag) {
      return;
    }

    const cordovaScript = document.createElement("script");
    cordovaScript.src = location.origin + "/posapp/assets/cordova/cordova.js";
    cordovaScript.async = true;
    cordovaScript.defer = true;
    const nonceElement = document.querySelector("script[nonce]");
    if (nonceElement instanceof HTMLScriptElement) {
      cordovaScript.nonce = nonceElement.nonce;
    }
    document.head.appendChild(cordovaScript);
  }, []);
  return null;
}

export const links: Route.LinksFunction = () => [
  {
    rel: "icon",
    href: "/favicon.svg",
  },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap",
  },
  // Inter — theme-2's face, and the display/mono/figure stand-in everywhere the
  // app used to reach for a second family (see theme-2.css, Login.css).
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&display=swap",
  },
];

function GoogleMapsScript() {
  useEffect(() => {
    const loadGoogleMaps = () => {
      const g = {
        key: "AIzaSyAW2ISSW-C0OWAEb0Bk3-pM8jgHyu2CkLQ",
        v: "weekly",
      };

      const h = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const params = new URLSearchParams();
        params.set("libraries", "");
        params.set("callback", "google.maps.__ib__");

        Object.entries(g).forEach(([key, value]) => {
          params.set(
            key.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
            value,
          );
        });

        script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
        script.async = true;
        script.defer = true;
        const nonceElement = document.querySelector("script[nonce]");
        if (nonceElement instanceof HTMLScriptElement) {
          script.nonce = nonceElement.nonce;
        }

        script.onerror = () => reject(new Error("Google Maps could not load."));
        window.google = window.google || {};
        window.google.maps = window.google.maps || {};
        window.google.maps.__ib__ = resolve;

        document.head.appendChild(script);
      });

      return h;
    };

    loadGoogleMaps().catch(console.error);
  }, []);

  return null;
}

// Applies the persisted theme to <html> before first paint, so a user on
// theme-1 never sees a theme-2 flash. Runs blocking in <head>; the theme is
// then owned by the `data-theme` attribute (see app/hooks/useTheme.ts).
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  StorageService.KEY_PREFIX + THEME_STORAGE_KEY,
)});if(t){t=t.replace(/^"|"$/g,"");if(${JSON.stringify(
  THEME_OPTIONS.map((o) => o.value),
)}.indexOf(t)>-1){document.documentElement.setAttribute("data-theme",t);}}}catch(e){}})();`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta content="#000000" name="theme-color" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Meta />
        <Links />

        <meta
          property="og:title"
          content="StoreKing - Transforming Small Town Kiranas into Digital Supermarkets"
        />
        <meta
          property="og:description"
          content="StoreKing has brought an solution to Unlocking online supermarket capabilities for local retailers in India's small towns"
        />
        <meta
          name="keywords"
          content="Online Supermarket for Small Towns, Digital Kirana Store, Upgrade Kirana to Online Store, StoreKing CLUB, Kirana Store App, Kirana Digital Transformation, Small Town Supermarket, Small-Town India Grocery, Rural Retail India, Tier 2–4 Retail Market, FMCG in Small Towns, Rural FMCG Growth, Supermarket for Small Towns, Underserved Towns Retail"
        />

        <meta property="og:url" content="http://storeking.in/" />
        <meta property="og:site_name" content="Storeking" />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://app.storeking.in/images/logo.svg"
        />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:image:width" content="300" />
        <meta property="og:image:height" content="300" />
        <meta property="og:image:alt" content="StoreKing" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <GoogleMapsScript />
        <CordovaInject />
        <Toaster />
      </body>
    </html>
  );
}

interface BroadcastMessage {
  id: string;
  message: string;
}

const BROADCAST_DISMISSED_KEY = "broadcastMsgId";

export default function App() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [broadcast, setBroadcast] = useState<BroadcastMessage | null>(null);

  useEffect(() => {
    // 3 minutes in milliseconds
    const INTERVAL_MS = 3 * 60 * 1000;

    const checkVersion = async () => {
      try {
        const basePath = "http://localhost:5173";
        const res = await fetch(`${basePath}/version.json?t=${Date.now()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.version && data.version !== APP_VERSION) {
          setShowUpdateModal(true);
        }

        if (data?.broadcast?.id && data.broadcast.message) {
          const dismissedId = StorageService.get<string>(
            BROADCAST_DISMISSED_KEY,
          );
          if (dismissedId !== String(data.broadcast.id)) {
            setBroadcast({
              id: String(data.broadcast.id),
              message: String(data.broadcast.message),
            });
          } else {
            setBroadcast(null);
          }
        } else {
          setBroadcast(null);
        }
      } catch (err) {
        console.error("Failed to check app version:", err);
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleBroadcastDismiss = () => {
    if (broadcast) {
      StorageService.set(BROADCAST_DISMISSED_KEY, broadcast.id);
    }
    setBroadcast(null);
  };

  return (
    <>
      {broadcast && (
        <div className="tw:fixed tw:inset-0 tw:bg-slate-900/60 tw:backdrop-blur-sm tw:z-9998 tw:flex tw:items-center tw:justify-center">
          <div className="tw:bg-white tw:rounded-2xl tw:p-8 tw:max-w-sm tw:w-full tw:mx-4 tw:shadow-2xl tw:border tw:border-slate-100 tw:text-center tw:animate-in tw:fade-in tw:zoom-in-95 tw:duration-200">
            <div className="tw:w-16 tw:h-16 tw:bg-amber-50 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mx-auto tw:mb-6">
              <Megaphone className="tw:w-8 tw:h-8 tw:text-amber-600" />
            </div>
            <p className="tw:text-base tw:font-medium tw:text-slate-800 tw:mb-6 tw:leading-relaxed">
              {broadcast.message}
            </p>
            <button
              type="button"
              onClick={handleBroadcastDismiss}
              className="tw:w-full tw:bg-amber-600 tw:hover:bg-amber-700 tw:active:bg-amber-800 tw:text-white tw:font-semibold tw:py-3 tw:px-4 tw:rounded-xl tw:transition-all tw:shadow-lg tw:shadow-amber-500/20 tw:cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}
      <Outlet />
      {showUpdateModal && (
        <div className="tw:fixed tw:inset-0 tw:bg-slate-900/60 tw:backdrop-blur-sm tw:z-9999 tw:flex tw:items-center tw:justify-center">
          <div className="tw:bg-white tw:rounded-2xl tw:p-8 tw:max-w-sm tw:w-full tw:mx-4 tw:shadow-2xl tw:border tw:border-slate-100 tw:text-center tw:animate-in tw:fade-in tw:zoom-in-95 tw:duration-200">
            <div className="tw:w-16 tw:h-16 tw:bg-blue-50 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:mx-auto tw:mb-6">
              <RefreshCw
                className="tw:w-8 tw:h-8 tw:text-blue-600 tw:animate-spin"
                style={{ animationDuration: "3s" }}
              />
            </div>
            <h2 className="tw:text-xl tw:font-bold tw:text-slate-900 tw:mb-2">
              App Update Available
            </h2>
            <p className="tw:text-sm tw:text-slate-500 tw:mb-6 tw:leading-relaxed">
              A new version of the app is available. Please reload the app to
              get the latest features and updates.
            </p>
            <button
              type="button"
              onClick={handleReload}
              className="tw:w-full tw:bg-blue-600 hover:tw:bg-blue-700 active:tw:bg-blue-800 tw:text-white tw:font-semibold tw:py-3 tw:px-4 tw:rounded-xl tw:transition-all tw:shadow-lg tw:shadow-blue-500/20 tw:cursor-pointer tw:flex tw:items-center tw:justify-center tw:gap-2"
            >
              <RefreshCw size={16} />
              Reload App
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="tw:pt-16 tw:p-4 tw:container tw:mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="tw:w-full tw:p-4 tw:overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function HydrateFallback() {
  return (
    <div className="tw:h-screen tw:flex tw:absolute tw:top-0 tw:left-0 tw:right-0 tw:bottom-0 tw:justify-center tw:items-center tw:flex-col tw:gap-4 tw:bg-white">
      <img
        src="/assets/images/logo/logo.png"
        alt="StoreKing"
        className="tw:h-10"
      />
      <div className="tw:text-xs tw:text-gray-500">
        Please wait, we are loading the app...
      </div>
      <div>
        <img
          src="/assets/images/ai/loader.gif"
          alt="StoreKing"
          className="tw:h-20"
        />
      </div>
    </div>
  );
}
