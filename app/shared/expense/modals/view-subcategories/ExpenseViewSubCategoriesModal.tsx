import { Edit, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ExpenseService from "~/services/ExpenseService";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppBadge from "~/components/core/badge/AppBadge";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import { prepareParams, getData, getCount } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";
import NoData from "~/components/core/no-data/NoData";
import AppCard from "~/components/core/card/AppCard";
import useAppToast from "~/hooks/useAppToast";
import { produce } from "immer";

type Props = {
  show: boolean;
  callback: (a: { action: string; data?: any }) => void;
  categoryId?: string | null;
};
const DEFAULT_PAGINATION: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const ExpenseViewSubCategoriesModal = ({
  show,
  callback,
  categoryId,
}: Props) => {
  const appToast = useAppToast();

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [parentCategory, setParentCategory] = useState<Record<
    string,
    any
  > | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);

  const filterRef = useRef<Record<string, any>>({});
  const paginationRef = useRef<PaginationState>({ ...DEFAULT_PAGINATION });

  const [statusIndex, setStatusIndex] = useState<number | null>(null);

  const handleClose = useCallback(() => {
    callback({ action: "close" });
  }, [callback]);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    setData([]);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      categoryId || undefined
    );
    const total = await getCount(params);
    paginationRef.current.totalRecords = total;
    const items = await getData(params);
    setData(items || []);
    setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    setLoading(false);
  }, [categoryId]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };
    const params = prepareParams(
      filterRef.current,
      paginationRef.current,
      categoryId || undefined
    );
    const items = await getData(params);
    setData((prev) => [...prev, ...items]);
    setHasMoreData(items.length >= paginationRef.current.rowsPerPage);
    setLoadingMore(false);
  }, [loadingMore, hasMoreData, categoryId]);

  useEffect(() => {
    if (show) {
      applyFilter();
    }
  }, [show, categoryId, applyFilter]);

  useEffect(() => {
    // fetch parent category details when modal opens or categoryId changes
    const fetchParent = async () => {
      if (!show || !categoryId) {
        setParentCategory(null);
        return;
      }

      try {
        const resp = await ExpenseService.getCategories({
          filter: { _id: categoryId },
        });
        const items = resp?.data?.data?.data || [];
        const it = items[0] || null;
        setParentCategory(it);
      } catch (err) {
        setParentCategory(null);
      }
    };

    fetchParent();
  }, [show, categoryId]);

  const handleAddSubCategory = useCallback(() => {
    // If parent category is explicitly inactive, show a toast and prevent adding
    if (parentCategory && parentCategory.isActive === false) {
      appToast.show({
        msg: "Cannot add subcategory to an inactive category",
        color: "error",
      });
      return;
    }

    // Inform parent to open add-subcategory modal with parent category id
    callback({
      action: "add-subcategory",
      data: { parentCategoryId: categoryId },
    });
  }, [callback, categoryId, parentCategory]);

  const handleStatus = async (row: any, index: number) => {
    setStatusIndex(index);
    try {
      const response = await ExpenseService.updateSubCategory(row._id, {
        isActive: !row.isActive,
      });
      if (response?.statusCode === 200) {
        appToast.show({
          msg: response?.data?.message || "Status updated successfully",
          color: "success",
        });
        setData(
          produce((draft) => {
            draft[index].isActive = !row.isActive;
            draft[index].statusLabel = !row.isActive ? "Active" : "Inactive";
            draft[index].statusColor = !row.isActive ? "success" : "danger";
          })
        );
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to update status",
          color: "error",
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setStatusIndex(null);
    }
  };

  const handleEdit = (row: any) => {
    callback({
      action: "edit",
      data: row,
    });
  };

  return (
    <AppModal show={show} callback={callback} className="tw:md:h-[90vh]">
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-lg tw:font-semibold tw:flex tw:items-center tw:gap-3">
          <span>"{parentCategory?.name || "--"}" Sub Categories</span>
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh] modal-bg">
        {loading ? (
          <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
            <AppSpinner />
          </div>
        ) : (
          <div className="tw:mt-4">
            {/* Parent category details */}
            {parentCategory && (
              <AppCard>
                <div className="tw:flex tw:justify-between tw:items-start">
                  <div>
                    <div className="tw:text-xs tw:uppercase tw:text-gray-500 tw:tracking-wide">
                      Category
                    </div>
                    <div className="tw:text-base tw:font-semibold tw:mt-1">
                      {parentCategory.name}
                    </div>
                    {parentCategory.description && (
                      <div className="tw:text-xs tw:text-gray-600 tw:mt-1">
                        {parentCategory.description}
                      </div>
                    )}
                  </div>
                </div>
              </AppCard>
            )}
            {data.length === 0 ? (
              <div className="tw:text-center tw:py-6">
                <NoData />
              </div>
            ) : (
              <>
                <div className="tw:text-sm tw:font-semibold tw:mb-1 tw:text-gray-600">
                  List of Sub Categories ({paginationRef.current.totalRecords})
                </div>

                <div className="tw:space-y-3">
                  {data.map((it, index) => (
                    <AppCard key={it._id}>
                      <div>
                        <div className="tw:flex tw:justify-between tw:items-center">
                          <div className="tw:font-semibold">{it.name}</div>
                          {!it.isGlobal && (
                            <AppButton
                              size="small"
                              fill="clear"
                              color="light"
                              onClick={() => handleEdit(it)}
                            >
                              <Edit size={16} />
                            </AppButton>
                          )}
                        </div>
                        <div className="tw:text-sm tw:md:text-xs tw:text-gray-600">
                          {it.description || "-"}
                        </div>
                      </div>
                      <div className="tw:flex tw:justify-end tw:gap-2">
                        <AppBadge variant={it.statusColor}>
                          {it.statusLabel}
                        </AppBadge>

                        {!it.isGlobal && (
                          <AppButton
                            size="small"
                            fill="outline"
                            color={it.isActive ? "danger" : "success"}
                            onClick={() => handleStatus(it, index)}
                            disabled={statusIndex === index}
                            isLoading={statusIndex === index}
                          >
                            {it.isActive
                              ? "Mark as inactive"
                              : "Mark as active"}
                          </AppButton>
                        )}
                      </div>
                    </AppCard>
                  ))}
                </div>
              </>
            )}
            {/* Load more button placed below the list */}
            {data.length > 0 && (
              <div className="tw:flex tw:justify-center tw:mt-4">
                <LoadMoreButton
                  loadMore={loadMore}
                  loading={loadingMore}
                  totalCount={paginationRef.current.totalRecords}
                  loadedCount={data.length}
                />
              </div>
            )}
          </div>
        )}
      </AppModal.Content>

      <AppModal.Footer>
        <div className="tw:flex tw:justify-end tw:items-center tw:w-full">
          <div className="tw:text-end">
            <AppButton
              color="primary"
              onClick={handleAddSubCategory}
              size="small"
            >
              <Plus /> Add Sub category
            </AppButton>
          </div>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ExpenseViewSubCategoriesModal;
