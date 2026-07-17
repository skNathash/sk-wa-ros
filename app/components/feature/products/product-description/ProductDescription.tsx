import clsx from "clsx";
import { CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import AuthService from "~/services/AuthService";

type Props = {
  products: Array<any>;
  type?: string;
  dealId?: string;
  pids?: string;
};

const prepareData = (
  products: Array<any>,
  type: string,
  dealId: string,
  pids: string,
) => {
  const p: Record<string, any> = products || {};

  p._seller = p.selectedSeller?.name || "";
  p.dealId = dealId;
  p.pids = pids;

  p.netWeight = (
    (p.csa || []).find((e: any) => e.name == "Weight") || { value: "" }
  ).value;

  const t: Array<{
    lbl: string;
    value: string | Array<string>;
    key: string;
    suffix?: string;
    ignoreType: Array<string>;
  }> = [
    {
      lbl: "Key Features",
      key: "keyFeatures",
      value: "",
      ignoreType: ["combo"],
    },
    {
      lbl: "Ingredients",
      key: "ingredients",
      value: "",
      ignoreType: ["combo"],
    },
    {
      lbl: "Packaging Type",
      key: "packagingType",
      value: "",
      ignoreType: ["combo"],
    },
    {
      lbl: "Shelf Life",
      key: "shelf_life",
      value: "",
      suffix: "days",
      ignoreType: ["combo"],
    },
    {
      lbl: "Manufacturer Details",
      key: "manufacturerDetails",
      value: "",
      ignoreType: ["combo"],
    },
    {
      lbl: "Marketed By",
      key: "marketedBy",
      value: "",
      ignoreType: ["combo"],
    },
    {
      lbl: "Country Of Origin",
      key: "originCountry",
      value: "",
      ignoreType: [],
    },
    {
      lbl: "Expiry Date",
      key: "expiryDate",
      value: "",
      ignoreType: ["combo"],
    },
    // {
    //   lbl: "Packaging Type",
    //   key: "packagingType",
    //   value: "",
    // },
    {
      lbl: "Net Weight",
      key: "netWeight",
      value: "",
      ignoreType: ["combo"],
    },
    // {
    //   lbl: "FSSAI License",
    //   key: "_franFssai",
    //   value: "",
    //   ignoreType: [],
    // },
    {
      lbl: "Seller",
      key: "_seller",
      value: "",
      ignoreType: [],
    },
    {
      lbl: "Deal ID",
      key: "dealId",
      value: "",
      ignoreType: [],
    },
    {
      lbl: "Product ID",
      key: "pids",
      value: "",
      ignoreType: [],
    },
    {
      lbl: "Description",
      key: "description",
      value: "",
      ignoreType: ["combo"],
    },
    {
      lbl: "Combo Description",
      key: "_comboDescription",
      value: "",
      ignoreType: [],
    },
    {
      lbl: "Disclaimer",
      key: "disclaimer",
      value: "",
      ignoreType: ["combo"],
    },
  ];

  t.forEach((x) => {
    // ignore the types
    if (x.ignoreType.indexOf(type) != -1) {
      x.value = "";
      return;
    }
    const v = p[x.key] || "";
    x.value = Array.isArray(v)
      ? v
      : v
        ? (v || "") + (x.suffix ? " " + x.suffix : "")
        : "";
  });

  return t.filter((x) => (Array.isArray(x.value) ? x.value.length : x.value));
};

const ProductDescription = ({
  products = [],
  type = "",
  dealId = "",
  pids = "",
}: Props) => {
  const [data, setData] = useState<Array<any>>([]);

  const [viewMoreDesc, setViewMoreDesc] = useState(true);

  // const toggleDesc = () => {
  //   setViewMoreDesc((v) => !v);
  // };

  useEffect(() => {
    setData(prepareData(products, type, dealId, pids));
  }, [products, type, dealId, pids]);

  return (
    <div>
      {data.map((x, k) => (
        <div
          key={x.key}
          className={clsx("tw:mb-2", k > 0 && !viewMoreDesc ? "tw:hidden" : "")}
        >
          <div className="tw:font-semibold tw:text-xs tw:mb-0.5">{x.lbl}</div>
          <div className="tw:text-xs">
            {x.key == "keyFeatures" ? (
              <>
                {(x.value || []).map((e: any, k1: number) => (
                  <div key={k1} className="tw:flex">
                    <div className="tw:pe-1">
                      <CheckCheck />
                    </div>
                    <div className="tw:flex-1"> {e} </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {x.key == "description" || x.key == "_comboDescription" ? (
                  <div
                    className="tw:overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: x.value }}
                  ></div>
                ) : (
                  x.value
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductDescription;
