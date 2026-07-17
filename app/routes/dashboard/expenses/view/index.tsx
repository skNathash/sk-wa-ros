import { Clock, Tag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import DateFormat from "~/components/core/date/DateFormat";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import NoData from "~/components/core/no-data/NoData";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import ImgPreviewModal from "~/modals/core/img-preview/ImgPreviewModal";
import ExpenseService from "~/services/ExpenseService";
import PageAccessService from "~/services/PageAccessService";
import type { BreadcrumbItem } from "~/types/CommonTypes";

export async function clientLoader() {
  return PageAccessService.canAccessPage([]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Dashboard",
    redirect: { path: "/dashboard" },
    langKey: "dashboard",
  },
  {
    label: "Expenses",
    redirect: { path: "/dashboard/expenses/list" },
    langKey: "expenses",
  },
  { label: "Expense Details", langKey: "expenseDetails" },
];

const ExpenseView = () => {
  const { t } = useTranslation(["expense"]);
  const { id } = useParams();

  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [imgPreviewModal, setImgPreviewModal] = useState<{
    show: boolean;
    images: any[];
    initialImageId: string;
  }>({ show: false, images: [], initialImageId: "" });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setLoading(false);
        setExpense(null);
        return;
      }

      setLoading(true);
      try {
        const params = { filter: { _id: id } };
        const resp = await ExpenseService.getTransactions(params);
        const list = resp?.data?.data || [];
        const item = Array.isArray(list) && list.length > 0 ? list[0] : null;
        setExpense(item);
      } catch (e: any) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const imgPreviewModalCallback = () => {
    setImgPreviewModal({ show: false, images: [], initialImageId: "" });
  };

  const openImagePreview = (image: any) => {
    setImgPreviewModal({
      show: true,
      images: expense.assets.map((item: any) => ({ id: item })),
      initialImageId: image,
    });
  };

  const renderValue = (value: string, type: string) => {
    if (type === "date") {
      return <DateFormat value={value} />;
    }
    return value;
  };

  const renderBlock = (
    icon: React.ReactNode,
    title: string,
    value: string,
    type: string = "text"
  ) => {
    return (
      <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:flex tw:flex-col tw:gap-2">
        <div className="tw:text-sm tw:text-slate-600 tw:flex tw:items-center tw:gap-2">
          {icon} {title}
        </div>
        <div className="tw:text-sm tw:text-slate-900 tw:font-medium">
          {renderValue(value, type)}
        </div>
      </div>
    );
  };

  return (
    <>
      <AppHeader title={t("expenseDetailsTitle")} />

      <div className="page-bg tw:p-4 app-page">
        <div className="app-container">
          <div className="tw:max-w-4xl tw:mx-auto">
            <div className="tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:gap-2 tw:mb-4">
              <AppBreadcrumbs data={breadcrumbs} />
            </div>

            {loading ? (
              <div className="tw:p-4 tw:text-center tw:flex tw:justify-center tw:items-center tw:h-40">
                <AppSpinner />
              </div>
            ) : null}

            {!loading && !expense ? <NoData /> : null}

            {!loading && expense ? (
              <>
                <AppCard>
                  <div className="tw:flex tw:flex-col tw:gap-2 tw:mb-10 tw:mt-4 tw:text-center">
                    <div className="tw:text-xl tw:font-bold tw:whitespace-nowrap tw:mx-auto">
                      {expense.title}
                    </div>
                    <div className="tw:text-3xl tw:font-semibold">
                      <Amount
                        value={Number(expense.amount ?? 0)}
                        className="tw:text-red-600"
                      />
                    </div>
                    <div className="tw:text-sm tw:text-gray-500 tw:flex tw:items-center tw:gap-1 tw:justify-center">
                      <span className="tw:font-semibold">
                        {t("expenseDate")}:
                      </span>
                      <DateFormat
                        value={expense.expenseDate}
                        formatStr="dd MMM yyyy"
                      />
                    </div>
                  </div>

                  <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-4 tw:mb-4">
                    {renderBlock(
                      <Tag size={16} />,
                      t("category"),
                      expense.categoryName || "-"
                    )}

                    {renderBlock(
                      <Tag size={16} />,
                      t("subCategory"),
                      expense.subCategoryName || "-"
                    )}

                    {renderBlock(
                      <User size={16} />,
                      t("createdBy"),
                      expense.createdBy?.name || "-"
                    )}

                    {renderBlock(
                      <Clock size={16} />,
                      t("createdOn"),
                      expense.createdAt || "-",
                      "date"
                    )}

                    {expense.recipient?.name
                      ? renderBlock(
                          <User size={16} />,
                          "Vendor / Recipient",
                          expense.recipient?.name || "-"
                        )
                      : null}
                  </div>

                  {/* <div className="tw:mb-4 tw:flex tw:flex-col tw:gap-2">
                    <div className="tw:text-sm tw:text-slate-600 ">
                      {t("description")}
                    </div>
                    <div className="tw:bg-gray-50 tw:p-4 tw:rounded-lg tw:w-full">
                      <div className="tw:text-sm tw:text-slate-700 tw:whitespace-pre-wrap">
                        {expense.description || "-"}
                      </div>
                    </div>
                  </div> */}

                  {expense.assets?.length > 0 ? (
                    <div>
                      <div className="tw:text-sm tw:text-slate-600 tw:mb-2">
                        Attachments:
                      </div>
                      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-6 tw:gap-4">
                        {expense.assets?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="tw:border tw:border-gray-200 tw:rounded-lg tw:overflow-hidden"
                            onClick={() => openImagePreview(item)}
                          >
                            <ImgRender
                              assetId={item}
                              className="tw:w-full tw:h-full tw:object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </AppCard>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <ImgPreviewModal
        show={imgPreviewModal.show}
        callback={imgPreviewModalCallback}
        images={imgPreviewModal.images}
        initialImageId={imgPreviewModal.initialImageId}
      />
    </>
  );
};

export default ExpenseView;
