import clsx from "clsx";
import Amount from "~/components/core/amount/Amount";
import ImgRender from "~/components/core/img/ImgRender";
import { htmlToText, type FieldType } from "../helper";

type Props = {
  value: any;
  type: FieldType;
  /** visually de-emphasise (used for the retailer value once it was replaced) */
  muted?: boolean;
  className?: string;
  onImageClick?: (images: any[]) => void;
};

const isEmpty = (v: any) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);

const FieldValue = ({
  value,
  type,
  muted = false,
  className = "",
  onImageClick,
}: Props) => {
  const base = clsx(
    "tw:text-sm tw:break-words",
    muted ? "tw:text-gray-400" : "tw:text-gray-900",
    className
  );

  if (type === "image") {
    if (isEmpty(value)) {
      return <span className={clsx(base, "tw:text-gray-400")}>No images</span>;
    }
    return (
      <div className="tw:flex tw:flex-wrap tw:gap-1.5">
        {(value as string[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onImageClick?.(value)}
            className={clsx(
              "tw:rounded-md tw:overflow-hidden tw:border tw:border-gray-200",
              "tw:hover:border-blue-400 tw:transition-colors tw:cursor-zoom-in",
              muted && "tw:opacity-60"
            )}
          >
            <ImgRender
              assetId={id}
              className="tw:w-14 tw:h-14 tw:object-cover"
            />
          </button>
        ))}
      </div>
    );
  }

  if (type === "html") {
    if (!htmlToText(value)) {
      return <span className={clsx(base, "tw:text-gray-400")}>--</span>;
    }
    return (
      <div
        // description arrives from the API as an HTML string; `rich-text` is the
        // app-wide style hook for such markup (see app.css)
        className={clsx("rich-text", base, "tw:max-w-full tw:overflow-x-auto")}
        dangerouslySetInnerHTML={{ __html: String(value) }}
      />
    );
  }

  if (isEmpty(value)) {
    return <span className={clsx(base, "tw:text-gray-400")}>--</span>;
  }

  if (type === "amount") {
    return (
      <span className={base}>
        <Amount value={Number(value)} />
      </span>
    );
  }

  if (type === "percent") {
    return <span className={base}>{value}%</span>;
  }

  if (type === "boolean") {
    return (
      <span
        className={clsx(
          "tw:inline-flex tw:items-center tw:rounded tw:px-1.5 tw:py-0.5 tw:text-xs tw:font-medium",
          value
            ? "tw:bg-emerald-50 tw:text-emerald-700"
            : "tw:bg-gray-100 tw:text-gray-600",
          muted && "tw:opacity-60"
        )}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  return <span className={base}>{String(value)}</span>;
};

export default FieldValue;
