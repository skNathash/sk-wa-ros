import { debounce } from "lodash";
import { Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { AppInput } from "~/components/core/form/AppInput";
import ViewToggle from "~/components/feature/utility/view-toggle/ViewToggle";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import CommonService from "~/services/CommonService";
import PageAccessService from "~/services/PageAccessService";
import type { PaginationState, ViewToggleType } from "~/types/CommonTypes";
import ListView from "./components/ListView";
import VendorsList from "./components/VendorsList";
import { getCount, getData, prepareParams } from "./helper";

const rbacRoles = {
  viewVendors: ["INVENTORY.VIEW-VENDORS"],
};

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-VENDORS"]);
}

const defaultFilter = {
  search: "",
  status: "",
  vendor: "",
};

const Vendors = () => {
  const { id } = useParams();
  const { t } = useTranslation(["common"]);

  const appNav = useAppNav();
  const { show: showToast } = useAppToast();

  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // React Hook Form setup
  const { register, getValues } = useForm({
    defaultValues: {
      search: "",
    },
  });

  const [view, setView] = useState<ViewToggleType>("card");

  const filterRef = useRef<any>({ ...defaultFilter });

  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  const sortRef = useRef<{ key: string; value: "asc" | "desc" | undefined }>({
    key: "createdAt",
    value: "desc",
  });

  useEffect(() => {
    if (id) {
      applyFilter();
    }
  }, [id]);

  // Apply filter and reset pagination
  const applyFilter = useCallback(async () => {
    if (!id) return;

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setVendors([]);
    try {
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const totalRecords = await getCount(params, id);
      paginationRef.current.totalRecords = totalRecords;
      const vendorsData = await getData(params, id);
      setVendors(vendorsData);
      setHasMoreData(vendorsData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error applying filter:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce(() => {
      const searchTerm = getValues("search");
      filterRef.current = {
        ...filterRef.current,
        search: searchTerm,
      };
      applyFilter();
    }, 500),
    [applyFilter, getValues]
  );

  // Load more data for load more button
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData || !id) {
      return;
    }
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(
        filterRef.current,
        paginationRef.current,
        sortRef.current
      );
      const vendorsData = await getData(params, id);
      setVendors((prev) => [...prev, ...vendorsData]);
      setHasMoreData(vendorsData.length >= paginationRef.current.rowsPerPage);
    } catch (error) {
      console.error("Error loading more data:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreData, id]);

  const handleFilterChange = useCallback(
    ({ formData }: any) => {
      filterRef.current = {
        ...filterRef.current,
        ...formData,
      };
      applyFilter();
    },
    [applyFilter]
  );

  const handleSort = useCallback(
    ({ key, value }: any) => {
      sortRef.current = { key, value };
      applyFilter();
    },
    [applyFilter]
  );

  const handleItemClick = useCallback(({ action, data }: any) => {
    if (AuthService.isMasterLogin()) {
      showToast({
        msg: t("youAreNotAuthorizedToDoThisAction"),
        color: "danger",
      });
      return;
    }
    if (action === "createPO") {
      appNav.to(`/dashboard/purchase-order/manage?vid=${data.vendor._id}`);
    }
  }, []);

  if (!id) {
    return (
      <div className="tw:p-4">
        <div className="tw:text-center tw:text-gray-500">
          No product selected
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="tw:mb-4 tw:flex tw:justify-between tw:items-center">
        <div>
          <div className="tw:text-base tw:font-medium">
            {t("vendorPurchaseHistory")}
          </div>
          <div className="tw:text-sm tw:text-gray-500">
            {t("vendorsFound", {
              count: paginationRef.current.totalRecords,
            })}
          </div>
        </div>
        <ViewToggle viewType={view} callback={setView} />
      </div>
      {/* Search Filter */}

      <AppInput
        name="search"
        placeholder={t("searchVendors")}
        register={register}
        leftIcon={<Search className="tw:w-4 tw:h-4 tw:text-gray-400" />}
        size="sm"
        onChange={() => debouncedSearch()}
        className="tw:mb-4"
      />

      {/* Vendor list content */}

      {loading ? (
        <div className="tw:text-center tw:py-8">
          <div className="tw:text-gray-500">{t("loadingVendors")}</div>
        </div>
      ) : vendors.length === 0 ? (
        <div className="tw:text-center tw:py-8">
          <div className="tw:text-gray-500">{t("noVendorsFound")}</div>
        </div>
      ) : (
        <div className="tw:space-y-4">
          {view === "list" ? (
            <ListView
              data={vendors}
              showLoadMore={hasMoreData && !loading}
              loadingMore={loadingMore}
              loadMore={loadMore}
              totalCount={paginationRef.current.totalRecords}
              loadedCount={vendors.length}
              callback={handleItemClick}
            />
          ) : (
            vendors.map((vendor, index) => (
              <VendorsList
                key={vendor._id || index}
                vendor={vendor}
                showLoadMore={
                  hasMoreData && !loading && index === vendors.length - 1
                }
                loadingMore={loadingMore}
                loadMore={loadMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={vendors.length}
                callback={handleItemClick}
              />
            ))
          )}
        </div>
      )}
    </>
  );
};

export default Vendors;

export function meta() {
  return [
    {
      title: CommonService.prepareAppDocumentTitle(
        "Products Vendors & Purchase"
      ),
    },
  ];
}
