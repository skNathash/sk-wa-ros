import React, { useEffect, useRef, useState } from "react";

interface NoteContentProps {
  /** Raw HTML note content produced by the rich text editor */
  html: string;
  /** Collapsed height in px before the "View more" toggle appears */
  collapsedHeight?: number;
  className?: string;
}

/**
 * Renders a single note's HTML content and, when it is longer than
 * `collapsedHeight`, clamps it with a "View more / View less" toggle.
 * Overflow is measured from the actual rendered height so tables, images and
 * long text are all handled correctly (not just plain character counts).
 */
const NoteContent: React.FC<NoteContentProps> = ({
  html,
  collapsedHeight = 96,
  className,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      setIsOverflowing(el.scrollHeight > collapsedHeight + 4);
    };
    measure();

    // Re-measure when the content (e.g. lazy images) changes size
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html, collapsedHeight]);

  const clamped = isOverflowing && !expanded;

  return (
    <div className={className}>
      <div
        ref={contentRef}
        className="ql-editor tw:p-0! tw:text-xs tw:text-gray-800 tw:overflow-hidden tw:transition-all"
        style={{ maxHeight: clamped ? collapsedHeight : "none" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="tw:mt-1 tw:text-xs tw:font-medium tw:text-blue-600 tw:hover:text-blue-700 tw:transition-colors"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default NoteContent;
