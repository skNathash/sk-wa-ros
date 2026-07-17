import clsx from "clsx";
import { Grid, List } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTranslation } from "react-i18next";

type Props = {
  viewType: "list" | "card";
  callback: (viewType: "list" | "card") => void;
  className?: string;
  hideInMobile?: boolean;
  showOnlyIcon?: boolean;
};

const ViewToggle = ({
  viewType,
  callback,
  className,
  hideInMobile = true,
  showOnlyIcon = false,
}: Props) => {
  const { t } = useTranslation(["common"]);
  return (
    <div
      className={clsx(className, {
        "tw:hidden tw:md:inline-flex": hideInMobile,
      })}
    >
      {viewType === "card" && (
        <Button onClick={() => callback("list")} size="sm" variant="outline">
          <List />
          {!showOnlyIcon && t("list")}
        </Button>
      )}
      {viewType === "list" && (
        <Button onClick={() => callback("card")} size="sm" variant="outline">
          <Grid />
          {!showOnlyIcon && t("card")}
        </Button>
      )}
    </div>
  );
};

export default ViewToggle;
