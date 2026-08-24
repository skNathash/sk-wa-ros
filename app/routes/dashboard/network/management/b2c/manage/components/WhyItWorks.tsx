import clsx from "clsx";

interface WhyItWorksProps {
  /** The one-paragraph pitch for the active onboarding route. */
  children: React.ReactNode;
  className?: string;
}

/** The rail note that explains why the active route beats a form. */
const WhyItWorks = ({ children, className }: WhyItWorksProps) => (
  <div
    className={clsx(
      "tw:rounded-xl tw:bg-white tw:p-4 tw:ring-1 tw:ring-slate-100",
      className,
    )}
  >
    <p
      className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-emerald-700"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      Why it works
    </p>
    <p className="tw:mt-2 tw:text-sm tw:leading-relaxed tw:text-slate-600">
      {children}
    </p>
  </div>
);

export default WhyItWorks;
