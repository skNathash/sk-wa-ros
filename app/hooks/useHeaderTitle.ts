export const useHeaderTitle = () => {
  return {
    setTitle: (title: string) => {
      document.title = title;
      const el = document.getElementById("app-header-title");
      if (el) el.innerHTML = title;
    },
  };
};
