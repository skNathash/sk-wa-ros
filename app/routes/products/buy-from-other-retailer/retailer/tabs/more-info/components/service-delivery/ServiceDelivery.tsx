import { CalendarClock, Clock, PackageOpen, Wallet } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import { EMPTY, getServiceSla, type Retailer } from "../../helper";

type ServiceDeliveryProps = {
  data: Retailer;
};

type SlaItem = {
  icon: React.ReactNode;
  label: string;
  title: string;
  subTitle: string;
  accent: "amber" | "blue" | "emerald" | "violet";
};

const accentMap = {
  amber: {
    card: "tw:border-amber-100 tw:bg-amber-50/60",
    chip: "tw:text-amber-600",
    blob: "tw:bg-amber-200/50",
  },
  blue: {
    card: "tw:border-blue-100 tw:bg-blue-50/60",
    chip: "tw:text-blue-600",
    blob: "tw:bg-blue-200/50",
  },
  emerald: {
    card: "tw:border-emerald-100 tw:bg-emerald-50/60",
    chip: "tw:text-emerald-600",
    blob: "tw:bg-emerald-200/50",
  },
  violet: {
    card: "tw:border-violet-100 tw:bg-violet-50/60",
    chip: "tw:text-violet-600",
    blob: "tw:bg-violet-200/50",
  },
};

const ServiceDelivery = ({ data }: ServiceDeliveryProps) => {
  const storeName = data.name || EMPTY;
  const sla = getServiceSla(data);
  const slaItems: SlaItem[] = [
    {
      icon: <Clock size={16} />,
      label: "Delivery ETA",
      ...sla.deliveryEta,
      accent: "amber",
    },
    {
      icon: <Wallet size={16} />,
      label: "Min order",
      ...sla.minOrder,
      accent: "blue",
    },
    {
      icon: <CalendarClock size={16} />,
      label: "Delivery days",
      ...sla.deliveryDays,
      accent: "emerald",
    },
    {
      icon: <PackageOpen size={16} />,
      label: "Returns / RTV",
      ...sla.returns,
      accent: "violet",
    },
  ];

  return (
    <AppCard
      title="Service & Delivery SLAs"
      subtitle={data.name ? `What ${storeName} promises` : undefined}
      noContentPadding
    >
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-4 tw:gap-3 tw:p-4 tw:pt-0">
        {slaItems.map((item) => {
          const accent = accentMap[item.accent];
          return (
            <div
              key={item.label}
              className={`tw:relative tw:overflow-hidden tw:rounded-xl tw:border tw:p-4 tw:shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${accent.card}`}
            >
              <div
                aria-hidden
                className={`tw:pointer-events-none tw:absolute tw:-top-6 tw:-right-6 tw:h-20 tw:w-20 tw:rounded-full ${accent.blob}`}
              />
              <div className="tw:relative tw:flex tw:items-center tw:gap-2">
                <span
                  className={`tw:flex tw:shrink-0 tw:items-center tw:justify-center ${accent.chip}`}
                >
                  {item.icon}
                </span>
                <span
                  className={`tw:text-[10px] tw:font-semibold tw:uppercase tw:tracking-wider ${accent.chip}`}
                >
                  {item.label}
                </span>
              </div>
              <div className="tw:relative tw:mt-2 tw:text-base tw:font-bold tw:text-slate-800">
                {item.title}
              </div>
              {item.subTitle && (
                <div className="tw:relative tw:mt-0.5 tw:text-xs tw:text-slate-500">
                  {item.subTitle}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AppCard>
  );
};

export default ServiceDelivery;
