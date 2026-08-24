import { format, isToday } from "date-fns";
import { Check, ChevronDown, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import AppButton from "~/components/core/button/AppButton";
import { AppInput, AppPincodeInput, AppSelect } from "~/components/core/form";
import SdtLocation from "~/components/core/sdt/SdtLocation";
import CommonService from "~/services/CommonService";
import { defaultFormData, getRecentBills, type RecentBill } from "../helper";

interface ZeroFormTabProps {
  /** Creates the customer; resolves true when the API accepted it. */
  onCreate: (data: Record<string, any>) => Promise<boolean>;
  submitting: boolean;
}

const WHAT_THIS_DOES = [
  "Creates the customer instantly",
  "Name auto-fills from their first bill or WhatsApp",
  "No forms, no KYC ask, no paperwork",
  "King Coins start counting from bill #1",
];

const genderOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

const billDate = (date: string | null) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return isToday(parsed) ? "today" : format(parsed, "d MMM");
};

/**
 * Route A — the mobile number is the whole customer record on day one.
 * Everything else (name, gender, address) is optional and tucked away, so the
 * counter-rush path is a single field and one tap.
 */
const ZeroFormTab = ({ onCreate, submitting }: ZeroFormTabProps) => {
  const { t } = useTranslation(["common"]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm({ defaultValues: { ...defaultFormData } });

  const [showAdditional, setShowAdditional] = useState(false);
  const [bills, setBills] = useState<RecentBill[]>([]);

  const [mobile, state, district, town] = useWatch({
    control,
    name: ["mobile", "state", "district", "town"],
  });

  // Bills already raised against this number — the history that gets
  // attributed to the customer the moment they're created.
  useEffect(() => {
    let alive = true;

    if (!CommonService.isValidMobileNo(mobile)) {
      setBills([]);
      return;
    }

    getRecentBills(mobile)
      .then((result) => {
        if (alive) setBills(result);
      })
      .catch(() => {
        if (alive) setBills([]);
      });

    return () => {
      alive = false;
    };
  }, [mobile]);

  const handleMobileChange = () => {
    setValue("mobile", getValues("mobile").replace(/[^0-9]/g, ""));
  };

  const handleNameChange = () => {
    setValue("name", getValues("name").replace(/[^A-Za-z\s]/g, ""));
  };

  const handleLocationChange = ({
    action,
    data,
  }: {
    action: string;
    data: any;
  }) => {
    if (action === "state_change") {
      setValue("state", data.state);
      setValue("district", data.district);
      setValue("town", data.town);
    } else if (action === "district_change") {
      setValue("district", data.district);
      setValue("town", data.town);
    } else if (action === "town_change") {
      setValue("town", data.town);
    }
  };

  const submit = async () => {
    const created = await onCreate(getValues());
    if (created) {
      reset({ ...defaultFormData });
      setBills([]);
      setShowAdditional(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="tw:space-y-4">
      <div className="tw:overflow-hidden tw:rounded-xl tw:bg-white tw:ring-1 tw:ring-slate-100">
        <div className="tw:flex tw:items-center tw:gap-3 tw:px-5 tw:pt-5">
          <span className="tw:flex tw:size-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-primary tw:text-white">
            <Plus size={18} />
          </span>
          <div>
            <p className="tw:text-sm tw:font-bold tw:text-slate-800">
              A · Zero-form
            </p>
            <p className="tw:text-xs tw:text-slate-500">
              Type mobile. That&rsquo;s the whole customer.
            </p>
          </div>
        </div>

        <div className="tw:p-5">
          <p
            className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Mobile number
          </p>

          <AppInput
            name="mobile"
            type="tel"
            maxLength={10}
            autoFocus
            placeholder="98456 12034"
            register={register}
            onChange={handleMobileChange}
            error={errors.mobile?.message}
            className="tw:mt-2"
            leftIcon={
              <span className="tw:text-base tw:font-medium tw:text-slate-400">
                +91
              </span>
            }
            inputClassName="tw:h-auto tw:rounded-xl tw:border-2 tw:border-primary tw:py-3.5 tw:pl-14 tw:text-xl tw:font-bold tw:tracking-wide tw:text-slate-800 tw:placeholder:font-normal tw:placeholder:text-slate-300"
          />

          <div className="tw:mt-4 tw:rounded-xl tw:bg-slate-50 tw:p-4">
            <p
              className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              What this does
            </p>
            <ul className="tw:mt-2 tw:space-y-1.5">
              {WHAT_THIS_DOES.map((line) => (
                <li
                  key={line}
                  className="tw:flex tw:gap-2 tw:text-sm tw:text-slate-600"
                >
                  <span className="tw:text-slate-300">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          {bills.length > 0 ? (
            <div className="tw:mt-4">
              <p
                className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-widest tw:text-slate-400"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Matches from recent bills
              </p>
              <div className="tw:mt-2 tw:overflow-hidden tw:rounded-xl tw:ring-1 tw:ring-slate-100">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    className="tw:flex tw:items-center tw:gap-3 tw:border-b tw:border-slate-100 tw:px-3 tw:py-2.5 tw:last:border-b-0"
                  >
                    <span className="tw:flex tw:size-7 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:bg-emerald-50 tw:text-emerald-600">
                      <Check size={14} />
                    </span>
                    <span className="tw:min-w-0 tw:flex-1">
                      <span className="tw:block tw:truncate tw:text-sm tw:font-semibold tw:text-slate-800">
                        {bill.billNo ? `Bill ${bill.billNo}` : "Bill"}
                        {billDate(bill.date) ? ` · ${billDate(bill.date)}` : ""}
                      </span>
                      <span className="tw:block tw:text-xs tw:text-slate-500">
                        ₹{bill.amount.toLocaleString("en-IN")}
                        {bill.itemCount ? ` · ${bill.itemCount} items` : ""}
                      </span>
                    </span>
                  </div>
                ))}
                <p className="tw:bg-slate-50 tw:px-3 tw:py-2.5 tw:text-xs tw:text-slate-500">
                  <span className="tw:font-semibold tw:text-slate-700">
                    {bills.length} past{" "}
                    {bills.length === 1 ? "bill" : "bills"}
                  </span>{" "}
                  will be attributed to this customer
                </p>
              </div>
            </div>
          ) : null}

          {/* Everything below is optional — the counter path never opens it. */}
          <div className="tw:mt-4 tw:overflow-hidden tw:rounded-xl tw:ring-1 tw:ring-slate-100">
            <button
              type="button"
              onClick={() => setShowAdditional(!showAdditional)}
              className="tw:flex tw:w-full tw:cursor-pointer tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:text-left tw:transition-colors tw:hover:bg-slate-50"
            >
              <span className="tw:flex tw:items-center tw:gap-3">
                <span className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-lg tw:bg-slate-100 tw:text-slate-500">
                  <MapPin size={16} />
                </span>
                <span>
                  <span className="tw:block tw:text-sm tw:font-semibold tw:text-slate-800">
                    {t("additionalInfo")}{" "}
                    <span className="tw:text-xs tw:font-normal tw:text-slate-400">
                      ({t("optional")})
                    </span>
                  </span>
                  <span className="tw:block tw:text-xs tw:text-slate-500">
                    {t("addEmailAndLocationDetails")}
                  </span>
                </span>
              </span>
              <ChevronDown
                size={18}
                className={`tw:shrink-0 tw:text-slate-400 tw:transition-transform ${
                  showAdditional ? "tw:rotate-180" : ""
                }`}
              />
            </button>

            {showAdditional ? (
              <div className="tw:grid tw:grid-cols-1 tw:gap-5 tw:border-t tw:border-slate-100 tw:p-4 tw:md:grid-cols-2">
                <AppInput
                  label="Name"
                  name="name"
                  type="text"
                  placeholder="Enter customer name"
                  register={register}
                  onChange={handleNameChange}
                  className="tw:w-full"
                  error={errors.name?.message}
                  maxLength={50}
                />

                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      label="Gender"
                      options={genderOptions}
                      placeholder="Select gender"
                      onChange={field.onChange}
                      value={field.value}
                      inputClassName="tw:w-full"
                      error={errors.gender?.message}
                    />
                  )}
                />

                <AppPincodeInput
                  label="Pincode"
                  name="pincode"
                  placeholder="Enter pincode"
                  register={register}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    setValue("pincode", event.target.value)
                  }
                  onPincodeSelect={({ data }) => {
                    if (!data) return;
                    if (data.state) setValue("state", data.state);
                    if (data.district) setValue("district", data.district);
                    if (data.city) setValue("town", data.city);
                  }}
                  className="tw:w-full"
                  error={errors.pincode?.message}
                />

                <SdtLocation
                  state={state}
                  district={district}
                  town={town}
                  callback={handleLocationChange}
                />

                <AppInput
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  register={register}
                  className="tw:w-full"
                  error={errors.email?.message}
                />
              </div>
            ) : null}
          </div>

          <AppButton
            type="submit"
            color="primary"
            size="large"
            expand="block"
            isLoading={submitting}
            disabled={submitting}
            className="tw:mt-5 tw:w-full"
          >
            <Check size={18} />
            Create · start earning coins
          </AppButton>
        </div>
      </div>
    </form>
  );
};

export default ZeroFormTab;
