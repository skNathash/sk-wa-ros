import { useFormContext } from "react-hook-form";
import { cn } from "~/lib/utils";
import Alpha from "./Alpha";

interface AlphaRailProps {
  callback: (value: string) => void;
  fieldName?: string;
  className?: string;
}

/**
 * Sticky vertical A-Z rail for mobile screens.
 *
 * Reads/writes the alpha filter from a surrounding react-hook-form
 * FormProvider, so it stays in sync with the desktop horizontal Alpha strip.
 */
const AlphaRail = ({
  callback,
  fieldName = "alpha",
  className,
}: AlphaRailProps) => {
  const { getValues, setValue } = useFormContext();
  const alpha = getValues(fieldName);

  const handleAlphaChange = (value: string) => {
    setValue(fieldName, value, { shouldValidate: false });
    callback(value);
  };

  return (
    <div
      className={cn(
        "tw:sticky tw:top-24 tw:self-start tw:h-[calc(100vh-16rem)] tw:shrink-0 tw:w-5",
        className,
      )}
    >
      <Alpha
        callback={handleAlphaChange}
        selected={alpha || ""}
        orientation="vertical"
        className="tw:h-full tw:[&_span]:my-0 tw:[&_span]:px-1 tw:[&_span]:py-0.5 tw:[&_span]:text-[10px] tw:[&_span[data-item='123']]:-ml-[3px]"
      />
    </div>
  );
};

export default AlphaRail;
