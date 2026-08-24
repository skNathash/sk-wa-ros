import clsx from "clsx";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import PageHeading from "~/components/core/page-heading/PageHeading";
import type { BreadcrumbItem } from "~/types/CommonTypes";

interface PageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
  className?: string;
}

const PageHeader = ({
  breadcrumbs,
  title,
  description,
  className,
}: PageHeaderProps) => {
  return (
    <div className={clsx("theme-2-mobile-hide", className)}>
      <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
      {description && <PageDescription description={description} />}
      <PageHeading title={title} description={description} />
    </div>
  );
};

export default PageHeader;
