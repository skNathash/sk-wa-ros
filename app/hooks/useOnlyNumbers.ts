import React, { useCallback } from "react";

function useOnlyNumber() {
  const onOnlyNumberType = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const maxDigit = (e.target as HTMLInputElement).maxLength;
      const value = (e.target as HTMLInputElement).value;

      // Allow special keys
      const allowedKeys = [
        "Backspace",
        "Tab",
        "Delete",
        "Enter",
        "Escape",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        ".",
      ];
      if (
        allowedKeys.includes(e.key) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        ((e.ctrlKey || e.metaKey) &&
          ["a", "c", "v", "x", "A", "C", "V", "X"].includes(e.key))
      ) {
        return;
      }
      // Ensure that it is a number and stop the keypress
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }

      if (maxDigit) {
        const v = value;
        if (v && v.toString().length >= maxDigit) {
          e.preventDefault();
        }
      }
    },
    []
  );

  return { onOnlyNumberType };
}

export default useOnlyNumber;
