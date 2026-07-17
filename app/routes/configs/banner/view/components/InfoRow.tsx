import type React from "react";

export default function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="tw:flex tw:items-start tw:gap-3 tw:py-2.5 tw:border-b tw:border-slate-100 last:tw:border-0">
      {icon && <span className="tw:text-slate-400 tw:mt-0.5">{icon}</span>}
      <div className="tw:min-w-[120px] tw:text-xs tw:font-medium tw:text-slate-500 tw:uppercase tw:tracking-wide tw:mt-0.5">
        {label}
      </div>
      <div className="tw:flex-1 tw:text-sm tw:text-slate-800">{value || "--"}</div>
    </div>
  );
}
