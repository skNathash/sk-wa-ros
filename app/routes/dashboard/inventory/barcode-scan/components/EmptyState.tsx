import {
  CheckCircle2,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Wand2,
} from "lucide-react";

const steps = [
  {
    icon: ScanLine,
    title: "Scan",
    desc: "Scan, or type a name / model.",
    tint: "tw:bg-blue-50 tw:text-blue-600",
  },
  {
    icon: CheckCircle2,
    title: "Check",
    desc: "See the product & price.",
    tint: "tw:bg-emerald-50 tw:text-emerald-600",
  },
  {
    icon: ShoppingCart,
    title: "Add",
    desc: "Set qty, tap Subscribe.",
    tint: "tw:bg-amber-50 tw:text-amber-600",
  },
];

const EmptyState = () => (
  <div className="tw:flex tw:flex-col tw:gap-3">
    {/* StoreKing AI promo — the headline reason to scan here */}
    <div className="tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:border-violet-200 tw:bg-linear-to-br tw:from-violet-50 tw:via-white tw:to-blue-50 tw:p-4">
      <div className="tw:absolute tw:-top-8 tw:-right-8 tw:w-32 tw:h-32 tw:rounded-full tw:bg-violet-100/60 tw:blur-2xl" />
      <div className="tw:relative tw:flex tw:items-start tw:gap-3">
        <div className="tw:flex tw:items-center tw:justify-center tw:w-11 tw:h-11 tw:rounded-xl tw:bg-linear-to-br tw:from-violet-500 tw:to-blue-600 tw:text-white tw:shadow-md tw:shrink-0">
          <Wand2 className="tw:w-5 tw:h-5" />
        </div>
        <div className="tw:min-w-0">
          <div className="tw:flex tw:items-center tw:gap-1 tw:text-sm tw:font-bold tw:text-violet-900">
            Powered by StoreKing AI
            <Sparkles className="tw:w-3.5 tw:h-3.5 tw:text-amber-400" />
          </div>
          <p className="tw:text-xs tw:text-gray-600 tw:mt-0.5 tw:leading-snug">
            Just search — AI fills in the name, brand, MRP and more in seconds.
          </p>
        </div>
      </div>
    </div>

    <div className="tw:rounded-lg tw:border tw:border-gray-200 tw:bg-white tw:overflow-hidden tw:p-3">
      <div className="tw:text-[11px] tw:font-semibold tw:text-gray-700 tw:mb-2">
        How it works
      </div>
      <ol className="tw:grid tw:grid-cols-3 tw:gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="tw:flex tw:items-center tw:gap-2 tw:p-2 tw:rounded-md tw:bg-gray-50"
            >
              <div
                className={`tw:flex tw:items-center tw:justify-center tw:w-7 tw:h-7 tw:rounded-full tw:shrink-0 ${s.tint}`}
              >
                <Icon className="tw:w-3.5 tw:h-3.5" />
              </div>
              <div className="tw:min-w-0">
                <div className="tw:text-[11px] tw:font-semibold tw:text-gray-900">
                  {i + 1}. {s.title}
                </div>
                <div className="tw:text-[10px] tw:text-gray-500 tw:leading-tight tw:line-clamp-2">
                  {s.desc}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  </div>
);

export default EmptyState;
