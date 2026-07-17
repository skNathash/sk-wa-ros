import { Check, Globe, Pause, Play } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import AppModal from "~/components/core/modal/AppModal";
import { Button } from "~/components/ui/button";
import { audioSources as defaultAudioSources } from "./helper";

type Props = {
  show: boolean;
  callback?: (a: { action: string; data?: any }) => void;
  feature?: string;
  title?: string;
};

const LearnAppModal: React.FC<Props> = ({
  show = false,
  callback,
  feature = "app",
  title = "Learn about the app",
}) => {
  const [language, setLanguage] = useState<string>("kn");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio source paths (assumption: files placed under public/assets/audio)
  const audioSources: Record<string, string> = {
    en: defaultAudioSources[feature]?.en || "/assets/audios/learn-app-en.mp3",
    kn: defaultAudioSources[feature]?.kn || "/assets/audios/learn-app-kn.mp3",
  };

  // autoplay when modal opens and stop when it closes
  useEffect(() => {
    const audio = audioRef.current;

    let timer;

    if (show) {
      const playAudio = async () => {
        let audio = audioRef.current;
        if (audio) {
          try {
            audio.currentTime = 0;
            await audio.play();
            setIsPlaying(true);
          } catch (err) {
            setIsPlaying(false);
          }
        }
      };

      timer = setTimeout(playAudio, 800);
    }
    return () => {
      // on unmount ensure audio stopped
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }
    };
    // only react to show; language handled above
  }, [show, language]);

  // reset duration when language changes so UI doesn't show previous value
  useEffect(() => {
    setDuration(null);
    setCurrentTime(0);
  }, [language]);

  // stop audio when tab is hidden or page is being unloaded
  useEffect(() => {
    const handleVisibility = () => {
      const audio = audioRef.current;
      if (document.hidden && audio && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handleBeforeUnload = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handleBeforeUnload);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handleBeforeUnload);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleClose = () => {
    if (callback) callback({ action: "close", data: {} });
  };

  const changeLanguage = (lang: string) => {
    // Only change the audio language for this modal; do not change app language
    setLanguage(lang);
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      // play may be blocked; just set false
      setIsPlaying(false);
    }
  };

  const formatDuration = (sec: number | null) => {
    if (sec === null || !isFinite(sec)) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const dur = duration;
    if (!audio || !dur) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * dur;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <AppModal show={show} callback={callback}>
      <AppModal.Title onClose={handleClose}>
        <div className="tw:font-semibold tw:flex tw:items-center tw:gap-2">
          {title}
        </div>
      </AppModal.Title>
      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-4">
          {/* Language selection block (only English and Kannada as requested) */}
          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:text-sm tw:font-medium tw:flex tw:items-center tw:gap-2">
              <Globe className="tw:w-4 tw:h-4 tw:text-slate-600" />
              <span>Choose language</span>
            </div>
            <div className="tw:flex tw:gap-2">
              <Button
                variant={language === "kn" ? "default" : "outline"}
                onClick={() => changeLanguage("kn")}
                className="tw:flex-1 tw:justify-center"
              >
                <div className="tw:flex tw:items-center tw:gap-2">
                  {language === "kn" ? (
                    <Check className="tw:w-4 tw:h-4" />
                  ) : null}
                  <span>ಕನ್ನಡ</span>
                </div>
              </Button>

              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => changeLanguage("en")}
                className="tw:flex-1 tw:justify-center"
              >
                <div className="tw:flex tw:items-center tw:gap-2">
                  {language === "en" ? (
                    <Check className="tw:w-4 tw:h-4" />
                  ) : null}
                  <span>English</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Audio playback block */}
          <div className="tw:flex tw:flex-col tw:gap-2">
            <div className="tw:text-sm tw:font-medium">
              {isPlaying ? "Listening..." : "Listen"}
            </div>
            {/* listen block background */}
            <div className="tw:flex tw:items-center tw:gap-3 tw:bg-slate-50 tw:p-3 tw:rounded tw:border tw:border-slate-100">
              <Button
                onClick={togglePlay}
                variant="ghost"
                className="tw:px-3"
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
              >
                <div
                  className={`tw:flex tw:items-center tw:justify-center tw:w-9 tw:h-9 tw:rounded-full tw:border tw:transition tw:duration-150 tw:ease-in-out ${
                    isPlaying
                      ? "tw:border-blue-500 tw:text-blue-500 tw:ring-2 tw:ring-blue-300 tw:ring-offset-2 tw:ring-offset-white animate__animated animate__pulse animate__infinite tw:shadow-lg"
                      : "tw:border-slate-400 tw:text-slate-700 hover:tw:border-blue-400 hover:tw:shadow-sm focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-blue-200 focus:tw:ring-offset-2"
                  }`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </div>
              </Button>
              {/* When playing we show the animated bordered pause icon above. No extra mic animation. */}
              <div className="tw:flex-1">
                <audio
                  ref={audioRef}
                  src={audioSources[language] || audioSources["en"]}
                  onEnded={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) =>
                    setDuration(e.currentTarget.duration)
                  }
                  onTimeUpdate={(e) =>
                    setCurrentTime(e.currentTarget.currentTime)
                  }
                />
                <div className="tw:flex tw:flex-col tw:gap-2">
                  <div className="tw:text-xs tw:text-slate-600 tw:flex tw:items-center tw:justify-between">
                    <div>
                      Play a short audio that describes the app functionality
                    </div>
                  </div>

                  <div className="tw:w-full tw:mt-2">
                    <div
                      className="tw:relative tw:h-2 tw:bg-slate-200 tw:rounded tw:cursor-pointer"
                      onClick={handleProgressClick}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={duration || 0}
                      aria-valuenow={currentTime}
                    >
                      <div
                        className="tw:absolute tw:left-0 tw:top-0 tw:bottom-0 tw:bg-blue-500 tw:rounded"
                        style={{
                          width: `${
                            duration ? (currentTime / duration) * 100 : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="tw:flex tw:justify-between tw:text-[10px] tw:text-slate-500 tw:mt-1">
                      <div>{formatDuration(currentTime)}</div>
                      <div>{formatDuration(duration)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default LearnAppModal;
