import { Trash2 } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import {
  Controller,
  useFormContext,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import CommonService from "~/services/CommonService";
import Amount from "~/components/core/amount/Amount";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { priceModeOptions } from "../helper";

const headers: TableHeaderItem[] = [
  { label: "Image", key: "image", width: "2%" },
  {
    label: "Product Detail",
    key: "productDetail",
    width: "15%",
  },
  {
    label: "Pricing",
    key: "pricing",
    width: "15%",
  },
  {
    label: "Price",
    key: "price",
    width: "10%",
  },
  { label: "Actions", key: "actions", width: "6%", isCentered: true },
];

const today = new Date();
const startDateConfig: DayPickerProps = {
  defaultMonth: today,
  startMonth: today,
  disabled: { before: today },
};

type Props = {
  callback: (args: { action: string; data?: any }) => void;
  loading: boolean;
  animateApply?: boolean;
};

const DesktopView = ({ callback, loading, animateApply }: Props) => {
  const { control, register, setValue } = useFormContext();

  const { fields } = useFieldArray({ control, name: "products" });

  const products = useWatch({ control, name: "products" });

  const handleTypeChange = (value: any, idx: number) => {
    // Use setValue to avoid replacing the whole field during typing
    setValue(`products.${idx}.formData.type`, value as any, {
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue(`products.${idx}.formData.discount`, "", { shouldDirty: true });
    setValue(`products.${idx}.formData.price`, "", { shouldDirty: true });
    setValue(`products.${idx}.formData.profit`, 0, { shouldDirty: true });
  };

  const handlePriceChange = (evt: any, idx: number) => {
    const raw = evt?.target?.value ?? evt;
    const val = raw === "" ? "" : raw; // keep string while typing
    const item = fields[idx];
    if (!item) return;
    const purchasePrice = item?.dealInfo?.purchasePrice || 0;
    const mrp = item?.dealInfo?.mrp || 0;
    const numericPrice = val === "" ? "" : Number(val);
    if (numericPrice === "") {
      setValue(`products.${idx}.formData.price`, val as any, {
        shouldDirty: true,
      });
      setValue(`products.${idx}.formData.profit`, 0 as any, {
        shouldDirty: true,
      });
      return;
    }
    // clamp to allowed range: 0 .. mrp
    const clamped = Math.max(0, Math.min(Number(numericPrice), Number(mrp)));
    const profit = CommonService.calculateProfit(
      purchasePrice,
      Number(clamped),
    );
    const priceToSet = String(clamped);
    setValue(`products.${idx}.formData.price`, priceToSet as any, {
      shouldDirty: true,
    });
    setValue(`products.${idx}.formData.profit`, profit as any, {
      shouldDirty: true,
    });
  };

  const handleDiscountChange = (evt: any, idx: number) => {
    const raw = evt?.target?.value ?? evt;
    const discountVal = raw === "" ? "" : raw; // keep string while typing
    const item = fields[idx];
    if (!item) return;
    const mrp = item?.dealInfo?.mrp || 0;
    const purchasePrice = item?.dealInfo?.purchasePrice || 0;
    const numericDiscount = discountVal === "" ? "" : Number(discountVal);
    if (numericDiscount === "") {
      setValue(`products.${idx}.formData.discount`, discountVal as any, {
        shouldDirty: true,
      });
      setValue(`products.${idx}.formData.price`, "" as any, {
        shouldDirty: true,
      });
      setValue(`products.${idx}.formData.profit`, 0 as any, {
        shouldDirty: true,
      });
      return;
    }
    // clamp discount to allowed range: 0 .. 100
    const clampedDiscount = Math.max(0, Math.min(Number(numericDiscount), 100));
    const newPrice = CommonService.calculateDiscountedPrice(
      Number(clampedDiscount),
      mrp,
    );
    const profit = CommonService.calculateProfit(
      purchasePrice,
      Number(newPrice),
    );
    const discountToSet = String(clampedDiscount);
    setValue(`products.${idx}.formData.discount`, discountToSet as any, {
      shouldDirty: true,
    });
    setValue(`products.${idx}.formData.price`, String(newPrice) as any, {
      shouldDirty: true,
    });
    setValue(`products.${idx}.formData.profit`, profit as any, {
      shouldDirty: true,
    });
  };

  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={12} />
        ) : null}
        {fields.map((field: any, index: number) => {
          const profit = Number(products[index]?.formData?.profit || 0);
          const profitClass =
            profit > 0
              ? "tw:text-green-600"
              : profit < 0
                ? "tw:text-red-600"
                : "tw:text-gray-700";
          return (
            <AppTable.Row
              key={field.id}
              id={`item-${index}`}
              className={
                animateApply
                  ? "animate__animated animate__pulse animate__infinite tw:bg-blue-50/50"
                  : ""
              }
            >
              <AppTable.Cell>
                <ImgRender
                  assetId={products[index]?.dealInfo?.images?.[0]}
                  alt={products[index]?.dealInfo?.dealName}
                  size="100x100"
                  className="tw:w-10 tw:h-10"
                />
              </AppTable.Cell>
              <AppTable.Cell>
                <div className="tw:font-semibold tw:mb-1">
                  <AppLink
                    asLink={true}
                    href={`/dashboard/inventory/products/view/${products[index]?.dealInfo?.dealId}`}
                    className="tw:font-medium"
                  >
                    {products[index]?.dealInfo?.dealName}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  ID: {products[index]?.dealInfo?.dealRefId}
                </div>
              </AppTable.Cell>

              <AppTable.Cell>
                <KeyValue
                  label="MRP"
                  horizontal
                  size="xs"
                  labelClassName="tw:w-1/2"
                >
                  <Amount value={products[index]?.dealInfo?.mrp || 0} />
                </KeyValue>
                <KeyValue
                  label="Purchase Price"
                  horizontal
                  size="xs"
                  labelClassName="tw:w-1/2 tw:text-blue-600" // Change label color
                  className="tw:my-1"
                  valueClassName="tw:text-blue-600" // Change value color
                >
                  <Amount
                    value={products[index]?.dealInfo?.purchasePrice || 0}
                  />
                </KeyValue>

                <KeyValue
                  label="B2B Price"
                  horizontal
                  size="xs"
                  labelClassName="tw:w-1/2 tw:text-green-600" // Change label color
                  valueClassName="tw:text-green-600" // Change label color
                >
                  <Amount value={products[index]?.dealInfo?.b2bPrice || 0} />
                </KeyValue>
              </AppTable.Cell>

              <AppTable.Cell>
                <div className="tw:flex tw:flex-col tw:gap-2">
                  <div>
                    <Controller
                      control={control}
                      name={`products.${index}.formData.type`}
                      render={({ field }) => (
                        <AppSelect
                          options={priceModeOptions}
                          value={field.value}
                          onChange={(val: any) => handleTypeChange(val, index)}
                          size="sm"
                          inputClassName="tw:w-full"
                        />
                      )}
                    />
                  </div>

                  {(products[index]?.formData?.type || field.formData?.type) ===
                  "on_mrp" ? (
                    <AppInput
                      name={`products.${index}.formData.discount`}
                      register={register}
                      type="number"
                      placeholder="Enter discount %"
                      size="sm"
                      onChange={(e: any) => handleDiscountChange(e, index)}
                    />
                  ) : (
                    <AppInput
                      name={`products.${index}.formData.price`}
                      register={register}
                      type="number"
                      placeholder="Enter price"
                      size="sm"
                      onChange={(e: any) => handlePriceChange(e, index)}
                    />
                  )}

                  <div className="tw:text-[10px] tw:flex tw:items-center tw:gap-1 tw:justify-between">
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-gray-500">New B2B Price: </span>
                      <span className="tw:text-primary tw:font-bold">
                        <Amount value={products[index]?.formData?.price || 0} />
                      </span>
                    </div>
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-gray-500">Profit: </span>
                      <span className={`${profitClass} tw:font-bold`}>
                        <Amount value={profit} />
                      </span>
                    </div>
                  </div>
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center">
                <AppButton
                  fill="outline"
                  size="small"
                  color="danger"
                  onClick={() => {
                    callback({
                      action: "remove-from-cart",
                      data: { itemId: products[index]?._id, index },
                    });
                  }}
                >
                  <Trash2 size={16} />
                </AppButton>
              </AppTable.Cell>
            </AppTable.Row>
          );
        })}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
