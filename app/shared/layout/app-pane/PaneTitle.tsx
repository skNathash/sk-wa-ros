import { cn } from "~/lib/utils";
import useSectionMenuLabel from "~/shared/navigation/useSectionMenuLabel";

interface PaneTitleProps {
  /**
   * Title used when no section nav is mounted to name the page — otherwise the
   * highlighted section-menu entry wins, so the pane heading always reads the
   * same as the rail item that leads here.
   */
  title?: string;
  /** Merged over the default heading style (e.g. a smaller size). */
  className?: string;
  forceTitle?: boolean;
}

/**
 * Heading of a side pane. Titles itself after the left rail's active entry (see
 * {@link useSectionMenuLabel}) so every page in a section carries that
 * section's name — "Customers" across the network directory pages, "Accounts"
 * across the accounts views — instead of a per-page variant.
 */
const PaneTitle = ({ title, className, forceTitle }: PaneTitleProps) => {
  const sectionLabel = useSectionMenuLabel();

  return (
    <h2 className={cn("tw:text-2xl tw:font-bold tw:text-slate-900", className)}>
      {forceTitle ? title : sectionLabel || title}
    </h2>
  );
};

export default PaneTitle;
