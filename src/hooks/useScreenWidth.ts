import { useEffect, useState } from "react";

// Initialize to a desktop-like width on SSR to match server/client first paint and avoid hydration mismatch.
export const useScreenWidth = () => {
  const [width, setWidth] = useState<number>(1024);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWidth(window.innerWidth);
    // set actual width on mount
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return width;
};
