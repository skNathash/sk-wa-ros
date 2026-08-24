import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import ExpenseService from "~/services/ExpenseService";

// Same accent palette as the summary hero / record rows — categories are
// user-defined (no color/icon field), so colors are derived by name hash.
const CATEGORY_COLORS = [
  "#075e54", // teal (primary)
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ef4444", // red
  "#0ea5e9", // sky
];

const colorFor = (key = "") => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

type CategoryItem = {
  _id: string;
  name: string;
};

/**
 * Category grid for the expense records page. Tapping a category sets the
 * `category` query param (tapping the active one clears it); the records
 * list reads the param and filters itself.
 */
const Category: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeCategory = searchParams.get("category") || "";

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        const response = await ExpenseService.getCategories({
          filter: { isActive: true },
        });
        const items = response?.data?.data?.data;
        if (active) setCategories(Array.isArray(items) ? items : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      active = false;
    };
  }, []);

  const handleSelect = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (activeCategory === id) {
      next.delete("category");
    } else {
      next.set("category", id);
    }
    setSearchParams(next);
  };

  if (loading || categories.length === 0) return null;

  return (
    <div className="tw:mb-4">
      <div className="tw:text-xs tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500 tw:mb-2">
        Categories
      </div>
      {/* Filter chips — content-sized so names never truncate and rows pack
          tightly; tapping the active chip clears the filter. */}
      <div className="tw:flex tw:flex-wrap tw:gap-1.5">
        {categories.map((category) => {
          const isActive = activeCategory === category._id;
          return (
            <button
              key={category._id}
              type="button"
              onClick={() => handleSelect(category._id)}
              title={
                isActive
                  ? `${category.name} — tap to clear filter`
                  : `Filter by ${category.name}`
              }
              aria-pressed={isActive}
              className={`tw:inline-flex tw:max-w-full tw:items-center tw:gap-1.5 tw:rounded-full tw:border tw:px-2.5 tw:py-1 tw:text-xs tw:font-medium tw:transition-colors focus-visible:tw:outline-none focus-visible:tw:ring-2 focus-visible:tw:ring-[#075e54]/40 ${
                isActive
                  ? "tw:border-[#075e54] tw:bg-[#075e54]/10 tw:text-[#075e54]"
                  : "tw:border-gray-200 tw:bg-white tw:text-gray-600 hover:tw:border-gray-300 hover:tw:text-gray-900"
              }`}
            >
              <span
                className="tw:inline-block tw:w-2 tw:h-2 tw:rounded-full tw:shrink-0"
                style={{ backgroundColor: colorFor(category.name) }}
              />
              <span className="tw:truncate">{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Category;
