import { Link } from "react-router";

type Props = {
  children: React.ReactNode;
  onClick?: (e: any) => void;
  className?: string;
  asLink?: boolean;
  href?: string;
  title?: string;
  noUnderline?: boolean;
  showLinkColor?: boolean;
};

const AppLink = ({
  children,
  onClick,
  className,
  asLink = false,
  href,
  title,
  noUnderline = false,
  showLinkColor = false,
}: Props) => {
  if (asLink) {
    return (
      <Link
        to={href || ""}
        className={`${
          noUnderline ? "" : "tw:hover:underline"
        } tw:text-left tw:cursor-pointer ${
          showLinkColor ? "tw:text-primary" : ""
        } ${className}`}
        onClick={onClick}
        title={title}
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      role="button"
      tabIndex={0}
      className={`tw:underline tw:text-left tw:cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
    </a>
  );
};
export default AppLink;
