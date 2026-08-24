import clsx from "clsx";
import type { ChatText } from "../helper";

/** Emphasised words inside a bubble (amounts, counts, step numbers). */
const RichText = ({ text }: { text: ChatText }) => (
  <>
    {text.map((chunk, index) => (
      <span
        key={index}
        className={clsx(chunk.bold && "tw:font-bold tw:text-slate-900")}
      >
        {chunk.text}
      </span>
    ))}
  </>
);

export default RichText;
