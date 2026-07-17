import React, { useCallback, useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";
import { AppInput } from "~/components/core/form";
import { useForm } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import { useTranslation } from "react-i18next";
import { prepareParams, getData, getCount } from "./helper";
import AppTab from "~/components/core/tab/AppTab";
import type { TabItem } from "~/types/CommonTypes";
import useAppNav from "~/hooks/useAppNav";
import AppButton from "~/components/core/button/AppButton";
import type { PaginationState } from "~/types/CommonTypes";
import {
  ChevronRight,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import NoData from "~/components/core/no-data/NoData";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import AuthService from "~/services/AuthService";
import AppBadge from "~/components/core/badge/AppBadge";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import Alpha from "~/components/core/alpha/Alpha";
import UserBadgeType from "~/shared/store/badge/UserBadgeType";

interface ChooseRetailerModalProps {
  show: boolean;
  callback: (params: { action: string; data?: any }) => void;
}

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const defaultFilter = {
  search: "",
  alpha: "",
  retailerType: "All",
  activeTab: "my-network",
};

const ChooseRetailerModal: React.FC<ChooseRetailerModalProps> = ({
  show,
  callback,
}) => {
  const { t } = useTranslation(["posbilling"]);
  const appNav = useAppNav();

  const { register, getValues, setValue } = useForm({
    defaultValues: { search: defaultFilter.search },
  });

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [total, setTotal] = useState(0);
  const [loadingTotalRecords, setLoadingTotalRecords] = useState(false);

  const [tabs, setTabs] = useState<TabItem[]>([]);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });
  const filterRef = useRef<Record<string, any>>({ ...defaultFilter });
  const [activeTab, setActiveTab] = useState<string>(
    filterRef.current.activeTab || defaultFilter.activeTab
  );
  const [selectedAlpha, setSelectedAlpha] = useState<string>("");

  const applyFilter = useCallback(async () => {
    // Apply current filterRef and reset pagination to first page
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setData([]);
    setLoadingTotalRecords(true);
    try {
      const params = prepareParams(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(params, filterRef.current.activeTab);
      paginationRef.current.totalRecords = totalRecords;
      const list = await getData(params, filterRef.current.activeTab);
      setData(list);
      setTotal(totalRecords);
      setHasMoreData(list.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoading(false);
      setLoadingTotalRecords(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search handler - reads value via getValues to keep in sync
  const handleSearch = useCallback(
    debounce(() => {
      const val = (getValues("search") || "").toString();
      filterRef.current.search = val;
      filterRef.current.alpha = "";
      setSelectedAlpha("");
      applyFilter();
    }, 500),
    [getValues, applyFilter]
  );

  useEffect(() => {
    // when modal opens, reset and load first page
    if (show) {
      paginationRef.current = { ...defaultPagination };
      filterRef.current = { ...defaultFilter };

      if (AuthService.isSalesEmployeeLoggedIn()) {
        setTabs([]);
        filterRef.current.activeTab = "my-network";
      } else if (AuthService.isSkSeller()) {
        setTabs([
          { key: "my-network", name: "My Network" },
          { key: "other-retailers", name: "Other Retailers" },
        ]);
        filterRef.current.activeTab = "my-network";
      } else {
        setTabs([{ key: "other-retailers", name: "Other Retailers" }]);
        filterRef.current.activeTab = "other-retailers";
      }

      setActiveTab(filterRef.current.activeTab);
      setSelectedAlpha("");
      setValue("search", "");
      setData([]);
      applyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  const handleClose = () => {
    callback({ action: "close" });
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreData) return;
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParams(filterRef.current, paginationRef.current);
      const list = await getData(params, filterRef.current.activeTab);
      setData((d) => [...d, ...list]);
      setHasMoreData(list.length >= paginationRef.current.rowsPerPage);
    } finally {
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMoreData, loadingMore]);

  const handleSelect = (item: any) => {
    callback({ action: "select", data: item });
  };

  const handleCreateRetailer = () => {
    appNav.to("/dashboard/network/management/b2b-retailers/manage", {
      sourcePage: "pos",
    });
    callback({ action: "retailerCreate" });
  };

  const handleTabChange = (tab: TabItem) => {
    setActiveTab(tab.key);
    filterRef.current.activeTab = tab.key;
    filterRef.current.search = "";
    filterRef.current.alpha = "";
    setSelectedAlpha("");
    setValue("search", "");
    applyFilter();
  };

  const handleAlphaChange = (value: string) => {
    setSelectedAlpha(value);
    filterRef.current.alpha = value;
    filterRef.current.search = "";
    setValue("search", "");
    applyFilter();
  };

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:max-w-2xl tw:md:h-[90vh]"
    >
      <AppModal.Title onClose={handleClose}>
        <div className="tw:text-left">
          <h2 className="tw:text-lg tw:font-bold">Choose B2B Retailer </h2>
          {tabs.length < 1 ? (
            <>
              {activeTab === "other-retailers" ? (
                <p className="tw:text-xs tw:text-muted-foreground">
                  Data is showing around 100 km for nearby retailers
                </p>
              ) : (
                <p className="tw:text-xs tw:text-muted-foreground">
                  Select a retailer to proceed with B2B checkout
                </p>
              )}
            </>
          ) : null}
        </div>
      </AppModal.Title>

      <AppModal.Content className="tw:max-h-[90vh]">
        {tabs.length > 1 && (
          <div className="tw:mb-3">
            <AppTab
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              className="tw:mb-2"
            />
            {activeTab === "my-network" && (
              <p className="tw:text-xs tw:text-muted-foreground tw:mt-1">
                Retailers from your connected network
              </p>
            )}
            {activeTab === "other-retailers" && (
              <p className="tw:text-xs tw:text-muted-foreground tw:mt-1">
                Showing retailers within 100 km — nearest first
              </p>
            )}
          </div>
        )}

        <AppInput
          name="search"
          placeholder="Search by Name, Mobile or ID ..."
          register={register}
          onChange={handleSearch}
          leftIcon={<Search className="tw:text-muted-foreground" size={16} />}
          className="tw:mb-2 tw:mt-1"
        />

        <Alpha
          selected={selectedAlpha}
          callback={handleAlphaChange}
          className="tw:mb-3"
        />

        <div className="tw:space-y-2">
          <div className="tw:mb-2 tw:flex tw:justify-between">
            <PaginationSummary
              paginationConfig={paginationRef.current}
              loadingTotalRecords={loadingTotalRecords}
              loadedCount={data.length}
              fwSize="sm"
            />
          </div>
          {data.map((item) => (
            <div
              key={item._id || item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelect(item)}
              className="tw:border tw:border-border tw:rounded-xl tw:p-4 tw:flex tw:justify-between tw:items-center tw:cursor-pointer tw:transition-colors tw:hover:border-primary/40 tw:hover:bg-muted/40"
            >
              <div>
                <div className="tw:flex tw:items-center tw:gap-2 tw:mb-1">
                  <div className="tw:font-semibold tw:text-sm tw:text-foreground">{item.name}</div>
                </div>

                <div className="tw:flex tw:gap-2 tw:mb-2">
                  <UserBadgeType type={item.displayType?.name} />

                  <div className="wa-mono tw:text-sm tw:md:text-xs tw:text-muted-foreground tw:flex tw:items-center tw:space-x-1 tw:gap-1 tw:mb-1">
                    ID: {item.franchiseId}
                  </div>
                  {activeTab !== "other-retailers" && (
                    <div className="wa-mono tw:text-sm tw:md:text-xs tw:text-muted-foreground tw:flex tw:items-center tw:space-x-1 tw:gap-1 tw:mb-1">
                      <Phone size={12} />
                      {item.mobile}
                    </div>
                  )}
                </div>

                <div className="tw:text-sm tw:text-muted-foreground tw:md:text-xs tw:flex tw:items-center tw:space-x-1 tw:gap-1 tw:mb-1">
                  <MapPin size={12} />
                  {item.formatAddress}
                </div>

                {item.distanceToFranchiseKm > 0 && (
                  <div>
                    <AppBadge variant="light" className="tw:text-muted-foreground">
                      <Navigation className="tw:w-3 tw:h-3" />
                      {item.distanceToFranchiseKm || 0} {t("km")}
                    </AppBadge>
                  </div>
                )}
              </div>

              <ChevronRight className="tw:text-muted-foreground" />
            </div>
          ))}

          {loading && (
            <div className="tw:space-y-2">
              {[...Array(5)].map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="tw:border tw:rounded tw:p-2 tw:flex tw:justify-between tw:items-center"
                >
                  <div className="tw:w-3/4">
                    <div className="tw:h-4 tw:mb-2">
                      <Skeleton className="tw:h-4 tw:w-2/3" />
                    </div>

                    <div className="tw:flex tw:gap-2 tw:mb-2">
                      <Skeleton className="tw:h-3 tw:w-24" />
                      <Skeleton className="tw:h-3 tw:w-20" />
                    </div>

                    <div className="tw:h-3 tw:w-1/2">
                      <Skeleton className="tw:h-3 tw:w-3/4" />
                    </div>
                  </div>
                  <div className="tw:w-8">
                    <Skeleton className="tw:h-4 tw:w-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && data.length < total && (
            <LoadMoreButton
              loadMore={loadMore}
              loading={loadingMore}
              totalCount={total}
              loadedCount={data.length}
            />
          )}

          {!loading && data.length === 0 && <NoData />}
        </div>
      </AppModal.Content>
      <AppModal.Footer>
        <div className="tw:text-end">
          <AppButton fill="outline" onClick={handleCreateRetailer}>
            <Plus size={16} />
            Create B2B Retailer
          </AppButton>
        </div>
      </AppModal.Footer>
    </AppModal>
  );
};

export default ChooseRetailerModal;
