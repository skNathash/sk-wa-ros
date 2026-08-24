import { useEffect, useRef, useState } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";
import { Check, Phone, Search } from "lucide-react";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import NoData from "~/components/core/no-data/NoData";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import PaginationSummary from "~/components/core/pagination/PaginationSummary";
import VendorTypeBadge from "~/shared/vendor/components/vendor-type-badge/VendorTypeBadge";
import AccountService from "~/services/AccountService";
import { AVATAR_COLORS, getEntityTypeLabel, getInitials } from "../../helper";
import { getCount, getData, prepareParams } from "./helper";
import type { PaginationState } from "~/types/CommonTypes";
import type {
  RecordPaymentEntity,
  RecordPaymentEntityType,
  RecordPaymentFlow,
} from "../../types";

type Props = {
  entityType: RecordPaymentEntityType;
  flow: RecordPaymentFlow;
};

const defaultPagination: PaginationState = {
  activePage: 1,
  rowsPerPage: 10,
  startSlNo: 1,
  endSlNo: 10,
  totalRecords: 0,
};

const Users = ({ entityType, flow }: Props) => {
  const { register, getValues } = useForm({
    defaultValues: { search: "" },
  });
  const searchField = register("search");

  const { setValue } = useFormContext();
  const entity = useWatch({ name: "entity" });

  const [data, setData] = useState<RecordPaymentEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);

  const requestIdRef = useRef(0);
  // Discards outstanding responses for a party the user has already moved past.
  const outstandingRequestIdRef = useRef(0);

  const paginationRef = useRef<PaginationState>({ ...defaultPagination });

  const applyFilter = async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setData([]);

    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };

    try {
      const params = prepareParams(
        entityType,
        getValues(),
        paginationRef.current
      );
      const [response, count] = await Promise.all([
        getData(entityType, params),
        getCount(entityType, params),
      ]);
      if (requestId !== requestIdRef.current) return;

      paginationRef.current = {
        ...paginationRef.current,
        totalRecords: count,
      };

      setHasMoreData(paginationRef.current.rowsPerPage === response.length);
      setData(response);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      // eslint-disable-next-line no-console
      console.error("Users applyFilter error:", error);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  const loadMore = async () => {
    const requestId = requestIdRef.current;

    paginationRef.current = {
      ...paginationRef.current,
      activePage: paginationRef.current.activePage + 1,
    };

    setLoadingMore(true);
    try {
      const params = prepareParams(
        entityType,
        getValues(),
        paginationRef.current
      );
      const response = await getData(entityType, params);
      if (requestId !== requestIdRef.current) return;

      setHasMoreData(paginationRef.current.rowsPerPage === response.length);
      setData((prev) => [...prev, ...response]);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      // eslint-disable-next-line no-console
      console.error("Users loadMore error:", error);
    } finally {
      if (requestId === requestIdRef.current) setLoadingMore(false);
    }
  };

  const debouncedApplyFilter = useDebouncedCallback(applyFilter, 400);

  useEffect(() => {
    applyFilter();
    return () => {
      // Drop in-flight responses and any queued search when we unmount.
      requestIdRef.current++;
      debouncedApplyFilter.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  const selectEntity = (item: RecordPaymentEntity) => {
    if (entity?.value?.id === item?.value?.id) return;

    setValue("entity", item, { shouldValidate: true });
    // The amount belongs to the previously picked party — clear it so the next
    // step recomputes instead of carrying stale figures over.
    setValue("amount", undefined, { shouldValidate: true });
    setValue("outstanding", undefined, { shouldValidate: true });
  };

  const entityId = entity?.value?.id;

  useEffect(() => {
    if (!entityId) return;

    const requestId = ++outstandingRequestIdRef.current;

    const fetchOutstanding = async () => {
      setLoadingOutstanding(true);
      setValue("outstanding", undefined, { shouldValidate: true });
      try {
        const response = await AccountService.getPayablesReceiveables({
          type: flow === "in" ? "receivables" : "payables",
          partyId: entityId,
        });
        if (requestId !== outstandingRequestIdRef.current) return;
        const rows = response?.data?.data;
        const total = Array.isArray(rows)
          ? rows.reduce(
              (acc: number, curr: any) =>
                acc + Number(curr?.outstandingAmount || 0),
              0
            )
          : 0;
        setValue("outstanding", Number(total) || 0, { shouldValidate: true });
      } catch {
        if (requestId !== outstandingRequestIdRef.current) return;
        setValue("outstanding", 0, { shouldValidate: true });
      } finally {
        if (requestId === outstandingRequestIdRef.current)
          setLoadingOutstanding(false);
      }
    };

    fetchOutstanding();

    return () => {
      outstandingRequestIdRef.current++;
    };
  }, [entityId, flow, setValue]);

  const entityLabel = getEntityTypeLabel(entityType).toLowerCase();

  return (
    <div>
      {/* Search */}
      <div className="tw:relative tw:mb-3">
        <Search
          size={16}
          className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:text-gray-400"
        />
        <input
          type="text"
          {...searchField}
          onChange={(e) => {
            searchField.onChange(e);
            debouncedApplyFilter();
          }}
          placeholder={`Search by ${entityLabel}, ref, phone…`}
          className="tw:w-full tw:rounded-md tw:border tw:border-gray-300 tw:py-2 tw:pl-9 tw:pr-3 tw:text-sm tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-teal-600"
        />
      </div>

      <PaginationSummary
        paginationConfig={paginationRef.current}
        loadingTotalRecords={loading}
        fwSize="sm"
        loadedCount={data.length}
      />

      {loading ? (
        <div className="tw:flex tw:justify-center tw:items-center tw:py-8">
          <AppSpinner />
        </div>
      ) : null}

      {!loading && !data.length ? <NoData /> : null}

      {!loading && data.length ? (
        <AppScrollArea className="tw:h-80">
          <div className="tw:divide-y tw:divide-gray-100">
            {data.map((item, index) => {
              const isSelected = entity?.value?.id === item?.value?.id;
              return (
                <div
                  key={item?.value?.id || index}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => selectEntity(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectEntity(item);
                    }
                  }}
                  className={`tw:flex tw:items-center tw:gap-3 tw:py-3 tw:px-2 tw:rounded-md tw:cursor-pointer tw:transition-colors ${
                    isSelected ? "tw:bg-teal-50" : "tw:hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`tw:w-10 tw:h-10 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-white tw:text-sm tw:font-semibold tw:shrink-0 ${
                      AVATAR_COLORS[index % AVATAR_COLORS.length]
                    }`}
                  >
                    {getInitials(item?.label)}
                  </div>

                  <div className="tw:flex-1 tw:min-w-0">
                    <div className="tw:flex tw:items-center tw:gap-2">
                      <div className="tw:text-sm tw:font-semibold tw:truncate">
                        {item?.label}
                      </div>
                      {item?.value?._vendorType ? (
                        <VendorTypeBadge
                          type={item.value._vendorType}
                          color={item.value._vendorTypeColor}
                          description={item.value._vendorTypeInfo}
                          className="tw:text-[10px]"
                          hideInfo={true}
                        />
                      ) : null}
                    </div>
                    <div className="tw:text-xs tw:text-gray-500 tw:flex tw:items-center tw:gap-3">
                      {item?.value?.refId ? (
                        <span>#{item.value.refId}</span>
                      ) : null}
                      {item?.value?.mobile ? (
                        <span className="tw:flex tw:items-center tw:gap-1">
                          <Phone size={11} className="tw:text-gray-400" />
                          {item.value.mobile}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="tw:w-5 tw:h-5 tw:rounded-full tw:bg-teal-700 tw:flex tw:items-center tw:justify-center tw:shrink-0">
                      <Check size={12} className="tw:text-white" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {hasMoreData ? (
            <div className="tw:flex tw:justify-center tw:mt-3">
              <LoadMoreButton
                loadMore={loadMore}
                loading={loadingMore}
                totalCount={paginationRef.current.totalRecords}
                loadedCount={data.length}
              />
            </div>
          ) : null}
        </AppScrollArea>
      ) : null}

      {entityId && loadingOutstanding ? (
        <div className="tw:flex tw:items-center tw:gap-2 tw:mt-2 tw:text-xs tw:text-gray-500">
          <AppSpinner size="sm" />
          Loading balance…
        </div>
      ) : null}
    </div>
  );
};

export default Users;
