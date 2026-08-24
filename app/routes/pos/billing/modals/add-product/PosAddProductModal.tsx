import { PackagePlus, PackageSearch } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AppButton from "~/components/core/button/AppButton";
import AppModal from "~/components/core/modal/AppModal";
import { DISCOUNT_DECIMAL_PLACES } from "~/constants";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import CommonService from "~/services/CommonService";
import FranchiseService from "~/services/FranchiseService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import PlatformFeeInfo from "~/shared/catalog/components/PlatformFeeInfo";
import PlatformFeeRequiredBlock from "~/shared/accounts/platform-fee/components/PlatformFeeRequiredBlock";

type PosAddProductModalProps = {
  show: boolean;
  /** The barcode (or name) the operator searched for and found nothing. */
  searchTerm: string;
  searchBy?: "barcode" | "name";
  /** Emits `created` with the new product's barcode and the qty to bill. */
  callback: (params: { action: string; data?: any }) => void;
};

type FormState = {
  productName: string;
  mrp: string;
  stock: string;
  purchasePrice: string;
  sellingPrice: string;
  cartQty: string;
};

// The import writes the product, its stock and its price config through
// asynchronously; hold the busy state so the grid only searches once the
// backend has all three — same settle the subscribe modal waits out.
const CREATE_SETTLE_DELAY_MS = 5000;

const EMPTY_FORM: FormState = {
  productName: "",
  mrp: "",
  stock: "",
  purchasePrice: "",
  sellingPrice: "",
  cartQty: "1",
};

/**
 * "Product not found" escape hatch for POS billing: creates the product through
 * the same seller-import endpoint the Subscribe > Add Product page uses, with
 * `autoApprove` so it lands in the seller's catalog immediately and can be
 * billed in the same breath. Nothing is looked up and nothing is pre-filled
 * from the search — the operator types every detail.
 */
type PlanState = {
  loading: boolean;
  isActive: boolean | null;
  availableAmount: number;
  planName: string;
  planType: string;
  typeOfPlan: string;
};

const EMPTY_PLAN: PlanState = {
  loading: false,
  isActive: null,
  availableAmount: 0,
  planName: "",
  planType: "",
  typeOfPlan: "",
};

const PosAddProductModal = ({
  show,
  searchTerm,
  searchBy = "barcode",
  callback,
}: PosAddProductModalProps) => {
  const appToast = useAppToast();
  const appNav = useAppNav();
  const nameRef = useRef<HTMLInputElement>(null);

  const isBarcodeSearch = searchBy === "barcode";
  // A barcode is numeric; anything else typed into the search box is a product
  // name (even if the tab still says "barcode"), so pre-fill the name field.
  const searchLooksBarcode = /^\d+$/.test(searchTerm);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [barcode, setBarcode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  // Named step of the in-flight create sequence, shown on the button.
  const [step, setStep] = useState("");
  // Creating a product here also books the stock, so it debits the platform-fee
  // plan exactly like Inventory > Add Stock does. Without an active plan — or
  // without enough purchase capacity left on it — creation is blocked here
  // rather than failing at the API after the operator has typed everything.
  const [plan, setPlan] = useState<PlanState>(EMPTY_PLAN);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  useEffect(() => {
    if (!show) return;

    // A name search pre-fills the product name; a barcode search pre-fills the
    // (optional) barcode field instead. A name typed in the default barcode tab
    // still reads as a name, not a barcode.
    setForm({
      ...EMPTY_FORM,
      productName: searchLooksBarcode ? "" : searchTerm,
    });
    setBarcode(searchLooksBarcode ? searchTerm : "");
    setError("");

    let planCancelled = false;
    const fetchPlan = async () => {
      setPlan({ ...EMPTY_PLAN, loading: true });
      try {
        const activePlan = await FranchiseService.getActivePlan();
        if (planCancelled) return;
        setPlan({
          loading: false,
          isActive: activePlan?.isPlanActive || false,
          availableAmount: Number(activePlan?.availableAmount) || 0,
          planName: activePlan?.planName || "",
          planType: activePlan?.isPercentage ? "Percentage" : "Value",
          typeOfPlan: activePlan?.typeOfPlan || "",
        });
      } catch (e) {
        if (planCancelled) return;
        setPlan({ ...EMPTY_PLAN, isActive: false });
      }
    };
    fetchPlan();

    setTimeout(() => nameRef.current?.focus(), 50);

    return () => {
      planCancelled = true;
    };
  }, [show, searchTerm, searchLooksBarcode]);

  const mrpNum = Number(form.mrp);
  const sellingNum = Number(form.sellingPrice);
  const purchaseNum = Number(form.purchasePrice);

  // The API wants both the fixed selling price and the discount it represents
  // against MRP, so the storefront can show the strike-through price.
  const discount = useMemo(() => {
    if (!(mrpNum > 0) || !(sellingNum > 0) || sellingNum > mrpNum) return 0;
    const value = CommonService.calculateDiscount(
      mrpNum,
      sellingNum,
      DISCOUNT_DECIMAL_PLACES,
    );
    return value > 0 ? value : 0;
  }, [mrpNum, sellingNum]);

  const margin =
    purchaseNum > 0 && sellingNum > 0 ? sellingNum - purchaseNum : 0;

  // Value of the stock being booked — what a Value plan debits from the
  // purchase capacity, one-for-one (same rule the by-deal charge API applies).
  const purchaseValue = useMemo(() => {
    const stockNum = Number(form.stock);
    if (!(purchaseNum > 0) || !(stockNum > 0)) return 0;
    return purchaseNum * stockNum;
  }, [purchaseNum, form.stock]);

  const planMissing = plan.isActive === false;
  // A percentage plan charges a cut of the purchase value, and the rate is only
  // known per deal — a product that does not exist yet has none. So the amount
  // check applies to Value plans; percentage plans are only blocked when the
  // capacity is already exhausted.
  const isValuePlan = plan.planType === "Value";
  const requiredAmount = isValuePlan ? purchaseValue : 0;
  const insufficientLimit =
    plan.isActive === true &&
    (isValuePlan
      ? requiredAmount > 0 && plan.availableAmount < requiredAmount
      : plan.availableAmount <= 0);
  const blocked = planMissing || insufficientLimit;

  const handleBuyPlan = () => {
    callback({ action: "close" });
    appNav.to(FranchiseService.getBuyPlanLink());
  };

  const validate = (): string => {
    if (plan.loading) return "Checking your purchase limit…";
    if (planMissing)
      return "A platform fee plan is required before creating a product";
    if (!form.productName.trim()) return "Enter the product name";
    if (!(mrpNum > 0)) return "Enter a valid MRP";
    if (!(purchaseNum > 0)) return "Enter a valid purchase price";
    if (purchaseNum > mrpNum) return "Purchase price cannot exceed MRP";
    if (!(sellingNum > 0)) return "Enter a valid selling price";
    if (sellingNum > mrpNum) return "Selling price cannot exceed MRP";
    if (!(Number(form.stock) > 0)) return "Enter the stock quantity";
    if (!(Number(form.cartQty) > 0)) return "Enter the billing quantity";
    if (Number(form.cartQty) > Number(form.stock))
      return "Billing quantity cannot exceed stock";
    if (insufficientLimit)
      return isValuePlan
        ? `Purchase limit exceeded — ₹${CommonService.roundedByDecimalPlace(
            requiredAmount,
            2,
          )} of stock needs more than the ₹${CommonService.roundedByDecimalPlace(
            plan.availableAmount,
            2,
          )} left on your plan`
        : "Your plan has no purchase limit left. Top up to continue";
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const payload: Record<string, any> = {
      autoApprove: true,
      productType: "New",
      productName: form.productName.trim(),
      barcode,
      mrp: mrpNum,
      qty: Number(form.stock),
      purchasePrice: purchaseNum,
      b2cPriceConfig: {
        isFixedPrice: true,
        fixedPrice: sellingNum,
        discount,
      },
    };

    setSaving(true);
    try {
      setStep("Creating the product…");
      const response =
        await InventorySubscribeService.importStoreProduct(payload);
      if (response.statusCode === 200) {
        // The stock and price land asynchronously on the backend — wait before
        // handing back, so the grid searches a fully billable product.
        setStep("Adding to cart…");
        await new Promise((resolve) =>
          setTimeout(resolve, CREATE_SETTLE_DELAY_MS),
        );

        callback({
          action: "created",
          data: {
            barcode,
            productName: payload.productName,
            cartQty: Number(form.cartQty),
          },
        });
      } else {
        appToast.show({
          msg: response?.data?.message || "Failed to create the product",
          color: "danger",
        });
      }
    } catch (e: any) {
      appToast.show({
        msg: e?.message || "Failed to create the product",
        color: "danger",
      });
    } finally {
      setStep("");
      setSaving(false);
    }
  };

  const fieldClass =
    "tw:w-full tw:border tw:border-gray-200 tw:rounded-lg tw:px-3 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-900 tw:outline-none tw:transition-colors focus:tw:border-primary";
  const labelClass =
    "tw:block tw:mb-1 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500";

  return (
    <AppModal
      show={show}
      callback={callback}
      className="tw:md:max-w-lg"
      backdropDismiss={false}
    >
      <AppModal.Title onClose={() => callback({ action: "close" })}>
        <div className="tw:flex tw:items-center tw:gap-2">
          <div className="tw:w-8 tw:h-8 tw:rounded-lg tw:bg-primary/10 tw:flex tw:items-center tw:justify-center tw:shrink-0">
            <PackagePlus className="tw:w-4 tw:h-4 tw:text-primary" />
          </div>
          <div className="tw:min-w-0 tw:flex-1">
            <h2 className="tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
              Add product
            </h2>
            <p className="tw:text-sm tw:font-bold tw:text-gray-900 tw:leading-tight tw:truncate">
              {barcode || searchTerm || "New product"}
            </p>
          </div>
        </div>
      </AppModal.Title>

      <AppModal.Content>
        <div className="tw:flex tw:flex-col tw:gap-3">
          {/* The modal opens by itself the moment a search comes back empty, so
              lead with why it is here before asking for any input. */}
          <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:border tw:border-amber-200 tw:bg-amber-50 tw:px-3 tw:py-2">
            <PackageSearch className="tw:w-4 tw:h-4 tw:text-amber-600 tw:shrink-0 tw:mt-0.5" />
            <p className="tw:text-[11px] tw:leading-snug tw:text-amber-900">
              {isBarcodeSearch
                ? "No product in your catalog carries the barcode "
                : "No product in your catalog matched "}
              <b className="tw:font-semibold">{searchTerm}</b>, so it can't be
              billed yet. Add it below — it is created in your catalog and put
              straight into this bill.
            </p>
          </div>

          {planMissing && (
            <PlatformFeeRequiredBlock
              onSubscribe={handleBuyPlan}
              description="Subscribe to create products and book stock."
              className="tw:mb-0"
            />
          )}

          <div>
            <label className={labelClass}>Product name</label>
            <input
              ref={nameRef}
              type="text"
              value={form.productName}
              onChange={(e) => setField("productName", e.target.value)}
              className={fieldClass}
              placeholder="e.g. Aashirvaad Sunflower Oil, 1 L"
            />
          </div>

          <div>
            <label className={labelClass}>
              Barcode <span className="tw:text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className={fieldClass}
              placeholder="e.g. 8901000111222"
            />
          </div>

          <div className="tw:grid tw:grid-cols-2 tw:gap-3">
            <div>
              <label className={labelClass}>MRP (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.mrp}
                onChange={(e) => setField("mrp", e.target.value)}
                className={fieldClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Stock</label>
              <input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setField("stock", e.target.value)}
                className={fieldClass}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Purchase price (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.purchasePrice}
                onChange={(e) => setField("purchasePrice", e.target.value)}
                className={fieldClass}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className={labelClass}>Selling price (₹)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.sellingPrice}
                onChange={(e) => setField("sellingPrice", e.target.value)}
                className={fieldClass}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="tw:grid tw:grid-cols-2 tw:gap-3 tw:items-end">
            <div>
              <label className={labelClass}>Qty to bill</label>
              <input
                type="number"
                min={1}
                value={form.cartQty}
                onChange={(e) => setField("cartQty", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                className={fieldClass}
                placeholder="1"
              />
            </div>
            <div className="tw:flex tw:flex-col tw:gap-1 tw:pb-1 tw:text-[11px] tw:font-semibold">
              {discount > 0 && (
                <span className="tw:text-blue-600">
                  Discount on MRP: {discount}%
                </span>
              )}
              {margin > 0 && (
                <span className="tw:text-green-600">
                  Margin: ₹{CommonService.roundedByDecimalPlace(margin, 2)}
                </span>
              )}
            </div>
          </div>

          {/* {plan.isActive === true && isValuePlan && purchaseValue > 0 && (
            <PlatformFeeInfo
              commissionAmount={requiredAmount}
              commissionPercentage={0}
              planName={plan.planName}
              planType={plan.planType}
              typeOfPlan={plan.typeOfPlan}
              availableAmount={plan.availableAmount}
              hasSufficientBalance={!insufficientLimit}
              calculating={false}
              onBuyPlan={handleBuyPlan}
            />
          )} */}

          {plan.isActive === true && !isValuePlan && insufficientLimit && (
            <div className="tw:flex tw:items-start tw:gap-2 tw:rounded-lg tw:border tw:border-red-200 tw:bg-red-50 tw:px-3 tw:py-2">
              <PackageSearch className="tw:w-4 tw:h-4 tw:text-red-600 tw:shrink-0 tw:mt-0.5" />
              <p className="tw:text-[11px] tw:leading-snug tw:text-red-800">
                Your plan has no purchase limit left. Top up before creating new
                products.
              </p>
            </div>
          )}

          <div className="tw:min-h-[18px]">
            {error && (
              <p className="tw:text-[11px] tw:font-medium tw:text-red-500">
                {error}
              </p>
            )}
          </div>

          <AppButton
            onClick={handleSubmit}
            isLoading={saving}
            disabled={saving || plan.loading || blocked}
            className="tw:w-full"
          >
            {saving && step
              ? step
              : planMissing
                ? "Plan required to create"
                : insufficientLimit
                  ? "Purchase limit exceeded"
                  : "Create & add to cart"}
          </AppButton>
        </div>
      </AppModal.Content>
    </AppModal>
  );
};

export default PosAddProductModal;
