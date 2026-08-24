import clsx from "clsx";
import { PackagePlus, Recycle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import Amount from "~/components/core/amount/Amount";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppButton from "~/components/core/button/AppButton";
import AppCard from "~/components/core/card/AppCard";
import { AppInput, AppSelect } from "~/components/core/form";
import AppHeader from "~/components/core/header/AppHeader";
import ImgRender from "~/components/core/img/ImgRender";
import InfoBlock from "~/components/core/info-blk/InfoBlock";
import NoData from "~/components/core/no-data/NoData";
import ContentLoader from "~/components/core/page-loader/ContentLoader";
import RichTextEditor from "~/components/core/rich-text-editor/RichTextEditor";
import useAppNav from "~/hooks/useAppNav";
import useAppToast from "~/hooks/useAppToast";
import useScreenView from "~/hooks/useScreenView";
import PageAccessService from "~/services/PageAccessService";
import InventoryAddStockModal from "~/shared/catalog/modals/add-stock/InventoryAddStockModal";
import { AppPaneMain } from "~/shared/layout/app-pane/AppPane";
import SectionMenu from "~/shared/navigation/section-menu/SectionMenu";
import type { BreadcrumbItem } from "~/types/CommonTypes";
import ImagePicker from "./components/ImagePicker";
import PreOwnedSuccessModal from "./components/PreOwnedSuccessModal";
import {
  CONDITION_TYPES,
  PRODUCT_GRADES,
  createPreOwnedDeal,
  getDealDetails,
  stripHtml,
} from "./helper";

export async function clientLoader() {
  return PageAccessService.canAccessPage(["INVENTORY.VIEW-INVENTORY"]);
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    label: "All Items",
    langKey: "allItems",
    redirect: { path: "/dashboard/inventory/products/list" },
  },
  { label: "Intake Pre-owned Unit" },
];

interface PreOwnedFormValues {
  dealName: string;
  mrp: number | "";
  productCondtionType: string;
  productGrade: string;
  description: string;
  images: string[];
}

/**
 * Lists a second-hand unit of an existing catalog product as a deal of its
 * own. Everything but the condition and the grade is carried over from the
 * source deal (`?dealId=`) — those two are what make the unit different, and
 * they drive the listing name.
 */
const PreOwnedIntake = () => {
  const { t } = useTranslation(["common", "menu"]);
  const appNav = useAppNav();
  const { show: showToast } = useAppToast();
  const { isMobile } = useScreenView();
  const [searchParams] = useSearchParams();
  const sourceDealId = searchParams.get("dealId") || "";

  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdDeal, setCreatedDeal] = useState<{
    dealId: string;
    dealRefId: string;
    dealName: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);

  // Once the name is touched by hand, condition changes stop rewriting it.
  const nameEditedRef = useRef(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PreOwnedFormValues>({
    defaultValues: {
      dealName: "",
      mrp: "",
      productCondtionType: "",
      productGrade: "",
      description: "",
      images: [],
    },
  });

  const conditionType = watch("productCondtionType");
  const description = watch("description");

  // The editor drives this field through setValue, so register it by hand.
  register("description", {
    validate: (value: string) =>
      stripHtml(value).length > 0 || "Description is required",
  });

  useEffect(() => {
    const fetchDeal = async () => {
      if (!sourceDealId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getDealDetails(sourceDealId);
        setDeal(data);
        if (data) {
          setValue("dealName", data.name || "");
          setValue("mrp", data.mrp || "");
          setValue("images", (data.images || []).filter(Boolean));
        }
      } catch (error) {
        console.error("Failed to load deal details", error);
        showToast({ msg: "Failed to load product details", color: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchDeal();
  }, [sourceDealId]);

  // Name mirrors the sample payload — source name plus the condition in
  // brackets — until the user takes it over.
  useEffect(() => {
    if (!deal?.name || !conditionType || nameEditedRef.current) return;
    setValue("dealName", `${deal.name} (${conditionType})`);
  }, [conditionType, deal?.name, setValue]);

  const onSubmit = async (values: PreOwnedFormValues) => {
    // The clone endpoint is keyed off the seller-deal document, not the deal.
    const sellerDealObjId = deal?.sellerDealObjId || "";
    if (!sellerDealObjId) {
      showToast({ msg: "Product reference is missing", color: "error" });
      return;
    }
    setSubmitting(true);
    const result = await createPreOwnedDeal(sellerDealObjId, {
      productCondtionType: values.productCondtionType,
      dealName: values.dealName.trim(),
      description: values.description || "",
      images: values.images,
      // The listing starts empty — stock comes in through the add-stock step
      // right after, so the unit is never briefly sellable without a quantity.
      quantity: 0,
      mrp: Number(values.mrp),
      productGrade: values.productGrade,
    });
    setSubmitting(false);

    if (result.status === "error") {
      showToast({ msg: result.msg, color: "error" });
      return;
    }
    setCreatedDeal(result.data || null);
    setShowSuccess(true);
  };

  const handleSuccessCallback = ({ action }: { action: string }) => {
    setShowSuccess(false);
    if (action === "add-stock") {
      setShowAddStock(true);
      return;
    }
    if (action === "go-to-inventory") {
      appNav.to("/dashboard/inventory/products/list");
    }
  };

  const handleAddStockCallback = ({ action }: { action: string }) => {
    setShowAddStock(false);
    if (action === "submit") {
      appNav.to("/dashboard/inventory/products/list");
    }
  };

  // The footer bar only makes sense once there is a form to submit.
  const showMobileActions = isMobile && !loading && !!deal?._id;

  const renderBody = () => {
    if (loading) return <ContentLoader />;
    if (!sourceDealId || !deal?._id) {
      return (
        <NoData
          title="Product not found"
          description="Open this page from a product to intake a pre-owned unit of it."
        />
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Source product — what the unit is a second-hand copy of. */}
        <AppCard>
          <div className="tw:flex tw:items-center tw:gap-3">
            <div className="tw:h-14 tw:w-14 tw:shrink-0 tw:overflow-hidden tw:rounded-xl tw:border tw:border-slate-200 tw:bg-white tw:md:h-16 tw:md:w-16">
              <ImgRender
                assetId={deal.images?.[0]}
                alt={deal.name}
                className="tw:h-full tw:w-full tw:object-contain"
              />
            </div>
            <div className="tw:min-w-0">
              <div className="tw:mb-0.5 tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-slate-400">
                Source product
              </div>
              <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-slate-900">
                {deal.name}
              </div>
              <div className="tw:text-xs tw:text-slate-500">
                MRP <Amount value={deal.mrp} />
                {deal.brand?._displayName ? ` · ${deal.brand._displayName}` : ""}
              </div>
            </div>
          </div>
        </AppCard>

        <InfoBlock variant="info" size="sm" bordered className="tw:mb-4">
          The unit is listed as a separate product. Its condition and grade are
          the only details we can't carry over — everything else is prefilled
          and editable.
        </InfoBlock>

        {/* Condition — the reason this listing exists, so it leads the form. */}
        <AppCard>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
            <Controller
              name="productCondtionType"
              control={control}
              rules={{ required: "Condition is required" }}
              render={({ field }) => (
                <AppSelect
                  label="Condition"
                  isRequired
                  placeholder="Select condition"
                  options={CONDITION_TYPES}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  error={errors.productCondtionType?.message}
                />
              )}
            />
            <Controller
              name="productGrade"
              control={control}
              rules={{ required: "Grade is required" }}
              render={({ field }) => (
                <AppSelect
                  label="Grade"
                  isRequired
                  placeholder="Select grade"
                  options={PRODUCT_GRADES}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  error={errors.productGrade?.message}
                />
              )}
            />
          </div>
        </AppCard>

        <AppCard>
          <div className="tw:grid tw:grid-cols-1 tw:gap-4">
            <AppInput
              name="dealName"
              label="Listing name"
              isRequired
              register={register}
              rules={{
                required: "Listing name is required",
                validate: (value: string) =>
                  value.trim().length > 0 || "Listing name is required",
              }}
              onChange={() => {
                nameEditedRef.current = true;
              }}
              error={errors.dealName?.message}
            />

            {/* Short numeric field — half width once there is room for it. */}
            <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2">
              <AppInput
                name="mrp"
                type="number"
                label="MRP"
                isRequired
                register={register}
                rules={{
                  required: "MRP is required",
                  min: { value: 1, message: "MRP must be greater than 0" },
                }}
                error={errors.mrp?.message}
              />
            </div>

            <div>
              <label className="tw:mb-2 tw:block tw:text-sm tw:font-medium tw:text-slate-700">
                Description
              </label>
              <RichTextEditor
                value={description}
                callback={(content) =>
                  setValue("description", content, { shouldValidate: true })
                }
              />
              {errors.description?.message && (
                <div className="tw:mt-1 tw:text-xs tw:text-red-500">
                  {errors.description.message}
                </div>
              )}
            </div>
          </div>
        </AppCard>

        <AppCard>
          <Controller
            name="images"
            control={control}
            rules={{
              validate: (value: string[]) =>
                (value && value.length > 0) || "Add at least one image",
            }}
            render={({ field }) => (
              <ImagePicker
                value={field.value || []}
                onChange={field.onChange}
                sourceImages={(deal.images || []).filter(Boolean)}
                error={errors.images?.message as string}
              />
            )}
          />
        </AppCard>

        {/* Desktop keeps the actions at the end of the form; mobile carries
            them in the footer bar so the primary stays in thumb reach. */}
        <div className="tw:hidden tw:justify-end tw:gap-3 tw:md:flex">
          <AppButton
            type="button"
            fill="outline"
            color="secondary"
            onClick={() => appNav.back()}
          >
            Cancel
          </AppButton>
          <AppButton type="submit" color="primary" isLoading={submitting}>
            <PackagePlus size={16} />
            List Pre-owned Unit
          </AppButton>
        </div>
      </form>
    );
  };

  return (
    <>
      <AppHeader title="Intake Pre-owned Unit" />
      <div
        className={clsx(
          "page-bg app-page tw:p-4",
          // Mobile carries the submit action in a footer bar — reserve for it.
          showMobileActions && "has-footer",
        )}
      >
        <div className="section-layout section-layout--tight">
          <aside className="section-menu-aside">
            <div className="tw:sticky tw:top-20">
              <SectionMenu
                sectionKey="catalog"
                activeTab="my-catalog"
                title={t("manageCatalog", { ns: "menu" })}
              />
            </div>
          </aside>

          <div className="section-content app-container">
            {/* Capped and centred so the fields keep a readable line length on
                wide screens instead of stretching the full content column. */}
            <AppPaneMain className="tw:mx-auto tw:w-full tw:max-w-3xl tw:space-y-0">
              <AppBreadcrumbs data={breadcrumbs} className="tw:mb-4" />

              <div className="tw:mb-4 tw:flex tw:items-center tw:gap-2">
                <Recycle size={20} className="tw:text-slate-400" />
                <h1 className="tw:text-lg tw:font-bold tw:text-slate-900 tw:md:text-xl">
                  Intake Pre-owned Unit
                </h1>
              </div>

              {renderBody()}
            </AppPaneMain>
          </div>
        </div>
      </div>

      {/* Mobile action bar — mirrors the form's desktop-only action row. */}
      {showMobileActions && (
        <div className="app-footer tw:flex tw:items-center tw:gap-3 tw:p-3">
          <AppButton
            type="button"
            fill="outline"
            color="secondary"
            className="tw:shrink-0"
            onClick={() => appNav.back()}
          >
            Cancel
          </AppButton>
          <AppButton
            type="button"
            color="primary"
            className="tw:flex-1"
            isLoading={submitting}
            onClick={handleSubmit(onSubmit)}
          >
            <PackagePlus size={16} />
            List Pre-owned Unit
          </AppButton>
        </div>
      )}

      <PreOwnedSuccessModal
        show={showSuccess}
        callback={handleSuccessCallback}
        dealName={createdDeal?.dealName}
      />

      <InventoryAddStockModal
        show={showAddStock}
        productId={createdDeal?.dealId}
        productName={createdDeal?.dealName}
        dealRefId={createdDeal?.dealRefId}
        mrp={Number(watch("mrp")) || undefined}
        currentStock={0}
        callback={handleAddStockCallback}
      />
    </>
  );
};

export default PreOwnedIntake;
