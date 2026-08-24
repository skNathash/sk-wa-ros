import clsx from "clsx";
import WhatsappContainer from "../whatsapp-container/WhatsappContainer";

export interface HomeSidePaneProps {
  className?: string;
}

/**
 * Contents of the home page's side pane in theme-2 desktop: the Sathi chat,
 * full height, with no pane header of its own — the chat carries its own
 * contact strip, and `.home-chat-pane` in `dashboard-home.css` strips the
 * pane's padding so the thread runs edge to edge.
 *
 * Kept as its own component (rather than dropping the chat straight into
 * `AppPaneSide`) so anything else the home pane grows later — a shortcut
 * strip, a notification list — has one place to live.
 */
const HomeSidePane = ({ className }: HomeSidePaneProps) => (
  <div className={clsx("tw:flex tw:h-full tw:flex-col", className)}>
    <WhatsappContainer />
  </div>
);

export default HomeSidePane;
