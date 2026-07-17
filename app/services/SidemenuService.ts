import {
  BellPlus,
  Boxes,
  Briefcase,
  Barcode,
  CreditCard,
  FileText,
  Gift,
  Image,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Megaphone,
  Network,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Ticket,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type { MenuItem, UserType } from "~/types/CommonTypes";
import AuthService from "./AuthService";
import FranchiseService from "./FranchiseService";

class SidemenuService {
  private static filterMenuItems(
    items: MenuItem[],
    type: UserType,
    parentId: string = "",
  ): MenuItem[] {
    const isBuyer =
      type === "BUYER" || type === "SFBUYER" || type === "SKBUYER";

    const currentFid = AuthService.getLoggedInUserId(true);

    return items
      .filter((item) => {
        if (item.fids && item.fids.length && !item.fids.includes(currentFid)) {
          return false;
        }
        if (item.rbac && item.rbac.length) {
          return AuthService.isRbacEnabled(item.rbac);
        }
        return true;
      })
      .map((item, index) => {
        // Only include items allowed for the current user type
        if (
          (isBuyer && !item.allowed.includes("BUYER")) ||
          (!isBuyer && !item.allowed.includes("SELLER"))
        ) {
          return null;
        }

        const currentId = parentId ? `${parentId}.${index}` : `${index}`;
        const filteredItem: MenuItem = { ...item, id: currentId };

        // Handle children recursively if they exist
        if (item.children?.length) {
          const filteredChildren = this.filterMenuItems(
            item.children,
            type,
            currentId,
          );

          // If children exist after filtering, attach them. If not, drop
          // the parent item (unless the parent itself has a path), because
          // a main/group menu without children shouldn't be shown.
          if (filteredChildren.length) {
            filteredItem.children = filteredChildren;
            return filteredItem;
          }

          // If there are no filtered children but the parent has a direct
          // `path`, keep it as a standalone item; otherwise exclude it.
          if (item.path) {
            delete filteredItem.children;
            return filteredItem;
          }

          return null;
        }

        return filteredItem;
      })
      .filter((item): item is MenuItem => item !== null);
  }

  static getSidemenu(): MenuItem[] {
    const showBuyFromSeller =
      AuthService.isBuyerUser() && AuthService.hasLinkedSeller();

    let menuItems: MenuItem[] = [
      // POS Dashboard - Quick Access at Top
      {
        label: "POS Dashboard",
        langKey: "posDashboard",
        icon: LayoutDashboard,
        path: "/pos/billing?type=b2c",
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "POS main dashboard",
        rbac: ["SALE-ORDER.POS-BILLING"],
        color: "primary",
        key: "posDashboard",
      },
      {
        label: "Assisted Order",
        langKey: "assistedOrder",
        icon: ShoppingCart,
        path: "/pos/billing?type=b2c&assisted=true",
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Assisted order (restricted POS flow)",
        rbac: ["SALE-ORDER.POS-BILLING"],
        color: "primary",
        key: "assistedOrder",
      },

      // Manage Inventory Group
      {
        label: "Manage Inventory",
        langKey: "manageInventory",
        icon: Boxes,
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage inventory and catalog",
        key: "manageInventoryGroup",
        children: [
          {
            label: "Create My Catalog",
            langKey: "createMyCatalog",
            icon: BellPlus,
            path: "/dashboard/inventory/subscribe/main",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Subscribe to product updates",
            rbac: ["CATALOG.SUBSCRIBE"],
            key: "createMyCatalog",
          },

          {
            label: "Items",
            langKey: "items",
            icon: Boxes,
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Inventory item views and configuration shortcuts",
            key: "itemsGroup",
            children: [
              {
                label: "Dashboard",
                langKey: "inventoryDashboard",
                icon: LayoutDashboard,
                path: "/dashboard/inventory/dashboard",
                allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
                description: "Inventory dashboard and analytics",
                rbac: ["INVENTORY.VIEW-INVENTORY"],
                key: "inventoryDashboard",
              },
              {
                label: "All Items",
                langKey: "inventory",
                icon: Boxes,
                path: "/dashboard/inventory/products/list",
                allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
                description: "Manage your inventory",
                rbac: ["INVENTORY.VIEW-INVENTORY"],
                key: "inventory",
              },
              {
                label: "Configs",
                langKey: "configs",
                icon: Settings,
                path: "/dashboard/inventory/products/config",
                allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
                description: "Manage missing inventory configurations",
                rbac: ["INVENTORY.VIEW-INVENTORY"],
                key: "inventoryConfigs",
              },
            ],
          },
          // {
          //   label: "SK Barcode Generator",
          //   langKey: "barcodeGenerator",
          //   icon: Barcode,
          //   path: "/dashboard/inventory/print-barcode",
          //   allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
          //   description: "Generate and print barcode labels",
          //   rbac: ["INVENTORY.VIEW-INVENTORY"],
          //   key: "barcodeGenerator",
          // },
          {
            label: "Warehouse Location",
            langKey: "warehouseLocation",
            icon: MapPin,
            path: "/dashboard/inventory/rack-bin",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Warehouse rack/bin locations",
            rbac: ["INVENTORY.VIEW-LOCATIONS"],
            key: "warehouseLocation",
          },
          {
            label: "Price",
            langKey: "priceManagement",
            icon: Tag,
            path: "/configs/rsp",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage product prices",
            rbac: ["CONFIGS.PRICING"],
            key: "priceManagement",
          },
        ],
      },

      // Manage Supply Group
      {
        label: "Manage Supply",
        langKey: "manageSupply",
        icon: ShoppingCart,
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage supply and procurement",
        key: "manageSupplyGroup",
        children: [
          {
            label: "Buy from Network",
            langKey: "buyFromNetwork",
            icon: Package,
            path: "/products/main",
            allowed: ["SKRETAILER", "SELLER", "BUYER"],
            description: "Explore products",
            rbac: ["PURCHASE_FROM_SK"],
            color: "success",
            key: "buyFromNetwork",
          },
          {
            label: "Buy From SK",
            langKey: "buyFromSK",
            icon: Package,
            path: "/products/sk",
            allowed: ["SKRETAILER", "SELLER"],
            description: "Explore products",
            rbac: ["PURCHASE_FROM_SK"],
            color: "success",
            key: "buyFromSK",
          },
          {
            label: "Purchase Orders",
            langKey: "purchaseOrders",
            icon: ShoppingCart,
            path: "/dashboard/purchase-order/main",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage purchase orders",
            rbac: ["PURCHASE-ORDER.PO-VIEW-ORDERS"],
            key: "purchaseOrders",
          },
          {
            label: "Vendors",
            langKey: "vendors",
            icon: Store,
            path: "/dashboard/vendor/list",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage vendors",
            rbac: ["VENDOR.VIEW"],
            key: "vendors",
          },
        ],
      },

      // Manage Sales Group
      {
        label: "Manage Sales",
        langKey: "manageSales",
        icon: ListChecks,
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage sales and fulfillment",
        key: "manageSalesGroup",
        children: [
          {
            label: "Orders",
            langKey: "orders",
            icon: ListChecks,
            path: "/dashboard/orders/dashboard",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage orders",
            rbac: ["SALE-ORDER.VIEW-ORDERS"],
            key: "orders",
          },
          {
            label: "Order Refunds",
            langKey: "refunds",
            icon: ListChecks,
            path: "/dashboard/orders/refunds/list",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage order refunds",
            rbac: ["SALE-ORDER.VIEW-ORDERS"],
            key: "refunds",
          },
          {
            label: "Fulfillment",
            langKey: "fulfillment",
            icon: Truck,
            path: "/dashboard/fulfillment/list",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Order fulfillment",
            rbac: ["SALE-ORDER.VIEW-ORDERS"],
            key: "fulfillment",
          },
          {
            label: "Last Mile Delivery",
            langKey: "lastMileDelivery",
            icon: Truck,
            path: "/dashboard/delivery/dispatch",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage last mile delivery operations",
            rbac: ["ACCOUNTS.COD-RECONCILIATION", "DELIVERY.DISPATCH"],
            key: "lastMileDelivery",
          },
          {
            label: "Delivery / Beat Route",
            langKey: "deliveryRoute",
            icon: Truck,
            path: "/configs/settings/delivery-routes",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage delivery / beat routes",
            rbac: [
              "DELIVERY-ROUTE.DELIVERY-ROUTE-VIEW",
              "DELIVERY-ROUTE.DELIVERY-ROUTE-CREATE",
            ],
            key: "deliveryRoute",
          },
        ],
      },

      // Manage Business Group
      {
        label: "Manage Business",
        langKey: "manageBusiness",
        icon: Briefcase,
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage business operations",
        key: "manageBusinessGroup",
        children: [
          {
            label: "Network",
            langKey: "networkManagement",
            icon: Network,
            path: "/dashboard/network/management/b2c-customers?tab=b2c-customers",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage your network",
            rbac: ["NETWORK.VIEW-USERS"],
            key: "networkManagement",
          },
          {
            label: "User",
            langKey: "manageEmployees",
            icon: Users,
            path: "/dashboard/employee/list",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage users and employees",
            rbac: ["USER-MANAGEMENT.VIEW-USER"],
            key: "userManagement",
          },
          {
            label: "Points",
            langKey: "kingCoins",
            icon: Gift,
            path: "/dashboard/points/list",
            allowed: ["SELLER", "BUYER"],
            description: "Manage loyalty and reward points",
            rbac: ["LOYALTY-POINTS.VIEW-STATEMENT"],
            key: "kingCoins",
          },
          // Coin Store menu removed — navigation available via KingCoins tabs
        ],
      },

      // Manage Finance Group
      {
        label: "Manage Finance",
        langKey: "manageFinance",
        icon: Wallet,
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage finances and accounts",
        key: "manageFinanceGroup",
        children: [
          {
            label: "Account Summary",
            langKey: "accountSummary",
            icon: Wallet,
            path: FranchiseService.getAccountSummaryLink(),
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Account summary and statements",
            rbac: ["ACCOUNTS.VIEW-STATEMENT"],
            key: "accountSummary",
          },
          {
            label: "Paylater",
            langKey: "paylater",
            icon: CreditCard,
            path: "/dashboard/paylater/analytics?tab=analytics",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage paylater transactions",
            rbac: ["ACCOUNTS.PAYLATER"],
            key: "paylater",
          },
          {
            label: "Expenses",
            langKey: "expenses",
            icon: FileText,
            path: "/dashboard/expenses/list",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage expenses and statements",
            rbac: ["EXPENSES.VIEW"],
            key: "expenses",
          },
          {
            label: "Report/Ledger",
            langKey: "report_ledger",
            icon: FileText,
            path: "/dashboard/reports",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Report/Ledger",
            rbac: ["REPORTS_VIEW"],
            key: "reports",
          },
        ],
      },

      // Marketing
      {
        label: "Marketing",
        langKey: "marketing",
        icon: Megaphone,
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage marketing",
        key: "marketingGroup",
        children: [
          {
            label: "Banners",
            langKey: "banners",
            icon: Image,
            path: "/configs/banner",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage banners",
            rbac: ["BANNER.BANNER-VIEW"],
            key: "banners",
          },
          {
            label: "Coupons",
            langKey: "coupons",
            icon: Ticket,
            path: "/configs/coupon",
            allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
            description: "Manage coupons",
            key: "coupons",
          },
        ],
      },

      // Settings
      {
        label: "Settings",
        langKey: "settings",
        icon: Settings,
        path: "/configs/settings",
        allowed: ["SELLER", "BUYER", "MASTER_LOGIN"],
        description: "Manage settings",
        rbac: [
          "CONFIGS.DELIVERY-SLOT",
          "CONFIGS.PAYMENT-CONFIG",
          "CONFIGS.DELIVERY-CHARGE",
          "CONFIGS.ADVANCE-SETTINGS",
        ],
        key: "settings",
      },
    ];

    if (AuthService.isMasterLogin()) {
      menuItems = menuItems.filter((item) =>
        item.allowed?.includes("MASTER_LOGIN"),
      );
    }

    // Filter nested children for specific conditions
    const filterNestedChildren = (
      items: MenuItem[],
      filterFn: (item: MenuItem) => boolean,
    ): MenuItem[] => {
      return items
        .map((item) => {
          if (item.children && item.children.length > 0) {
            const filteredChildren = item.children.filter(filterFn);
            return { ...item, children: filteredChildren };
          }
          return item;
        })
        .filter((item) => {
          // Remove parent groups that have no children and no path
          if (item.children && item.children.length === 0 && !item.path) {
            return false;
          }
          return true;
        });
    };

    // Hide 'Buy from Retailer' from SK Seller users
    if (AuthService.isSkSeller()) {
      menuItems = filterNestedChildren(
        menuItems,
        (item) => item.key !== "buyFromRetailer",
      );
    }

    // Hide 'Buy from Network' for manpower users
    if (AuthService.isManpowerLoggedIn()) {
      menuItems = filterNestedChildren(
        menuItems,
        (item) => item.key !== "buyFromNetwork",
      );
    }

    // Show 'Assisted Order' only for manpower users
    if (!AuthService.isManpowerLoggedIn()) {
      menuItems = menuItems.filter((item) => item.key !== "assistedOrder");
    }

    // Only show Paylater menu for allowed mobile numbers.
    try {
      if (!AuthService.isPaylaterEnabled()) {
        menuItems = filterNestedChildren(
          menuItems,
          (item) => item.key !== "paylater",
        );
      }
    } catch (e) {
      // If anything goes wrong, default to hiding Paylater
      menuItems = filterNestedChildren(
        menuItems,
        (item) => item.key !== "paylater",
      );
    }

    // if (showBuyFromSeller) {
    //   const buyFromSellerItem: MenuItem = {
    //     label: "Buy from Seller",
    //     langKey: "buyFromSKSeller",
    //     icon: Package,
    //     path: "/products/main",
    //     allowed: ["BUYER", "MASTER_LOGIN"],
    //     description: "Explore products",
    //     rbac: ["PURCHASE_FROM_SELLLER"],
    //     color: "warning",
    //     key: "buyFromSeller",
    //   };
    //   menuItems.splice(1, 0, buyFromSellerItem);
    // }

    return this.filterMenuItems(menuItems, AuthService.getLoggedInUserType());
  }

  static getFooterMenu(): MenuItem[] {
    // const isBuyer = AuthService.isBuyerUser();

    // const footerItems: MenuItem[] = [
    //   {
    //     label: "POS Dashboard",
    //     langKey: "posDashboard",
    //     icon: LayoutDashboard,
    //     path: "/pos/billing",
    //     allowed: ["SELLER", "BUYER"],
    //     description: "POS main dashboard",
    //     rbac: ["SALE-ORDER.POS-BILLING"],
    //     color: "primary",
    //   },
    //   {
    //     label: "Buy from SK",
    //     langKey: "exploreProducts",
    //     icon: Package,
    //     path: "/products/main",
    //     allowed: ["SELLER"],
    //     description: "Explore products",
    //     rbac: ["PURCHASE_FROM_SK"],
    //     color: "success",
    //   },
    //   {
    //     label: "Buy from Seller",
    //     langKey: "buyFromSeller",
    //     icon: Package,
    //     path: "/products/main",
    //     allowed: ["BUYER"],
    //     description: "Explore products",
    //     rbac: ["PURCHASE_FROM_SELLLER"],
    //     color: "warning",
    //   },
    // ];

    // return this.filterMenuItems(footerItems, isBuyer);
    return [];
  }
}

export default SidemenuService;
