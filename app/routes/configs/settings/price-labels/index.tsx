import { Printer } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppHeader from "~/components/core/header/AppHeader";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import useScreenView from "~/hooks/useScreenView";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import Filter from "./components/Filter";
import Template1 from "./components/templates/Template1";
import Template2 from "./components/templates/Template2";
import Template3 from "./components/templates/Template3";
import Template4 from "./components/templates/Template4";
import Template5 from "./components/templates/Template5";
import { getCount, getData, prepareParams } from "./helper";
import MobileNotice from "./MobileNotice";

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "Configs",
    langKey: "configs",
    redirect: { path: "/configs/settings" },
  },
  {
    label: "Price Labels",
  },
];

interface FilterRef {
  search: string;
  brand: string;
  category: string;
  dealIds: string;
}

const PriceLabelsIndex: React.FC = () => {
  const { isMobile } = useScreenView();

  const [priceLabels, setPriceLabels] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [records, setRecords] = useState({
    loading: false,
    total: 0,
  });

  const [width, setWidth] = useState(60); // mm
  const [height, setHeight] = useState(25); // mm
  const [gap, setGap] = useState(1); // mm
  const [selectedTemplate, setSelectedTemplate] = useState("template1");

  const filterRef = useRef<FilterRef>({
    search: "",
    brand: "",
    category: "",
    dealIds: "",
  });

  const paginationRef = useRef<any>({
    page: 1,
    count: 24,
  });

  useEffect(() => {
    applyFilter();
  }, []);

  useEffect(() => {
    if (selectedTemplate === "template1") {
      setWidth(60);
      setHeight(42);
    } else if (selectedTemplate === "template2") {
      setWidth(60);
      setHeight(42);
    } else if (selectedTemplate === "template3") {
      setWidth(38);
      setHeight(25);
    } else if (selectedTemplate === "template4") {
      setWidth(60);
      setHeight(42);
    } else if (selectedTemplate === "template5") {
      setWidth(60);
      setHeight(42);
    }
  }, [selectedTemplate]);

  const handleFilter = (params: { action: string; data: any }) => {
    filterRef.current = {
      ...filterRef.current,
      ...params.data,
    };
    applyFilter();
  };

  const applyFilter = async () => {
    paginationRef.current = {
      ...paginationRef.current,
      page: 1,
    };

    setIsLoading(true);
    setSelected(new Set());
    setRecords({
      loading: true,
      total: 0,
    });

    const params = prepareParams(filterRef.current, paginationRef.current);
    const response = await getData(params);

    setPriceLabels(response);
    // Select everything by default.
    setSelected(new Set(response.map((_: any, idx: number) => idx)));

    setIsLoading(false);

    const count = await getCount(params);
    setRecords({
      loading: false,
      total: count,
    });
  };

  const loadMore = async () => {
    setIsLoadingMore(true);
    paginationRef.current = {
      ...paginationRef.current,
      page: paginationRef.current.page + 1,
    };

    const prevLen = priceLabels.length;
    const wasAllSelected = selected.size === prevLen;

    const params = prepareParams(filterRef.current, paginationRef.current);
    const response = await getData(params);
    if (response) {
      setPriceLabels((prev) => [...prev, ...response]);
      // If everything was selected, keep the newly loaded items selected too.
      if (wasAllSelected) {
        setSelected((prev) => {
          const next = new Set(prev);
          for (let i = prevLen; i < prevLen + response.length; i++) {
            next.add(i);
          }
          return next;
        });
      }
    }
    setIsLoadingMore(false);
  };

  const toggleSelected = (idx: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.size === priceLabels.length
        ? new Set()
        : new Set(priceLabels.map((_, idx) => idx))
    );
  };

  const handlePrint = () => {
    if (selected.size === 0) {
      alert("Please select at least one label to print.");
      return;
    }

    const mainEl = document.querySelector("main");
    const styleContent = mainEl?.querySelector("style")?.innerHTML || "";

    // Clone the rendered grid and drop any label that isn't selected, so the
    // print job only contains the chosen items.
    const container = mainEl?.querySelector(".print-price-label-main");
    const clone = container?.cloneNode(true) as HTMLElement | undefined;
    clone?.querySelectorAll(".price-label-wrap").forEach((el) => {
      const idx = Number((el as HTMLElement).dataset.idx);
      if (!selected.has(idx)) {
        el.remove();
      }
    });
    const htmlContent = clone?.innerHTML || "";
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups for this site to print.");
      return;
    }

    // The print popup does NOT inherit the app's Tailwind stylesheet, so we
    // ship a self-contained set of rules: a page size + zero margin so the
    // sheet grid aligns with the physical labels, an explicit font-family,
    // and a fallback for the Tailwind class the Amount component uses.
    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Price Labels</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      @page { size: A4 portrait; margin: 0; }
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      html, body {
        margin: 0;
        padding: 0;
        font-family: "Open Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      .tw\\:font-serif { font-family: "Times New Roman", Times, serif; }
      ${styleContent}
    </style>
  </head>
  <body>${htmlContent}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();

    // Defer printing so the layout and fonts settle before the dialog opens;
    // closing immediately after print() can abort the job in some browsers.
    let printed = false;
    const triggerPrint = () => {
      if (printed || printWindow.closed) return;
      printed = true;
      printWindow.print();
      printWindow.close();
    };
    printWindow.onload = triggerPrint;
    setTimeout(triggerPrint, 500);
  };

  if (isMobile) {
    return <MobileNotice />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Open+Sans:wght@400;500;600;700;800&display=swap');

        .price-label {
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #000;
          -webkit-print-color-adjust: exact;
          position: relative;
          font-family: "Open Sans", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .price-label-container > div {
          page-break-inside: avoid;
        }

        .page-break {
          width: 100%;
          height: 0;
          page-break-after: always;
          break-after: page;
        }

        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          .price-label { box-shadow: none; }
        }
      `}</style>

      <AppHeader title="Price Labels" />
      <div className="app-page tw:p-4">
        <div className="app-container">
          <div>
            <AppBreadcrumbs data={breadcrumbs} />
            <div className="tw:top-15 tw:bg-white tw:z-50 tw:py-4">
              <div className="tw:flex tw:flex-col tw:gap-4">
                <div className="tw:bg-white tw:p-4 tw:rounded-xl tw:border tw:border-gray-200 tw:shadow-sm">
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-3 tw:pb-3 tw:border-b tw:border-gray-100">
                    <div className="tw:p-1.5 tw:bg-blue-50 tw:text-blue-600 tw:rounded-lg">
                      <Printer size={16} />
                    </div>
                    <span className="tw:font-semibold tw:text-gray-800">
                      Print Settings
                    </span>
                  </div>
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:mb-3 tw:text-xs tw:text-amber-700 tw:bg-amber-50 tw:border tw:border-amber-200 tw:rounded-lg tw:px-3 tw:py-2">
                    <span>
                      Note: If a product has no discount, a default price-only
                      label is used instead of the selected template.
                    </span>
                  </div>
                  <div className="tw:flex tw:flex-wrap tw:items-end tw:gap-4">
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <label className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="tw:w-24 tw:px-3 tw:py-2 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-gray-50 tw:text-sm tw:font-medium tw:text-gray-900 focus:tw:ring-2 focus:tw:ring-blue-500/20 focus:tw:border-blue-500 tw:transition-all outline-none"
                      />
                    </div>
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <label className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="tw:w-24 tw:px-3 tw:py-2 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-gray-50 tw:text-sm tw:font-medium tw:text-gray-900 focus:tw:ring-2 focus:tw:ring-blue-500/20 focus:tw:border-blue-500 tw:transition-all outline-none"
                      />
                    </div>
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <label className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide">
                        Gap (mm)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={gap}
                        onChange={(e) =>
                          setGap(Math.max(0, Number(e.target.value)))
                        }
                        className="tw:w-24 tw:px-3 tw:py-2 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-gray-50 tw:text-sm tw:font-medium tw:text-gray-900 focus:tw:ring-2 focus:tw:ring-blue-500/20 focus:tw:border-blue-500 tw:transition-all outline-none"
                      />
                    </div>
                    <div className="tw:flex tw:flex-col tw:gap-1.5">
                      <label className="tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wide">
                        Template
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="tw:w-32 tw:px-3 tw:py-2 tw:border tw:border-gray-200 tw:rounded-lg tw:bg-gray-50 tw:text-sm tw:font-medium tw:text-gray-900 focus:tw:ring-2 focus:tw:ring-blue-500/20 focus:tw:border-blue-500 tw:transition-all outline-none"
                      >
                        <option value="template1">Template 1</option>
                        <option value="template2">Template 2</option>
                        <option value="template3">Template 3</option>
                        <option value="template4">Template 4</option>
                        <option value="template5">Template 5</option>
                      </select>
                    </div>
                    <div className="tw:ml-auto">
                      <AppButton
                        onClick={handlePrint}
                        disabled={selected.size === 0}
                        className="tw:px-6"
                      >
                        <span className="tw:flex tw:items-center tw:gap-2">
                          <Printer size={16} />
                          {selected.size > 0
                            ? `Print Selected (${selected.size})`
                            : "Print Selected"}
                        </span>
                      </AppButton>
                    </div>
                  </div>
                </div>

                <Filter onFilter={handleFilter} />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-64 no-print">
              <AppSpinner className="tw:w-10 tw:h-10" />
            </div>
          ) : priceLabels.length === 0 ? (
            <div className="tw:flex tw:justify-center tw:items-center tw:h-64 no-print">
              <div className="tw:text-gray-500">No price labels found</div>
            </div>
          ) : (
            <>
              <div className="tw:flex tw:items-center tw:gap-3 tw:mb-4 no-print">
                <label className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-gray-700 tw:cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      priceLabels.length > 0 &&
                      selected.size === priceLabels.length
                    }
                    onChange={toggleSelectAll}
                    className="tw:w-4 tw:h-4 tw:cursor-pointer"
                  />
                  Select all
                </label>
                <span className="tw:text-sm tw:text-gray-500">
                  {selected.size} of {priceLabels.length} selected
                </span>
              </div>
              <div className="print-price-label-main">
                <div
                  className={`price-label-container`}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: `${gap}mm`,
                  }}
                >
                  {priceLabels.map((label, idx) => (
                    <div
                      key={idx}
                      data-idx={idx}
                      className="price-label-wrap"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <label
                        className="no-print"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(idx)}
                          onChange={() => toggleSelected(idx)}
                          style={{
                            width: "16px",
                            height: "16px",
                            cursor: "pointer",
                          }}
                        />
                        Select
                      </label>
                      <div
                        onClick={() => toggleSelected(idx)}
                        className="price-label"
                        style={{
                          width: `${width}mm`,
                          height: `${height}mm`,
                          cursor: "pointer",
                        }}
                      >
                      {selectedTemplate === "template1" && (
                        <Template1
                          name={label.name}
                          price={label.price}
                          mrp={label.mrp}
                          saving={label.saving}
                        />
                      )}
                      {selectedTemplate === "template2" && (
                        <Template2
                          name={label.name}
                          price={label.price}
                          mrp={label.mrp}
                          saving={label.saving}
                        />
                      )}
                      {selectedTemplate === "template3" && (
                        <Template3
                          name={label.name}
                          price={label.price}
                          mrp={label.mrp}
                          saving={label.saving}
                        />
                      )}
                      {selectedTemplate === "template4" && (
                        <Template4
                          name={label.name}
                          price={label.price}
                          mrp={label.mrp}
                          saving={label.saving}
                        />
                      )}
                      {selectedTemplate === "template5" && (
                        <Template5
                          name={label.name}
                          price={label.price}
                          mrp={label.mrp}
                          saving={label.saving}
                        />
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {priceLabels.length > 0 && priceLabels.length < records.total && (
            <div className="tw:flex tw:justify-center tw:mt-4 no-print">
              <LoadMoreButton
                loadMore={loadMore}
                loading={isLoadingMore}
                totalCount={records.total}
                loadedCount={priceLabels.length}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PriceLabelsIndex;
