import React from "react";
import BrandSearchInput from "~/shared/catalog/components/search-input/brand/BrandSearchInput";
import CategorySearchInput from "~/shared/catalog/components/search-input/category/CategorySearchInput";
import MenuSearchInput from "~/shared/catalog/components/search-input/menu/MenuSearchInput";
import { itemIdByScope, type ScopeItem } from "../helper";

// Brand / Category / Product picker that mirrors the catalog manage-product
// search inputs. Holds a list of selected {label, value} items.
const ScopeSearchInput: React.FC<{
  scopeType: string;
  value: ScopeItem[];
  onChange: (items: ScopeItem[]) => void;
}> = ({ scopeType, value, onChange }) => {
  const selected = value || [];

  const handleSelect = (item: ScopeItem, action: "add" | "remove") => {
    if (action === "add") {
      const id = itemIdByScope(item, scopeType);
      if (selected.some((s) => itemIdByScope(s, scopeType) === id)) return;
      onChange([...selected, item]);
    } else {
      const id = itemIdByScope(item, scopeType);
      onChange(selected.filter((s) => itemIdByScope(s, scopeType) !== id));
    }
  };

  const common = {
    size: "sm" as const,
    multiSelect: true,
    values: selected,
    callback: handleSelect,
    className: "tw:w-full",
  };

  if (scopeType === "BRAND") {
    return (
      <BrandSearchInput
        {...common}
        feature="product"
        placeholder="Search brands..."
      />
    );
  }
  if (scopeType === "MENU") {
    return (
      <MenuSearchInput {...common} feature="pos" placeholder="Search menus..." />
    );
  }
  return (
    <CategorySearchInput
      {...common}
      feature="product"
      placeholder="Search categories..."
    />
  );
};

export default ScopeSearchInput;
