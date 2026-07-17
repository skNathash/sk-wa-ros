import debounce from "lodash/debounce";
import { ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput } from "~/components/core/form/AppInput";
import AppModal from "~/components/core/modal/AppModal";
import NoData from "~/components/core/no-data/NoData";
import AccountService from "~/services/AccountService";
import type { PaginationState } from "~/types/CommonTypes";

// Unique type names to avoid conflicts
type BankListModalBank = {
  id?: string | number;
  name?: string;
  [key: string]: any;
};

type BankListModalFilter = {
  search: string;
  type?: string;
};

// Filter and pagination refs
const filterRef: BankListModalFilter = {
  search: "",
};
const paginationRef: PaginationState = {
  activePage: 1,
  rowsPerPage: 50,
  totalRecords: 0,
  startSlNo: 1,
  endSlNo: 50,
};

// Prepare filter params (simple for banks)
const prepareFilterParams = (
  filter: BankListModalFilter,
  pagination: PaginationState
) => {
  const params: any = {
    page: pagination.activePage,
    count: pagination.rowsPerPage,
    sort: { name: 1 },
    filter: {},
  };

  if (filter.type === "skBank") {
    params.filter.skBank = true;
  }

  if (filter.search) {
    params.filter.name = { $regex: filter.search, $options: "i" };
  }

  if (Object.keys(params.filter).length === 0) {
    delete params.filter;
  }

  return params;
};

// Get data from API
const getData = async (params: any): Promise<BankListModalBank[]> => {
  const r = await AccountService.getBanks(params);
  return Array.isArray(r.data) ? r.data : [];
};

interface BankListModalProps {
  show: boolean;
  callback: (payload: { action: string; data?: any }) => void;
  type?: "skBank" | "all";
}

const BankListModal: React.FC<BankListModalProps> = ({
  show,
  callback,
  type = "all",
}) => {
  const [banks, setBanks] = useState<BankListModalBank[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const filterRef = useRef<BankListModalFilter>({
    search: "",
    type,
  });

  // React Hook Form for search input
  const { register, getValues } = useForm<{ search: string }>({
    defaultValues: { search: "" },
  });

  // Debounced search handler
  const onSearchChange = useCallback(
    debounce((event: React.ChangeEvent<HTMLInputElement>) => {
      const value = getValues("search");
      filterRef.current.search = value;
      applyFilter();
    }, 400),
    []
  );

  // Apply filter and fetch data
  const applyFilter = async () => {
    setIsLoading(true);
    paginationRef.activePage = 1;
    const params = prepareFilterParams(filterRef.current, paginationRef);
    const data = await getData(params);
    setBanks(data);
    setHasMore(data.length >= paginationRef.rowsPerPage);
    setIsLoading(false);
  };

  // Load more data for load more button
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    paginationRef.activePage += 1;
    const params = prepareFilterParams(filterRef.current, paginationRef);
    const data = await getData(params);
    setBanks((prev) => [...prev, ...data]);
    // Hide load more button if no data is returned or less than expected
    setHasMore(data.length >= paginationRef.rowsPerPage);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (show) {
      filterRef.current = {
        ...filterRef.current,
        type: type || "",
      };
      applyFilter();
    }
  }, [show, type]);

  const onClose = () => {
    callback({ action: "close" });
  };

  // Get title based on type
  const getTitle = () => {
    return type === "skBank" ? "SK Bank List" : "Bank List";
  };

  return (
    <AppModal show={show} callback={onClose} className="tw:h-[90vh]">
      <AppModal.Title onClose={onClose} noShadow={true}>
        {getTitle()}
      </AppModal.Title>
      <AppModal.Content className="tw:max-h-[80vh] modal-bg">
        <AppInput
          name="search"
          placeholder="Type bank name..."
          register={register}
          onChange={onSearchChange}
          className="tw:mb-4 tw:mt-2"
        />
        {isLoading ? (
          <div>Loading...</div>
        ) : banks.length === 0 ? (
          <NoData />
        ) : (
          <>
            <div className="tw:divide-y tw:divide-gray-200">
              {banks.map((bank, idx) => (
                <div
                  key={bank.id || idx}
                  className="tw:flex tw:items-center tw:justify-between tw:py-3 tw:cursor-pointer hover:tw:bg-gray-100"
                  onClick={() => {
                    callback({ action: "selected", data: bank });
                  }}
                >
                  <span className="tw:tex-sm">{bank.name}</span>
                  <ChevronRight className="tw:w-5 tw:h-5 tw:text-gray-400" />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="tw:flex tw:justify-center tw:mt-6">
                <AppButton
                  fill="outline"
                  color="light"
                  size="small"
                  onClick={loadMore}
                  isLoading={isLoadingMore}
                >
                  Load More
                </AppButton>
              </div>
            )}
          </>
        )}
      </AppModal.Content>
    </AppModal>
  );
};

export default BankListModal;
