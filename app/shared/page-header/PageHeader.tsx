import clsx from "clsx";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import PageDescription from "~/components/core/page-description/PageDescription";
import PageHeading from "~/components/core/page-heading/PageHeading";
import type { BreadcrumbItem } from "~/types/CommonTypes";

/**
 * Page header block that bundles the breadcrumbs, page description and page
 * heading that most dashboard pages render together (see e.g. the
 * purchase-order/summary page).
 *
 * `breadcrumbs` feeds AppBreadcrumbs, `title` is the pre-translated heading and
 * `description` is a key from the `pageDescription` namespace, shared by both
 * PageDescription and PageHeading (same contract as those components).
 */
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
    <div className={clsx(className)}>
      <AppBreadcrumbs data={breadcrumbs} className="tw:mb-0!" />
      {description && <PageDescription description={description} />}
      <PageHeading title={title} description={description} />
    </div>
  );
};

export default PageHeader;
