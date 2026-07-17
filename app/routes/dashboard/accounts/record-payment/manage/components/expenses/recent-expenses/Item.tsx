import { Calendar } from "lucide-react";
import Amount from "~/components/core/amount/Amount";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";

type Props = {
  data: any;
};

const Item: React.FC<Props> = ({ data }) => {
  const title = data?.title || "Expense";
  const amount = Number(data?.amount) || 0;
  const date = data?.expenseDate;
  const subCategory = data?.subCategoryName;

  return (
    <AppLink asLink href={`/dashboard/expenses/view/${data?._id}`} noUnderline>
      <div className="tw:border tw:border-gray-200 tw:rounded-lg tw:p-3 tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex tw:items-center tw:gap-3">
          <div>
            <div className="tw:text-gray-500 tw:text-sm tw:md:text-xs tw:mb-1">
              Expense Date: <DateFormat value={date} formatStr="dd MMM yyyy" />
            </div>
            <div className="tw:font-medium tw:text-gray-800">{title}</div>
            <div className="tw:text-xs tw:text-gray-500">
              {subCategory || "--"}
            </div>
          </div>
        </div>
        <div className="tw:text-right">
          <div className="wa-amount tw:font-semibold tw:text-[color:var(--wa-domain-out)]">
            <Amount value={amount} />
          </div>
        </div>
      </div>
    </AppLink>
  );
};

export default Item;
