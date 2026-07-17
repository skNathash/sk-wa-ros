import { memo, useRef } from "react";

import useOnlyNumber from "~/hooks/useOnlyNumbers";

type Props = {
  count?: number;
  callback: (a: { value: number }) => void;
};

const SplitInput = ({ count = 4, callback }: Props) => {
  const { onOnlyNumberType } = useOnlyNumber();

  const inpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const onChange = (index: number) => {
    const v = inpRefs.current[index]?.value;
    const l = v ? v.toString().slice(-1) : "";
    if (inpRefs.current[index]?.value) {
      inpRefs.current[index]!.value = l;
      // inpRefs.current[index]!.type = "password";
    }
    const nxt = index + 1;
    if (nxt < count && l) {
      inpRefs.current[nxt]?.focus();
    }

    const finalVal = inpRefs.current
      .map((x) => x?.value?.toString() || "")
      .join("");

    callback({ value: Number(finalVal) });
  };

  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    onOnlyNumberType(e);
    if (e.key == ".") {
      e.preventDefault();
      return;
    }
    const v = "" + inpRefs.current[index]?.value;
    if (e.key == "Backspace" && !v.length) {
      if (inpRefs.current[index - 1]) {
        inpRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <div className="tw:w-full tw:p-0">
      <div className="tw:flex tw:flex-row tw:gap-2">
        {Array.from({ length: count }, (_, i) => i).map((x) => (
          <div key={x} className="tw:flex-1">
            <input
              type="number"
              ref={(el) => {
                inpRefs.current[x] = el;
              }}
              onInput={() => onChange(x)}
              className="tw:w-full tw:border tw:bg-white tw:inline-block tw:h-12 tw:rounded tw:shadow tw:outline-none tw:text-center"
              onKeyDown={(e) => onKeyDown(e, x)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(SplitInput);
