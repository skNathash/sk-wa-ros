import { InfoIcon, Package, Search } from "lucide-react";
import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import Amount from "~/components/core/amount/Amount";
import AppBadge from "~/components/core/badge/AppBadge";
import { AppInput } from "~/components/core/form/AppInput";
import AppSelect from "~/components/core/form/AppSelect";
import KeyValue from "~/components/core/key-value/KeyValue";
import AppLink from "~/components/core/link/AppLink";
import AppPopover from "~/components/core/popover/AppPopover";
import RecentPurchasePopover from "~/shared/vendor/popovers/recent-purchase/RecentPurchasePopover";
import ReceivedDetails from "./ReceivedDetails";
import Summary from "./Summary";

interface ProductsTabProps {
  items: any[];
  callback: (data: { action: string; data: any }) => void;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "received", label: "Received" },
  { value: "not_received", label: "Not Received" },
];

const Products: React.FC<ProductsTabProps> = ({ items }) => {
  const { control, register } = useForm<{
    search: string;
    status: string;
  }>({
    defaultValues: { search: "", status: "all" },
  });
  const [search, status] = useWatch({ control, name: ["search", "status"] });

  const filteredItems = useMemo(() => {
    const searchText = (search || "").toLowerCase().trim();
    const selStatus = status || "all";

    const matchesSearch = (it: any) => {
      if (!searchText) return true;
      return (
        String(it.dealName || "")
          .toLowerCase()
          .includes(searchText) ||
        String(it.dealRefId || "")
          .toLowerCase()
          .includes(searchText)
      );
    };

    const isReceived = (it: any) =>
      it?.status === "Completed" || it?.status === "Partially Received";

    const matchesStatus = (it: any) => {
      if (selStatus === "all") return true;
      if (selStatus === "received") return isReceived(it);
      if (selStatus === "not_received") return !isReceived(it);
      return true;
    };

    return (items || []).filter((it) => matchesSearch(it) && matchesStatus(it));
  }, [items, search, status]);

  const summary = useMemo(() => {
    const isReceived = (it: any) =>
      it?.status === "Completed" || it?.status === "Partially Received";

    const totalProducts = filteredItems.length;
    const totalUnits = filteredItems.reduce(
      (sum, it) => sum + Number(it.quantity || 0),
      0,
    );

    const receivedItems = filteredItems.filter((it) => isReceived(it));
    const receivedProducts = receivedItems.length;
    const receivedUnits = receivedItems.reduce(
      (sum, it) => sum + Number(it.receivedQuantity || 0),
      0,
    );

    const notReceivedItems = filteredItems.filter((it) =>
      ["Partially Received", "Approved", "Pending"].includes(it.status),
    );
    const notReceivedProducts = notReceivedItems.length;
    const notReceivedUnits = notReceivedItems.reduce(
      (sum, it) =>
        sum + (Number(it.quantity || 0) - Number(it.receivedQuantity || 0)),
      0,
    );

    return {
      total: { products: totalProducts, units: totalUnits },
      received: { products: receivedProducts, units: receivedUnits },
      notReceived: { products: notReceivedProducts, units: notReceivedUnits },
    };
  }, [filteredItems]);

  return (
    <div className="tw:overflow-hidden tw:rounded-xl tw:bg-white">
      {/* Search + status — `app-search-field` beats theme-2's forced white input bg */}
      <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-stretch tw:gap-2 tw:border-b tw:border-slate-100 tw:px-3 tw:py-3 tw:sm:items-center tw:md:px-4">
        <AppInput
          name="search"
          placeholder="Search products by name or ID"
          register={register}
          size="sm"
          inputClassName="tw:w-full tw:border-0 tw:shadow-none tw:bg-gray-100! tw:focus-visible:ring-0 tw:focus-visible:border-transparent"
          className="tw:w-full tw:sm:flex-1"
          leftIcon={<Search className="tw:h-4 tw:w-4 tw:text-slate-400" />}
        />

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <AppSelect
              options={statusOptions}
              value={field.value}
              onChange={field.onChange}
              placeholder="Select status"
              size="sm"
              className="tw:w-full tw:sm:w-28 tw:shrink-0"
              inputClassName="tw:w-full tw:border-slate-200 tw:bg-white tw:shadow-none tw:h-8 tw:text-sm"
            />
          )}
        />
      </div>

      <Summary
        totalProducts={summary.total.products}
        totalUnits={summary.total.units}
        receivedProducts={summary.received.products}
        receivedUnits={summary.received.units}
        notReceivedProducts={summary.notReceived.products}
        notReceivedUnits={summary.notReceived.units}
      />

      {/* Product rows — flat, separated by hairlines */}
      {filteredItems.map((item, index) => (
        <div
          key={item.dealId}
          className={
            index < filteredItems.length - 1
              ? "tw:border-b tw:border-slate-100"
              : undefined
          }
        >
          <div className="tw:flex tw:items-start tw:gap-2.5 tw:px-3 tw:py-3 tw:md:px-4">
            <div className="tw:flex tw:h-8 tw:w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:bg-slate-100 tw:text-slate-500">
              <Package className="tw:h-4 tw:w-4" />
            </div>

            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:flex tw:items-start tw:justify-between tw:gap-2">
                <div className="tw:min-w-0">
                  <h3 className="tw:truncate tw:text-sm tw:font-semibold tw:leading-snug">
                    <AppLink
                      asLink={true}
                      href={`/dashboard/inventory/products/view/${item.dealId}`}
                      showLinkColor={true}
                      className="tw:no-underline"
                    >
                      {item.dealName}
                    </AppLink>
                  </h3>
                  <p className="tw:mt-0.5 tw:text-[11px] tw:text-slate-500">
                    ID: {item.dealRefId}
                  </p>
                </div>

                {item._statusLabel && (
                  <AppBadge
                    variant={item._statusColor}
                    size="sm"
                    className="tw:shrink-0 tw:uppercase"
                  >
                    {item._statusLabel}
                  </AppBadge>
                )}
              </div>
            </div>
          </div>

          <div className="tw:grid tw:grid-cols-2 tw:sm:grid-cols-3 tw:md:grid-cols-5 tw:gap-x-4 tw:gap-y-2.5 tw:px-3 tw:pb-3 tw:md:px-4">
            <KeyValue label="Ordered" size="xs">
              <span className="tw:font-semibold">
                {item.quantity || 0} units
              </span>
            </KeyValue>

            <KeyValue label="Invoiced Qty" size="xs">
              <span className="tw:font-semibold">
                {item.invoicedQuantity || item.invoiceQuantity || 0} units
              </span>
            </KeyValue>

            <KeyValue label="MRP" size="xs">
              <Amount
                value={item.mrp}
                decimalPlaces={0}
                className="tw:font-semibold"
              />
            </KeyValue>

            <KeyValue label="Purchase Price" size="xs">
              <div className="tw:flex tw:items-center tw:gap-1.5">
                <Amount
                  value={item.purchasePrice}
                  decimalPlaces={0}
                  className="tw:font-semibold"
                />
                <AppPopover
                  triggerContent={
                    <InfoIcon className="tw:h-3 tw:w-3 tw:text-sky-500" />
                  }
                >
                  <RecentPurchasePopover
                    productId={item._id || item.dealId}
                    limit={3}
                  />
                </AppPopover>
              </div>
            </KeyValue>

            {item.damagedQuantity > 0 && (
              <KeyValue label="Damaged" size="xs">
                <span className="tw:font-semibold tw:text-red-500">
                  {item.damagedQuantity} units
                </span>
              </KeyValue>
            )}

            <KeyValue label="Total Value" size="xs">
              <Amount
                value={item._totalValue}
                decimalPlaces={0}
                className="tw:font-semibold"
              />
            </KeyValue>
          </div>

          {(item.status === "Completed" ||
            item.status === "Partially Received") && (
            <ReceivedDetails item={item} />
          )}
        </div>
      ))}
    </div>
  );
};

export default Products;
