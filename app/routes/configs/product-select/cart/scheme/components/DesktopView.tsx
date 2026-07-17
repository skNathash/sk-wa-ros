import { Trash2 } from "lucide-react";
import type { DayPickerProps } from "react-day-picker";
import { Controller, useFormContext } from "react-hook-form";
import DisplayPrice from "~/shared/products/display-price/DisplayPrice";
import AppButton from "~/components/core/button/AppButton";
import { AppDateInput, AppInput, AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import { AppTable, TableSkeletonLoader } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import DisplayProfit from "~/shared/others/components/DisplayProfit";
import type { TableHeaderItem } from "~/types/CommonTypes";
import { calculateOnOptions } from "../helper";

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
    label: "Scheme Discount",
    key: "offerDiscount",
    width: "10%",
  },
  { label: "Validity", key: "date", width: "16%" },
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
  products: any[];
};

const DesktopView = ({ callback, loading, animateApply, products }: Props) => {
  const { control, register } = useFormContext();

  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={12} />
        ) : null}
        {products.map((item: any, index: number) => (
          <AppTable.Row
            key={item.id}
            id={`item-${index}`}
            className={
              animateApply
                ? "animate__animated animate__pulse animate__infinite tw:bg-blue-50/50"
                : ""
            }
          >
            <AppTable.Cell>
              <ImgRender
                assetId={item.dealInfo?.images?.[0]}
                alt={item.dealInfo?.dealName}
                size="100x100"
                className="tw:w-10 tw:h-10"
              />
            </AppTable.Cell>
            <AppTable.Cell>
              <div className="tw:font-semibold tw:mb-1">
                <AppLink
                  asLink={true}
                  href={`/dashboard/inventory/products/view/${item.dealInfo?.dealId}`}
                  className="tw:font-medium"
                >
                  {item.dealInfo.dealName}
                </AppLink>
              </div>
              <div className="tw:flex tw:items-center tw:gap-2">
                <div className="tw:text-xs tw:text-gray-500">
                  ID: {item.dealInfo.dealRefId}
                </div>

                {/* tax */}
                <div className="tw:text-xs tw:text-gray-500">
                  Tax: {item.dealInfo.tax || 0}%
                </div>
              </div>
            </AppTable.Cell>

            <AppTable.Cell>
              <KeyValue
                label="MRP"
                horizontal
                size="xs"
                labelClassName="tw:w-1/2"
              >
                <DisplayPrice
                  price={item.dealInfo?.mrp || 0}
                  uom={item.dealInfo?.selectedStockUom}
                />
              </KeyValue>
              <KeyValue
                label="Purchase Price"
                horizontal
                size="xs"
                labelClassName="tw:w-1/2 tw:text-blue-600" // Change label color
                className="tw:my-1"
                valueClassName="tw:text-blue-600" // Change value color
              >
                <DisplayPrice
                  price={item.dealInfo?.purchasePrice || 0}
                  uom={item.dealInfo?.selectedStockUom}
                />
              </KeyValue>
              <KeyValue
                label="B2B Price"
                horizontal
                size="xs"
                labelClassName="tw:w-1/2 tw:text-green-600" // Change label color
                valueClassName="tw:text-green-600" // Change value color
              >
                <DisplayPrice
                  price={item.dealInfo?.b2bPrice || 0}
                  uom={item.dealInfo?.selectedStockUom}
                />
              </KeyValue>
            </AppTable.Cell>

            <AppTable.Cell>
              <div className="tw:flex tw:flex-col tw:gap-2">
                <AppInput
                  name={`products.${index}.formData.offerDiscount`}
                  register={register}
                  type="number"
                  placeholder="Enter"
                  size="sm"
                  onChange={(e) => {
                    callback({
                      action: "fieldUpdate",
                      data: {
                        key: "offerDiscount",
                        index,
                      },
                    });
                  }}
                  rightIcon={"%"}
                />

                <div>
                  <Controller
                    control={control}
                    name={`products.${index}.formData.calculateOn`}
                    render={({ field }) => (
                      <AppSelect
                        options={calculateOnOptions}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          callback({
                            action: "fieldUpdate",
                            data: { key: "calculateOn", index },
                          });
                        }}
                        size="sm"
                        inputClassName="tw:w-full"
                      />
                    )}
                  />
                </div>
                <div className="tw:text-[10px] tw:flex tw:items-center tw:gap-1 tw:justify-between">
                  <div className="tw:flex tw:items-center tw:gap-1">
                    <span className="tw:text-gray-500">Scheme Price: </span>
                    <span className="tw:text-primary tw:font-bold">
                      <DisplayPrice
                        price={item.formData?.schemePrice || 0}
                        uom={item.dealInfo?.selectedStockUom}
                      />
                    </span>
                  </div>
                  {item.formData?.schemePrice > 0 && (
                    <div className="tw:flex tw:items-center tw:gap-1">
                      <span className="tw:text-gray-500">Profit: </span>
                      <DisplayProfit
                        price={item.dealInfo?.purchasePrice || 0}
                        offerPrice={item.formData?.schemePrice || 0}
                        className="tw:font-bold"
                      />
                    </div>
                  )}
                </div>
              </div>
            </AppTable.Cell>
            <AppTable.Cell>
              <div className="tw:flex tw:flex-col tw:gap-2">
                <Controller
                  control={control}
                  name={`products.${index}.formData.offerStartDate`}
                  render={({ field }) => (
                    <AppDateInput
                      callback={(e) => {
                        field.onChange(e);
                        callback({
                          action: "fieldUpdate",
                          data: {
                            key: "offerStartDate",
                            index,
                          },
                        });
                      }}
                      value={field.value}
                      placeholder="From Date"
                      className="tw:w-full"
                      isRequired
                      size="sm"
                      dateConfig={startDateConfig}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`products.${index}.formData.offerEndDate`}
                  render={({ field }) => (
                    <AppDateInput
                      callback={field.onChange}
                      value={field.value}
                      placeholder="To Date"
                      className="tw:w-full tw:mb-6"
                      isRequired
                      size="sm"
                      dateConfig={{
                        defaultMonth: item.formData?.offerStartDate || today,
                        startMonth: item.formData?.offerStartDate || today,
                        disabled: {
                          before: item.formData?.offerStartDate || today,
                        },
                      }}
                    />
                  )}
                />
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
                    data: { itemId: item._id, index },
                  });
                }}
              >
                <Trash2 size={16} />
              </AppButton>
            </AppTable.Cell>
          </AppTable.Row>
        ))}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
