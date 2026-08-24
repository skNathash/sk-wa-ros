import clsx from "clsx";
import { ScanLine, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppTable, TableHeader } from "~/components/core/table";
import {
  applyQtyFieldChange,
  getProductBadgeLabel,
  getProductReceiveStatus,
  getShortQty,
  type ProductReceiveStatus,
} from "./productQtyUtils";

type Props = {
  products: any[];
  onEdit: (index: number) => void;
  onScanNext?: () => void;
  onAutoCount?: () => void;
};

const statusVariant: Record<
  ProductReceiveStatus,
  "success" | "danger" | "warning"
> = {
  OK: "success",
  DAMAGED: "danger",
  SHORT: "warning",
};

const ProductsDesktopTable = ({
  products,
  onEdit,
  onScanNext,
  onAutoCount,
}: Props) => {
  const { t } = useTranslation();
  const { setValue, getValues } = useFormContext();

  const headers = [
    {
      label: `${t("item", { defaultValue: "Item" })} · ${t("mrp")}`,
      key: "item",
      width: "32%",
    },
    { label: t("ordered"), key: "ordered", width: "8%", isCentered: true },
    {
      label: t("invoiceQty"),
      key: "invoiceQty",
      width: "10%",
      isCentered: true,
    },
    {
      label: t("receivedGood", { defaultValue: "Received (Good)" }),
      key: "receivedQty",
      width: "12%",
      isCentered: true,
    },
    {
      label: `${t("damaged")} · ${t("short", { defaultValue: "Short" })}`,
      key: "damageShort",
      width: "16%",
      isCentered: true,
    },
    { label: t("status"), key: "status", width: "22%", isCentered: true },
  ];

  const updateQty = (
    index: number,
    field: "receivedQty" | "damageQty" | "shortQty",
    rawValue: string,
  ) => {
    const productsList = getValues("products") || [];
    const product = productsList[index];
    if (!product) return;

    const nextFormData = applyQtyFieldChange({
      product,
      field,
      rawValue,
    });

    setValue(`products.${index}.formData`, nextFormData, { shouldDirty: true });
    setValue(`products.${index}._scanned`, true, { shouldDirty: true });
  };

  return (
    <AppCard noPadding className="tw:overflow-hidden tw:mb-4">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-3 tw:border-b tw:border-slate-100">
        <h3 className="tw:text-sm tw:font-semibold tw:text-slate-800">
          {t("productsInThisOrder", { defaultValue: "Items in this order" })}
          <span className="tw:text-slate-400 tw:font-medium">
            {" "}
            · {products.length}
          </span>
        </h3>
        <div className="tw:flex tw:items-center tw:gap-2">
          {onScanNext && (
            <AppButton
              size="small"
              fill="outline"
              color="light"
              onClick={onScanNext}
              className="tw:font-medium tw:bg-white"
            >
              <ScanLine className="tw:w-3.5 tw:h-3.5" />
              {t("scanNextItem", { defaultValue: "Scan next item" })}
            </AppButton>
          )}
          {onAutoCount && (
            <AppButton
              size="small"
              fill="outline"
              color="light"
              onClick={onAutoCount}
              className="tw:font-medium tw:bg-white"
            >
              <Sparkles className="tw:w-3.5 tw:h-3.5" />
              {t("autoCountFromPhotos", {
                defaultValue: "Auto-count from photos",
              })}
            </AppButton>
          )}
        </div>
      </div>

      <AppTable
        size="sm"
        condensed
        fixedLayout
        container
        stickyHeader
        minWidth="960px"
        containerStyle={{ maxHeight: "calc(100vh - 320px)" }}
      >
        <AppTable.Header>
          <TableHeader headers={headers} />
        </AppTable.Header>
        <AppTable.Body>
          {products.length === 0 ? (
            <AppTable.Row>
              <AppTable.Cell
                colSpan={headers.length}
                className="tw:text-center tw:py-10 tw:text-slate-400"
              >
                {t("noProductsFoundInPurchaseOrder")}
              </AppTable.Cell>
            </AppTable.Row>
          ) : (
            products.map((product, index) => {
              const formData = product.formData || {};
              const receivedQty = Number(formData.receivedQty) || 0;
              const damageQty = Number(formData.damageQty) || 0;
              const shortQty = getShortQty(product);
              const status = getProductReceiveStatus(product);
              const badge = getProductBadgeLabel(product);
              const brand = product.brand?.name || "";
              const buyPrice = Number(formData.purchasePrice) || 0;
              const mrp = Number(formData.mrp) || 0;

              return (
                <AppTable.Row
                  key={`${product.dealId}-${index}`}
                  className={clsx(product._anim && "tw:bg-emerald-50/60")}
                >
                  <AppTable.Cell>
                    <div className="tw:flex tw:items-start tw:gap-2.5">
                      <div
                        className={clsx(
                          "tw:w-9 tw:h-9 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:text-[10px] tw:font-bold tw:shrink-0",
                          badge.tone === "own"
                            ? "tw:bg-rose-100 tw:text-rose-700"
                            : "tw:bg-orange-100 tw:text-orange-700",
                        )}
                      >
                        {badge.label}
                      </div>
                      <div className="tw:min-w-0">
                        <div className="tw:text-sm tw:font-medium tw:text-slate-800 tw:leading-snug tw:line-clamp-2">
                          {product.dealName}
                        </div>
                        <div className="tw:text-[11px] tw:text-slate-500 tw:mt-0.5 tw:truncate">
                          {[
                            brand,
                            mrp ? (
                              <span key="mrp">
                                {t("mrp")} <Amount value={mrp} decimalPlaces={0} />
                              </span>
                            ) : null,
                            buyPrice ? (
                              <span key="buy">
                                {t("buy", { defaultValue: "buy" })}{" "}
                                <Amount value={buyPrice} decimalPlaces={1} />
                              </span>
                            ) : null,
                          ]
                            .filter(Boolean)
                            .reduce<ReactNode[]>((acc, node, i) => {
                              if (i > 0) {
                                acc.push(
                                  <span
                                    key={`sep-${i}`}
                                    className="tw:mx-1 tw:text-slate-300"
                                  >
                                    ·
                                  </span>,
                                );
                              }
                              acc.push(node);
                              return acc;
                            }, [])}
                        </div>
                      </div>
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-center tw:font-medium tw:text-slate-700">
                    {product.quantity || 0}
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-center tw:font-medium tw:text-slate-700">
                    {formData.invoiceQty || 0}
                  </AppTable.Cell>

                  <AppTable.Cell className="tw:text-center">
                    <input
                      type="number"
                      min={0}
                      value={receivedQty}
                      onChange={(e) =>
                        updateQty(index, "receivedQty", e.target.value)
                      }
                      className="tw:w-16 tw:mx-auto tw:text-center tw:text-sm tw:font-medium tw:border tw:border-slate-200 tw:rounded-md tw:px-1.5 tw:py-1.5 tw:bg-white focus:tw:outline-none focus:tw:ring-2 focus:tw:ring-primary/20 focus:tw:border-primary"
                    />
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:justify-center tw:gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={damageQty}
                        onChange={(e) =>
                          updateQty(index, "damageQty", e.target.value)
                        }
                        className={clsx(
                          "tw:w-12 tw:text-center tw:text-sm tw:font-medium tw:rounded-md tw:px-1 tw:py-1.5 tw:bg-white focus:tw:outline-none focus:tw:ring-2",
                          damageQty > 0
                            ? "tw:border tw:border-red-300 tw:text-red-700 focus:tw:ring-red-100"
                            : "tw:border tw:border-slate-200 focus:tw:ring-primary/20",
                        )}
                      />
                      <input
                        type="number"
                        min={0}
                        value={shortQty}
                        onChange={(e) =>
                          updateQty(index, "shortQty", e.target.value)
                        }
                        className={clsx(
                          "tw:w-12 tw:text-center tw:text-sm tw:font-medium tw:rounded-md tw:px-1 tw:py-1.5 tw:bg-white focus:tw:outline-none focus:tw:ring-2",
                          shortQty > 0
                            ? "tw:border tw:border-amber-300 tw:text-amber-700 focus:tw:ring-amber-100"
                            : "tw:border tw:border-slate-200 focus:tw:ring-primary/20",
                        )}
                      />
                    </div>
                  </AppTable.Cell>

                  <AppTable.Cell>
                    <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
                      <AppBadge variant={statusVariant[status]} size="sm">
                        {status}
                      </AppBadge>
                      <AppButton
                        size="small"
                        fill="outline"
                        color="light"
                        onClick={() => onEdit(index)}
                        className="tw:bg-white tw:font-medium tw:text-xs"
                      >
                        {status === "DAMAGED"
                          ? t("capture", { defaultValue: "Capture" })
                          : t("edit", { defaultValue: "Edit" })}{" "}
                        →
                      </AppButton>
                    </div>
                  </AppTable.Cell>
                </AppTable.Row>
              );
            })
          )}
        </AppTable.Body>
      </AppTable>
    </AppCard>
  );
};

export default ProductsDesktopTable;
