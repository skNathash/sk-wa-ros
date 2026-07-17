import { Mic } from "lucide-react";
import VoiceSearch from "./VoiceSearch";

type Props = {
  callback?: (arg: { action: string; data?: any }) => void;
  /** Size of the mic icon inside the button. */
  size?: number;
  className?: string;
};

/**
 * Shared voice-search mic button — the pulsing red ring + gradient circle
 * originally built for the subscribe/search page. Wraps {@link VoiceSearch}
 * so the speech-recognition flow stays in one place while every search input
 * shares the same mic UI.
 */
const VoiceMic = ({ callback, size = 16, className }: Props) => {
  return (
    <VoiceSearch callback={callback} className={className}>
      <span className="tw:relative tw:inline-flex tw:items-center tw:justify-center">
        <span className="tw:absolute tw:inline-flex tw:h-full tw:w-full tw:rounded-full tw:bg-primary/40 tw:animate-ping" />
        <span className="tw:relative tw:inline-flex tw:items-center tw:justify-center tw:h-8 tw:w-8 tw:rounded-full tw:bg-primary tw:text-primary-foreground tw:shadow-md tw:shadow-primary/30 tw:transition-transform tw:hover:scale-105 tw:active:scale-95">
          <Mic size={size} />
        </span>
      </span>
    </VoiceSearch>
  );
};

export default VoiceMic;
