import React, { useEffect, useState } from "react";
import useScreenView from "~/hooks/useScreenView";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView";
import { getData, type ShapesVsTableData } from "./helper";

const CompareShapesVsTable: React.FC = () => {
  const { isMobile } = useScreenView();

  const [data, setData] = useState<ShapesVsTableData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchRows = async () => {
      setLoading(true);
      try {
        const result = await getData();
        if (active) setData(result);
      } catch (error) {
        console.error("Error fetching plan perks:", error);
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRows();

    return () => {
      active = false;
    };
  }, []);

  if (!loading && !data?.rows.length) return null;

  return isMobile ? (
    <MobileView data={data} loading={loading} />
  ) : (
    <DesktopView data={data} loading={loading} />
  );
};

export default CompareShapesVsTable;
