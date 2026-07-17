import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import AppSwitch from "~/components/core/form/AppSwitch";
import ImgRender from "~/components/core/img/ImgRender";
import AppPopover from "~/components/core/popover/AppPopover";
import AppScrollArea from "~/components/core/scroll-area/AppScrollArea";
import AuthService from "~/services/AuthService";
import InventorySubscribeService from "~/services/InventorySubscribeService";
import SellerCatalogService from "~/services/SellerCatalogService";
import { StorageService } from "~/services/StorageService";

const SubscribeTopProductInfo = ({
  primeCatalogShow,
}: {
  primeCatalogShow: boolean;
}) => {
  const primaryBusiness = AuthService.getLoggedInUserPrimaryBusiness();
  const secondaryBusiness = AuthService.getLoggedInUserSecondaryBusiness();

  const [searchParams, setSearchParams] = useSearchParams();
  const [menus, setMenus] = useState<any[]>([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handlePrimeCatalogShowChange = (show: boolean) => {
    StorageService.set("primeCatalogShow", show);
    setSearchParams({
      ...Object.fromEntries(searchParams.entries()),
      primeCatalog: show ? "true" : "false",
    });
  };

  const fetchLinkedMenus = useCallback(async () => {
    try {
      setMenusLoading(true);
      const primaryId = primaryBusiness?.id;
      const secondaryId = secondaryBusiness?.id;
      const linked = await SellerCatalogService.getBusinessLinkedMenus(
        primaryId,
        secondaryId,
      );

      if (linked.status === "success" && linked.ids?.length) {
        const resp = await InventorySubscribeService.getMenus({
          page: 1,
          count: 100,
          filter: {
            "applicableMenu.id": { $in: linked.ids },
          },
        });

        if (resp?.statusCode === 200 && Array.isArray(resp.data?.data)) {
          setMenus(
            InventorySubscribeService.formatMenuResponse(resp.data?.data || []),
          );
          return;
        }
      }

      setMenus([]);
    } catch (err) {
      setMenus([]);
    } finally {
      setMenusLoading(false);
    }
  }, [primaryBusiness, secondaryBusiness]);

  const handlePopoverOpenChange = async (open: boolean) => {
    setPopoverOpen(open);
    if (open && menus.length === 0) {
      await fetchLinkedMenus();
    }
  };

  const renderMenuPopover = () => {
    return (
      <div className="tw:min-w-[220px] tw:max-w-[320px]">
        <div className="tw:text-xs tw:font-semibold tw:mb-2">
          Menus linked to your business category
        </div>
        <AppScrollArea className="tw:h-[200px]">
          {menusLoading ? (
            <div className="tw:py-4 tw:text-center tw:text-xs">Loading...</div>
          ) : menus.length > 0 ? (
            <div className="tw:space-y-2">
              {menus.map((m: any) => (
                <div
                  key={m._id}
                  className="tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-1"
                >
                  {m._displayImg ? (
                    <ImgRender
                      assetId={m._displayImg}
                      alt={m._displayName}
                      className="tw:w-8 tw:h-8 tw:object-cover tw:rounded"
                    />
                  ) : (
                    <div className="tw:w-8 tw:h-8 tw:bg-gray-100 tw:rounded" />
                  )}
                  <div className="tw:text-xs tw:font-medium tw:flex-1">
                    {m._displayName || m.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tw:p-3 tw:text-xs">No linked menus</div>
          )}
        </AppScrollArea>
      </div>
    );
  };

  return (
    <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-1.5 tw:rounded-md tw:border tw:border-blue-100 tw:bg-blue-50/40 tw:px-2 tw:py-1 tw:text-xs tw:text-gray-600">
      <span className="tw:min-w-0 tw:truncate tw:leading-tight">
        Popular for{" "}
        <span className="tw:font-semibold">"{primaryBusiness.name}"</span>
        {secondaryBusiness.name &&
        secondaryBusiness.name !== primaryBusiness.name ? (
          <>
            {" & "}
            <span className="tw:font-semibold">"{secondaryBusiness.name}"</span>
          </>
        ) : null}
      </span>
      <AppPopover
        triggerContent={
          <span className="tw:shrink-0 tw:text-[11px] tw:underline tw:cursor-pointer tw:whitespace-nowrap">
            Linked Menus
          </span>
        }
        side="bottom"
        align="end"
        open={popoverOpen}
        onOpenChange={handlePopoverOpenChange}
      >
        {renderMenuPopover()}
      </AppPopover>
      <div className="tw:shrink-0">
        <AppSwitch
          checked={primeCatalogShow}
          onCheckedChange={handlePrimeCatalogShowChange}
          label={
            <span className="tw:text-xs">
              {primeCatalogShow ? "Hide" : "Show"}
            </span>
          }
        />
      </div>
    </div>
  );
};

export default SubscribeTopProductInfo;
