import AppHeader from "~/components/core/header/AppHeader";
import AppBreadcrumbs from "~/components/core/breadcrumbs/AppBreadcrumbs";
import AppCard from "~/components/core/card/AppCard";
import { useState } from "react";
import InventoryTab from "../components/tab/InventoryTab";
import Summary from "./components/Summary";
import DesktopView from "./components/item/DesktopView";
import MobileView from "./components/item/MobileView";
import useScreenView from "~/hooks/useScreenView";
import AppButton from "~/components/core/button/AppButton";
import PurchaseBasketModal from "~/modals/feature/inventory/purchase-basket/PurchaseBasketModal";

const defaultBreadcrumbs = [
  { label: "Dashboard", url: "/dashboard" },
  { label: "Inventory" },
];

// Sample data for demonstration
const sampleData = [
  {
    _id: "1",
    product: {
      name: "Organic Bananas",
      sku: "BAN-001",
      image:
        "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop",
    },
    currentStock: 15,
    desiredQty: 50,
    unitPrice: 45.0,
    priority: "urgent" as const,
    reason: "Low stock alert - high demand product",
    suggestedVendor: {
      name: "Fresh Fruits Co.",
      id: "vendor1",
    },
    estTotal: 2250.0,
    targetDate: "2024-01-15",
    dateAdded: "2024-01-10",
    addedBy: {
      name: "John Smith",
      id: "user1",
    },
  },
  {
    _id: "2",
    product: {
      name: "Premium Coffee Beans",
      sku: "COF-002",
      image:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=100&h=100&fit=crop",
    },
    currentStock: 8,
    desiredQty: 25,
    unitPrice: 120.0,
    priority: "high" as const,
    reason: "Seasonal demand increase",
    suggestedVendor: {
      name: "Coffee Masters Ltd.",
      id: "vendor2",
    },
    estTotal: 3000.0,
    targetDate: "2024-01-20",
    dateAdded: "2024-01-11",
    addedBy: {
      name: "Sarah Johnson",
      id: "user2",
    },
  },
  {
    _id: "3",
    product: {
      name: "Fresh Milk",
      sku: "MIL-003",
      image:
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop",
    },
    currentStock: 22,
    desiredQty: 40,
    unitPrice: 35.0,
    priority: "medium" as const,
    reason: "Regular restocking",
    suggestedVendor: {
      name: "Dairy Farm Fresh",
      id: "vendor3",
    },
    estTotal: 1400.0,
    targetDate: "2024-01-18",
    dateAdded: "2024-01-12",
    addedBy: {
      name: "Mike Wilson",
      id: "user3",
    },
  },
  {
    _id: "4",
    product: {
      name: "Whole Grain Bread",
      sku: "BRD-004",
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop",
    },
    currentStock: 12,
    desiredQty: 30,
    unitPrice: 28.0,
    priority: "low" as const,
    reason: "Weekly restocking",
    suggestedVendor: {
      name: "Artisan Bakery",
      id: "vendor4",
    },
    estTotal: 840.0,
    targetDate: "2024-01-25",
    dateAdded: "2024-01-13",
    addedBy: {
      name: "Lisa Brown",
      id: "user4",
    },
  },
];

const PurchaseBasket = () => {
  const [breadcrumbs] = useState(defaultBreadcrumbs);
  const [data, setData] = useState(sampleData);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortValue, setSortValue] = useState<"asc" | "desc">("asc");
  const { isMobile } = useScreenView();

  // Modal state: {show, data}
  const [modal, setModal] = useState<{ show: boolean; data?: any }>({
    show: false,
    data: null,
  });

  const handleSort = (sortData: { key: string; value: "asc" | "desc" }) => {
    setSortKey(sortData.key);
    setSortValue(sortData.value);
  };

  const handleEdit = (item: any) => {
    setModal({ show: true, data: item });
  };

  const handleDelete = (item: any) => {
    // Implement delete functionality
  };

  const handleView = (item: any) => {
    // Implement view functionality
  };

  const handleAddItem = () => {
    setModal({ show: true, data: null });
  };

  const handleModalCallback = (result: { action: string; data?: any }) => {
    if (result.action === "close") {
      setModal({ show: false, data: null });
    }
    // You can handle save/add logic here
  };

  return (
    <>
      <AppHeader title="Inventory Management" />
      <div className="app-page tw:p-4 page-bg">
        <div className="app-container">
          <div className="tw:flex tw:justify-between tw:items-center">
            <AppBreadcrumbs data={breadcrumbs} />
            <AppButton color="primary" onClick={handleAddItem}>
              Add Item
            </AppButton>
          </div>
          <div className="tw:mb-6 tw:text-gray-500 tw:text-xs">
            Manage your purchase basket, track items, and prepare orders
          </div>

          <InventoryTab activeTab="purchase-basket" className="tw:mb-4" />

          <Summary />

          <AppCard title="Purchase Basket Items" icon="shopping-cart">
            {data.length > 0 ? (
              isMobile ? (
                <MobileView
                  data={data}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ) : (
                <DesktopView
                  data={data}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onSort={handleSort}
                  sortKey={sortKey}
                  sortValue={sortValue}
                />
              )
            ) : (
              <div className="tw:text-center tw:py-8 tw:text-gray-500">
                No items in purchase basket
              </div>
            )}
          </AppCard>
        </div>
      </div>
      <PurchaseBasketModal show={modal.show} callback={handleModalCallback} />
    </>
  );
};

export default PurchaseBasket;
