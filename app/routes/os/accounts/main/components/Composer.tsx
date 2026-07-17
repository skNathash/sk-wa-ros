import { Camera, Mic, Plus } from "lucide-react";

/**
 * WhatsApp-style composer pinned to the bottom: the entry point for adding an
 * income, expense or note. Static for now — wire the input/mic once the capture
 * flow exists.
 */
const Composer = () => (
  // The bottom tab bar sits below this and carries the safe-area inset, so the
  // composer only needs its own breathing room.
  <div className="tw:shrink-0 tw:border-t tw:border-border tw:bg-card tw:px-2 tw:py-2">
    <div className="tw:mx-auto tw:flex tw:max-w-2xl tw:items-center tw:gap-2">
      <div className="tw:flex tw:h-12 tw:flex-1 tw:items-center tw:gap-2 tw:rounded-full tw:bg-[color:var(--wa-paper)] tw:px-3">
        <button
          type="button"
          aria-label="Add entry"
          className="tw:cursor-pointer tw:text-muted-foreground tw:transition-colors tw:hover:text-primary"
        >
          <Plus size={22} />
        </button>
        <input
          type="text"
          placeholder="Add income · expense · note"
          aria-label="Add income, expense or note"
          className="tw:min-w-0 tw:flex-1 tw:bg-transparent tw:text-sm tw:text-foreground tw:outline-none tw:placeholder:text-muted-foreground"
        />
        <button
          type="button"
          aria-label="Scan a bill"
          className="tw:cursor-pointer tw:text-muted-foreground tw:transition-colors tw:hover:text-primary"
        >
          <Camera size={20} />
        </button>
      </div>

      <button
        type="button"
        aria-label="Record a voice note"
        className="tw:flex tw:size-12 tw:shrink-0 tw:cursor-pointer tw:items-center tw:justify-center tw:rounded-full tw:bg-primary tw:text-primary-foreground tw:shadow-md tw:transition-opacity tw:hover:opacity-90"
      >
        <Mic size={20} />
      </button>
    </div>
  </div>
);

export default Composer;
