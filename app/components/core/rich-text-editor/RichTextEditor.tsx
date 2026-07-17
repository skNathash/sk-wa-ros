import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import BlotFormatter from "@enzedonline/quill-blot-formatter2";
import "@enzedonline/quill-blot-formatter2/dist/css/quill-blot-formatter2.css";
import clsx from "clsx";
import AjaxService from "~/services/AjaxService";
import { ASSET } from "~/constants";
import useAppToast from "~/hooks/useAppToast";

// Register the image resize/align module once (no-op if already registered)
Quill.register("modules/blotFormatter2", BlotFormatter);

// Allowed image types and max upload size for the editor's image button
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE_MB = 5;

type RichTextEditorProps = {
  value: string;
  callback: (content: string) => void;
  className?: string;
  readOnly?: boolean;
};

// Treat visually empty Quill content (like "<p><br></p>") as empty
const normalizeQuillContent = (html: string | null | undefined): string => {
  if (!html) return "";

  const raw = html.trim();

  // Common Quill "empty" HTML
  if (
    raw === "<p><br></p>" ||
    raw === "<p><br></p>\n" ||
    raw === "<p></p>" ||
    raw === "<p><br></p><p><br></p>"
  ) {
    return "";
  }

  // Fallback: strip tags & whitespace and see if anything remains
  const textOnly = raw
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, "")
    .trim();

  return textOnly.length === 0 ? "" : html;
};

export default function RichTextEditor({
  value = "", // Ensure default value is always a string
  callback,
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const quillInstanceRef = useRef<Quill | null>(null); // Renamed to avoid confusion with value
  const { show: showToast } = useAppToast();
  // Keep the latest toast fn available to the (mount-only) Quill handler without stale closures
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Effect for initializing Quill
  useEffect(() => {
    if (!editorRef.current) return;

    // Uploads a picked image to the asset service and inserts it at the cursor as a URL
    const handleImageUpload = async () => {
      const quill = quillInstanceRef.current;
      if (!quill) return;

      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // Validate type and size before uploading
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          showToastRef.current({
            msg: "Unsupported image type. Use JPG, PNG, GIF or WebP.",
            color: "error",
          });
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          showToastRef.current({
            msg: `Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`,
            color: "error",
          });
          return;
        }

        try {
          const response = await AjaxService.request(
            `${ASSET}/upload`,
            "POST",
            { file },
            { headers: { "Content-Type": "multipart/form-data" } },
          );

          const imageId =
            response.data?._id || response.data?.data?._id;

          if (
            (response.statusCode === 200 || response.statusCode === 201) &&
            imageId
          ) {
            // Insert the served URL at the current cursor (or end), keeping stored HTML small
            const range = quill.getSelection(true);
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(
              index,
              "image",
              `${ASSET}/${imageId}.jpg`,
              "user",
            );
            quill.setSelection(index + 1, 0);
          } else {
            showToastRef.current({
              msg: "Failed to upload image",
              color: "error",
            });
          }
        } catch (error) {
          console.error("Error uploading image:", error);
          showToastRef.current({
            msg: "An error occurred while uploading image",
            color: "error",
          });
        }
      };
    };

    // Initialize Quill only once
    if (!quillInstanceRef.current) {
      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: {
          toolbar: {
            container: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline"],
              ["link", "image", "blockquote", "code-block"],
              [{ list: "ordered" }, { list: "bullet" }],
              // Table controls (Quill's built-in table module).
              // These operate on the table cell the cursor is currently in.
              [
                "insertTable",
                "insertRowBelow",
                "deleteRow",
                "insertColumnRight",
                "deleteColumn",
                "deleteTable",
              ],
              ["clean"],
            ],
            handlers: {
              image: handleImageUpload,
              // `this` is the toolbar module; `this.quill.focus()` has already
              // restored the pre-click selection, so getSelection() inside these
              // table methods still points at the active cell.
              insertTable(this: { quill: Quill }) {
                (this.quill.getModule("table") as any)?.insertTable(3, 3);
              },
              insertRowBelow(this: { quill: Quill }) {
                (this.quill.getModule("table") as any)?.insertRowBelow();
              },
              deleteRow(this: { quill: Quill }) {
                (this.quill.getModule("table") as any)?.deleteRow();
              },
              insertColumnRight(this: { quill: Quill }) {
                (this.quill.getModule("table") as any)?.insertColumnRight();
              },
              deleteColumn(this: { quill: Quill }) {
                (this.quill.getModule("table") as any)?.deleteColumn();
              },
              deleteTable(this: { quill: Quill }) {
                (this.quill.getModule("table") as any)?.deleteTable();
              },
            },
          },
          // Enables Quill's native table blots so pasted/AI-generated tables
          // stay structured and the table controls above can edit them.
          table: true,
          // Adds drag-handle resizing + alignment for images
          blotFormatter2: {},
        },
        readOnly: readOnly,
        // Constrain tooltips (like link editor) within the editor box so they don't overflow the modal
        bounds: editorRef.current as HTMLElement,
        // Use the editor as the scrolling container to improve tooltip positioning in modals
        scrollingContainer: editorRef.current as HTMLElement,
      } as any);
      quillInstanceRef.current = quill;

      // The table controls aren't built-in Quill formats, so they render as
      // empty buttons. Give them compact SVG icons + tooltips so the toolbar
      // stays simple, clean and intuitive (rows = horizontal bars, columns =
      // vertical bars, with a +/− badge for insert/delete).
      const tableButtonIcons: Record<string, { icon: string; title: string }> =
        {
          insertTable: {
            title: "Insert table",
            icon: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="2.5" width="13" height="13" rx="1.5"/><line x1="2.5" y1="7" x2="15.5" y2="7"/><line x1="2.5" y1="11.5" x2="15.5" y2="11.5"/><line x1="7" y1="2.5" x2="7" y2="15.5"/><line x1="11.5" y1="2.5" x2="11.5" y2="15.5"/></svg>`,
          },
          insertRowBelow: {
            title: "Insert row below",
            icon: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="3" width="13" height="6" rx="1"/><line x1="2.5" y1="6" x2="15.5" y2="6"/><path d="M9 11.5v4M7 13.5h4" stroke-linecap="round"/></svg>`,
          },
          deleteRow: {
            title: "Delete row",
            icon: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="2.5" y="3" width="13" height="6" rx="1"/><line x1="2.5" y1="6" x2="15.5" y2="6"/><path d="M7 13.5h4" stroke-linecap="round"/></svg>`,
          },
          insertColumnRight: {
            title: "Insert column right",
            icon: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="2.5" width="6" height="13" rx="1"/><line x1="6" y1="2.5" x2="6" y2="15.5"/><path d="M13.5 7v4M11.5 9h4" stroke-linecap="round"/></svg>`,
          },
          deleteColumn: {
            title: "Delete column",
            icon: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="2.5" width="6" height="13" rx="1"/><line x1="6" y1="2.5" x2="6" y2="15.5"/><path d="M11.5 9h4" stroke-linecap="round"/></svg>`,
          },
          deleteTable: {
            title: "Delete table",
            icon: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M4 5.5h10M7.5 5.5V4h3v1.5M6 5.5l.6 9h4.8l.6-9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
          },
        };
      const toolbarModule = quill.getModule("toolbar") as any;
      const toolbarContainer: HTMLElement | undefined = toolbarModule?.container;
      if (toolbarContainer) {
        Object.entries(tableButtonIcons).forEach(([name, { icon, title }]) => {
          const button = toolbarContainer.querySelector<HTMLButtonElement>(
            `button.ql-${name}`,
          );
          if (button) {
            button.innerHTML = icon;
            button.title = title;
          }
        });
        // Visually group the six table controls so they read as one cluster.
        const firstTableBtn = toolbarContainer.querySelector<HTMLButtonElement>(
          "button.ql-insertTable",
        );
        firstTableBtn
          ?.closest(".ql-formats")
          ?.classList.add("rte-table-controls");
      }

      // Handle content changes from Quill and pass to callback
      quill.on("text-change", (delta, oldDelta, source) => {
        // Only call callback if change originated from user (not API)
        if (source === "user") {
          const currentContent = quill.root.innerHTML;
          const normalizedContent = normalizeQuillContent(currentContent);
          callback(normalizedContent);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (quillInstanceRef.current) {
        // Remove all event listeners
        quillInstanceRef.current.off("text-change");

        // Get the toolbar element and remove it from DOM
        const toolbar = quillInstanceRef.current.getModule('toolbar') as any;
        if (toolbar && toolbar.container) {
          toolbar.container.remove();
        }

        // Remove all tooltip elements that Quill may have created
        const tooltips = document.querySelectorAll('.ql-tooltip, .ql-editing');
        tooltips.forEach(tooltip => tooltip.remove());

        // Clear the editor content
        if (quillInstanceRef.current.root) {
          quillInstanceRef.current.root.innerHTML = '';
        }

        // Nullify the instance
        quillInstanceRef.current = null;
      }

      // Clean up the editor container
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    };
  }, []); // Run only once on mount

  // Effect for setting initial value and subsequent value prop changes
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (!quill) return;

    // Check if the current value in Quill is different from the prop value
    // We trim whitespace and compare to avoid false positives with empty strings/default values
    const currentQuillHtml = quill.root.innerHTML.trim();
    const propValueHtml = value.trim();

    if (propValueHtml !== currentQuillHtml) {
      // Set content if different. We use 'silent' source to prevent this change
      // from triggering the 'text-change' listener and thus calling the callback again immediately.
      if (normalizeQuillContent(propValueHtml) === "") {
        // Empty value → fully clear the editor. dangerouslyPasteHTML(0, "") would
        // leave existing content in place, so wipe the contents explicitly.
        quill.setContents([] as any, "silent");
      } else {
        quill.setContents(
          quill.clipboard.convert({ html: propValueHtml }) as any,
          "silent",
        );
      }
    }
  }, [value]); // Rerun when 'value' prop changes

  // Effect for updating readOnly state
  useEffect(() => {
    const quill = quillInstanceRef.current;
    if (quill) {
      quill.enable(!readOnly);
      // Manage toolbar visibility based on readOnly
      const toolbar = quill.getModule('toolbar') as any;
      if (toolbar && toolbar.container) {
        toolbar.container.style.display = readOnly ? 'none' : '';
      }
    }
  }, [readOnly]);

  return (
    <div className={clsx("rte-wrapper tw:border tw:rounded-md", className)}>
      <style>{RTE_STYLES}</style>
      <div ref={editorRef} className="tw:min-h-32 tw:p-2" style={{ position: 'relative', zIndex: 0 }}></div>
    </div>
  );
}

// Toolbar polish: a compact, evenly-spaced Snow toolbar with the six table
// controls grouped into a single subtle pill so they read as one cluster.
const RTE_STYLES = `
.rte-wrapper .ql-toolbar.ql-snow {
  border: none;
  border-bottom: 1px solid #e5e7eb;
  padding: 6px 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 6px;
}
.rte-wrapper .ql-container.ql-snow {
  border: none;
}
.rte-wrapper .ql-toolbar.ql-snow .ql-formats {
  margin-right: 0;
  display: inline-flex;
  align-items: center;
}
.rte-wrapper .ql-toolbar.ql-snow button {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  padding: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.rte-wrapper .ql-toolbar.ql-snow button:hover {
  background: #f3f4f6;
}
.rte-wrapper .ql-toolbar.ql-snow button.ql-active {
  background: #e0edff;
}
.rte-wrapper .ql-toolbar.ql-snow .rte-table-controls {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 2px 3px;
  gap: 1px;
}
.rte-wrapper .ql-toolbar.ql-snow .rte-table-controls button svg {
  width: 18px;
  height: 18px;
}
.rte-wrapper .ql-toolbar.ql-snow .rte-table-controls button.ql-deleteTable:hover {
  background: #fee2e2;
  color: #dc2626;
}
`;
