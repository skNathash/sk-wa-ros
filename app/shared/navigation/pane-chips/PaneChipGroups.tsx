import PaneChips, {
  type PaneChipItem,
  type PaneChipsAction,
} from "./PaneChips";

/** A labelled strip of chips in a side pane (e.g. "Views", "Channels"). */
export interface PaneChipGroup {
  /** Small caps heading above the strip. Omit for an unlabelled strip. */
  label?: string;
  chips: PaneChipItem[];
  /** Fired with the tapped chip — the page decides what selecting it does. */
  onSelect: (chip: PaneChipItem) => void;
}

interface PaneChipGroupsProps {
  groups?: PaneChipGroup[];
}

/**
 * Renders however many labelled chip strips a side pane was handed, in order.
 * Shared by the order and fulfilment panes so a group looks the same wherever
 * it lands; the pane owns no selection state — each group reports its tap back
 * to the page.
 */
const PaneChipGroups = ({ groups }: PaneChipGroupsProps) => (
  <>
    {groups?.map((group, index) => {
      const handleCallback = ({ data }: PaneChipsAction) =>
        group.onSelect(data);

      return (
        <div key={group.label ?? index}>
          {group.label && (
            <p className="app-pane-label">
              {group.label}
            </p>
          )}
          <PaneChips
            data={group.chips}
            callback={handleCallback}
            className={group.label ? "tw:mt-1.5" : undefined}
          />
        </div>
      );
    })}
  </>
);

export default PaneChipGroups;
