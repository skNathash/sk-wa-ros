import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import AppCard from "~/components/core/card/AppCard";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppBadge from "~/components/core/badge/AppBadge";
import AppLink from "~/components/core/link/AppLink";

type SocialLink = { name: string; link: string };

interface ProductOtherInfoProps {
  basic: {
    id: string;
    brand: { name: string; id: string };
    category: { name: string; id: string };
    menu: { name: string; id: string };
    status: string;
    description: string;
    hsn: string;
    gst: number;
    companyName?: string;
    sellingType?: string;
    caseQty?: number;
    innerCaseQty?: number;
    sellerSocialMediaLinks?: SocialLink[];
    youtubeLink?: SocialLink[];
    instaLink?: SocialLink[];
  };
}

const ProductOtherInfo: React.FC<ProductOtherInfoProps> = ({ basic }) => {
  const { t } = useTranslation(["common"]);
  const { id, brand, category, status, description, menu } = basic;
  const [descExpanded, setDescExpanded] = useState(false);
  const [descOverflows, setDescOverflows] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    setDescOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [description]);

  const getStatusVariant = (s?: string) => {
    switch (s?.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "danger";
      default:
        return "secondary";
    }
  };
  return (
    <AppCard title={t("itemInformation")}>
      <div className="tw:grid tw:grid-cols-2 tw:md:grid-cols-3 tw:gap-4">
        <KeyValue label={t("dealId")} size="sm">
          {id || "--"}
        </KeyValue>
        <KeyValue label={t("hsn")} size="sm">
          {basic.hsn || "--"}
        </KeyValue>
        <KeyValue label={t("gst")} size="sm">
          {basic.gst}%
        </KeyValue>
        <KeyValue label={t("brand")} size="sm">
          <AppLink asLink href={`/cms/brands/view/${brand.id}`}>
            {brand.name}
          </AppLink>
        </KeyValue>
        <KeyValue label={t("menu")} size="sm">
          {menu.name}
        </KeyValue>
        <KeyValue label={t("companyName")} size="sm">
          {basic.companyName || "--"}
        </KeyValue>
        <KeyValue label={t("category")} size="sm">
          <AppLink asLink href={`/cms/categories/view/${category.id}`}>
            {category.name}
          </AppLink>{" "}
          ({menu.name})
        </KeyValue>
        <KeyValue label={t("status")} size="sm">
          <AppBadge variant={getStatusVariant(status)}>
            {status || "--"}
          </AppBadge>
        </KeyValue>
        <div className="tw:col-span-2 tw:md:col-span-3">
          <KeyValue label={t("description")} size="sm">
            {description ? (
              <div>
                <div
                  ref={descRef}
                  className={`rich-text tw:transition-all ${
                    descExpanded ? "" : "tw:line-clamp-3"
                  }`}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
                {(descOverflows || descExpanded) && (
                  <button
                    type="button"
                    onClick={() => setDescExpanded((v) => !v)}
                    className="tw:mt-1.5 tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium tw:text-primary tw:hover:underline"
                  >
                    {descExpanded ? t("viewLess") : t("viewMore")}
                    <ChevronDown
                      size={14}
                      className={`tw:transition-transform ${
                        descExpanded ? "tw:rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            ) : (
              "--"
            )}
          </KeyValue>
        </div>
      </div>
    </AppCard>
  );
};

export default ProductOtherInfo;
