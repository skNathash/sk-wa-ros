import clsx from "clsx";

/**
 * Swa's brand mark — the native-script monogram on the green disc. Repeats
 * beside every incoming bubble, so it takes the size from the caller.
 */
const Avatar = ({
  mark,
  className = "",
}: {
  mark: string;
  className?: string;
}) => (
  <span
    className={clsx(
      "wa-avatar tw:flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:font-semibold tw:text-white",
      className || "tw:size-8 tw:text-xs",
    )}
  >
    {mark}
  </span>
);

export default Avatar;
