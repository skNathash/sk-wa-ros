import { useCallback } from "react";

export const useHeaderTitle = () => {
  return {
    setTitle: useCallback((title: string) => {
      document.title = title;
      const el = document.getElementById("app-header-title");
      if (el) el.innerHTML = title;
    }, []),
  };
};
