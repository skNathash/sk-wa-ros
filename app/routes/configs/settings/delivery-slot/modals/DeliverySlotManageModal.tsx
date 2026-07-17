import { format, set } from "date-fns";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppCard from "~/components/core/card/AppCard";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppSelect } from "~/components/core/form";
import AppModal from "~/components/core/modal/AppModal";
import AppAlertDialog from "~/components/core/alert-dialog/AppAlertDialog";
import useAppToast from "~/hooks/useAppToast";
import AuthService from "~/services/AuthService";
import PosService from "~/services/PosService";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import BusyLoader from "~/components/core/busyloader/Busyloader";
import { Clock, Info } from "lucide-react";

type Props = {
  show: boolean;
  callback: (a: { action: "submit" | "close"; data?: any }) => void;
  data: {
    selectedDate: Date;
    slabs: Array<any>;
    mode: "add" | "edit";
    slabEditIndex: number;
    startTime: Date;
  };
  isDefaultConfig?: boolean;
};

type FormData = {
  feePerOrder: number;
  from: number;
  to: number | null;
  isActive: boolean;
  order: number;
  specialFee: number;
};

const DeliverySlotManageModal = ({
  show,
  callback,
  data,
  isDefaultConfig = false,
}: Props) => {
  const { t } = useTranslation(["common"]);
  const { register, setValue, getValues, control, reset } = useForm<FormData>({
    defaultValues: {
      feePerOrder: 0,
      from: 0,
      to: 0,
      isActive: true,
      order: 10,
      specialFee: 0,
    },
  });

  const appToast = useAppToast();

  // AppAlertDialog state
  const [appAlertDialog, setAppAlertDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    successCb: () => void;
    cancelCb: () => void;
  }>({
    show: false,
    title: "",
    description: "",
    successCb: () => {},
    cancelCb: () => {},
  });

  const [fromTimes, setFromTimes] = useState<any[]>(getTimes(5));
  const [toTimes, setToTimes] = useState<any[]>([]);
  const [showRemove, setShowRemove] = useState(false);

  const [busyLoader, setBusyLoader] = useState({
    show: false,
    msg: "",
  });

  useEffect(() => {
    if (show) {
      reset();

      const fromTime = format(new Date(data.selectedDate), "H:mm");
      let fromHour = Number(fromTime.split(":")[0]);
      const fromMinute = Number(fromTime.split(":")[1]) || 0;
      if (fromMinute) {
        fromHour += fromMinute / 100;
      }
      setFromTimes(getTimes(fromHour));

      if (data.mode == "edit") {
        setShowRemove(true);
        const f = data.slabs[data.slabEditIndex] || {};
        if (Object.keys(f).length > 0) {
          setFromTimes(getTimes(Number(f.from)));
          setValue("from", f.from);
          setValue("order", f.ordersLimit ?? 10);
          setValue("to", f.to);
        }
      } else {
        setValue("from", Number(fromHour));
      }
      // If there's no 'to' value present when modal opens, update it
      // from the generated `toTimes`. Otherwise preserve existing 'to'.
      const hasTo = !!getValues("to");
      handleFromChange(!hasTo);
    }
  }, [show, data]);

  const onClose = () => {
    callback({ action: "close" });
  };

  const doProcess = async (action: string) => {
    const f = getValues();
    setBusyLoader({
      show: true,
      msg: t("pleaseWait"),
    });

    const params = {
      filter: {
        franchiseId: AuthService.getLoggedInUserId(),
        date: {
          $gte: set(data.selectedDate, {
            hours: 0,
            minutes: 0,
            seconds: 0,
          }),
          $lte: set(data.selectedDate, {
            hours: 23,
            minutes: 59,
            seconds: 59,
          }),
        },
      },
    };

    const res = await PosService.getDeliveryTimeSlot(params);

    const slotData = {
      from: 1 * f.from,
      to: 1 * (f.to || 0),
      isActive: true,
      ordersLimit: f.order,
      // specialFee: 1 * f.specialFee,
    };

    const d =
      Array.isArray(res.data?.data) && res.data.data.length > 0
        ? res.data.data[0]
        : {};

    let s: any = (d.slab || []).map((x: any) => ({
      from: x.from,
      to: x.to,
      isActive: true,
      ordersLimit: x.ordersLimit,
    }));

    if (action == "remove") {
      s = [...data.slabs];
      s.splice(data.slabEditIndex, 1);
    } else if (data.mode == "edit" && data.slabEditIndex != -1) {
      s[data.slabEditIndex] = slotData;
    } else {
      s = s.concat(slotData);
    }

    const paylaod = {
      feePerOrder: 1 * f.feePerOrder,
      // franchiseId: AuthService.getLoggedInUserId(),
      date: format(data.selectedDate, "yyyy-MM-dd"),
      slab: s,
    };

    let updateRes;
    if (Array.isArray(res.data?.data) && res.data.data.length > 0) {
      updateRes = await PosService.updateDeliveryTimeSlot(d._id, paylaod);
    } else {
      updateRes = await PosService.createDeliveryTimeSlot(paylaod);
    }

    setBusyLoader({
      show: false,
      msg: "",
    });

    if (updateRes.statusCode == 200 || updateRes.statusCode == 201) {
      const t = setTimeout(() => {
        callback({ action: "submit" });
        clearTimeout(t);
      }, 300);
    } else {
      appToast.show({
        msg: updateRes.data?.message || t("failedPleaseTryAgain"),
        color: "danger",
      });
    }
  };

  const removeSlot = () => {
    setAppAlertDialog({
      show: true,
      title: t("pleaseConfirm"),
      description: t("doYouWantToRemoveThisSlot"),
      successCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
        doProcess("remove");
      },
      cancelCb: () => {
        setAppAlertDialog((prev) => ({ ...prev, show: false }));
      },
    });
  };

  const validate = () => {
    const f = getValues();

    let msg = "";

    const from = 1 * f.from;

    const to = 1 * (f.to || 0);

    const slabs = data.slabs || [];

    const editIndex = data.slabEditIndex;

    if (!f.from) {
      msg = t("pleaseChooseFromTime");
    } else if (!f.to) {
      msg = t("pleaseChooseToTime");
    } else if (f.from == f.to) {
      msg = t("fromTimeAndToTimeShouldBeDifferent");
    } else if (!f.order) {
      msg = t("pleaseProvideOrderLimit");
    } else {
      msg = "";
    }

    if (checkOverlaps(slabs, { ...f, to: to || 0 }, editIndex)) {
      msg = t("givenTimeSlotAlreadyExists");
    }

    if (!msg) {
      let s = [...slabs];
      if (editIndex && editIndex != -1) {
        s[editIndex] = { ...(s[editIndex] || {}), from: from, to: to };
      } else {
        s.push({ from, to });
      }
    }

    return {
      msg,
      status: msg ? false : true,
    };
  };

  const checkOverlaps = (
    intervals: Array<any> = [],
    inp: { from: number; to: number; order: number },
    editIndex = -1
  ) => {
    if (editIndex !== -1) {
      const currentSlot = intervals[editIndex];
      if (
        currentSlot &&
        currentSlot.from === inp.from &&
        currentSlot.to === inp.to
      ) {
        return false;
      }
    }

    return intervals.some((slot, index) => {
      if (index === editIndex) {
        return false;
      }
      return (
        (inp.from >= slot.from && inp.from < slot.to) ||
        (inp.to > slot.from && inp.to <= slot.to) ||
        (inp.from <= slot.from && inp.to >= slot.to)
      );
    });
  };

  const handleFromChange = (updateTo = true) => {
    const from = Number(getValues("from"));
    let nxt: number;

    if (from % 1 === 0) {
      nxt = from + 0.5;
    } else {
      nxt = Math.ceil(from);
    }

    const toTimes = getTimes(nxt, 24);
    setToTimes(toTimes);
    if (updateTo) {
      if (toTimes.length > 0) {
        setValue("to", toTimes[0].value);
      } else {
        setValue("to", null);
      }
    }
  };

  const handleOrderChange = () => {
    const order = getValues("order");
    setValue("order", Math.floor(order < 1 ? 1 : order));
  };

  const handleSubmit = () => {
    const v = validate();
    if (v.status) {
      doProcess("add");
    } else {
      appToast.show({ msg: v.msg, color: "danger" });
    }
  };

  return (
    <>
      <AppModal show={show} callback={onClose} className="offcanvas-modal">
        <AppModal.Title onClose={onClose} noShadow>
          <div className="tw:font-semibold">{t("deliverySlotManage")}</div>
        </AppModal.Title>
        <AppModal.Content>
          {!isDefaultConfig && (
            <InfoBlock shadow size="sm" className="tw:mb-4" variant="info">
              <div className="tw:flex tw:gap-3">
                <div className="tw:flex-shrink-0">
                  <Clock size={20} className="tw:text-blue-500" />
                </div>
                <div className="tw:flex-1">
                  <div className="tw:font-semibold tw:mb-1">
                    {t("deliverySlotConfiguration")}
                  </div>
                  <div className="tw:text-gray-700 tw:text-xs">
                    {t("configureDeliveryTimeSlotsFor")}{" "}
                    <span className="tw:font-medium">
                      {format(data.selectedDate, "dd MMM yyyy")}
                    </span>
                    . {t("setTimeRangesAndOrderLimits")}
                  </div>
                </div>
              </div>
            </InfoBlock>
          )}
          <AppCard>
            <div className="tw:grid tw:grid-cols-2 tw:gap-4 tw:mb-8">
              <Controller
                control={control}
                name="from"
                render={({ field }) => (
                  <AppSelect
                    label={t("from")}
                    options={fromTimes}
                    onChange={(value) => {
                      field.onChange(value);
                      handleFromChange(true);
                    }}
                    isRequired={true}
                    inputClassName="tw:w-full"
                    value={field.value?.toString() || ""}
                  />
                )}
              />

              <Controller
                control={control}
                name="to"
                render={({ field }) => (
                  <AppSelect
                    label={t("to")}
                    options={toTimes}
                    onChange={field.onChange}
                    isRequired={true}
                    value={field.value?.toString() || ""}
                    inputClassName="tw:w-full"
                  />
                )}
              />

              <AppInput
                name="order"
                register={register}
                label={t("orderLimit")}
                type="number"
                maxLength={1000}
                placeholder={t("orderLimit")}
                onChange={handleOrderChange}
                isRequired={true}
              />
            </div>

            <div className="tw:flex tw:justify-between tw:gap-2">
              <div>
                {showRemove && (
                  <AppButton color="danger" fill="outline" onClick={removeSlot}>
                    {t("remove")}
                  </AppButton>
                )}
              </div>
              <div className="tw:flex tw:gap-2">
                <AppButton fill="outline" onClick={onClose} color="light">
                  {t("close")}
                </AppButton>
                <AppButton onClick={handleSubmit} color="dark">
                  {t("submit")}
                </AppButton>
              </div>
            </div>
          </AppCard>
        </AppModal.Content>
      </AppModal>
      <BusyLoader show={busyLoader.show} />
      <AppAlertDialog
        show={appAlertDialog.show}
        title={appAlertDialog.title}
        description={appAlertDialog.description}
        onConfirm={appAlertDialog.successCb}
        onCancel={appAlertDialog.cancelCb}
      />
    </>
  );
};

const getTimes = (start: number, max = 23) => {
  let t: any = [];
  let dt = new Date();

  if (start % 1 != 0) {
    start = Math.floor(start) + 0.5;
  }

  for (let i = start; i <= max; i += 0.5) {
    let minVal = 0;
    if (i % 1 != 0) {
      minVal = 0.3;
    }
    t.push({
      label: format(set(dt, { hours: i, minutes: minVal * 100 }), "hh:mm a"),
      value: Math.floor(i) + minVal,
    });
  }
  return t;
};

export default DeliverySlotManageModal;
