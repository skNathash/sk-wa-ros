import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import MiscService from "~/services/MiscService";
import ProductService from "~/services/ProductService";
import AppSpinner from "../../Spinner/AppSpinner";
// Removed ImgRender GIF; using a looping video background with centered Mic icon
import AppButton from "../../button/AppButton";
import ImgRender from "../../img/ImgRender";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
};

const voiceLanguages: Array<{ key: string; label: string }> =
  CommonService.getVoiceSearchLangs();

declare const window: any;

const stopCordovaListening = () => {
  return new Promise((resolve) => {
    const triggerResolve = () => {
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve(true);
      }, 500);
    };

    try {
      const speech = window.parent?.plugins?.speechRecognition;
      if (speech && typeof speech.stopListening === "function") {
        speech.stopListening(
          () => {
            triggerResolve();
          },
          (e: any) => {
            triggerResolve();
          },
        );
      } else {
        triggerResolve();
      }
    } catch (e) {
      triggerResolve();
    }
  });
};

const VoiceSearchModal = ({ show, callback }: Props) => {
  const recRef = useRef<any | null>(null);
  const suppressCloseRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<Element | null>(null);

  const appToast = useAppToast();

  const [lang, setLang] = useState<string>(
    () => CommonService.getVoiceLang() || "kn-IN",
  );

  const [word, setWord] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  /* video replaced by animated gradient; no video-ready state needed */

  const isSearchingRef = useRef(false);

  const init = useCallback(() => {
    try {
      // If a recognition instance already exists, abort it and suppress its onend
      if (recRef.current) {
        try {
          // disable previous onend to avoid it calling close
          recRef.current.onend = null;
          recRef.current.abort?.();
        } catch (e) {
          // ignore errors when aborting previous recognition
          // eslint-disable-next-line no-console
          console.debug("ignore rec abort error", e);
        }
      }

      recRef.current =
        new window.webkitSpeechRecognition() || new window.SpeechRecognition();

      // set default language from state (use current lang)
      recRef.current.lang = lang;

      recRef.current.continuous = false;
      recRef.current.interimResults = false;

      recRef.current.onend = () => {
        // if we're suppressing close (e.g. because of a language change), skip closing
        if (suppressCloseRef.current) {
          suppressCloseRef.current = false;
          return;
        }

        if (!isSearchingRef.current) {
          try {
            recRef.current.abort();
          } catch (e) {
            // ignore abort errors
            // eslint-disable-next-line no-console
            console.debug("abort error", e);
          }
          callback({ action: "close" });
        }
      };

      recRef.current.onresult = async (e: any) => {
        setError("");
        try {
          const w = (e.results[e.resultIndex][0]?.transcript || "").trim();
          setWord(w);
          if (w) {
            isSearchingRef.current = true;
            setLoading(true);

            const r = await ProductService.keywordSearchSuggestions(w);
            const kws = r.data.data?.keywords || [];

            setLoading(false);
            isSearchingRef.current = false;
            if (kws.length > 0) {
              recRef.current.stop();
              setWord("");
              callback({ action: "close", data: { search: w, keywords: kws } });
            } else {
              // keep the modal open so the user can read the error and retry
              suppressCloseRef.current = true;
              setError("Did not match, please try again");
            }
          } else {
            isSearchingRef.current = false;
          }
        } catch (error) {
          console.warn(error);
          isSearchingRef.current = false;
        }
      };
      recRef.current.start();
    } catch (error) {
      console.log(error);
    }
  }, [callback, lang]);

  const startListening = useCallback(async () => {
    // Reset state when (re)starting recognition
    setWord("");
    setError("");
    setLoading(false);

    isSearchingRef.current = false;
    // If the app is Cordova-enabled, run only the native Cordova flow; do NOT fallback to web
    if (MiscService.hasCordova()) {
          // plugin must be available
          if (
            typeof window.parent?.plugins?.speechRecognition === "undefined"
          ) {
            try {
              appToast.show({
                msg: "Voice recognition not available",
                color: "danger",
              });
            } catch (e) {
              // ignore
            }
            callback({ action: "close" });
            return;
          }

          await stopCordovaListening();

          try {
            const speech = window.parent.plugins.speechRecognition;
            speech.startListening(
              async (result: any) => {
                const raw = result?.[0]?.trim();
                setWord(raw || "");
                if (raw) {
                  setLoading(true);
                  try {
                    const r =
                      await ProductService.keywordSearchSuggestions(raw);
                    const kws = r.data.data?.keywords || [];
                    setLoading(false);
                    if (kws.length > 0) {
                      callback({
                        action: "close",
                        data: { search: raw, keywords: kws },
                      });
                    } else {
                      setError("Did not match, please try again");
                    }
                  } catch (err) {
                    setLoading(false);
                    try {
                      appToast.show({
                        msg: "Voice search failed",
                        color: "danger",
                      });
                    } catch (e) {
                      // ignore
                    }
                    callback({ action: "close" });
                  }
                } else {
                  setError("Did not match, please try again");
                }
              },
              (e: any) => {
                if (e?.toLowerCase()?.includes("no match")) {
                  setError("Did not match, please try again");
                }
              },
              { showPopup: false, language: lang },
            );
          } catch (e) {
            // If Cordova flow throws, show error and close (do not fallback to web)
            console.debug("Cordova speech init error", e);
            try {
              appToast.show({
                msg: "Voice recognition failed to start",
                color: "danger",
              });
            } catch (e2) {
              // ignore
            }
            callback({ action: "close" });
          }
    } else {
      // Not a Cordova app -> use web SpeechRecognition flow
      init();
    }
  }, [appToast, callback, init, lang]);

  useEffect(() => {
    if (show) {
      startListening();
    }
    // Only (re)start when the modal opens/closes. `startListening` is
    // intentionally excluded: its identity changes on every render, which
    // would otherwise re-trigger listening and wipe the error/word state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  // const search = () => {
  //   recRef.current.stop();
  //   const t = setTimeout(() => {
  //     clearTimeout(t);
  //     callback({ action: "close", data: { search: word } });
  //   }, 500);
  // };

  const onClose = () => {
    setWord("");
    try {
      recRef.current.abort();
    } catch (e) {
      console.debug("abort on close error", e);
    }
    callback({ action: "close" });
  };

  const handleLangClick = (key: string) => {
    // prevent the existing recognition instance from closing the modal
    suppressCloseRef.current = true;

    // If Cordova is available, stop native listening first and update lang in its callback
    if (MiscService.hasCordova()) {
      try {
        const speech = window.parent?.plugins?.speechRecognition;
        if (speech && typeof speech.stopListening === "function") {
          // stop listening, then persist and update lang in callback
          speech.stopListening(
            () => {
              CommonService.setVoiceLang(key);
              setLang(key);
            },
            (err: any) => {
              // On error, still persist the language to keep UI consistent
              console.debug("stopListening error", err);
              CommonService.setVoiceLang(key);
              setLang(key);
            },
          );
        } else {
          // If plugin API not present, fallback to web behavior
          try {
            recRef.current?.abort?.();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.debug("abort before lang change error", e);
          }
          CommonService.setVoiceLang(key);
          setLang(key);
        }
      } catch (e) {
        // On unexpected errors, fallback to web behavior
        // eslint-disable-next-line no-console
        console.debug("cordova stopListening error", e);
        try {
          recRef.current?.abort?.();
        } catch (e2) {
          console.debug("abort before lang change error", e2);
        }
        CommonService.setVoiceLang(key);
        setLang(key);
      }
    } else {
      // Not Cordova -> stop current web recognition and update immediately
      try {
        recRef.current?.abort?.();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug("abort before lang change error", e);
      }
      // persist selected lang and update state
      CommonService.setVoiceLang(key);
      setLang(key);
    }
  };

  if (!show) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        // close when clicking outside the modal content
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
      className="tw:fixed tw:top-0 tw:left-0 tw:right-0 tw:bottom-0 tw:inset-0 tw:flex tw:flex-col tw:items-center tw:bg-black/80 tw:backdrop-blur-sm tw:z-50"
    >
      <AppButton
        type="button"
        onClick={onClose}
        aria-label="Close voice search"
        className="tw:fixed tw:top-4 tw:sm:top-6 tw:right-4 tw:z-50 tw:bg-white/50 tw:p-2 tw:rounded-full tw-backdrop-blur-sm"
        fill="clear"
      >
        <X className="tw:w-5 tw:h-5" />
      </AppButton>

      {/* Centered mic container (placed in flow so content sits below) */}
      <div className="tw:flex tw:justify-center tw:z-40 tw:mt-12">
        <div className="tw:relative animate__animated animate__backInUp animate__slow">
          {/* Simple circular video with centered mic and subtle shadow */}
          <div className="tw:w-32 tw:h-32 tw:relative">
            <div className="tw:w-32 tw:h-32 tw:rounded-full tw:overflow-hidden tw:shadow-md tw:mx-auto">
              {/* Animated listening gradient background */}
              <div className="tw:absolute tw:inset-0 tw:rounded-full tw:overflow-hidden">
                <div className="tw:w-full tw:h-full listening-gradient" />
              </div>
            </div>

            {/* Centered mic icon */}
            <div className="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:pointer-events-none">
              <div className="tw:bg-transparent tw:p-2 tw:rounded-full">
                {/* <Mic className="tw:text-white tw:w-8 tw:h-8 tw:drop-shadow-lg" /> */}
                <ImgRender
                  src="others/voice-search-2.gif"
                  className="tw:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal content in the middle (pushed below mic container) */}
      <div className="tw:px-4 tw:w-full tw:max-w-md tw:flex-1 tw:flex tw:flex-col tw:justify-start tw:pt-8 tw:mt-6 tw:z-30">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Voice search"
          className="tw:bg-transparent tw:rounded-lg tw:text-center tw:relative"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="tw:p-4 tw:pt-2">
            {/* <div className="tw:font-semibold tw:mb-4">Say something</div> */}

            <div className="tw:py-2 tw:text-sm tw:italic tw:text-white">{word}</div>

            {error ? (
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:mb-4">
                <div className="tw:text-xs tw:text-red-500">{error}</div>
                <AppButton
                  type="button"
                  onClick={() => startListening()}
                  className="tw:px-4 tw:py-1 tw:rounded-full tw:bg-primary tw:text-primary-foreground tw:text-sm"
                  fill="solid"
                >
                  Retry
                </AppButton>
              </div>
            ) : null}

            {loading ? (
              <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:text-gray-500 tw:mb-4">
                <AppSpinner />
                Searching....
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Language selection at the bottom */}
      <div className="tw:px-4 tw:pb-4 tw:w-full tw:max-w-md tw:flex tw:flex-wrap tw:items-center tw:justify-center tw:gap-2">
        {voiceLanguages.map((l) => (
          <button
            type="button"
            key={l.key}
            onClick={handleLangClick.bind(null, l.key)}
            className={
              "tw:px-3 tw:py-1 tw:rounded-full tw:border tw:text-xs " +
              (lang === l.key
                ? "tw:bg-primary tw:text-primary-foreground tw:border-primary"
                : "tw:bg-gray-50/80 tw:text-gray-700 tw:border-gray-200")
            }
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );

  // Use portal to render modal at document body level to avoid parent container constraints
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default VoiceSearchModal;
