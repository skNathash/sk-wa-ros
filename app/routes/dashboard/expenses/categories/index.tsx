import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import ExpenseService from "~/services/ExpenseService";
import RecentExpenses from "~/shared/expense/components/recent-expenses/RecentExpenses";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import ExpenseSidePane from "~/shared/expense/components/expense-side-pane/ExpenseSidePane";
import ManageExpenseCategoryModal from "~/shared/expense/modals/manage-category/ManageExpenseCategoryModal";
import ManageExpenseSubCategoryModal from "~/shared/expense/modals/manage-subcategory/ManageExpenseSubCategoryModal";
import ExpenseViewSubCategoriesModal from "~/shared/expense/modals/view-subcategories/ExpenseViewSubCategoriesModal";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import DesktopView from "./components/DesktopView";
import Filter from "./components/Filter";
import MobileView from "./components/MobileView";
import { getCount, getData, prepareParams } from "./helper";

const Categories = () => {
  const { t } = useTranslation(["menu"]);
  const { isMobile } = useScreenView();

  const [view, setView] = useState<ViewToggleType>("list");

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const toast = useAppToast();

  const filterRef = useRef<Record<string, any>>({});

  const [manageCategoryModal, setManageCategoryModal] = useState<{
    show: boolean;
    mode: "add" | "edit";
    editId?: string | null;
  }>({ show: false, mode: "add", editId: null });

  const [viewSubCategoriesModal, setViewSubCategoriesModal] = useState<{
    show: boolean;
    categoryId?: string | null;
  }>({ show: false, categoryId: null });

  const [manageSubCategoryModal, setManageSubCategoryModal] = useState<{
    show: boolean;
    mode: "add" | "edit";
    parentCategoryId?: string | null;
    editId?: string | null;
  }>({ show: false, mode: "add", parentCategoryId: null, editId: null });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
    };

    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);

    const totalRecords = await getCount(params);
    paginationRef.current.totalRecords = totalRecords;

    setData(result || []);
    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  }, []);

  useEffect(() => {
    applyFilter();
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);

    const params = prepareParams(filterRef.current, paginationRef.current);
    const result = await getData(params);

    setData((prev) => [...prev, ...result]);
    setHasMoreData(result.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  }, [loadingMore, hasMoreData]);

  const handleViewCallback = useCallback(
    (a?: { action: string; data?: any }) => {
      // Handle actions from child views here. Replace with real handlers as needed.
      if (!a) {
        return;
      }

      if (a.action === "edit") {
        // open edit modal with id
        const id = a.data?._id;
        if (id) {
          setManageCategoryModal({ show: true, mode: "edit", editId: id });
        }
      }
      if (a.action === "view-subcategories") {
        const id = a.data?._id;
        if (id) {
          setViewSubCategoriesModal({ show: true, categoryId: id });
        }
      }
      if (a.action === "delete") {
        // TODO: confirm and delete
        console.debug("Delete category", a.data);
      }
      if (a.action === "mark-active" || a.action === "mark-deactive") {
        const item = a.data;
        if (!item) return;

        const shouldActivate = a.action === "mark-active";
        setAppAlertDialog({
          show: true,
          title: shouldActivate ? "Mark as active" : "Mark as deactive",
          description: shouldActivate
            ? "Are you sure you want to mark this category as active?"
            : "Are you sure you want to mark this category as deactive?",
          onConfirm: async () => {
            setAppAlertDialog((prev) => ({ ...prev, show: false }));
            await doToggleStatus(item, shouldActivate);
          },
          onCancel: () => {
            setAppAlertDialog((prev) => ({ ...prev, show: false }));
          },
        });
      }
    },
    [],
  );

  const doToggleStatus = useCallback(
    async (item: any, activate: boolean) => {
      const id = item._id || item.id;
      if (!id) return;

      setTogglingId(id);

      try {
        const resp = await ExpenseService.updateCategory(id, {
          isActive: activate,
        });

        if (resp?.statusCode === 200) {
          toast.show({ msg: "Status updated successfully", color: "success" });

          // update local data copy (also update status label/color so UI shows change)
          setData((prev) =>
            prev.map((d) =>
              d._id === id || d.id === id
                ? {
                    ...d,
                    isActive: activate,
                    statusLabel: activate ? "Active" : "Inactive",
                    statusColor: activate ? "success" : "danger",
                  }
                : d,
            ),
          );
        } else {
          toast.show({
            msg: resp?.data?.message || "Failed to update status",
            color: "error",
          });
        }
      } catch (err) {
        console.error("Error toggling category status", err);
        toast.show({ msg: "Error while updating status", color: "error" });
      } finally {
        setTogglingId(null);
      }
    },
    [toast],
  );

  const handleFilterCallback = useCallback(
    (p: { formData: Record<string, any> }) => {
      filterRef.current = p.formData || {};
      applyFilter();
    },
    [applyFilter],
  );

  const handleAddCategoryClick = useCallback(() => {
    setManageCategoryModal({ show: true, mode: "add", editId: null });
  }, []);

  const handleManageCategoryCallback = useCallback(
    (res: { action: string; data?: any }) => {
      // close modal
      if (res?.action === "close") {
        setManageCategoryModal((prev) => ({ ...prev, show: false }));
      }
      // on success, refresh list and close
      if (res?.action === "success") {
        setManageCategoryModal({ show: false, mode: "add", editId: null });
        applyFilter();
      }
    },
    [applyFilter],
  );

  const handleViewSubCategoriesModalCallback = useCallback(
    (res?: { action: string; data?: any }) => {
      if (!res) return;

      setViewSubCategoriesModal({ show: false, categoryId: null });

      if (res.action === "edit") {
        const parentCategoryId = res.data?.categoryId;
        if (parentCategoryId) {
          setManageSubCategoryModal({
            show: true,
            mode: "edit",
            parentCategoryId: parentCategoryId,
            editId: res.data?._id,
          });
        }
      }

      if (res.action === "add-subcategory") {
        const parentId = res.data?.parentCategoryId;
        setManageSubCategoryModal({
          show: true,
          mode: "add",
          parentCategoryId: parentId,
        });
      }
    },
    [],
  );

  const handleManageSubCategoryCallback = useCallback(
    (r?: { action: string; data?: any }) => {
      if (!r) return;

      setManageSubCategoryModal({
        show: false,
        mode: "add",
        parentCategoryId: null,
        editId: null,
      });

      if (r.action === "success") {
        setViewSubCategoriesModal({
          show: true,
          categoryId: manageSubCategoryModal.parentCategoryId,
        });
      }
    },
    [manageSubCategoryModal.parentCategoryId],
  );

  return (
    <>
      {/* No `theme-2-mobile-gap-top`: the layout's sticky tab tray sits
          directly above with its own bottom margin, so the grid's mobile top
          gap would only double the space above the first card. */}
      <div className="tw:grid tw:grid-cols-12 tw:gap-4 tw:items-start">
        <AppPaneMain className="tw:lg:col-span-12">
          <div className="tw:py-4">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:mb-3">
              <div className="tw:text-base tw:font-semibold tw:text-gray-900">
                Expense Categories
              </div>
              <AppButton size="small" onClick={handleAddCategoryClick}>
                <Plus size={16} />
                Add Category
              </AppButton>
            </div>

            <Filter callback={handleFilterCallback} />

            <div className="tw:flex tw:items-center tw:mt-2">
              <div className="tw:flex-1">
                <PaginationSummary
                  loadingTotalRecords={loading}
                  paginationConfig={paginationRef.current}
                  loadedCount={data.length}
                  fwSize="sm"
                />
              </div>
              <ViewToggle viewType={view} callback={setView} />
            </div>
          </div>

          {isMobile || view === "card" ? (
            <MobileView
              data={data}
              loading={loading}
              loadingMore={loadingMore}
              loadMore={loadMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={data.length}
              showLoadMore={hasMoreData}
              callback={handleViewCallback}
              togglingId={togglingId}
            />
          ) : (
            <AppCard noPadding>
              <DesktopView
                data={data}
                loading={loading}
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
                showLoadMore={hasMoreData}
                callback={handleViewCallback}
                togglingId={togglingId}
              />
            </AppCard>
          )}
        </AppPaneMain>

        {/* Side column — only rendered while the theme-2 split layout is
            active (lg+), where the CSS re-homes it as the fixed list pane
            beside the icon rail. */}
        <ExpenseSidePane>
          <RecentExpenses limit={5} showViewAll />
        </ExpenseSidePane>
      </div>

      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />

      <ManageExpenseCategoryModal
        show={manageCategoryModal.show}
        callback={handleManageCategoryCallback}
        mode={manageCategoryModal.mode}
        editId={manageCategoryModal.editId}
      />

      <ExpenseViewSubCategoriesModal
        show={viewSubCategoriesModal.show}
        callback={handleViewSubCategoriesModalCallback}
        categoryId={viewSubCategoriesModal.categoryId}
      />

      <ManageExpenseSubCategoryModal
        show={manageSubCategoryModal.show}
        callback={handleManageSubCategoryCallback}
        mode={manageSubCategoryModal.mode}
        parentCategoryId={manageSubCategoryModal.parentCategoryId || undefined}
        editId={manageSubCategoryModal.editId || ""}
      />
    </>
  );
};

export default Categories;
