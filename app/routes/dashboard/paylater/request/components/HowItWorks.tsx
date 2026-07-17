import React, { useState } from "react";
import {
  Activity,
  BookOpen,
  UserCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import clsx from "clsx";

const Step: React.FC<{
  number: number;
  title: string;
  desc: string;
  icon?: React.ReactNode;
}> = ({ number, title, desc, icon }) => {
  // map step number to a different bg + text color (Tailwind classes)
  const colorClass =
    number === 1
      ? "tw:bg-blue-100 tw:text-blue-700"
      : number === 2
        ? "tw:bg-yellow-100 tw:text-yellow-700"
        : number === 3
          ? "tw:bg-green-100 tw:text-green-700"
          : "tw:bg-gray-100 tw:text-gray-700";

  return (
    <div className="tw:flex tw:items-start">
      <div className="tw:flex-shrink-0">
        <div
          className={`tw:h-8 tw:w-8 tw:rounded-full ${colorClass} tw:flex tw:items-center tw:justify-center tw:font-medium`}
        >
          {number}
        </div>
      </div>
      <div className="tw:ml-3">
        <div className="tw:text-sm tw:font-medium">{title}</div>
        <div className="tw:text-xs tw:text-gray-600">{desc}</div>
      </div>
      {/* {icon && <div className="tw:ml-auto tw:text-gray-400">{icon}</div>} */}
    </div>
  );
};

const HowItWorks: React.FC = () => {
  const { t } = useTranslation(["applyPaylater"]);
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      number: 1,
      title: t("howItWorks.steps.1.title"),
      desc: t("howItWorks.steps.1.desc"),
      icon: <Activity className="tw:h-5 tw:w-5" />,
    },
    {
      number: 2,
      title: t("howItWorks.steps.2.title"),
      desc: t("howItWorks.steps.2.desc"),
      icon: <UserCheck className="tw:h-5 tw:w-5" />,
    },
    {
      number: 3,
      title: t("howItWorks.steps.3.title"),
      desc: t("howItWorks.steps.3.desc"),
      icon: <XCircle className="tw:h-5 tw:w-5" />,
    },
  ];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <AppCard
      title={
        <div
          className="tw:flex tw:items-center tw:justify-between tw:w-full tw:cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="tw:flex tw:items-center tw:gap-2">
            <BookOpen />
            <span>{t("howItWorks.title")}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="tw:w-5 tw:h-5 tw:text-gray-500" />
          ) : (
            <ChevronDown className="tw:w-5 tw:h-5 tw:text-gray-500" />
          )}
        </div>
      }
      noContentPadding
      className={clsx("tw:pt-4", !isExpanded ? "tw:pb-0" : "")}
    >
      {isExpanded && (
        <div className="tw:p-4 tw:space-y-4">
          {steps.map((s) => (
            <Step
              key={s.number}
              number={s.number}
              title={s.title}
              desc={s.desc}
              icon={s.icon}
            />
          ))}
        </div>
      )}
    </AppCard>
  );
};

export default HowItWorks;
