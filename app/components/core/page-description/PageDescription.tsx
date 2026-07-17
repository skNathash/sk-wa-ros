import { useTranslation } from "react-i18next";

const PageDescription = ({
  description,
  className,
}: {
  className?: string;
  description: string;
}) => {
  const { t } = useTranslation(["pageDescription"]);
  return (
    <div
      className={`app-page-description tw:text-[10px] tw:md:text-xs tw:text-gray-500 ${className} tw:line-clamp-1`}
    >
      {t(description)}
    </div>
  );
};

export default PageDescription;
