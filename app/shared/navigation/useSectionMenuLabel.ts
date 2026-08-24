import { useTranslation } from "react-i18next";
import SectionTabService from "~/services/SectionTabService";
import { useActiveSectionState } from "~/shared/navigation/activeSection";

/**
 * Label of the section-menu entry highlighted in the left rail, e.g.
 * "Customers" while any network-management page is open.
 *
 * The side panes title themselves with this so the pane heading always reads
 * the same as the rail item the user clicked to get there. Returns undefined
 * when no section nav is mounted (or it can't resolve an entry), in which case
 * callers keep their own title.
 */
const useSectionMenuLabel = (): string | undefined => {
  const { t } = useTranslation(["common"]);
  const { sectionKey, tabKey } = useActiveSectionState();

  if (!sectionKey || !tabKey) return undefined;

  const tab = SectionTabService.getTab(sectionKey, tabKey);
  if (!tab) return undefined;

  // Resolved exactly as the rail resolves it, so the two always read alike.
  return tab.langKey ? t(tab.langKey) : tab.label;
};

export default useSectionMenuLabel;
