import { useTranslation } from "react-i18next";

/**
 * Page title + description block. Hidden by default and shown ONLY in theme-2
 * (see theme-2.css), where the breadcrumbs and PageDescription are hidden
 * app-wide — otherwise pages would have an empty gap above their content.
 *
 * `title` is passed pre-translated by the caller; `description` is a key from
 * the `pageDescription` namespace (same contract as PageDescription).
 */
const PageHeading = ({
  title,
  description,
  className = "",
}: {
  title: string;
  description?: string;
  className?: string;
}) => {
  const { t } = useTranslation(["pageDescription"]);
  return (
    <div className={`app-page-heading tw:hidden ${className}`}>
      <h1 className="tw:text-lg tw:font-semibold tw:text-foreground">
        {title}
      </h1>
      {description && (
        <p className="tw:text-xs tw:text-muted-foreground tw:mt-0.5 tw:line-clamp-2">
          {t(description)}
        </p>
      )}
    </div>
  );
};

export default PageHeading;
