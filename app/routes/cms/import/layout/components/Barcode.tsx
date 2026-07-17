import React, { useState } from "react";
import { Barcode as BarcodeIcon, Search as SearchIcon } from "lucide-react";
import AppButton from "~/components/core/button/AppButton";

const Barcode: React.FC = () => {
  const [barcode, setBarcode] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search logic
  };

  return (
    <div className="tw:bg-blue-50 tw:p-4 tw:rounded-xl tw:border tw:border-blue-500 tw:mb-4">
      <div className="tw:flex tw:items-center tw:mb-2">
        <BarcodeIcon className="tw:w-6 tw:h-6 tw:text-blue-600 tw:mr-2" />
        <h2 className="tw:text-2xl tw:font-bold tw:text-gray-900">
          Quick Barcode Lookup
        </h2>
      </div>
      <p className="tw:text-gray-600 tw:mb-4 tw:text-sm">
        Scan or enter a barcode to check if the product already exists in your
        catalog
      </p>
      <form
        className="tw:flex tw:flex-col tw:md:flex-row tw:gap-2"
        onSubmit={handleSearch}
      >
        <input
          type="text"
          className="tw:flex-1 tw:px-4 tw:py-2 tw:border tw:border-gray-300 tw:rounded-lg tw:bg-white tw:text-gray-800 tw:outline-none focus:tw:border-blue-400"
          placeholder="Enter or scan barcode..."
          value={barcode}
          onChange={handleInputChange}
        />
        <AppButton
          type="submit"
          color="primary"
          fill="solid"
          className="tw:flex tw:items-center tw:gap-2 tw:px-6 tw:py-2"
        >
          <SearchIcon className="tw:w-5 tw:h-5" />
          Search
        </AppButton>
      </form>
    </div>
  );
};

export default Barcode;
