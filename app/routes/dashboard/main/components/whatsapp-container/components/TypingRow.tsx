import Avatar from "./Avatar";

/** The three-dot bubble while Swa is working on the answer. */
const TypingRow = ({ avatarMark }: { avatarMark: string }) => (
  <div className="tw:flex tw:items-end tw:gap-2">
    <Avatar mark={avatarMark} className="tw:mt-auto tw:size-8 tw:text-xs" />
    <div className="wa-bubble wa-bubble-plain tw:flex tw:items-center tw:gap-1 tw:rounded-lg tw:px-3 tw:py-3 tw:shadow-sm">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="tw:size-1.5 tw:animate-bounce tw:rounded-full tw:bg-slate-400"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  </div>
);

export default TypingRow;
