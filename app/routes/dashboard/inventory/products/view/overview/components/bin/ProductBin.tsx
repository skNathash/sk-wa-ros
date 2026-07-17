import { Package } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PaginationState } from "~/types/CommonTypes";
import type { InventorySummary } from "./helper";
import {
  defaultInventorySummary,
  getCount,
  getData,
  prepareParam,
} from "./helper";
import ProductBinList from "./ProductBinList";
import ProductBinSummary from "./ProductBinSummary";
import ProductInventorySummary from "./ProductInventorySummary";
import ShelfLifeSummary from "./ShelfLifeSummary";
import OpenPo from "../open-po/OpenPo";
import AppCard from "~/components/core/card/AppCard";

const defaultFilter = {
  search: "",
  dealId: "",
  sellable: "",
  withStock: true,
};

const ProductBin: React.FC<{ dealId: string }> = ({ dealId }) => {
  const { t } = useTranslation(["common"]);
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalStock, setTotalStock] = useState(0);
  const [locations, setLocations] = useState(0);
  const [stockLevel, setStockLevel] = useState("");
  const [selectedStockUom, setSelectedStockUom] = useState<string | undefined>(
    undefined,
  );
  const [inventorySummary, setInventorySummary] = useState<InventorySummary>({
    ...defaultInventorySummary,
  });
  const [shelfLife, setShelfLife] = useState<{
    expired: number;
    expiresSoon: number;
    fresh: number;
  }>({ expired: 0, expiresSoon: 0, fresh: 0 });

  const filterRef = useRef<any>({ ...defaultFilter, dealId });
  const paginationRef = useRef<PaginationState>({
    activePage: 1,
    rowsPerPage: 10,
    startSlNo: 1,
    endSlNo: 10,
    totalRecords: 0,
  });

  useEffect(() => {
    filterRef.current = { ...filterRef.current, dealId };
    applyFilter();
    // eslint-disable-next-line
  }, [dealId]);

  const applyFilter = useCallback(async () => {
    paginationRef.current = {
      ...paginationRef.current,
      activePage: 1,
      startSlNo: 1,
      endSlNo: paginationRef.current.rowsPerPage,
    };
    setLoading(true);
    setBins([]);
    try {
      const params = prepareParam(filterRef.current, paginationRef.current);
      const totalRecords = await getCount(dealId, params);
      paginationRef.current.totalRecords = totalRecords;
      const binsData = await getData(dealId, params);

      setBins(binsData.locations || []);
      setSelectedStockUom(binsData.locations?.[0]?.selectedStockUom);
      setHasMoreData(
        (binsData.locations?.length || 0) >= paginationRef.current.rowsPerPage,
      );

      setInventorySummary(binsData.summary || defaultInventorySummary);

      // set shelf life summary if present
      if (binsData.shelfLifeSummary) {
        setShelfLife({
          expired: binsData.shelfLifeSummary.expired || 0,
          expiresSoon: binsData.shelfLifeSummary.expiresSoon || 0,
          fresh: binsData.shelfLifeSummary.fresh || 0,
        });
      } else {
        setShelfLife({ expired: 0, expiresSoon: 0, fresh: 0 });
      }

      // Extract summary data from API response
      if (binsData.summary) {
        setTotalStock(binsData.summary.sellableStock || 0);
        setLocations(binsData.summary.sellableLocations || 0);
      }
    } catch (error) {
      console.error("Error fetching bins data:", error);
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      paginationRef.current = {
        ...paginationRef.current,
        activePage: paginationRef.current.activePage + 1,
      };
      const params = prepareParam(filterRef.current, paginationRef.current);
      const binsData = await getData(dealId, params);
      setBins((prev) => [...prev, ...(binsData.locations || [])]);
      setHasMoreData(
        (binsData.locations?.length || 0) >= paginationRef.current.rowsPerPage,
      );
    } finally {
      setLoadingMore(false);
    }
  }, [dealId]);

  return (
    <div id="product-bin-block">
      <AppCard
        className="tw:bg-green-50"
        title={`${t("sellableStockDistribution")}`}
      >
        <ProductBinSummary
          totalStock={totalStock}
          locations={locations}
          stockLevel={stockLevel}
          selectedStockUom={selectedStockUom}
        />
      </AppCard>

      <OpenPo dealId={dealId} />

      <ShelfLifeSummary shelfLife={shelfLife} />

      <ProductBinList data={bins} dealId={dealId} />

      <ProductInventorySummary
        summary={inventorySummary}
        selectedStockUom={selectedStockUom}
      />
    </div>
  );
};

export default ProductBin;
