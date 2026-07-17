import { toast } from "sonner";
import { useCallback } from "react";

export type Options = {
  msg: string;
  color?: "success" | "error" | "warning" | "info" | "danger";
  duration?: number;
};

const defaultOptions: any = {
  position: "top-center",
  duration: 3000,
  invert: true,
};

function useAppToast() {
  const show = useCallback((options: Options) => {
    if (options.color === "success") {
      toast.success(options.msg, {
        ...defaultOptions,
        duration: options.duration || 3000,
        style: {
          background: "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
        },
      });
    } else if (options.color === "error" || options.color === "danger") {
      toast.error(options.msg, {
        ...defaultOptions,
        duration: options.duration || 3000,
        style: {
          background: "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
        },
      });
    } else if (options.color === "warning") {
      toast.warning(options.msg, {
        ...defaultOptions,
        duration: options.duration || 3000,
        style: {
          background: "#fff3cd",
          color: "#856404",
          border: "1px solid #ffeaa7",
        },
      });
    } else if (options.color === "info") {
      toast.info(options.msg, {
        ...defaultOptions,
        duration: options.duration || 3000,
        style: {
          background: "#d1ecf1",
          color: "#0c5460",
          border: "1px solid #bee5eb",
        },
      });
    } else {
      toast(options.msg, {
        ...defaultOptions,
        duration: options.duration || 3000,
        style: {
          background: "#e2e3e5",
          color: "#383d41",
          border: "1px solid #d6d8db",
        },
      });
    }
  }, []);

  return { show };
}

export default useAppToast;
