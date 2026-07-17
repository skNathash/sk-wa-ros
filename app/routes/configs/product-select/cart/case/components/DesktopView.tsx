import { Trash2 } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import AppButton from "~/components/core/button/AppButton";
import { AppCheckbox, AppInput, AppSelect } from "~/components/core/form";
import ImgRender from "~/components/core/img/ImgRender";
import AppLink from "~/components/core/link/AppLink";
import { AppTable } from "~/components/core/table";
import TableHeader from "~/components/core/table/TableHeader";
import TableSkeletonLoader from "~/components/core/table/TableSkeletonLoader";
import SellerCatalogService from "~/services/SellerCatalogService";
import type { TableHeaderItem } from "~/types/CommonTypes";
import AllowUnitDescPopover from "./AllowUnitDescPopover";

const headers: TableHeaderItem[] = [
  { label: "Image", key: "image", width: "8%" },
  { label: "Product Details", key: "productDetail", width: "32%" },
  { label: "Current Stock", key: "currentStock", width: "15%" },
  { label: "Sell In", key: "packageType", width: "15%" },
  { label: "Quantity", key: "packageQty", width: "20%" },
  { label: "Actions", key: "actions", width: "10%", isCentered: true },
];

const packageTypes = SellerCatalogService.getSellingTypes().map((st: any) => ({
  label: st.label,
  value: st.apiValue,
}));
packageTypes.unshift({ label: "Choose", value: "Choose" });

type Props = {
  callback: (args: { action: string; data?: any }) => void;
  loading: boolean;
  animateApply?: boolean;
  products: any[];
};

const DesktopView = ({ callback, loading, animateApply, products }: Props) => {
  const { control, setValue, register } = useFormContext();

  return (
    <AppTable>
      <AppTable.Header>
        <TableHeader headers={headers} />
      </AppTable.Header>
      <AppTable.Body>
        {loading ? (
          <TableSkeletonLoader cols={headers.length} rows={12} />
        ) : null}
        {(products || []).map((item: any, index: number) => {
          const packageTypeName = `products.${index}.formData.packageType`;
          const packageQtyName = `products.${index}.formData.packageQty`;
          const allowPackageOverrideName = `products.${index}.formData.allowPackageQtyOverride`;

          const imgAsset = item.dealInfo?.images?.[0];

          return (
            <AppTable.Row
              key={item._id || index}
              id={`item-${index}`}
              className={
                animateApply
                  ? "animate__animated animate__pulse animate__infinite tw:bg-blue-50/50"
                  : ""
              }
            >
              <AppTable.Cell className="tw:py-4">
                <ImgRender
                  assetId={imgAsset}
                  alt={item.dealInfo?.dealName}
                  size="60x60"
                  className="tw:w-14 tw:h-14 tw:object-contain tw:bg-gray-100 tw:rounded"
                />
              </AppTable.Cell>
              <AppTable.Cell className="tw:py-4">
                <div className="tw:font-semibold tw:text-sm tw:mb-2">
                  <AppLink
                    asLink={true}
                    href={`/dashboard/inventory/products/view/${item.dealInfo?.dealId}`}
                    className="tw:font-medium"
                  >
                    {item.dealInfo.dealName}
                  </AppLink>
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  ID: {item.dealInfo.dealRefId}
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-4 tw:text-center">
                <div className="tw:text-sm">
                  {item.dealInfo?.quantity ?? "-"}
                </div>
                <div className="tw:text-xs tw:text-gray-500">units</div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-4">
                <Controller
                  control={control}
                  name={packageTypeName}
                  render={({ field }) => (
                    <AppSelect
                      size="sm"
                      options={packageTypes}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        callback({
                          action: "fieldUpdate",
                          data: { key: "packageType", index },
                        });
                      }}
                      inputClassName="tw:w-full tw:mb-6"
                    />
                  )}
                />
              </AppTable.Cell>

              <AppTable.Cell className="tw:py-4">
                <div className="tw:flex tw:flex-col tw:gap-2">
                  <div className="tw:flex tw:items-center tw:gap-2">
                    <AppInput
                      name={packageQtyName}
                      register={register}
                      size="sm"
                      type="number"
                      placeholder="Qty"
                      inputClassName="tw:w-full"
                      disabled={item.formData?.packageType === "Unit"}
                      onChange={() => {
                        callback({
                          action: "fieldUpdate",
                          data: { key: "packageQty", index },
                        });
                      }}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={allowPackageOverrideName}
                    render={({ field }) => {
                      const currentType = item.formData?.packageType;
                      if (
                        !currentType ||
                        currentType === "Choose" ||
                        currentType === "Unit"
                      ) {
                        return <div className="tw:h-5"></div>;
                      }
                      return (
                        <AppCheckbox
                          label={
                            <span className="tw:text-xs tw:text-gray-600 tw:flex tw:items-center tw:gap-1">
                              Override to units
                              <AllowUnitDescPopover />
                            </span>
                          }
                          value={field.value || false}
                          onChange={field.onChange}
                          size="sm"
                        />
                      );
                    }}
                  />
                </div>
              </AppTable.Cell>

              <AppTable.Cell className="tw:text-center tw:py-4">
                <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
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
                </div>
              </AppTable.Cell>
            </AppTable.Row>
          );
        })}
      </AppTable.Body>
    </AppTable>
  );
};

export default DesktopView;
