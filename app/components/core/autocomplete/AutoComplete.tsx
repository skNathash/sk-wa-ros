import { ChevronsUpDown } from "lucide-react";
import React, { useCallback, useEffect } from "react";

import { debounce } from "lodash";
import { Button } from "~/components/ui/button";
import LoadMoreButton from "~/components/core/load-more/LoadMoreButton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import useScreenView from "~/hooks/useScreenView";
import AppBadge from "../badge/AppBadge";
import InpLabel from "../form/InpLabel";

interface AutoCompleteItem {
  label: string;
  value: { id: string; name: string } & Record<string, any>;
}

interface AutoCompleteProps {
  searchCallback: (
    query: string,
    isLoadMore?: boolean
  ) => Promise<AutoCompleteItem[]>;
  initialData: AutoCompleteItem[];
  onSelect: (
    item: AutoCompleteItem | AutoCompleteItem[],
    action: "add" | "remove"
  ) => void;
  placeholder?: string;
  multiSelect?: boolean;
  loadMoreLabel?: string;
  debounceTime?: number;
  size?: "sm" | "lg";
  label?: string;
  values?: AutoCompleteItem[];
  disabled?: boolean;
  className?: string;
  isRequired?: boolean;
  /**
   * Optional render function to customize how each item is displayed in the
   * suggestion list. Receives the item and should return a React node.
   */
  itemTemplate?: (item: AutoCompleteItem) => React.ReactNode;
}

const AutoComplete = ({
  searchCallback,
  initialData,
  onSelect,
  placeholder,
  multiSelect,
  loadMoreLabel,
  debounceTime = 500,
  size = "sm",
  label,
  values,
  disabled,
  className,
  isRequired,
  itemTemplate,
}: AutoCompleteProps) => {
  const { isMobile } = useScreenView();
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<AutoCompleteItem[]>(initialData);
  const [value, setValue] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  useEffect(() => {
    if (initialData?.length > 0) {
      setData(initialData);
      setHasMore(initialData.length > 0);
    }
  }, [initialData]);

  // Reset search value when drawer/popover closes
  useEffect(() => {
    if (!open) {
      setValue("");
      setHasSearched(false);
      setData(initialData || []);
      setHasMore((initialData || []).length > 0);
      setSearching(false);
    }
  }, [open, initialData]);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      setSearching(true);
      const results = await searchCallback(query);
      setData(results);
      setHasMore(results.length > 0); // You may want to adjust this logic based on your backend
      setSearching(false);
    }, debounceTime),
    [searchCallback, debounceTime]
  );

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const moreResults = await searchCallback(value, true);
    if (moreResults.length === 0) {
      setHasMore(false);
    } else {
      setData((prev) => [...prev, ...moreResults]);
    }
    setLoadingMore(false);
  };

  const handleSelect = (item: AutoCompleteItem) => {
    onSelect(item, "add");
    setOpen(false);
  };

  const commandContent = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={placeholder || "Search..."}
        className="tw:h-9"
        value={value}
        onValueChange={(newValue) => {
          setValue(newValue);
          const trimmed = newValue.trim();
          if (!trimmed && 0) {
            setHasSearched(false);
            setData(initialData || []);
            setHasMore((initialData || []).length > 0);
            setSearching(false);
            return;
          }
          setHasSearched(true);
          debouncedSearch(newValue);
        }}
      />
      <CommandList>
        <CommandEmpty>
          {searching ? "Searching..." : hasSearched ? "No results found" : ""}
        </CommandEmpty>
        <CommandGroup>
          {data.map((item, index) => (
            <CommandItem
              key={item.value.id + ":" + index}
              value={item.value.id}
              onSelect={() => handleSelect(item)}
            >
              {/** Use custom template when provided, otherwise fallback to label */}
              {typeof itemTemplate === "function"
                ? itemTemplate(item)
                : item.label}
            </CommandItem>
          ))}
          {hasMore && data.length >= 10 && (
            <div className="tw:flex tw:justify-center tw:py-2">
              <LoadMoreButton
                loadMore={handleLoadMore}
                loading={loadingMore}
                totalCount={data.length + (hasMore ? 1 : 0)}
                loadedCount={data.length}
                noMargin={true}
              />
            </div>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  const triggerButton = (
    <Button
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      role="combobox"
      aria-expanded={open}
      className="tw:w-full tw:justify-between tw:bg-white"
      disabled={disabled}
    >
      <div className="tw:flex tw:gap-1 tw:flex-wrap tw:items-center tw:w-full">
        {values && values.length > 0 ? (
          values.map((item, index) => (
            <div key={item.value.id + ":" + index}>
              <AppBadge
                showClose={true}
                onClose={(e: any) => {
                  e.stopPropagation();
                  onSelect(item, "remove");
                }}
                className="tw:mr-1"
              >
                {item.label}
              </AppBadge>
            </div>
          ))
        ) : (
          <span className="tw:text-gray-500 tw:font-normal">
            {placeholder || "Search"}
          </span>
        )}
        <ChevronsUpDown className="opacity-50 tw:ml-auto" />
      </div>
    </Button>
  );

  return (
    <div className={className}>
      {label && (
        <InpLabel size={size} isRequired={isRequired}>
          {label}
        </InpLabel>
      )}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{label || "Search"}</DrawerTitle>
            </DrawerHeader>
            <div className="tw:px-4 tw:pb-4 tw:min-h-[300px]">
              {commandContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent className="tw:w-[var(--radix-popover-trigger-width)] tw:p-0">
            {commandContent}
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

export default AutoComplete;
