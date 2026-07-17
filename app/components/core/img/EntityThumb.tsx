import ImgRender from "./ImgRender";

type Props = {
  /** Asset id for the image; when missing/broken the initial is shown instead. */
  assetId?: string;
  /** Display name — its first character seeds the fallback initial. */
  name?: string;
  /** Box shape/size classes (height, width, rounding, border, bg). */
  boxClassName?: string;
  /** Classes for the rendered <img>. */
  imgClassName?: string;
  /** How the image fits its box. */
  fit?: "contain" | "cover";
  /** Font-size class for the fallback initial. */
  initialClassName?: string;
  /** Requested image width (thumbnails); ignored when `size` fits better. */
  width?: number;
  /** Requested image size preset (larger covers). */
  size?: string;
};

const getInitial = (name?: string) => {
  const ch = (name || "").trim().charAt(0);
  return ch ? ch.toUpperCase() : "#";
};

/**
 * Thumbnail for brands/categories/menus. Renders the asset image when
 * available and falls back to a clean, consistent initial badge instead of the
 * generic gray "No Image" box — the fallback also covers broken/404 images.
 */
const EntityThumb = ({
  assetId,
  name,
  boxClassName = "",
  imgClassName = "",
  fit = "contain",
  initialClassName = "tw:text-sm",
  width,
  size,
}: Props) => {
  const initial = (
    <span
      className={`tw:flex tw:h-full tw:w-full tw:items-center tw:justify-center tw:bg-primary/10 tw:font-semibold tw:text-primary tw:select-none ${initialClassName}`}
    >
      {getInitial(name)}
    </span>
  );

  return (
    <div className={`tw:overflow-hidden ${boxClassName}`}>
      {assetId ? (
        <ImgRender
          assetId={assetId}
          alt={name}
          width={width}
          size={size}
          className={`tw:w-full tw:h-full ${
            fit === "cover" ? "tw:object-cover" : "tw:object-contain"
          } ${imgClassName}`}
          fallback={initial}
        />
      ) : (
        initial
      )}
    </div>
  );
};

export default EntityThumb;
