import React, { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import AppModal from "~/components/core/modal/AppModal";
import AppButton from "~/components/core/button/AppButton";
import AppSpinner from "~/components/core/Spinner/AppSpinner";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import { AppInput } from "~/components/core/form/AppInput";
import { AppCheckbox } from "~/components/core/form";
import OmsService from "~/services/OmsService";
import useAppToast from "~/hooks/useAppToast";
import DateFormat from "~/components/core/date/DateFormat";

interface Props {
  show: boolean;
  callback: (data: { action: string; data?: any }) => void;
  orderId?: string | number;
}

const SplitOrderCreateModal: React.FC<Props> = ({
  show,
  callback,
  orderId,
}) => {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const { show: showToast } = useAppToast();

  const [appAlertDialog, setAppAlertDialog] = useState({
    show: false,
    title: "Confirm Split",
    description:
      "Are you sure you want to create a split request for the selected items?",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const handleClose = () => callback({ action: "close" });

  const {
    register,
    control,
    handleSubmit: formHandleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    defaultValues: { items: [] },
  });

  const { fields } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (!show) return;
    if (!orderId) return;

    let mounted = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const resp = await OmsService.getSellerOrderDetail(String(orderId));
        const fetched = resp?.data?.data || null;

        if (!mounted) return;

        if (fetched && fetched.items) {
          const formatted = OmsService.formatOrderResponse([fetched]);
          const finalOrder =
            formatted && formatted.length > 0 ? formatted[0] : fetched;
          setOrder(finalOrder);

          // initialize form items for reserve items from fetched order
          const fetchedReserveItems = (finalOrder.items || []).filter(
            (i: any) => i?.isReserve || i?.isReserveOrder,
          );

          const items = fetchedReserveItems.map((it: any) => ({
            dealId: String(it.dealId || it._id || it.deal || ""),
            quantity: it.quantity || 1,
            maxQuantity: it.quantity || 0,
            dealName: it.dealName || it.name || "",
            sku: it.sku || it.dealCode || "",
            originalItem: it,
          }));

          reset({ items });
        } else {
          setOrder(fetched);
        }
      } catch (err) {
        setOrder(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      mounted = false;
    };
  }, [show, orderId]);

  // Use `fields` from react-hook-form as the source of reserve items

  const toggleSelect = (dealId: string) => {
    setSelected((prev) => ({ ...prev, [dealId]: !prev[dealId] }));
  };

  const handleQtyChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    maxQty: number,
  ) => {
    const raw = e.target.value;
    const num = Number(raw);
    if (raw === "") {
      setValue(`items.${index}.quantity`, "", { shouldValidate: true });
      return;
    }
    if (isNaN(num)) return;
    const clamped = Math.max(1, Math.min(maxQty || 1, Math.floor(num)));
    setValue(`items.${index}.quantity`, clamped, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  // Normal onSubmit handler for react-hook-form
  const onSubmit = async (data: any) => {
    const selectedItems = fields
      .map((field: any, idx: number) => ({ field, idx }))
      .filter(({ field }) => {
        const id = String(field.dealId || "");
        return id && selected[id];
      })
      .map(({ field, idx }) => {
        const qty = Number(data.items?.[idx]?.quantity || 0) || 0;
        return { ...field, quantity: qty };
      });

    if (!selectedItems || selectedItems.length === 0) {
      showToast({ msg: "Please select at least one item.", color: "error" });
      return;
    }

    setAppAlertDialog({
      show: true,
      title: "Confirm Split",
      description: `Create split request for ${selectedItems.length} item(s)?`,
      onConfirm: async () => {
        setAppAlertDialog((p) => ({ ...p, show: false }));
        await new Promise((r) => setTimeout(r, 200));
        await doSubmit(selectedItems);
      },
      onCancel: () => setAppAlertDialog((p) => ({ ...p, show: false })),
    });
  };

  const onError = (formErrs: any) => {
    showToast({ msg: "Please correct quantity errors.", color: "error" });
  };

  const doSubmit = async (items: any[]) => {
    if (!orderId) return;
    setIsSubmitting(true);

    const splitItems = items.map((it: any) => ({
      dealId:
        it.dealId ||
        it._id ||
        it.deal ||
        (it.dealDetails && it.dealDetails._id) ||
        "",
      quantity: it.quantity || it.requestedQuantity || 1,
    }));

    const expectedShipping =
      order?.deliveryTimeSlot?.date || new Date().toISOString().split("T")[0];

    try {
      const resp = await OmsService.createSplitRequest(String(orderId), {
        splitItems,
        expectedShipping,
      });

      if (resp?.statusCode === 200 || resp?.statusCode === 201) {
        showToast({
          msg: resp?.message || "Split request created.",
          color: "success",
        });
        callback({ action: "submit", data: resp });
      } else {
        showToast({
          msg: resp?.data?.message || "Failed to create split request.",
          color: "error",
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        msg: err?.message || "Error creating split request.",
        color: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count selected items
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <>
      <AppModal show={show} callback={callback} className="tw:h-[90vh]">
        <AppModal.Title onClose={handleClose}>
          Create Split Order
        </AppModal.Title>

        <AppModal.Content className="tw:h-[90vh]">
          <div>
            {loading ? (
              <div className="tw:flex tw:justify-center tw:items-center tw:h-24">
                <AppSpinner />
              </div>
            ) : !order ? (
              <div className="tw:text-center tw:py-4 tw:text-sm tw:text-gray-500">
                No order data found.
              </div>
            ) : (
              <div className="tw:flex tw:flex-col tw:gap-4">
                {/* How it works */}
                <div className="tw:p-3 tw:border tw:border-gray-200 tw:rounded">
                  <div className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-2">
                    How Split Order Works
                  </div>
                  <div className="tw:text-xs tw:text-gray-600 tw:leading-relaxed">
                    Select reserve items below. We'll send an approval request
                    to assigned buyers. Once approved, a new order will be
                    created automatically.
                  </div>
                </div>

                {/* Order Summary */}
                <div className="tw:p-3 tw:border tw:border-gray-200 tw:rounded">
                  <div className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-3">
                    Order Summary
                  </div>
                  <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:text-sm">
                    <div>
                      <div className="tw:text-xs tw:text-gray-600 tw:mb-1">
                        Order ID
                      </div>
                      <div className="tw:font-semibold tw:text-gray-900">
                        {order.orderRefNo}
                      </div>
                    </div>
                    <div>
                      <div className="tw:text-xs tw:text-gray-600 tw:mb-1">
                        Order Date
                      </div>
                      <div className="tw:font-semibold tw:text-gray-900">
                        <DateFormat value={order.orderedDate} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information Block */}
                <div className="tw:p-3 tw:border tw:border-gray-200 tw:rounded">
                  <div className="tw:text-xs tw:font-semibold tw:text-gray-900 tw:mb-3">
                    Customer Information
                  </div>
                  <div className="tw:space-y-2 tw:text-sm">
                    <div className="tw:font-semibold tw:text-gray-900">
                      {order.customerInfo?.name}
                    </div>
                    <div className="tw:flex tw:gap-4 tw:text-xs tw:text-gray-700">
                      <div>
                        <span className="tw:text-gray-600">ID:</span>{" "}
                        <span className="tw:font-medium">
                          {order.customerInfo?.refId || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="tw:text-gray-600">Mobile:</span>{" "}
                        <span className="tw:font-medium">
                          {order.customerInfo?.mobile || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="tw:text-xs tw:text-gray-600">
                      {[
                        order.customerInfo?.address?.city,
                        order.customerInfo?.address?.district,
                        order.customerInfo?.address?.state,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {order.customerInfo?.address?.pincode &&
                        ` - ${order.customerInfo.address.pincode}`}
                    </div>
                  </div>
                </div>

                {/* Items Selection Section */}

                {/* Items Selection */}
                <div>
                  <div className="tw:flex tw:items-center tw:justify-between tw:mb-3">
                    <label className="tw:text-sm tw:font-semibold tw:text-gray-900">
                      Select Items to Split
                      <span className="tw:text-xs tw:font-medium tw:text-gray-600 tw:ml-2">
                        ({selectedCount} selected)
                      </span>
                    </label>
                  </div>

                  {fields.length === 0 ? (
                    <div className="tw:flex tw:items-center tw:justify-center tw:text-gray-500 tw:text-sm tw:py-4 tw:rounded tw:border tw:border-gray-200">
                      <div className="tw:text-center">
                        <div>No reserve items available for split</div>
                      </div>
                    </div>
                  ) : (
                    <div className="tw:flex tw:flex-col tw:gap-2 tw:max-h-64 tw:overflow-y-auto">
                      {fields.map((it: any, index: number) => {
                        const id = String(it.dealId || index);
                        const qty = it.maxQuantity || it.quantity || 0;
                        const name = it.dealName || "";
                        const sku = it.sku || "N/A";

                        return (
                          <label
                            key={`${id}-${index}`}
                            className="tw:flex tw:items-start tw:gap-3 tw:border tw:border-gray-200 tw:px-3 tw:py-3 tw:rounded tw:cursor-pointer hover:tw:bg-gray-50 tw:transition-colors"
                          >
                            <AppCheckbox
                              label={<></>}
                              value={!!selected[id]}
                              onChange={(checked: boolean) =>
                                setSelected((prev) => ({
                                  ...prev,
                                  [id]: !!checked,
                                }))
                              }
                              className="tw-flex-shrink-0 tw:mt-1 tw-w-4 tw-h-4"
                              size="sm"
                            />
                            <div className="tw:flex-1 tw:min-w-0">
                              <div className="tw:font-semibold tw:text-sm tw:text-gray-900">
                                {name}
                              </div>
                              <div className="tw:flex tw:flex-wrap tw:gap-3 tw:text-xs tw:text-gray-600 tw:mt-1">
                                <span>
                                  SKU:{" "}
                                  <span className="tw:font-mono">{sku}</span>
                                </span>
                                <span>
                                  Qty:{" "}
                                  <span className="tw:font-semibold">
                                    {qty}
                                  </span>
                                </span>
                              </div>
                              {selected[id] && (
                                <div className="tw:mt-3 tw:max-w-xs">
                                  <AppInput
                                    name={`items.${index}.quantity`}
                                    label="Split Quantity"
                                    type="number"
                                    placeholder="Enter quantity"
                                    register={register}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => handleQtyChange(e, index, qty)}
                                    isRequired
                                    size="sm"
                                  />
                                </div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </AppModal.Content>

        <AppModal.Footer>
          <div className="tw:w-full tw:flex tw:justify-between tw:items-center tw:gap-3 tw:px-4 tw:pb-3">
            <div className="tw:text-xs tw:font-medium tw:text-gray-600">
              {fields.length > 0 && selectedCount > 0 ? (
                <span>
                  Ready to split {selectedCount} item
                  {selectedCount > 1 ? "s" : ""}
                </span>
              ) : (
                <span>Select items to split order</span>
              )}
            </div>
            <div className="tw:flex tw:gap-2">
              <AppButton
                color="dark"
                fill="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </AppButton>

              <AppButton
                color="primary"
                onClick={formHandleSubmit(onSubmit, onError)}
                isLoading={isSubmitting}
                disabled={fields.length === 0 || selectedCount === 0}
              >
                Submit Split
              </AppButton>
            </div>
          </div>
        </AppModal.Footer>
      </AppModal>

      <AppAlertDialog
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        show={appAlertDialog.show}
        onConfirm={appAlertDialog.onConfirm}
        onCancel={appAlertDialog.onCancel}
      />
    </>
  );
};

export default SplitOrderCreateModal;
