import { useState } from "react";

interface RemarksCellProps {
  // The remarks text to display. Empty / missing renders a dash.
  value?: string | null;
  // Character count beyond which the text is clamped and a toggle is shown.
  limit?: number;
  className?: string;
}

// Renders follow-up remarks, clamping anything longer than `limit` characters
// behind a "View more" / "View less" toggle so long notes don't blow out the
// table row. Shared across the CRM pages.
const RemarksCell: React.FC<RemarksCellProps> = ({
  value,
  limit = 100,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  const text = value?.trim();
  if (!text) {
    return <span className="tw:text-gray-700">-</span>;
  }

  const isLong = text.length > limit;
  const shown = isLong && !expanded ? `${text.slice(0, limit)}…` : text;

  return (
    <span className={`tw:text-gray-700 ${className || ""}`}>
      {shown}
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="tw:ml-1 tw:cursor-pointer tw:font-medium tw:text-blue-600 tw:hover:underline"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </span>
  );
};

export default RemarksCell;
