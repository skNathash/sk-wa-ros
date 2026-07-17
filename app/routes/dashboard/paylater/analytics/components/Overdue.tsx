import clsx from "clsx";
import { format } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppLink from "~/components/core/link/AppLink";
import AuthService from "~/services/AuthService";
import PaylaterService from "~/services/PaylaterService";

const Overdue = ({ type }: { type: "today" | "tomorrow" }) => {
  const { t } = useTranslation("paylater");

  const [b2cAmount, setB2cAmount] = useState<number>(0);
  const [b2bAmount, setB2bAmount] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [b2cUsers, setB2cUsers] = useState<number>(0);
  const [b2bUsers, setB2bUsers] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const date =
          type === "today"
            ? format(new Date(), "yyyy-MM-dd")
            : format(
                new Date(new Date().setDate(new Date().getDate() + 1)),
                "yyyy-MM-dd"
              );

        const resp: any = await PaylaterService.getDueAmounts({
          dueDate: date,
        });

        const payload = resp?.data?.data || {};

        const parsedB2cAmount = Number(payload?.b2c?.amount ?? 0);
        const parsedB2bAmount = Number(payload?.b2b?.amount ?? 0);
        const parsedTotalAmount = Number(
          payload?.total?.amount ?? parsedB2cAmount + parsedB2bAmount
        );

        const parsedB2cUsers = Number(payload?.b2c?.userCount ?? 0);
        const parsedB2bUsers = Number(payload?.b2b?.userCount ?? 0);
        const parsedTotalUsers = Number(
          payload?.total?.userCount ?? parsedB2cUsers + parsedB2bUsers
        );

        if (isMounted) {
          setB2cAmount(parsedB2cAmount);
          setB2bAmount(parsedB2bAmount);
          setTotalAmount(parsedTotalAmount);
          setB2cUsers(parsedB2cUsers);
          setB2bUsers(parsedB2bUsers);
          setTotalUsers(parsedTotalUsers);
        }
      } catch (e) {
        if (isMounted) {
          setB2cAmount(0);
          setB2bAmount(0);
          setTotalAmount(0);
          setB2cUsers(0);
          setB2bUsers(0);
          setTotalUsers(0);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetch();

    return () => {
      isMounted = false;
    };
  }, [type]);

  const title =
    type === "today" ? t("overdue.dueToday") : t("overdue.dueTomorrow");

  const displayDate =
    type === "today"
      ? new Date()
      : new Date(new Date().setDate(new Date().getDate() + 1));

  return (
    <AppCard className="tw:mb-0">
      <div role="region" aria-label={title}>
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:pb-4 tw:border-b tw:border-gray-200">
          <Calendar
            size={16}
            className={clsx(
              "tw:flex-shrink-0",
              type === "today" ? "tw:text-red-600" : "tw:text-orange-500"
            )}
          />
          <h3
            className={clsx(
              "tw:text-sm tw:font-semibold tw:truncate",
              type === "today" ? "tw:text-red-600" : "tw:text-orange-500"
            )}
          >
            {title} -{" "}
            <DateFormat
              value={displayDate}
              formatStr="dd MMM yyyy"
              className="tw:text-sm tw:text-gray-500"
            />
          </h3>
        </div>

        {AuthService.isBuyerUser() ? (
          <div className="tw:flex tw:items-center tw:gap-4 tw:mt-4">
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                {t("overdue.totalAmount")}:
              </span>
              <div className="tw:text-lg tw:font-bold tw:text-green-600">
                <Amount value={loading ? 0 : totalAmount} />
              </div>
            </div>
            <div className="tw:flex tw:items-center tw:gap-2">
              <span className="tw:text-sm tw:font-medium tw:text-gray-700">
                {t("overdue.totalUsers")}:
              </span>
              <AppLink
                href={`/dashboard/paylater/wallets/b2c?tab=b2c-wallets&status=${
                  type === "today" ? "DueToday" : "DueTomorrow"
                }`}
                className="tw:underline tw:flex tw:items-center tw:gap-1"
                asLink
              >
                <span className="tw:text-sm tw:text-gray-600">
                  {loading ? 0 : totalUsers}
                </span>
                <span className="tw:text-xs tw:flex tw:items-center tw:gap-1">
                  {t("overdue.view")}{" "}
                  <ArrowRight size={16} className="tw:text-gray-500" />
                </span>
              </AppLink>
            </div>
          </div>
        ) : (
          <div className="tw:grid tw:grid-cols-3 tw:gap-3 tw:mt-4">
            <div className="tw:space-y-0.5">
              <div className="tw:text-base tw:font-bold tw:text-red-600 tw:leading-tight">
                <Amount value={loading ? 0 : b2cAmount} />
              </div>
              <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                {t("overdue.b2c")}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                <AppLink
                  href={`/dashboard/paylater/wallets/b2c?tab=b2c-wallets&status=${
                    type === "today" ? "DueToday" : "DueTomorrow"
                  }`}
                  className="tw:underline tw:flex tw:items-center tw:gap-1"
                  asLink
                >
                  {loading ? 0 : b2cUsers} users{" "}
                </AppLink>
              </div>
            </div>

            <div className="tw:space-y-0.5">
              <div className="tw:text-base tw:font-bold tw:text-primary tw:leading-tight">
                <Amount value={loading ? 0 : b2bAmount} />
              </div>
              <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                {t("overdue.b2b")}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                <AppLink
                  href={`/dashboard/paylater/wallets/b2b?tab=b2b-wallets&status=${
                    type === "today" ? "DueToday" : "DueTomorrow"
                  }`}
                  className="tw:underline tw:flex tw:items-center tw:gap-1"
                  asLink
                >
                  {loading ? 0 : b2bUsers} users{" "}
                </AppLink>
              </div>
            </div>

            <div className="tw:space-y-0.5">
              <div className="tw:text-base tw:font-bold tw:text-green-600 tw:leading-tight">
                <Amount value={loading ? 0 : totalAmount} />
              </div>
              <div className="tw:text-xs tw:text-gray-600 tw:font-medium">
                {t("overdue.total")}
              </div>
              <div className="tw:text-xs tw:text-gray-500">
                {loading ? 0 : totalUsers} {t("overdue.users")}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppCard>
  );
};

export default Overdue;
