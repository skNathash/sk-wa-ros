import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import useAppNav from "~/hooks/useAppNav";
import { AppPaneSide } from "~/shared/layout/app-pane/AppPane";
import PaneTitle from "~/shared/layout/app-pane/PaneTitle";

interface ExpenseSidePaneProps {
  /** Pane-specific content rendered below the header block (summary, lists). */
  children?: React.ReactNode;
  /** Extra classes merged onto the underlying {@link AppPaneSide}. */
  className?: string;
}

/**
 * Side column shared by the expense section pages (records, categories,
 * detail view). Only rendered inside the theme-2 split layout — the section
 * page header and its "Add Expense" CTA are hidden there, so this pane carries
 * the section heading and the CTA that routes to the add-expense page.
 */
const ExpenseSidePane: React.FC<ExpenseSidePaneProps> = ({
  children,
  className = "",
}) => {
  const { t } = useTranslation(["expense", "menu"]);
  const appNav = useAppNav();

  return (
    <AppPaneSide className={`app-pane-only ${className}`}>
      <div className="tw:flex tw:items-baseline tw:justify-between tw:px-1">
        <PaneTitle title={t("expenses", { ns: "menu" })} />
        {/* Scope label removed — the pane header carries the title alone.
        <span className="tw:text-sm tw:text-slate-400">
          {t("manageBusiness", { ns: "menu" })}
        </span>
        */}
      </div>

      <AppButton
        className="tw:w-full"
        onClick={() => appNav.to("/dashboard/expenses/manage")}
      >
        <Plus />
        {t("addExpense", { ns: "expense" })}
      </AppButton>

      {children}
    </AppPaneSide>
  );
};

export default ExpenseSidePane;
